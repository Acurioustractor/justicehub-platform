"""
Supabase client for Python scrapers and data management.
"""
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
from supabase import create_client, Client
from loguru import logger
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseClient:
    """Client for interacting with Supabase database."""
    
    def __init__(self):
        """Initialize Supabase client."""
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY must be set")
        
        self.client: Client = create_client(url, key)
        logger.info("Supabase client initialized")
    
    def insert_budget_allocation(self, data: Dict) -> Optional[Dict]:
        """Insert a budget allocation record."""
        try:
            # Convert SQLAlchemy model fields to Supabase format
            record = {
                'fiscal_year': data.get('fiscal_year'),
                'department': data.get('department'),
                'program': data.get('program'),
                'category': data.get('category'),
                'amount': float(data.get('amount', 0)),
                'description': data.get('description'),
                'source_url': data.get('source_url'),
                'source_document': data.get('source_document'),
                'scraped_date': datetime.utcnow().isoformat()
            }
            
            result = self.client.table('budget_allocations').insert(record).execute()
            logger.info(f"Inserted budget allocation: {record['program']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting budget allocation: {e}")
            return None
    
    def insert_expenditure(self, data: Dict) -> Optional[Dict]:
        """Insert an expenditure record."""
        try:
            record = {
                'allocation_id': data.get('allocation_id'),
                'date': data.get('date'),
                'amount': float(data.get('amount', 0)),
                'facility_name': data.get('facility_name'),
                'program_type': data.get('program_type'),
                'daily_cost': float(data.get('daily_cost', 0)) if data.get('daily_cost') else None,
                'youth_count': data.get('youth_count'),
                'indigenous_youth_count': data.get('indigenous_youth_count'),
                'description': data.get('description')
            }
            
            result = self.client.table('expenditures').insert(record).execute()
            logger.info(f"Inserted expenditure for {record['date']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting expenditure: {e}")
            return None
    
    def insert_youth_statistics(self, data: Dict) -> Optional[Dict]:
        """Insert youth statistics record."""
        try:
            record = {
                'date': data.get('date'),
                'facility_name': data.get('facility_name'),
                'total_youth': int(data.get('total_youth', 0)),
                'indigenous_youth': data.get('indigenous_youth'),
                'indigenous_percentage': float(data.get('indigenous_percentage', 0)) if data.get('indigenous_percentage') else None,
                'average_age': float(data.get('average_age', 0)) if data.get('average_age') else None,
                'average_stay_days': float(data.get('average_stay_days', 0)) if data.get('average_stay_days') else None,
                'program_type': data.get('program_type'),
                'source_url': data.get('source_url'),
                'scraped_date': datetime.utcnow().isoformat()
            }
            
            result = self.client.table('youth_statistics').insert(record).execute()
            logger.info(f"Inserted youth statistics for {record['date']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting youth statistics: {e}")
            return None
    
    def insert_parliamentary_document(self, data: Dict) -> Optional[Dict]:
        """Insert parliamentary document record."""
        try:
            # Check if document already exists
            existing = self.client.table('parliamentary_documents').select('*').eq('url', data.get('url')).execute()
            if existing.data:
                logger.info(f"Document already exists: {data.get('title')}")
                return existing.data[0]
            
            record = {
                'document_type': data.get('document_type'),
                'title': data.get('title'),
                'date': data.get('date'),
                'author': data.get('author'),
                'url': data.get('url'),
                'content': data.get('content'),
                'mentions_youth_justice': data.get('mentions_youth_justice', False),
                'mentions_spending': data.get('mentions_spending', False),
                'mentions_indigenous': data.get('mentions_indigenous', False),
                'scraped_date': datetime.utcnow().isoformat()
            }
            
            result = self.client.table('parliamentary_documents').insert(record).execute()
            logger.info(f"Inserted parliamentary document: {record['title']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting parliamentary document: {e}")
            return None
    
    def insert_cost_comparison(self, data: Dict) -> Optional[Dict]:
        """Insert cost comparison record."""
        try:
            record = {
                'date': data.get('date'),
                'detention_daily_cost': float(data.get('detention_daily_cost', 857)),
                'community_daily_cost': float(data.get('community_daily_cost', 41)),
                'cost_ratio': float(data.get('cost_ratio', 0)) if data.get('cost_ratio') else None,
                'detention_spending_percentage': float(data.get('detention_spending_percentage', 0)) if data.get('detention_spending_percentage') else None,
                'community_spending_percentage': float(data.get('community_spending_percentage', 0)) if data.get('community_spending_percentage') else None,
                'total_budget': float(data.get('total_budget', 0)) if data.get('total_budget') else None,
                'notes': data.get('notes')
            }
            
            result = self.client.table('cost_comparisons').insert(record).execute()
            logger.info(f"Inserted cost comparison for {record['date']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting cost comparison: {e}")
            return None
    
    def insert_hidden_cost(self, data: Dict) -> Optional[Dict]:
        """Insert hidden cost record."""
        try:
            record = {
                'cost_category': data.get('cost_category'),
                'stakeholder_type': data.get('stakeholder_type'),
                'description': data.get('description'),
                'amount_per_instance': float(data.get('amount_per_instance', 0)) if data.get('amount_per_instance') else None,
                'frequency': data.get('frequency'),
                'annual_estimate': float(data.get('annual_estimate', 0)) if data.get('annual_estimate') else None,
                'source': data.get('source'),
                'notes': data.get('notes')
            }
            
            result = self.client.table('hidden_costs').insert(record).execute()
            logger.info(f"Inserted hidden cost: {record['cost_category']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting hidden cost: {e}")
            return None
    
    def insert_family_cost_calculation(self, data: Dict) -> Optional[Dict]:
        """Insert family cost calculation record."""
        try:
            record = {
                'calculation_date': data.get('calculation_date'),
                'youth_location': data.get('youth_location'),
                'family_location': data.get('family_location'),
                'distance_km': float(data.get('distance_km', 0)) if data.get('distance_km') else None,
                'travel_cost_per_trip': float(data.get('travel_cost_per_trip', 0)) if data.get('travel_cost_per_trip') else None,
                'trips_per_month': data.get('trips_per_month'),
                'monthly_travel_cost': float(data.get('monthly_travel_cost', 0)) if data.get('monthly_travel_cost') else None,
                'phone_calls_per_week': data.get('phone_calls_per_week'),
                'call_cost_per_minute': float(data.get('call_cost_per_minute', 0)) if data.get('call_cost_per_minute') else None,
                'average_call_duration': data.get('average_call_duration'),
                'monthly_phone_cost': float(data.get('monthly_phone_cost', 0)) if data.get('monthly_phone_cost') else None,
                'work_days_missed_per_month': float(data.get('work_days_missed_per_month', 0)) if data.get('work_days_missed_per_month') else None,
                'average_daily_wage': float(data.get('average_daily_wage', 0)) if data.get('average_daily_wage') else None,
                'monthly_lost_wages': float(data.get('monthly_lost_wages', 0)) if data.get('monthly_lost_wages') else None,
                'legal_representation': data.get('legal_representation'),
                'legal_cost_estimate': float(data.get('legal_cost_estimate', 0)) if data.get('legal_cost_estimate') else None,
                'total_monthly_cost': float(data.get('total_monthly_cost', 0)) if data.get('total_monthly_cost') else None,
                'total_annual_cost': float(data.get('total_annual_cost', 0)) if data.get('total_annual_cost') else None,
                'official_daily_cost': float(data.get('official_daily_cost', 857)),
                'family_cost_percentage': float(data.get('family_cost_percentage', 0)) if data.get('family_cost_percentage') else None,
                'notes': data.get('notes')
            }
            
            result = self.client.table('family_cost_calculations').insert(record).execute()
            logger.info(f"Inserted family cost calculation for {record['calculation_date']}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error inserting family cost calculation: {e}")
            return None
    
    # Query methods
    def get_budget_allocations(self, fiscal_year: Optional[str] = None, category: Optional[str] = None) -> List[Dict]:
        """Get budget allocations with optional filters."""
        try:
            query = self.client.table('budget_allocations').select('*')
            
            if fiscal_year:
                query = query.eq('fiscal_year', fiscal_year)
            if category:
                query = query.eq('category', category)
            
            result = query.order('fiscal_year', desc=True).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting budget allocations: {e}")
            return []
    
    def get_youth_statistics(self, start_date: Optional[str] = None, end_date: Optional[str] = None, 
                           facility_name: Optional[str] = None) -> List[Dict]:
        """Get youth statistics with optional filters."""
        try:
            query = self.client.table('youth_statistics').select('*')
            
            if start_date:
                query = query.gte('date', start_date)
            if end_date:
                query = query.lte('date', end_date)
            if facility_name:
                query = query.eq('facility_name', facility_name)
            
            result = query.order('date', desc=True).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting youth statistics: {e}")
            return []
    
    def get_cost_comparisons(self, limit: int = 10) -> List[Dict]:
        """Get recent cost comparisons."""
        try:
            result = self.client.table('cost_comparisons').select('*').order('date', desc=True).limit(limit).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting cost comparisons: {e}")
            return []
    
    def get_hidden_costs(self, category: Optional[str] = None) -> List[Dict]:
        """Get hidden costs with optional category filter."""
        try:
            query = self.client.table('hidden_costs').select('*')
            
            if category:
                query = query.eq('cost_category', category)
            
            result = query.execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting hidden costs: {e}")
            return []
    
    def get_recent_documents(self, document_type: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """Get recent parliamentary documents."""
        try:
            query = self.client.table('parliamentary_documents').select('*')
            
            if document_type:
                query = query.eq('document_type', document_type)
            
            # Filter for documents that mention youth justice
            query = query.eq('mentions_youth_justice', True)
            
            result = query.order('date', desc=True).limit(limit).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting parliamentary documents: {e}")
            return []
    
    def get_impact_metrics(self, metric_type: Optional[str] = None, limit: int = 30) -> List[Dict]:
        """Get impact metrics."""
        try:
            query = self.client.table('impact_metrics').select('*')
            
            if metric_type:
                query = query.eq('metric_type', metric_type)
            
            result = query.order('metric_date', desc=True).limit(limit).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"Error getting impact metrics: {e}")
            return []

# Create singleton instance
supabase_client = SupabaseClient() if os.getenv('SUPABASE_URL') else None