#!/usr/bin/env python3
"""
Script to run Treasury budget PDF scraper and Parliament QoN scraper.
"""

import sys
from datetime import datetime, timedelta
from loguru import logger

from src.scrapers import TreasuryBudgetScraper, ParliamentQoNScraper
from src.database import init_db

# Configure logging
logger.add("logs/treasury_qon_scraper_{time}.log", rotation="1 week")

def main():
    """Run Treasury and QoN scrapers."""
    logger.info("Starting Treasury budget and Parliament QoN scraping...")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Run Treasury budget scraper
    logger.info("\n=== Running Treasury Budget PDF Scraper ===")
    treasury_scraper = TreasuryBudgetScraper()
    
    try:
        # Scrape last 3 fiscal years
        fiscal_years = ['2024-25', '2023-24', '2022-23']
        allocations = treasury_scraper.scrape_and_save(fiscal_years)
        
        logger.info(f"\nTotal allocations found: {len(allocations)}")
        
        # Show summary by year
        if allocations:
            by_year = {}
            for alloc in allocations:
                year = alloc['fiscal_year']
                if year not in by_year:
                    by_year[year] = []
                by_year[year].append(alloc)
            
            for year, year_allocs in sorted(by_year.items(), reverse=True):
                percentages = treasury_scraper.calculate_detention_vs_community(year_allocs)
                
                print(f"\n{year} Summary:")
                print(f"  Total Programs: {len(year_allocs)}")
                print(f"  Total Budget: ${percentages['total_budget']:,.0f}")
                print(f"  Detention: {percentages['detention_percentage']:.1f}% (${percentages['detention_total']:,.0f})")
                print(f"  Community: {percentages['community_percentage']:.1f}% (${percentages['community_total']:,.0f})")
                
                # Show top programs
                print(f"\n  Top Programs by Funding:")
                sorted_programs = sorted(year_allocs, key=lambda x: x['amount'], reverse=True)[:5]
                for i, prog in enumerate(sorted_programs, 1):
                    print(f"    {i}. {prog['program'][:60]}... - ${prog['amount']:,.0f} ({prog['category']})")
        
    except Exception as e:
        logger.error(f"Treasury scraper error: {e}")
    
    # Run Parliament QoN scraper
    logger.info("\n\n=== Running Parliament Questions on Notice Scraper ===")
    qon_scraper = ParliamentQoNScraper()
    
    try:
        # Search last year of questions
        questions = qon_scraper.search_questions_on_notice(
            start_date=datetime.now() - timedelta(days=365),
            end_date=datetime.now()
        )
        
        if questions:
            # Generate summary
            summary = qon_scraper.generate_summary_report(questions)
            
            print(f"\nQuestions on Notice Summary:")
            print(f"  Total Questions: {summary['total_questions']}")
            print(f"\n  By Category:")
            for category, count in summary['categories'].items():
                print(f"    {category.capitalize()}: {count}")
            
            print(f"\n  Highlighted Questions:")
            print(f"    Indigenous detention rates: {summary['highlighted']['indigenous_detention_rates']}")
            print(f"    Spending-related: {summary['highlighted']['spending_related']}")
            
            print(f"\n  Top Question Askers:")
            for mp, count in summary['top_askers']:
                print(f"    {mp}: {count} questions")
            
            print(f"\n  Top Ministers Questioned:")
            for minister, count in summary['top_ministers']:
                print(f"    {minister}: {count} questions")
            
            # Show sample highlighted questions
            highlighted = [q for q in questions if q.get('indigenous_detention_highlight')][:3]
            if highlighted:
                print(f"\n  Sample Indigenous Detention Questions:")
                for q in highlighted:
                    print(f"\n    Q{q.get('question_number', 'Unknown')} - {q.get('mp_name', 'Unknown')} to {q.get('minister', 'Unknown')}")
                    print(f"    Date: {q.get('date', 'Unknown').strftime('%Y-%m-%d') if isinstance(q.get('date'), datetime) else 'Unknown'}")
                    print(f"    Question: {q.get('question', '')[:200]}...")
                    if q.get('statistics'):
                        print(f"    Key statistics found: {len(q.get('statistics', []))}")
            
            # Save to database
            qon_scraper.save_to_database(questions)
            
        else:
            logger.warning("No Questions on Notice found")
        
    except Exception as e:
        logger.error(f"Parliament QoN scraper error: {e}")
    
    logger.info("\nScraping complete!")

if __name__ == "__main__":
    main()