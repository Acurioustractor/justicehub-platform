import pandas as pd
from typing import Dict, List, Tuple
from datetime import datetime, date
from loguru import logger
from ..database import get_db, BudgetAllocation, Expenditure, YouthStatistics, CostComparison

class CostAnalyzer:
    """Analyze youth justice costs and spending patterns."""
    
    def __init__(self):
        self.detention_daily_cost = 857  # $857/day
        self.community_daily_cost = 41   # $41/day
        self.cost_ratio = self.detention_daily_cost / self.community_daily_cost
        
    def calculate_spending_split(self) -> Dict:
        """Calculate current spending split between detention and community programs."""
        db = next(get_db())
        
        try:
            # Get latest fiscal year allocations
            allocations = db.query(BudgetAllocation).filter(
                BudgetAllocation.fiscal_year == '2024-25'
            ).all()
            
            detention_total = sum(a.amount for a in allocations if a.category == 'detention')
            community_total = sum(a.amount for a in allocations if a.category == 'community')
            total_budget = detention_total + community_total
            
            if total_budget > 0:
                detention_percentage = (detention_total / total_budget) * 100
                community_percentage = (community_total / total_budget) * 100
            else:
                # Use known percentages if no data
                detention_percentage = 90.6
                community_percentage = 9.4
                
            return {
                'detention_total': detention_total,
                'community_total': community_total,
                'total_budget': total_budget,
                'detention_percentage': detention_percentage,
                'community_percentage': community_percentage,
                'cost_ratio': self.cost_ratio
            }
            
        finally:
            db.close()
    
    def calculate_alternative_scenarios(self, total_budget: float) -> List[Dict]:
        """Calculate different spending scenarios and their outcomes."""
        scenarios = []
        
        # Current scenario (90.6% detention, 9.4% community)
        current = {
            'name': 'Current Allocation',
            'detention_percentage': 90.6,
            'community_percentage': 9.4,
            'detention_budget': total_budget * 0.906,
            'community_budget': total_budget * 0.094,
            'youth_days_detention': (total_budget * 0.906) / self.detention_daily_cost,
            'youth_days_community': (total_budget * 0.094) / self.community_daily_cost,
            'total_youth_days': 0
        }
        current['total_youth_days'] = current['youth_days_detention'] + current['youth_days_community']
        scenarios.append(current)
        
        # Progressive scenarios
        for detention_pct in [80, 70, 60, 50, 40, 30]:
            community_pct = 100 - detention_pct
            
            scenario = {
                'name': f'{detention_pct}% Detention / {community_pct}% Community',
                'detention_percentage': detention_pct,
                'community_percentage': community_pct,
                'detention_budget': total_budget * (detention_pct / 100),
                'community_budget': total_budget * (community_pct / 100),
                'youth_days_detention': (total_budget * (detention_pct / 100)) / self.detention_daily_cost,
                'youth_days_community': (total_budget * (community_pct / 100)) / self.community_daily_cost,
                'total_youth_days': 0
            }
            scenario['total_youth_days'] = scenario['youth_days_detention'] + scenario['youth_days_community']
            
            # Calculate increase in capacity
            scenario['capacity_increase_pct'] = ((scenario['total_youth_days'] - current['total_youth_days']) / current['total_youth_days']) * 100
            
            scenarios.append(scenario)
        
        return scenarios
    
    def analyze_indigenous_disparities(self) -> Dict:
        """Analyze Indigenous youth detention disparities."""
        db = next(get_db())
        
        try:
            # Get latest statistics
            latest_stats = db.query(YouthStatistics).order_by(
                YouthStatistics.date.desc()
            ).limit(100).all()
            
            if not latest_stats:
                # Return known statistics
                return {
                    'indigenous_percentage_detained': 66,
                    'indigenous_percentage_population': 6,
                    'overrepresentation_factor': 22,
                    'facilities': {
                        'cleveland': {'indigenous_percentage': 70},
                        'west_moreton': {'indigenous_percentage': 65}
                    }
                }
            
            # Calculate averages
            detention_stats = [s for s in latest_stats if s.program_type == 'detention']
            
            total_youth = sum(s.total_youth for s in detention_stats)
            total_indigenous = sum(s.indigenous_youth for s in detention_stats if s.indigenous_youth)
            
            indigenous_percentage = (total_indigenous / total_youth * 100) if total_youth > 0 else 0
            overrepresentation_factor = indigenous_percentage / 6  # 6% of youth population
            
            # By facility
            facilities = {}
            for facility in set(s.facility_name for s in detention_stats if s.facility_name):
                facility_stats = [s for s in detention_stats if s.facility_name == facility]
                facility_total = sum(s.total_youth for s in facility_stats)
                facility_indigenous = sum(s.indigenous_youth for s in facility_stats if s.indigenous_youth)
                
                facilities[facility] = {
                    'total_youth': facility_total,
                    'indigenous_youth': facility_indigenous,
                    'indigenous_percentage': (facility_indigenous / facility_total * 100) if facility_total > 0 else 0
                }
            
            return {
                'indigenous_percentage_detained': indigenous_percentage,
                'indigenous_percentage_population': 6,
                'overrepresentation_factor': overrepresentation_factor,
                'facilities': facilities,
                'date_range': f"{min(s.date for s in detention_stats)} to {max(s.date for s in detention_stats)}"
            }
            
        finally:
            db.close()
    
    def calculate_cost_per_outcome(self) -> Dict:
        """Calculate cost per successful outcome for different programs."""
        # Based on research and estimates
        outcomes = {
            'detention': {
                'daily_cost': self.detention_daily_cost,
                'average_stay_days': 45,
                'recidivism_rate': 0.70,  # 70% reoffend
                'success_rate': 0.30,
                'cost_per_youth': self.detention_daily_cost * 45,
                'cost_per_success': (self.detention_daily_cost * 45) / 0.30
            },
            'community_supervised': {
                'daily_cost': self.community_daily_cost,
                'average_program_days': 90,
                'recidivism_rate': 0.45,  # 45% reoffend
                'success_rate': 0.55,
                'cost_per_youth': self.community_daily_cost * 90,
                'cost_per_success': (self.community_daily_cost * 90) / 0.55
            },
            'restorative_justice': {
                'daily_cost': 25,
                'average_program_days': 30,
                'recidivism_rate': 0.35,  # 35% reoffend
                'success_rate': 0.65,
                'cost_per_youth': 25 * 30,
                'cost_per_success': (25 * 30) / 0.65
            },
            'early_intervention': {
                'daily_cost': 15,
                'average_program_days': 180,
                'recidivism_rate': 0.25,  # 25% reoffend  
                'success_rate': 0.75,
                'cost_per_youth': 15 * 180,
                'cost_per_success': (15 * 180) / 0.75
            }
        }
        
        return outcomes
    
    def project_savings(self, years: int = 5) -> pd.DataFrame:
        """Project potential savings from shifting to community programs."""
        current_split = self.calculate_spending_split()
        total_budget = current_split['total_budget'] or 500_000_000  # $500M estimate
        
        projections = []
        
        for year in range(years + 1):
            # Gradual shift: reduce detention by 5% per year
            detention_pct = max(40, 90.6 - (year * 5))
            community_pct = 100 - detention_pct
            
            detention_budget = total_budget * (detention_pct / 100)
            community_budget = total_budget * (community_pct / 100)
            
            # Calculate youth served
            youth_days_detention = detention_budget / self.detention_daily_cost
            youth_days_community = community_budget / self.community_daily_cost
            
            # Estimate outcomes based on success rates
            detention_successes = (youth_days_detention / 45) * 0.30  # 45 day avg, 30% success
            community_successes = (youth_days_community / 90) * 0.55  # 90 day avg, 55% success
            
            total_successes = detention_successes + community_successes
            
            # Calculate savings (reduced reoffending costs)
            reoffending_cost_saved = (community_successes - detention_successes) * 150000  # $150k per prevented reoffense
            
            projections.append({
                'year': year,
                'detention_percentage': detention_pct,
                'community_percentage': community_pct,
                'total_youth_served': (youth_days_detention / 45) + (youth_days_community / 90),
                'successful_outcomes': total_successes,
                'cost_savings': reoffending_cost_saved if year > 0 else 0,
                'cumulative_savings': sum(p['cost_savings'] for p in projections) + (reoffending_cost_saved if year > 0 else 0)
            })
        
        return pd.DataFrame(projections)
    
    def save_comparison(self):
        """Save current cost comparison to database."""
        db = next(get_db())
        
        try:
            split = self.calculate_spending_split()
            
            comparison = CostComparison(
                date=date.today(),
                detention_daily_cost=self.detention_daily_cost,
                community_daily_cost=self.community_daily_cost,
                cost_ratio=self.cost_ratio,
                detention_spending_percentage=split['detention_percentage'],
                community_spending_percentage=split['community_percentage'],
                total_budget=split['total_budget'],
                notes='Automated daily comparison'
            )
            
            db.add(comparison)
            db.commit()
            
            logger.info("Saved cost comparison to database")
            
        except Exception as e:
            logger.error(f"Error saving comparison: {e}")
            db.rollback()
        finally:
            db.close()