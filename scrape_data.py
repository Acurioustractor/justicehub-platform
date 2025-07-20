#!/usr/bin/env python3
"""
Script to run web scrapers and collect youth justice data.
"""

import sys
from datetime import datetime
from loguru import logger

from src.scrapers import BudgetScraper, ParliamentScraper, TreasuryBudgetScraper, ParliamentQoNScraper
from src.database import init_db

# Configure logging
logger.add("logs/scraper_{time}.log", rotation="1 week")

def main():
    """Run all scrapers."""
    logger.info("Starting data collection...")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Run budget scraper
    logger.info("Running budget scraper...")
    budget_scraper = BudgetScraper()
    
    try:
        # Scrape current year budget
        budget_data = budget_scraper.scrape_budget_papers('2024-25')
        
        # Parse and save allocations
        allocations = budget_scraper.parse_youth_justice_allocations(budget_data)
        budget_scraper.save_to_database(allocations)
        
        logger.info(f"Collected {len(allocations)} budget allocations")
        
    except Exception as e:
        logger.error(f"Budget scraper error: {e}")
    
    # Run parliament scraper
    logger.info("Running parliament scraper...")
    parliament_scraper = ParliamentScraper()
    
    try:
        # Scrape Hansard
        hansard_docs = parliament_scraper.scrape_hansard()
        if hansard_docs:
            parliament_scraper.save_to_database(hansard_docs)
            logger.info(f"Collected {len(hansard_docs)} Hansard documents")
        
        # Scrape committee reports
        committee_reports = parliament_scraper.scrape_committee_reports()
        if committee_reports:
            parliament_scraper.save_to_database(committee_reports)
            logger.info(f"Collected {len(committee_reports)} committee reports")
        
        # Scrape Questions on Notice
        qon_docs = parliament_scraper.scrape_questions_on_notice()
        if qon_docs:
            parliament_scraper.save_to_database(qon_docs)
            logger.info(f"Collected {len(qon_docs)} Questions on Notice")
        
    except Exception as e:
        logger.error(f"Parliament scraper error: {e}")
    
    # Run Treasury budget PDF scraper
    logger.info("Running Treasury budget PDF scraper...")
    treasury_scraper = TreasuryBudgetScraper()
    
    try:
        treasury_allocations = treasury_scraper.scrape_and_save(['2024-25', '2023-24'])
        logger.info(f"Collected {len(treasury_allocations)} Treasury budget allocations")
    except Exception as e:
        logger.error(f"Treasury scraper error: {e}")
    
    # Run Parliament QoN scraper
    logger.info("Running Parliament QoN scraper...")
    qon_scraper = ParliamentQoNScraper()
    
    try:
        qon_questions = qon_scraper.search_questions_on_notice()
        if qon_questions:
            qon_scraper.save_to_database(qon_questions)
            logger.info(f"Collected {len(qon_questions)} Questions on Notice")
    except Exception as e:
        logger.error(f"Parliament QoN scraper error: {e}")
    
    logger.info("Data collection complete")

if __name__ == "__main__":
    main()