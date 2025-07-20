from .base_scraper import BaseScraper
from loguru import logger
from typing import List, Dict
import re
from datetime import datetime
from ..database import get_db, BudgetAllocation
from ..database.supabase_client import supabase_client

class BudgetScraper(BaseScraper):
    """Scraper for Queensland Budget website."""
    
    def __init__(self):
        super().__init__('https://budget.qld.gov.au')
        self.youth_justice_keywords = [
            'youth justice', 'youth detention', 'cleveland youth detention',
            'west moreton youth detention', 'youth crime', 'community youth justice',
            'supervised community accommodation', 'youth engagement', 'restorative justice'
        ]
        
    def scrape_budget_papers(self, year: str = '2024-25') -> List[Dict]:
        """Scrape budget papers for youth justice allocations."""
        logger.info(f"Scraping budget papers for {year}")
        
        results = []
        
        # Budget Paper URLs pattern
        budget_urls = [
            f"/budget/{year}/budget-papers",
            f"/budget/{year}/service-delivery-statements",
            f"/budget/{year}/capital-statement"
        ]
        
        for url_path in budget_urls:
            url = self.base_url + url_path
            response = self.get_page(url)
            
            if not response:
                continue
                
            soup = self.parse_html(response.text)
            
            # Look for PDFs and department pages
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link['href']
                text = link.get_text(strip=True).lower()
                
                # Check if it's related to relevant departments
                if any(dept in text for dept in ['youth justice', 'children', 'employment', 'communities']):
                    if href.endswith('.pdf'):
                        # Store PDF for later processing
                        results.append({
                            'type': 'pdf',
                            'url': self.base_url + href if not href.startswith('http') else href,
                            'title': link.get_text(strip=True),
                            'year': year
                        })
                    else:
                        # Follow department page
                        dept_data = self._scrape_department_page(href)
                        if dept_data:
                            results.extend(dept_data)
        
        self.save_raw_data({'budget_papers': results}, f'budget_{year}')
        return results
    
    def _scrape_department_page(self, url: str) -> List[Dict]:
        """Scrape individual department page for youth justice spending."""
        if not url.startswith('http'):
            url = self.base_url + url
            
        response = self.get_page(url)
        if not response:
            return []
            
        soup = self.parse_html(response.text)
        results = []
        
        # Extract tables with budget data
        tables = self.extract_tables(soup)
        
        for table in tables:
            for row in table['data']:
                # Check if row contains youth justice keywords
                row_text = ' '.join(str(v).lower() for v in row.values())
                
                if any(keyword in row_text for keyword in self.youth_justice_keywords):
                    # Try to extract amount
                    amount = self._extract_amount(row)
                    if amount:
                        results.append({
                            'source': url,
                            'data': row,
                            'amount': amount,
                            'scraped_date': datetime.utcnow().isoformat()
                        })
        
        return results
    
    def _extract_amount(self, row: Dict) -> float:
        """Extract monetary amount from row data."""
        amount_pattern = r'\$?([\d,]+(?:\.\d+)?)\s*(?:million|m|thousand|k)?'
        
        for value in row.values():
            match = re.search(amount_pattern, str(value))
            if match:
                amount_str = match.group(1).replace(',', '')
                amount = float(amount_str)
                
                # Convert to actual amount if abbreviated
                if 'million' in str(value).lower() or 'm' in str(value).lower():
                    amount *= 1_000_000
                elif 'thousand' in str(value).lower() or 'k' in str(value).lower():
                    amount *= 1_000
                    
                return amount
        
        return None
    
    def parse_youth_justice_allocations(self, data: List[Dict]) -> List[Dict]:
        """Parse scraped data to extract youth justice allocations."""
        allocations = []
        
        for item in data:
            if 'data' in item:
                row = item['data']
                
                # Determine if it's detention or community based on keywords
                category = 'detention' if any(word in str(row).lower() 
                    for word in ['detention', 'cleveland', 'west moreton']) else 'community'
                
                allocation = {
                    'fiscal_year': '2024-25',  # Default, should be extracted
                    'department': 'Department of Youth Justice',
                    'program': self._extract_program_name(row),
                    'category': category,
                    'amount': item.get('amount', 0),
                    'description': str(row),
                    'source_url': item.get('source', ''),
                    'source_document': 'Budget Paper',
                }
                
                allocations.append(allocation)
        
        return allocations
    
    def _extract_program_name(self, row: Dict) -> str:
        """Extract program name from row data."""
        # Look for program/service names in common column headers
        for key in ['program', 'service', 'initiative', 'description']:
            if key in row:
                return row[key]
        
        # Return first non-numeric value as program name
        for value in row.values():
            if not re.match(r'^[\d\$,\.]+$', str(value).strip()):
                return str(value)
        
        return 'Unknown Program'
    
    def save_to_database(self, allocations: List[Dict]):
        """Save allocations to database."""
        # Save to SQLite
        db = next(get_db())
        
        try:
            for alloc in allocations:
                db_allocation = BudgetAllocation(**alloc)
                db.add(db_allocation)
            
            db.commit()
            logger.info(f"Saved {len(allocations)} allocations to SQLite database")
        except Exception as e:
            logger.error(f"Error saving to SQLite database: {e}")
            db.rollback()
        finally:
            db.close()
        
        # Save to Supabase if available
        if supabase_client:
            try:
                for alloc in allocations:
                    supabase_client.insert_budget_allocation(alloc)
                logger.info(f"Saved {len(allocations)} allocations to Supabase")
            except Exception as e:
                logger.error(f"Error saving to Supabase: {e}")