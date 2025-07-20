import requests
from bs4 import BeautifulSoup
from loguru import logger
import time
from typing import Optional, Dict, List
import random

class BaseScraper:
    """Base class for all web scrapers."""
    
    def __init__(self, base_url: str, headers: Optional[Dict] = None):
        self.base_url = base_url
        self.session = requests.Session()
        
        default_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        if headers:
            default_headers.update(headers)
        
        self.session.headers.update(default_headers)
        
    def get_page(self, url: str, **kwargs) -> Optional[requests.Response]:
        """Fetch a page with retry logic."""
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, **kwargs)
                response.raise_for_status()
                
                # Add random delay to avoid rate limiting
                time.sleep(random.uniform(0.5, 2.0))
                
                return response
            
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                else:
                    logger.error(f"Failed to fetch {url} after {max_retries} attempts")
                    return None
    
    def parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML content."""
        return BeautifulSoup(html, 'lxml')
    
    def extract_tables(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract all tables from a page."""
        tables = []
        for table in soup.find_all('table'):
            headers = []
            rows = []
            
            # Extract headers
            for th in table.find_all('th'):
                headers.append(th.get_text(strip=True))
            
            # Extract rows
            for tr in table.find_all('tr'):
                cells = tr.find_all(['td', 'th'])
                if cells:
                    row = [cell.get_text(strip=True) for cell in cells]
                    if len(row) == len(headers) and row != headers:
                        rows.append(dict(zip(headers, row)))
            
            if rows:
                tables.append({
                    'headers': headers,
                    'data': rows
                })
        
        return tables
    
    def save_raw_data(self, data: Dict, filename: str):
        """Save raw scraped data."""
        import json
        from datetime import datetime
        
        data['scraped_at'] = datetime.utcnow().isoformat()
        
        filepath = f"data/raw/{filename}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved raw data to {filepath}")