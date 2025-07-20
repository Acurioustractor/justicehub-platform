from .base_scraper import BaseScraper
from loguru import logger
from typing import List, Dict
import re
from datetime import datetime, timedelta
from ..database import get_db, ParliamentaryDocument

class ParliamentScraper(BaseScraper):
    """Scraper for Queensland Parliament website."""
    
    def __init__(self):
        super().__init__('https://www.parliament.qld.gov.au')
        self.youth_justice_terms = [
            'youth justice', 'youth detention', 'juvenile', 'youth crime',
            'cleveland detention', 'west moreton detention', 'youth offender',
            'indigenous youth', 'aboriginal youth', 'torres strait youth'
        ]
        
    def scrape_hansard(self, start_date: datetime = None, end_date: datetime = None) -> List[Dict]:
        """Scrape Hansard records for youth justice mentions."""
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
            
        logger.info(f"Scraping Hansard from {start_date} to {end_date}")
        
        results = []
        
        # Hansard search URL
        search_url = f"{self.base_url}/work-of-assembly/sitting-dates/hansard"
        response = self.get_page(search_url)
        
        if not response:
            return results
            
        soup = self.parse_html(response.text)
        
        # Find Hansard links within date range
        hansard_links = soup.find_all('a', href=re.compile(r'/hansard/\d{4}'))
        
        for link in hansard_links:
            href = link['href']
            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', href)
            
            if date_match:
                doc_date = datetime.strptime(date_match.group(1), '%Y-%m-%d')
                
                if start_date <= doc_date <= end_date:
                    doc_data = self._scrape_hansard_document(href)
                    if doc_data:
                        results.append(doc_data)
        
        self.save_raw_data({'hansard': results}, 'hansard_records')
        return results
    
    def _scrape_hansard_document(self, url: str) -> Dict:
        """Scrape individual Hansard document."""
        if not url.startswith('http'):
            url = self.base_url + url
            
        response = self.get_page(url)
        if not response:
            return None
            
        soup = self.parse_html(response.text)
        
        # Extract document content
        content = soup.get_text()
        
        # Check for youth justice mentions
        mentions_youth_justice = any(term in content.lower() for term in self.youth_justice_terms)
        mentions_spending = any(word in content.lower() for word in ['budget', 'spending', 'allocation', 'cost', 'expenditure'])
        mentions_indigenous = any(word in content.lower() for word in ['indigenous', 'aboriginal', 'torres strait'])
        
        if mentions_youth_justice:
            # Extract relevant sections
            relevant_sections = self._extract_relevant_sections(content)
            
            return {
                'document_type': 'hansard',
                'title': soup.find('title').get_text() if soup.find('title') else 'Hansard Record',
                'date': self._extract_date(url, soup),
                'url': url,
                'content': relevant_sections,
                'mentions_youth_justice': mentions_youth_justice,
                'mentions_spending': mentions_spending,
                'mentions_indigenous': mentions_indigenous,
                'full_content': content[:10000]  # Store first 10k chars
            }
        
        return None
    
    def scrape_committee_reports(self) -> List[Dict]:
        """Scrape committee reports related to youth justice."""
        logger.info("Scraping committee reports")
        
        results = []
        
        # Committee pages to check
        committees = [
            'legal-affairs-and-safety-committee',
            'community-support-and-services-committee',
            'economics-and-governance-committee'
        ]
        
        for committee in committees:
            url = f"{self.base_url}/work-of-committees/committees/{committee}/reports"
            response = self.get_page(url)
            
            if not response:
                continue
                
            soup = self.parse_html(response.text)
            
            # Find report links
            report_links = soup.find_all('a', href=re.compile(r'\.pdf$'))
            
            for link in report_links:
                title = link.get_text(strip=True).lower()
                
                if any(term in title for term in self.youth_justice_terms):
                    results.append({
                        'document_type': 'committee_report',
                        'title': link.get_text(strip=True),
                        'url': self.base_url + link['href'] if not link['href'].startswith('http') else link['href'],
                        'committee': committee,
                        'date': self._extract_date_from_text(title)
                    })
        
        self.save_raw_data({'committee_reports': results}, 'committee_reports')
        return results
    
    def scrape_questions_on_notice(self) -> List[Dict]:
        """Scrape Questions on Notice related to youth justice."""
        logger.info("Scraping Questions on Notice")
        
        results = []
        qon_url = f"{self.base_url}/work-of-assembly/questions-on-notice"
        
        response = self.get_page(qon_url)
        if not response:
            return results
            
        soup = self.parse_html(response.text)
        
        # Find QoN entries
        questions = soup.find_all('div', class_='question-notice')
        
        for question in questions:
            text = question.get_text(strip=True).lower()
            
            if any(term in text for term in self.youth_justice_terms):
                # Extract question details
                q_number = question.find('span', class_='question-number')
                q_date = question.find('span', class_='question-date')
                q_member = question.find('span', class_='member-name')
                q_text = question.find('div', class_='question-text')
                
                results.append({
                    'document_type': 'question_on_notice',
                    'title': f"Question {q_number.get_text() if q_number else 'Unknown'}",
                    'date': self._parse_date(q_date.get_text() if q_date else ''),
                    'author': q_member.get_text() if q_member else 'Unknown',
                    'content': q_text.get_text() if q_text else text,
                    'url': self.base_url + question.find('a')['href'] if question.find('a') else ''
                })
        
        self.save_raw_data({'questions_on_notice': results}, 'questions_on_notice')
        return results
    
    def _extract_relevant_sections(self, content: str) -> str:
        """Extract sections of content that mention youth justice."""
        relevant_sections = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            if any(term in line.lower() for term in self.youth_justice_terms):
                # Get context (5 lines before and after)
                start = max(0, i - 5)
                end = min(len(lines), i + 6)
                
                section = '\n'.join(lines[start:end])
                relevant_sections.append(section)
        
        return '\n\n---\n\n'.join(relevant_sections)
    
    def _extract_date(self, url: str, soup) -> datetime:
        """Extract date from URL or page content."""
        # Try URL first
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', url)
        if date_match:
            return datetime.strptime(date_match.group(1), '%Y-%m-%d')
        
        # Try page content
        date_pattern = r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})'
        text = soup.get_text()
        date_match = re.search(date_pattern, text, re.IGNORECASE)
        
        if date_match:
            return datetime.strptime(f"{date_match.group(1)} {date_match.group(2)} {date_match.group(3)}", "%d %B %Y")
        
        return datetime.now()
    
    def _extract_date_from_text(self, text: str) -> datetime:
        """Extract date from text string."""
        date_patterns = [
            r'(\d{4})',  # Year only
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # DD/MM/YYYY
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # DD-MM-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                if len(match.groups()) == 1:
                    # Year only
                    return datetime(int(match.group(1)), 1, 1)
                elif len(match.groups()) == 3:
                    # Full date
                    return datetime(int(match.group(3)), int(match.group(2)), int(match.group(1)))
        
        return datetime.now()
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date from various formats."""
        date_formats = [
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d',
            '%d %B %Y',
            '%B %d, %Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        return datetime.now()
    
    def save_to_database(self, documents: List[Dict]):
        """Save parliamentary documents to database."""
        db = next(get_db())
        
        try:
            for doc in documents:
                # Check if document already exists
                existing = db.query(ParliamentaryDocument).filter_by(url=doc.get('url')).first()
                
                if not existing:
                    db_doc = ParliamentaryDocument(**doc)
                    db.add(db_doc)
            
            db.commit()
            logger.info(f"Saved {len(documents)} parliamentary documents to database")
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
            db.rollback()
        finally:
            db.close()