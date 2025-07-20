#!/usr/bin/env python3
"""
Script to migrate data from SQLite to Supabase.
This preserves existing data while enabling cloud storage.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database.models import (
    Base, BudgetAllocation, Expenditure, YouthStatistics,
    ParliamentaryDocument, CostComparison, HiddenCost,
    FamilyCostCalculation, MediaCitation, PolicyChange,
    ImpactMetric, RTIRequest, Report
)
from src.database.supabase_client import supabase_client
from loguru import logger
from datetime import datetime
import json


def migrate_budget_allocations(session):
    """Migrate budget allocations to Supabase."""
    logger.info("Migrating budget allocations...")
    
    allocations = session.query(BudgetAllocation).all()
    migrated = 0
    
    for allocation in allocations:
        try:
            data = {
                'fiscal_year': allocation.fiscal_year,
                'department': allocation.department,
                'program': allocation.program,
                'category': allocation.category,
                'amount': float(allocation.amount),
                'description': allocation.description,
                'source_url': allocation.source_url,
                'source_document': allocation.source_document,
                'scraped_date': allocation.scraped_date.isoformat() if allocation.scraped_date else None
            }
            
            result = supabase_client.insert_budget_allocation(data)
            if result:
                migrated += 1
                
        except Exception as e:
            logger.error(f"Error migrating budget allocation {allocation.id}: {e}")
    
    logger.info(f"Migrated {migrated}/{len(allocations)} budget allocations")
    return migrated


def migrate_youth_statistics(session):
    """Migrate youth statistics to Supabase."""
    logger.info("Migrating youth statistics...")
    
    stats = session.query(YouthStatistics).all()
    migrated = 0
    
    for stat in stats:
        try:
            data = {
                'date': stat.date.isoformat() if stat.date else None,
                'facility_name': stat.facility_name,
                'total_youth': stat.total_youth,
                'indigenous_youth': stat.indigenous_youth,
                'indigenous_percentage': float(stat.indigenous_percentage) if stat.indigenous_percentage else None,
                'average_age': float(stat.average_age) if stat.average_age else None,
                'average_stay_days': float(stat.average_stay_days) if stat.average_stay_days else None,
                'program_type': stat.program_type,
                'source_url': stat.source_url,
                'scraped_date': stat.scraped_date.isoformat() if stat.scraped_date else None
            }
            
            result = supabase_client.insert_youth_statistics(data)
            if result:
                migrated += 1
                
        except Exception as e:
            logger.error(f"Error migrating youth statistic {stat.id}: {e}")
    
    logger.info(f"Migrated {migrated}/{len(stats)} youth statistics")
    return migrated


def migrate_parliamentary_documents(session):
    """Migrate parliamentary documents to Supabase."""
    logger.info("Migrating parliamentary documents...")
    
    documents = session.query(ParliamentaryDocument).all()
    migrated = 0
    
    for doc in documents:
        try:
            data = {
                'document_type': doc.document_type,
                'title': doc.title,
                'date': doc.date.isoformat() if doc.date else None,
                'author': doc.author,
                'url': doc.url,
                'content': doc.content,
                'mentions_youth_justice': doc.mentions_youth_justice,
                'mentions_spending': doc.mentions_spending,
                'mentions_indigenous': doc.mentions_indigenous,
                'scraped_date': doc.scraped_date.isoformat() if doc.scraped_date else None
            }
            
            result = supabase_client.insert_parliamentary_document(data)
            if result:
                migrated += 1
                
        except Exception as e:
            logger.error(f"Error migrating parliamentary document {doc.id}: {e}")
    
    logger.info(f"Migrated {migrated}/{len(documents)} parliamentary documents")
    return migrated


def migrate_cost_comparisons(session):
    """Migrate cost comparisons to Supabase."""
    logger.info("Migrating cost comparisons...")
    
    comparisons = session.query(CostComparison).all()
    migrated = 0
    
    for comparison in comparisons:
        try:
            data = {
                'date': comparison.date.isoformat() if comparison.date else None,
                'detention_daily_cost': float(comparison.detention_daily_cost),
                'community_daily_cost': float(comparison.community_daily_cost),
                'cost_ratio': float(comparison.cost_ratio) if comparison.cost_ratio else None,
                'detention_spending_percentage': float(comparison.detention_spending_percentage) if comparison.detention_spending_percentage else None,
                'community_spending_percentage': float(comparison.community_spending_percentage) if comparison.community_spending_percentage else None,
                'total_budget': float(comparison.total_budget) if comparison.total_budget else None,
                'notes': comparison.notes
            }
            
            result = supabase_client.insert_cost_comparison(data)
            if result:
                migrated += 1
                
        except Exception as e:
            logger.error(f"Error migrating cost comparison {comparison.id}: {e}")
    
    logger.info(f"Migrated {migrated}/{len(comparisons)} cost comparisons")
    return migrated


def migrate_hidden_costs(session):
    """Migrate hidden costs to Supabase."""
    logger.info("Migrating hidden costs...")
    
    costs = session.query(HiddenCost).all()
    migrated = 0
    
    for cost in costs:
        try:
            data = {
                'cost_category': cost.cost_category,
                'stakeholder_type': cost.stakeholder_type,
                'description': cost.description,
                'amount_per_instance': float(cost.amount_per_instance) if cost.amount_per_instance else None,
                'frequency': cost.frequency,
                'annual_estimate': float(cost.annual_estimate) if cost.annual_estimate else None,
                'source': cost.source,
                'notes': cost.notes
            }
            
            result = supabase_client.insert_hidden_cost(data)
            if result:
                migrated += 1
                
        except Exception as e:
            logger.error(f"Error migrating hidden cost {cost.id}: {e}")
    
    logger.info(f"Migrated {migrated}/{len(costs)} hidden costs")
    return migrated


def migrate_family_costs(session):
    """Migrate family cost calculations to Supabase."""
    logger.info("Migrating family cost calculations...")
    
    calculations = session.query(FamilyCostCalculation).all()
    migrated = 0
    
    for calc in calculations:
        try:
            data = {
                'calculation_date': calc.calculation_date.isoformat() if calc.calculation_date else None,
                'youth_location': calc.youth_location,
                'family_location': calc.family_location,
                'distance_km': float(calc.distance_km) if calc.distance_km else None,
                'travel_cost_per_trip': float(calc.travel_cost_per_trip) if calc.travel_cost_per_trip else None,
                'trips_per_month': calc.trips_per_month,
                'monthly_travel_cost': float(calc.monthly_travel_cost) if calc.monthly_travel_cost else None,
                'phone_calls_per_week': calc.phone_calls_per_week,
                'call_cost_per_minute': float(calc.call_cost_per_minute) if calc.call_cost_per_minute else None,
                'average_call_duration': calc.average_call_duration,
                'monthly_phone_cost': float(calc.monthly_phone_cost) if calc.monthly_phone_cost else None,
                'work_days_missed_per_month': float(calc.work_days_missed_per_month) if calc.work_days_missed_per_month else None,
                'average_daily_wage': float(calc.average_daily_wage) if calc.average_daily_wage else None,
                'monthly_lost_wages': float(calc.monthly_lost_wages) if calc.monthly_lost_wages else None,
                'legal_representation': calc.legal_representation,
                'legal_cost_estimate': float(calc.legal_cost_estimate) if calc.legal_cost_estimate else None,
                'total_monthly_cost': float(calc.total_monthly_cost) if calc.total_monthly_cost else None,
                'total_annual_cost': float(calc.total_annual_cost) if calc.total_annual_cost else None,
                'official_daily_cost': float(calc.official_daily_cost) if calc.official_daily_cost else 857,
                'family_cost_percentage': float(calc.family_cost_percentage) if calc.family_cost_percentage else None,
                'notes': calc.notes
            }
            
            result = supabase_client.insert_family_cost_calculation(data)
            if result:
                migrated += 1
                
        except Exception as e:
            logger.error(f"Error migrating family cost calculation {calc.id}: {e}")
    
    logger.info(f"Migrated {migrated}/{len(calculations)} family cost calculations")
    return migrated


def main():
    """Main migration function."""
    logger.info("Starting SQLite to Supabase migration...")
    
    if not supabase_client:
        logger.error("Supabase client not initialized. Check your environment variables.")
        return
    
    # Connect to SQLite database
    sqlite_path = os.path.join(os.path.dirname(__file__), '..', 'youth_justice.db')
    if not os.path.exists(sqlite_path):
        logger.error(f"SQLite database not found at {sqlite_path}")
        return
    
    engine = create_engine(f'sqlite:///{sqlite_path}')
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Run migrations
        total_migrated = 0
        
        total_migrated += migrate_budget_allocations(session)
        total_migrated += migrate_youth_statistics(session)
        total_migrated += migrate_parliamentary_documents(session)
        total_migrated += migrate_cost_comparisons(session)
        total_migrated += migrate_hidden_costs(session)
        total_migrated += migrate_family_costs(session)
        
        logger.info(f"Migration complete! Total records migrated: {total_migrated}")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        
    finally:
        session.close()


if __name__ == "__main__":
    main()