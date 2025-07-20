import os
import re
import requests
import pdfplumber
import pandas as pd
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from loguru import logger
from bs4 import BeautifulSoup
import tempfile

from .base_scraper import BaseScraper
from ..database import get_db, BudgetAllocation

class TreasuryBudgetScraper(BaseScraper):
    """Enhanced scraper for Queensland Treasury budget PDFs."""
    
    def __init__(self):
        super().__init__('https://budget.qld.gov.au')
        
        # Comprehensive youth justice keywords
        self.youth_justice_keywords = [
            'youth justice', 'youth detention', 'juvenile justice',
            'cleveland youth detention', 'west moreton youth detention',
            'youth crime', 'young offender', 'youth offender',
            'community youth justice', 'youth engagement',
            'supervised community accommodation', 'restorative justice',
            'youth bail', 'youth court', 'children\'s court',
            'youth rehabilitation', 'youth diversion'
        ]
        
        # Keywords for categorizing programs
        self.detention_keywords = [
            'detention', 'cleveland', 'west moreton', 'secure facility',
            'custody', 'remand', 'secure accommodation'
        ]
        
        self.community_keywords = [
            'community', 'diversion', 'restorative', 'supervision',
            'bail support', 'family support', 'early intervention',
            'prevention', 'rehabilitation', 'reintegration'
        ]
        
        self.pdf_cache = {}
        
    def find_budget_pdfs(self, fiscal_years: List[str] = None) -> List[Dict]:
        """Find all budget PDFs that might contain youth justice information."""
        if not fiscal_years:
            fiscal_years = ['2024-25', '2023-24', '2022-23']
            
        logger.info(f"Searching for budget PDFs for years: {fiscal_years}")
        
        pdf_urls = []
        
        for year in fiscal_years:
            # Common budget document patterns
            document_types = [
                'budget-papers',
                'service-delivery-statements', 
                'capital-statement',
                'budget-measures'
            ]
            
            for doc_type in document_types:
                url = f"{self.base_url}/budget/{year}/{doc_type}"
                response = self.get_page(url)
                
                if not response:
                    continue
                    
                soup = self.parse_html(response.text)
                
                # Find all PDF links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    
                    if href.endswith('.pdf'):
                        # Check if link text contains relevant department names
                        link_text = link.get_text(strip=True).lower()
                        
                        relevant_depts = [
                            'youth justice', 'children', 'communities',
                            'employment', 'child safety', 'attorney-general',
                            'police', 'corrective services'
                        ]
                        
                        if any(dept in link_text for dept in relevant_depts):
                            pdf_url = href if href.startswith('http') else self.base_url + href
                            
                            pdf_urls.append({
                                'url': pdf_url,
                                'title': link.get_text(strip=True),
                                'fiscal_year': year,
                                'document_type': doc_type,
                                'department': self._extract_department(link_text)
                            })
        
        logger.info(f"Found {len(pdf_urls)} potentially relevant PDFs")
        return pdf_urls
    
    def download_pdf(self, url: str) -> Optional[str]:
        """Download PDF to temporary file."""
        if url in self.pdf_cache:
            return self.pdf_cache[url]
            
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(response.content)
                filepath = tmp_file.name
                
            self.pdf_cache[url] = filepath
            return filepath
            
        except Exception as e:
            logger.error(f"Error downloading PDF {url}: {e}")
            return None
    
    def extract_budget_tables_from_pdf(self, pdf_path: str, fiscal_year: str) -> List[Dict]:
        """Extract budget tables containing youth justice allocations."""
        allocations = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Get page text
                    text = page.extract_text() or ""
                    
                    # Check if page contains youth justice keywords
                    if not any(keyword in text.lower() for keyword in self.youth_justice_keywords):
                        continue
                    
                    logger.info(f"Found youth justice content on page {page_num + 1}")
                    
                    # Extract tables
                    tables = page.extract_tables()
                    
                    for table in tables:
                        if not table:
                            continue
                            
                        # Process table
                        processed_data = self._process_budget_table(table, text, fiscal_year)
                        allocations.extend(processed_data)
                    
                    # Also extract text-based budget information
                    text_allocations = self._extract_text_allocations(text, fiscal_year)
                    allocations.extend(text_allocations)
                    
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            
        return allocations
    
    def _process_budget_table(self, table: List[List], context_text: str, fiscal_year: str) -> List[Dict]:
        """Process a budget table to extract allocations."""
        allocations = []
        
        # Convert table to DataFrame for easier processing
        try:
            df = pd.DataFrame(table)
            
            # Try to identify header row
            header_row = 0
            for i, row in enumerate(table[:5]):  # Check first 5 rows
                if row and any('$' in str(cell) or 'budget' in str(cell).lower() for cell in row):
                    header_row = i
                    break
            
            # Set column names
            if header_row < len(table):
                df.columns = df.iloc[header_row]
                df = df[header_row + 1:]
            
            # Process each row
            for _, row in df.iterrows():
                row_text = ' '.join(str(cell) for cell in row if cell)
                
                # Check if row contains youth justice keywords
                if any(keyword in row_text.lower() for keyword in self.youth_justice_keywords):
                    # Extract allocation data
                    allocation = self._extract_allocation_from_row(row, row_text, fiscal_year)
                    if allocation:
                        allocations.append(allocation)
                        
        except Exception as e:
            logger.debug(f"Error processing table: {e}")
            
        return allocations
    
    def _extract_allocation_from_row(self, row: pd.Series, row_text: str, fiscal_year: str) -> Optional[Dict]:
        """Extract allocation data from a table row."""
        # Look for amount patterns
        amount_pattern = r'\$?([\d,]+(?:\.\d+)?)\s*(?:million|m|thousand|k)?'
        amounts = re.findall(amount_pattern, row_text)
        
        if not amounts:
            return None
            
        # Get the largest amount (likely the budget allocation)
        amount_str = max(amounts, key=lambda x: float(x.replace(',', '')))
        amount = float(amount_str.replace(',', ''))
        
        # Check for multipliers
        if 'million' in row_text.lower() or ' m' in row_text.lower():
            amount *= 1_000_000
        elif 'thousand' in row_text.lower() or ' k' in row_text.lower():
            amount *= 1_000
            
        # Determine category
        category = self._categorize_program(row_text)
        
        # Extract program name
        program_name = self._extract_program_name(row_text)
        
        return {
            'fiscal_year': fiscal_year,
            'program': program_name,
            'category': category,
            'amount': amount,
            'description': row_text[:500],  # Limit description length
            'source_type': 'budget_table'
        }
    
    def _extract_text_allocations(self, text: str, fiscal_year: str) -> List[Dict]:
        """Extract budget allocations from text paragraphs."""
        allocations = []
        
        # Split into sentences
        sentences = re.split(r'[.!?]', text)
        
        for sentence in sentences:
            # Check for youth justice keywords and amounts
            if any(keyword in sentence.lower() for keyword in self.youth_justice_keywords):
                amount_match = re.search(r'\$?([\d,]+(?:\.\d+)?)\s*(?:million|m)', sentence)
                
                if amount_match:
                    amount = float(amount_match.group(1).replace(',', ''))
                    amount *= 1_000_000  # Convert to dollars
                    
                    category = self._categorize_program(sentence)
                    program_name = self._extract_program_name(sentence)
                    
                    allocations.append({
                        'fiscal_year': fiscal_year,
                        'program': program_name,
                        'category': category,
                        'amount': amount,
                        'description': sentence.strip(),
                        'source_type': 'budget_text'
                    })
                    
        return allocations
    
    def _categorize_program(self, text: str) -> str:
        """Categorize program as detention or community based on keywords."""
        text_lower = text.lower()
        
        detention_score = sum(1 for keyword in self.detention_keywords if keyword in text_lower)
        community_score = sum(1 for keyword in self.community_keywords if keyword in text_lower)
        
        if detention_score > community_score:
            return 'detention'
        elif community_score > 0:
            return 'community'
        else:
            # Default based on specific facility mentions
            if any(facility in text_lower for facility in ['cleveland', 'west moreton']):
                return 'detention'
            return 'community'
    
    def _extract_program_name(self, text: str) -> str:
        """Extract program name from text."""
        # Common program patterns
        patterns = [
            r'(?:for|to|in)\s+([A-Z][^.]{10,50}?)(?:\s+program|\s+initiative|\s+service)',
            r'([A-Z][^.]{10,50}?)\s+(?:program|initiative|service|centre|facility)',
            r'(?:youth justice|youth)\s+([^.]{10,50}?)(?:\s+funding|\s+allocation)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        # Fallback: use first part of text
        return text[:100].strip()
    
    def _extract_department(self, text: str) -> str:
        """Extract department name from text."""
        dept_patterns = [
            r'department of ([^,]+)',
            r'([^,]+) department',
            r'ministry of ([^,]+)'
        ]
        
        for pattern in dept_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return 'Unknown Department'
    
    def calculate_detention_vs_community(self, allocations: List[Dict]) -> Dict:
        """Calculate detention vs community program percentages."""
        detention_total = sum(a['amount'] for a in allocations if a['category'] == 'detention')
        community_total = sum(a['amount'] for a in allocations if a['category'] == 'community')
        total = detention_total + community_total
        
        if total > 0:
            detention_percentage = (detention_total / total) * 100
            community_percentage = (community_total / total) * 100
        else:
            detention_percentage = 0
            community_percentage = 0
            
        return {
            'detention_total': detention_total,
            'community_total': community_total,
            'total_budget': total,
            'detention_percentage': detention_percentage,
            'community_percentage': community_percentage,
            'allocation_count': len(allocations)
        }
    
    def scrape_and_save(self, fiscal_years: List[str] = None):
        """Main method to scrape budget PDFs and save to database."""
        # Find PDFs
        pdf_list = self.find_budget_pdfs(fiscal_years)
        
        all_allocations = []
        
        for pdf_info in pdf_list:
            logger.info(f"Processing: {pdf_info['title']}")
            
            # Download PDF
            pdf_path = self.download_pdf(pdf_info['url'])
            if not pdf_path:
                continue
                
            # Extract allocations
            allocations = self.extract_budget_tables_from_pdf(
                pdf_path, 
                pdf_info['fiscal_year']
            )
            
            # Add metadata
            for allocation in allocations:
                allocation['department'] = pdf_info['department']
                allocation['source_url'] = pdf_info['url']
                allocation['source_document'] = pdf_info['title']
                
            all_allocations.extend(allocations)
        
        # Calculate percentages
        if all_allocations:
            # Group by fiscal year
            by_year = {}
            for alloc in all_allocations:
                year = alloc['fiscal_year']
                if year not in by_year:
                    by_year[year] = []
                by_year[year].append(alloc)
            
            # Calculate and log percentages for each year
            for year, year_allocations in by_year.items():
                percentages = self.calculate_detention_vs_community(year_allocations)
                logger.info(f"\nFiscal Year {year}:")
                logger.info(f"  Total Budget: ${percentages['total_budget']:,.0f}")
                logger.info(f"  Detention: {percentages['detention_percentage']:.1f}% (${percentages['detention_total']:,.0f})")
                logger.info(f"  Community: {percentages['community_percentage']:.1f}% (${percentages['community_total']:,.0f})")
                logger.info(f"  Programs Found: {percentages['allocation_count']}")
        
        # Save to database
        self.save_to_database(all_allocations)
        
        # Save raw data
        self.save_raw_data({
            'pdfs_processed': len(pdf_list),
            'allocations': all_allocations,
            'summary': {year: self.calculate_detention_vs_community(allocs) 
                       for year, allocs in by_year.items()} if all_allocations else {}
        }, 'treasury_budget_scrape')
        
        # Clean up temporary files
        for filepath in self.pdf_cache.values():
            try:
                os.unlink(filepath)
            except:
                pass
                
        return all_allocations
    
    def save_to_database(self, allocations: List[Dict]):
        """Save allocations to database."""
        db = next(get_db())
        
        try:
            for alloc in allocations:
                # Check if already exists
                existing = db.query(BudgetAllocation).filter_by(
                    fiscal_year=alloc['fiscal_year'],
                    program=alloc['program'],
                    amount=alloc['amount']
                ).first()
                
                if not existing:
                    db_allocation = BudgetAllocation(
                        fiscal_year=alloc['fiscal_year'],
                        department=alloc.get('department', 'Unknown'),
                        program=alloc['program'],
                        category=alloc['category'],
                        amount=alloc['amount'],
                        description=alloc.get('description', ''),
                        source_url=alloc.get('source_url', ''),
                        source_document=alloc.get('source_document', '')
                    )
                    db.add(db_allocation)
            
            db.commit()
            logger.info(f"Saved {len(allocations)} budget allocations to database")
            
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
            db.rollback()
        finally:
            db.close()