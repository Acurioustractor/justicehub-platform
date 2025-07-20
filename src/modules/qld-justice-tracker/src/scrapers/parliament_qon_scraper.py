import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from loguru import logger
import json

from .base_scraper import BaseScraper
from ..database import get_db, ParliamentaryDocument

class ParliamentQoNScraper(BaseScraper):
    """Enhanced scraper for Parliament Questions on Notice focused on youth justice."""
    
    def __init__(self):
        super().__init__('https://www.parliament.qld.gov.au')
        
        # Core youth justice search terms
        self.youth_justice_keywords = [
            'youth justice', 'youth detention', 'juvenile',
            'young offender', 'youth offender', 'youth crime',
            'cleveland detention', 'west moreton detention',
            'youth rehabilitation', 'youth bail', 'children\'s court'
        ]
        
        # Indigenous-related keywords
        self.indigenous_keywords = [
            'indigenous', 'aboriginal', 'torres strait', 'first nations',
            'atsi', 'closing the gap', 'overrepresentation',
            'cultural', 'elder', 'yarning circle'
        ]
        
        # Spending/budget keywords
        self.spending_keywords = [
            'budget', 'cost', 'spending', 'expenditure', 'allocation',
            'funding', 'investment', 'million', 'dollars', '$',
            'financial', 'fiscal', 'resources'
        ]
        
        # Detention-specific keywords
        self.detention_keywords = [
            'detention centre', 'custody', 'secure facility',
            'remand', 'lockup', 'incarceration', 'confined'
        ]
        
    def search_questions_on_notice(self, start_date: datetime = None, 
                                  end_date: datetime = None,
                                  limit: int = 500) -> List[Dict]:
        """Search and extract Questions on Notice related to youth justice."""
        if not start_date:
            start_date = datetime.now() - timedelta(days=365)  # Last year
        if not end_date:
            end_date = datetime.now()
            
        logger.info(f"Searching Questions on Notice from {start_date} to {end_date}")
        
        questions = []
        
        # QoN search endpoints
        search_urls = [
            "/work-of-assembly/questions-on-notice/current",
            "/work-of-assembly/questions-on-notice/previous"
        ]
        
        for search_path in search_urls:
            url = self.base_url + search_path
            response = self.get_page(url)
            
            if not response:
                continue
                
            soup = self.parse_html(response.text)
            
            # Find question entries
            question_entries = soup.find_all(['div', 'article'], 
                                           class_=re.compile(r'question|qon|notice'))
            
            for entry in question_entries[:limit]:
                question_data = self._extract_question_data(entry)
                
                if question_data and self._is_relevant_question(question_data):
                    # Enhance with analysis
                    question_data = self._analyze_question(question_data)
                    questions.append(question_data)
            
            # Also check for paginated results
            questions.extend(self._get_paginated_questions(soup, start_date, end_date, limit))
        
        logger.info(f"Found {len(questions)} relevant Questions on Notice")
        
        # Save raw data
        self.save_raw_data({
            'questions': questions,
            'date_range': f"{start_date} to {end_date}",
            'total_found': len(questions)
        }, 'parliament_qon')
        
        return questions
    
    def _extract_question_data(self, entry) -> Optional[Dict]:
        """Extract question data from HTML entry."""
        try:
            data = {}
            
            # Extract question number
            q_number = entry.find(class_=re.compile(r'number|q-?no'))
            if q_number:
                data['question_number'] = q_number.get_text(strip=True)
            
            # Extract date
            date_elem = entry.find(class_=re.compile(r'date|asked'))
            if date_elem:
                data['date'] = self._parse_date(date_elem.get_text(strip=True))
            else:
                data['date'] = datetime.now()
            
            # Extract MP name (asker)
            mp_elem = entry.find(class_=re.compile(r'member|mp|asker'))
            if mp_elem:
                data['mp_name'] = mp_elem.get_text(strip=True)
            
            # Extract Minister (answerer)
            minister_elem = entry.find(class_=re.compile(r'minister|answerer'))
            if minister_elem:
                data['minister'] = minister_elem.get_text(strip=True)
            
            # Extract question text
            question_elem = entry.find(class_=re.compile(r'question-text|q-text'))
            if question_elem:
                data['question'] = question_elem.get_text(strip=True)
            else:
                # Fallback: get all text
                data['question'] = entry.get_text(strip=True)
            
            # Extract answer if available
            answer_elem = entry.find(class_=re.compile(r'answer|response'))
            if answer_elem:
                data['answer'] = answer_elem.get_text(strip=True)
                data['has_answer'] = True
            else:
                data['answer'] = ''
                data['has_answer'] = False
            
            # Extract URL
            link = entry.find('a', href=True)
            if link:
                data['url'] = self.base_url + link['href'] if not link['href'].startswith('http') else link['href']
            
            return data if 'question' in data else None
            
        except Exception as e:
            logger.debug(f"Error extracting question data: {e}")
            return None
    
    def _is_relevant_question(self, question_data: Dict) -> bool:
        """Check if question is relevant to youth justice."""
        text_to_check = (question_data.get('question', '') + ' ' + 
                        question_data.get('answer', '')).lower()
        
        # Must contain at least one youth justice keyword
        return any(keyword in text_to_check for keyword in self.youth_justice_keywords)
    
    def _analyze_question(self, question_data: Dict) -> Dict:
        """Analyze question for specific themes and flags."""
        text = (question_data.get('question', '') + ' ' + 
               question_data.get('answer', '')).lower()
        
        # Check for Indigenous youth content
        mentions_indigenous = any(keyword in text for keyword in self.indigenous_keywords)
        
        # Check for spending/budget content
        mentions_spending = any(keyword in text for keyword in self.spending_keywords)
        
        # Check for detention focus
        mentions_detention = any(keyword in text for keyword in self.detention_keywords)
        
        # Extract key statistics if present
        statistics = self._extract_statistics(text)
        
        # Determine primary topic
        topics = []
        if mentions_detention:
            topics.append('detention')
        if mentions_indigenous:
            topics.append('indigenous')
        if mentions_spending:
            topics.append('spending')
        
        # Special highlighting for Indigenous detention rates
        indigenous_detention_highlight = False
        if mentions_indigenous and mentions_detention:
            # Check for rate/percentage mentions
            rate_patterns = [r'\d+%', r'\d+\s*times', r'\d+x', r'rate', 'percentage']
            if any(re.search(pattern, text) for pattern in rate_patterns):
                indigenous_detention_highlight = True
        
        # Flag spending-related questions
        spending_flag = False
        if mentions_spending:
            # Check for specific amounts
            amount_pattern = r'\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand))?'
            if re.search(amount_pattern, text):
                spending_flag = True
        
        # Update question data
        question_data.update({
            'mentions_indigenous': mentions_indigenous,
            'mentions_spending': mentions_spending,
            'mentions_detention': mentions_detention,
            'topics': topics,
            'indigenous_detention_highlight': indigenous_detention_highlight,
            'spending_flag': spending_flag,
            'statistics': statistics,
            'analysis_timestamp': datetime.now().isoformat()
        })
        
        return question_data
    
    def _extract_statistics(self, text: str) -> List[Dict]:
        """Extract statistical information from text."""
        statistics = []
        
        # Percentage patterns
        percentage_pattern = r'(\d+(?:\.\d+)?)\s*%'
        for match in re.finditer(percentage_pattern, text):
            # Get context around percentage
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end]
            
            statistics.append({
                'type': 'percentage',
                'value': float(match.group(1)),
                'context': context.strip()
            })
        
        # Dollar amount patterns
        amount_pattern = r'\$\s*([\d,]+(?:\.\d+)?)\s*(?:(million|billion|thousand))?'
        for match in re.finditer(amount_pattern, text):
            amount = float(match.group(1).replace(',', ''))
            
            # Apply multiplier
            multiplier = match.group(2)
            if multiplier:
                if multiplier == 'billion':
                    amount *= 1_000_000_000
                elif multiplier == 'million':
                    amount *= 1_000_000
                elif multiplier == 'thousand':
                    amount *= 1_000
            
            # Get context
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end]
            
            statistics.append({
                'type': 'amount',
                'value': amount,
                'context': context.strip()
            })
        
        # Rate/ratio patterns (e.g., "22 times higher")
        rate_pattern = r'(\d+(?:\.\d+)?)\s*(?:times|x)\s*(?:higher|more|greater)'
        for match in re.finditer(rate_pattern, text):
            statistics.append({
                'type': 'rate',
                'value': float(match.group(1)),
                'context': match.group(0)
            })
        
        return statistics
    
    def _get_paginated_questions(self, soup, start_date: datetime, 
                                end_date: datetime, limit: int) -> List[Dict]:
        """Get questions from paginated results."""
        questions = []
        
        # Look for pagination links
        pagination = soup.find(['nav', 'div'], class_=re.compile(r'pagination|pager'))
        if not pagination:
            return questions
        
        # Get page links
        page_links = pagination.find_all('a', href=True)
        
        for link in page_links[:5]:  # Limit pages to avoid too many requests
            url = self.base_url + link['href'] if not link['href'].startswith('http') else link['href']
            
            response = self.get_page(url)
            if not response:
                continue
                
            page_soup = self.parse_html(response.text)
            
            # Extract questions from this page
            question_entries = page_soup.find_all(['div', 'article'], 
                                                class_=re.compile(r'question|qon|notice'))
            
            for entry in question_entries:
                if len(questions) >= limit:
                    break
                    
                question_data = self._extract_question_data(entry)
                
                if question_data and self._is_relevant_question(question_data):
                    question_data = self._analyze_question(question_data)
                    
                    # Check date range
                    if start_date <= question_data['date'] <= end_date:
                        questions.append(question_data)
        
        return questions
    
    def get_detailed_question(self, url: str) -> Optional[Dict]:
        """Get detailed information for a specific question."""
        response = self.get_page(url)
        if not response:
            return None
            
        soup = self.parse_html(response.text)
        
        # Extract full details
        data = {
            'url': url,
            'full_text': soup.get_text(strip=True)
        }
        
        # Try to extract structured data
        main_content = soup.find(['main', 'article', 'div'], class_=re.compile(r'content|main'))
        if main_content:
            question_data = self._extract_question_data(main_content)
            if question_data:
                data.update(question_data)
                data = self._analyze_question(data)
        
        return data
    
    def generate_summary_report(self, questions: List[Dict]) -> Dict:
        """Generate summary report of Questions on Notice."""
        total = len(questions)
        
        # Count by categories
        indigenous_count = sum(1 for q in questions if q.get('mentions_indigenous'))
        spending_count = sum(1 for q in questions if q.get('mentions_spending'))
        detention_count = sum(1 for q in questions if q.get('mentions_detention'))
        
        # Highlighted questions
        indigenous_detention_highlights = [q for q in questions 
                                         if q.get('indigenous_detention_highlight')]
        spending_flags = [q for q in questions if q.get('spending_flag')]
        
        # Extract all statistics
        all_statistics = []
        for q in questions:
            all_statistics.extend(q.get('statistics', []))
        
        # Top askers
        mp_counts = {}
        for q in questions:
            mp = q.get('mp_name', 'Unknown')
            mp_counts[mp] = mp_counts.get(mp, 0) + 1
        
        top_askers = sorted(mp_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Top ministers
        minister_counts = {}
        for q in questions:
            minister = q.get('minister', 'Unknown')
            minister_counts[minister] = minister_counts.get(minister, 0) + 1
        
        top_ministers = sorted(minister_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        summary = {
            'total_questions': total,
            'categories': {
                'indigenous': indigenous_count,
                'spending': spending_count,
                'detention': detention_count
            },
            'highlighted': {
                'indigenous_detention_rates': len(indigenous_detention_highlights),
                'spending_related': len(spending_flags)
            },
            'top_askers': top_askers,
            'top_ministers': top_ministers,
            'statistics_found': len(all_statistics),
            'sample_statistics': all_statistics[:10]  # First 10 statistics
        }
        
        return summary
    
    def save_to_database(self, questions: List[Dict]):
        """Save questions to database as parliamentary documents."""
        db = next(get_db())
        
        try:
            for q in questions:
                # Check if already exists
                existing = db.query(ParliamentaryDocument).filter_by(
                    url=q.get('url', '')
                ).first() if q.get('url') else None
                
                if not existing:
                    # Format content
                    content = f"Question: {q.get('question', '')}\n\nAnswer: {q.get('answer', 'Pending')}"
                    
                    # Create title
                    title = f"QoN {q.get('question_number', 'Unknown')} - {q.get('mp_name', 'Unknown MP')} to {q.get('minister', 'Minister')}"
                    
                    db_doc = ParliamentaryDocument(
                        document_type='question_on_notice',
                        title=title,
                        date=q.get('date', datetime.now()),
                        author=q.get('mp_name', 'Unknown'),
                        url=q.get('url', ''),
                        content=content,
                        mentions_youth_justice=True,  # Already filtered
                        mentions_spending=q.get('mentions_spending', False),
                        mentions_indigenous=q.get('mentions_indigenous', False)
                    )
                    db.add(db_doc)
            
            db.commit()
            logger.info(f"Saved {len(questions)} Questions on Notice to database")
            
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date from various formats."""
        date_formats = [
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d',
            '%d %B %Y',
            '%B %d, %Y',
            '%d %b %Y'
        ]
        
        date_str = date_str.strip()
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # Try to extract just year
        year_match = re.search(r'20\d{2}', date_str)
        if year_match:
            return datetime(int(year_match.group(0)), 1, 1)
        
        return datetime.now()