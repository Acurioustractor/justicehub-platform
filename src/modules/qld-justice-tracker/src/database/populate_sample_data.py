"""
Populate database with sample data if empty.
"""

from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from . import get_db, init_db, BudgetAllocation, YouthStatistics, CostComparison, ParliamentaryDocument
import logging

logger = logging.getLogger(__name__)

def check_if_database_empty(db: Session) -> bool:
    """Check if database has any data."""
    try:
        # Check key tables
        budget_count = db.query(BudgetAllocation).count()
        stats_count = db.query(YouthStatistics).count()
        comparison_count = db.query(CostComparison).count()
        
        return budget_count == 0 and stats_count == 0 and comparison_count == 0
    except Exception as e:
        logger.error(f"Error checking database: {e}")
        return True

def populate_sample_data():
    """Populate database with sample data."""
    db = next(get_db())
    
    try:
        if not check_if_database_empty(db):
            logger.info("Database already has data, skipping sample data population")
            return
        
        logger.info("Populating database with sample data...")
        
        # Create sample budget allocations
        base_date = datetime.now() - timedelta(days=365)
        for i in range(12):
            date = base_date + timedelta(days=i*30)
            
            # Create detention budget
            detention_budget = BudgetAllocation(
                fiscal_year=f"{date.year}-{date.year+1}",
                department="Department of Youth Justice",
                program="Youth Detention Operations",
                category="detention",
                amount=450_000_000 + random.randint(-10_000_000, 10_000_000),
                description="Funding for youth detention facilities",
                source_document="Sample Budget Paper",
                scraped_date=date
            )
            db.add(detention_budget)
            
            # Create community budget
            community_budget = BudgetAllocation(
                fiscal_year=f"{date.year}-{date.year+1}",
                department="Department of Youth Justice",
                program="Community Youth Justice",
                category="community",
                amount=45_000_000 + random.randint(-2_000_000, 2_000_000),
                description="Funding for community-based programs",
                source_document="Sample Budget Paper",
                scraped_date=date
            )
            db.add(community_budget)
        
        # Create sample youth statistics
        for i in range(12):
            date = base_date + timedelta(days=i*30)
            stats = YouthStatistics(
                date=date.date(),
                facility_name="Sample Youth Detention Centre",
                total_youth=250 + random.randint(-20, 20),
                indigenous_youth=int((250 + random.randint(-20, 20)) * 0.75),
                indigenous_percentage=75.0 + random.uniform(-5, 5),
                average_age=16.5 + random.uniform(-1, 1),
                average_stay_days=120 + random.randint(-10, 10),
                program_type="detention",
                source_url="https://example.com/sample-data"
            )
            db.add(stats)
        
        # Create sample cost comparisons
        for i in range(30):
            date = base_date + timedelta(days=i*12)
            detention_cost = 857 + random.randint(-50, 50)
            community_cost = 41 + random.randint(-5, 5)
            comparison = CostComparison(
                date=date.date(),
                detention_daily_cost=detention_cost,
                community_daily_cost=community_cost,
                cost_ratio=detention_cost / community_cost,
                detention_spending_percentage=90.6 + random.uniform(-2, 2),
                community_spending_percentage=9.4 + random.uniform(-2, 2),
                total_budget=500_000_000 + random.randint(-10_000_000, 10_000_000),
                notes="Sample cost comparison data"
            )
            db.add(comparison)
        
        # Create sample parliamentary documents
        doc_types = ["Question on Notice", "Committee Report", "Budget Paper", "Annual Report"]
        for i in range(20):
            date = base_date + timedelta(days=i*18)
            doc = ParliamentaryDocument(
                title=f"Sample {doc_types[i % len(doc_types)]} - Youth Justice {i+1}",
                document_type=doc_types[i % len(doc_types)],
                date=date.date(),
                author="Sample Author",
                url=f"https://parliament.qld.gov.au/sample/{i+1}",
                content=f"Sample content discussing youth justice matters. Document {i+1}.",
                mentions_youth_justice=True,
                mentions_spending=bool(i % 2),
                mentions_indigenous=bool(i % 3)
            )
            db.add(doc)
        
        db.commit()
        logger.info("Sample data populated successfully")
        
    except Exception as e:
        logger.error(f"Error populating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    populate_sample_data()