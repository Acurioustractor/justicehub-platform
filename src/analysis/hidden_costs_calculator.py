import math
from typing import Dict, List, Tuple
from datetime import date
from loguru import logger

from ..database import get_db, HiddenCost, FamilyCostCalculation

class HiddenCostsCalculator:
    """Calculate hidden costs borne by families of youth in detention."""
    
    def __init__(self):
        # Detention centers
        self.detention_centers = {
            'Cleveland Youth Detention Centre': {
                'location': 'Townsville',
                'coordinates': (-19.2590, 146.8169)
            },
            'West Moreton Youth Detention Centre': {
                'location': 'Wacol, Brisbane',
                'coordinates': (-27.5976, 152.9329)
            }
        }
        
        # Major Queensland towns with coordinates
        self.queensland_towns = {
            'Brisbane': (-27.4698, 153.0251),
            'Gold Coast': (-28.0167, 153.4000),
            'Sunshine Coast': (-26.6500, 153.0667),
            'Townsville': (-19.2590, 146.8169),
            'Cairns': (-16.9186, 145.7781),
            'Toowoomba': (-27.5600, 151.9500),
            'Mackay': (-21.1425, 149.1821),
            'Rockhampton': (-23.3781, 150.5100),
            'Bundaberg': (-24.8661, 152.3489),
            'Mount Isa': (-20.7333, 139.5000),
            'Gladstone': (-23.8489, 151.2555),
            'Hervey Bay': (-25.2882, 152.8234),
            'Ipswich': (-27.6104, 152.7609),
            'Logan': (-27.6393, 153.1093),
            'Redland Bay': (-27.6111, 153.3022),
            'Caboolture': (-27.0833, 152.9500),
            # Remote communities
            'Thursday Island': (-10.5820, 142.2190),
            'Weipa': (-12.6786, 141.9247),
            'Normanton': (-17.6731, 141.0707),
            'Longreach': (-23.4397, 144.2500),
            'Charleville': (-26.4072, 146.2458),
            'Roma': (-26.5733, 148.7869),
            'Emerald': (-23.5269, 148.1614),
            'Ayr': (-19.5742, 147.4056),
            'Innisfail': (-17.5236, 146.0297),
            'Mareeba': (-17.0003, 145.4231),
            'Charters Towers': (-20.0736, 146.2611),
            'Kingaroy': (-26.5333, 151.8333),
            'Warwick': (-28.2156, 152.0341),
            'Gympie': (-26.1906, 152.6655),
            'Maryborough': (-25.5369, 152.7019),
            # Indigenous communities
            'Palm Island': (-18.7500, 146.5833),
            'Yarrabah': (-16.9167, 145.8667),
            'Doomadgee': (-17.9333, 138.8167),
            'Aurukun': (-13.3547, 141.7208),
            'Lockhart River': (-12.4833, 143.3333),
            'Bamaga': (-10.8950, 142.3889),
            'Cherbourg': (-26.2833, 151.9500),
            'Woorabinda': (-24.1167, 149.4500),
            'Hope Vale': (-15.2944, 145.1050)
        }
        
        # Cost parameters
        self.fuel_cost_per_km = 0.15  # Based on average fuel economy and prices
        self.phone_cost_per_minute = 0.50  # Detention center rates
        self.average_daily_wage = 200  # Queensland minimum wage approximation
        
        # Load hidden costs from database
        self._load_hidden_costs()
    
    def _load_hidden_costs(self):
        """Load hidden cost data from database."""
        db = next(get_db())
        
        try:
            costs = db.query(HiddenCost).all()
            
            self.hidden_costs = {
                'travel': {
                    'parking': 20,  # Per visit
                    'tolls': 10,  # Average per trip
                    'meals': 30,  # Per person per visit
                    'accommodation': 150  # Per night if required
                },
                'communication': {
                    'phone_setup_fee': 10,  # Account setup
                    'video_call_fee': 5  # Per call
                },
                'legal': {
                    'private_lawyer_hourly': 350,
                    'court_filing_fees': 200,
                    'expert_witness': 2000
                },
                'miscellaneous': {
                    'clothing_packages': 100,  # Quarterly
                    'commissary': 50,  # Monthly
                    'counseling': 150  # Per session for family
                }
            }
            
            # Update from database
            for cost in costs:
                if cost.cost_category in self.hidden_costs:
                    self.hidden_costs[cost.cost_category][cost.description] = cost.amount_per_instance
                    
        finally:
            db.close()
    
    def calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate distance between two coordinates using Haversine formula."""
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def calculate_travel_costs(self, family_location: str, detention_center: str, 
                             visits_per_month: int = 2) -> Dict:
        """Calculate travel costs for family visits."""
        if family_location not in self.queensland_towns:
            raise ValueError(f"Unknown location: {family_location}")
        
        if detention_center not in self.detention_centers:
            raise ValueError(f"Unknown detention center: {detention_center}")
        
        # Get coordinates
        family_coords = self.queensland_towns[family_location]
        center_coords = self.detention_centers[detention_center]['coordinates']
        
        # Calculate distance
        distance_km = self.calculate_distance(family_coords, center_coords)
        
        # Round trip distance
        round_trip_km = distance_km * 2
        
        # Fuel cost
        fuel_cost = round_trip_km * self.fuel_cost_per_km
        
        # Additional costs
        parking = self.hidden_costs['travel']['parking']
        meals = self.hidden_costs['travel']['meals'] * 2  # 2 people average
        
        # Check if accommodation needed (over 300km one way)
        accommodation = 0
        if distance_km > 300:
            accommodation = self.hidden_costs['travel']['accommodation']
        
        # Tolls (mainly for Brisbane area)
        tolls = 0
        if 'Brisbane' in detention_center or family_location in ['Gold Coast', 'Sunshine Coast']:
            tolls = self.hidden_costs['travel']['tolls'] * 2  # Round trip
        
        # Total per visit
        cost_per_visit = fuel_cost + parking + meals + accommodation + tolls
        
        # Monthly cost
        monthly_cost = cost_per_visit * visits_per_month
        
        return {
            'distance_km': round(distance_km, 1),
            'round_trip_km': round(round_trip_km, 1),
            'fuel_cost': round(fuel_cost, 2),
            'parking': parking,
            'meals': meals,
            'accommodation': accommodation,
            'tolls': tolls,
            'cost_per_visit': round(cost_per_visit, 2),
            'visits_per_month': visits_per_month,
            'monthly_cost': round(monthly_cost, 2),
            'annual_cost': round(monthly_cost * 12, 2)
        }
    
    def calculate_phone_costs(self, calls_per_week: int = 3, 
                            minutes_per_call: int = 15) -> Dict:
        """Calculate phone call costs."""
        # Setup fee (one-time, amortized over a year)
        monthly_setup = self.hidden_costs['communication']['phone_setup_fee'] / 12
        
        # Call costs
        minutes_per_month = calls_per_week * minutes_per_call * 4.33  # Average weeks per month
        call_cost_monthly = minutes_per_month * self.phone_cost_per_minute
        
        # Video calls (assume 1 per month)
        video_cost_monthly = self.hidden_costs['communication']['video_call_fee']
        
        total_monthly = monthly_setup + call_cost_monthly + video_cost_monthly
        
        return {
            'calls_per_week': calls_per_week,
            'minutes_per_call': minutes_per_call,
            'cost_per_minute': self.phone_cost_per_minute,
            'minutes_per_month': round(minutes_per_month, 1),
            'call_cost_monthly': round(call_cost_monthly, 2),
            'video_cost_monthly': video_cost_monthly,
            'total_monthly': round(total_monthly, 2),
            'annual_cost': round(total_monthly * 12, 2)
        }
    
    def calculate_lost_wages(self, days_missed_per_month: float = 2) -> Dict:
        """Calculate lost wages from missed work."""
        monthly_lost = days_missed_per_month * self.average_daily_wage
        
        return {
            'days_missed_per_month': days_missed_per_month,
            'daily_wage': self.average_daily_wage,
            'monthly_lost_wages': round(monthly_lost, 2),
            'annual_lost_wages': round(monthly_lost * 12, 2)
        }
    
    def calculate_legal_costs(self, hours_required: int = 20, 
                            private_representation: bool = True) -> Dict:
        """Calculate legal representation costs."""
        if not private_representation:
            return {
                'private_representation': False,
                'total_cost': 0,
                'monthly_cost': 0,
                'note': 'Using Legal Aid services'
            }
        
        lawyer_cost = hours_required * self.hidden_costs['legal']['private_lawyer_hourly']
        filing_fees = self.hidden_costs['legal']['court_filing_fees']
        
        total = lawyer_cost + filing_fees
        
        return {
            'private_representation': True,
            'hours_required': hours_required,
            'hourly_rate': self.hidden_costs['legal']['private_lawyer_hourly'],
            'lawyer_cost': lawyer_cost,
            'filing_fees': filing_fees,
            'total_cost': total,
            'monthly_cost': round(total / 12, 2)  # Amortized over a year
        }
    
    def calculate_total_family_burden(self, family_location: str, 
                                    detention_center: str,
                                    visits_per_month: int = 2,
                                    calls_per_week: int = 3,
                                    work_days_missed: float = 2,
                                    private_lawyer: bool = True) -> Dict:
        """Calculate total financial burden on family."""
        # Travel costs
        travel = self.calculate_travel_costs(family_location, detention_center, visits_per_month)
        
        # Phone costs
        phone = self.calculate_phone_costs(calls_per_week)
        
        # Lost wages
        wages = self.calculate_lost_wages(work_days_missed)
        
        # Legal costs
        legal = self.calculate_legal_costs(private_representation=private_lawyer)
        
        # Miscellaneous costs
        misc_monthly = (
            self.hidden_costs['miscellaneous']['clothing_packages'] / 3 +  # Quarterly
            self.hidden_costs['miscellaneous']['commissary'] +  # Monthly
            self.hidden_costs['miscellaneous']['counseling'] / 2  # Bi-monthly
        )
        
        # Total monthly cost
        total_monthly = (
            travel['monthly_cost'] +
            phone['total_monthly'] +
            wages['monthly_lost_wages'] +
            legal['monthly_cost'] +
            misc_monthly
        )
        
        # Compare to official detention cost
        official_daily = 857
        official_monthly = official_daily * 30.4  # Average days per month
        
        family_percentage = (total_monthly / official_monthly) * 100
        
        # Calculate how many days of detention the family costs equal
        family_days_equivalent = total_monthly / official_daily
        
        return {
            'family_location': family_location,
            'detention_center': detention_center,
            'breakdown': {
                'travel': travel,
                'communication': phone,
                'lost_wages': wages,
                'legal': legal,
                'miscellaneous': {
                    'monthly_cost': round(misc_monthly, 2),
                    'annual_cost': round(misc_monthly * 12, 2)
                }
            },
            'total_monthly_cost': round(total_monthly, 2),
            'total_annual_cost': round(total_monthly * 12, 2),
            'official_monthly_cost': round(official_monthly, 2),
            'family_cost_percentage': round(family_percentage, 1),
            'family_days_equivalent': round(family_days_equivalent, 1),
            'combined_monthly_cost': round(total_monthly + official_monthly, 2),
            'note': f"Family bears {family_percentage:.1f}% of official detention cost"
        }
    
    def save_calculation(self, calculation_data: Dict):
        """Save family cost calculation to database."""
        db = next(get_db())
        
        try:
            calc = FamilyCostCalculation(
                calculation_date=date.today(),
                youth_location=calculation_data['detention_center'],
                family_location=calculation_data['family_location'],
                
                # Travel
                distance_km=calculation_data['breakdown']['travel']['distance_km'],
                travel_cost_per_trip=calculation_data['breakdown']['travel']['cost_per_visit'],
                trips_per_month=calculation_data['breakdown']['travel']['visits_per_month'],
                monthly_travel_cost=calculation_data['breakdown']['travel']['monthly_cost'],
                
                # Communication
                phone_calls_per_week=calculation_data['breakdown']['communication']['calls_per_week'],
                call_cost_per_minute=calculation_data['breakdown']['communication']['cost_per_minute'],
                average_call_duration=calculation_data['breakdown']['communication']['minutes_per_call'],
                monthly_phone_cost=calculation_data['breakdown']['communication']['total_monthly'],
                
                # Lost wages
                work_days_missed_per_month=calculation_data['breakdown']['lost_wages']['days_missed_per_month'],
                average_daily_wage=calculation_data['breakdown']['lost_wages']['daily_wage'],
                monthly_lost_wages=calculation_data['breakdown']['lost_wages']['monthly_lost_wages'],
                
                # Legal
                legal_representation=calculation_data['breakdown']['legal']['private_representation'],
                legal_cost_estimate=calculation_data['breakdown']['legal']['total_cost'],
                
                # Totals
                total_monthly_cost=calculation_data['total_monthly_cost'],
                total_annual_cost=calculation_data['total_annual_cost'],
                family_cost_percentage=calculation_data['family_cost_percentage'],
                
                notes=calculation_data['note']
            )
            
            db.add(calc)
            db.commit()
            
            logger.info(f"Saved family cost calculation for {calculation_data['family_location']}")
            
        except Exception as e:
            logger.error(f"Error saving calculation: {e}")
            db.rollback()
        finally:
            db.close()
    
    def get_comparative_analysis(self) -> Dict:
        """Get comparative analysis of hidden costs across different locations."""
        results = []
        
        # Calculate for major population centers to both detention centers
        major_towns = [
            'Brisbane', 'Gold Coast', 'Cairns', 'Townsville', 'Mount Isa',
            'Palm Island', 'Yarrabah', 'Doomadgee', 'Aurukun'
        ]
        
        for town in major_towns:
            for center_name in self.detention_centers.keys():
                try:
                    calc = self.calculate_total_family_burden(
                        family_location=town,
                        detention_center=center_name,
                        visits_per_month=2,
                        calls_per_week=3,
                        work_days_missed=2,
                        private_lawyer=True
                    )
                    
                    results.append({
                        'from': town,
                        'to': center_name,
                        'distance_km': calc['breakdown']['travel']['distance_km'],
                        'monthly_cost': calc['total_monthly_cost'],
                        'percentage_of_official': calc['family_cost_percentage']
                    })
                except:
                    pass
        
        # Sort by monthly cost
        results.sort(key=lambda x: x['monthly_cost'], reverse=True)
        
        # Calculate averages
        if results:
            avg_monthly = sum(r['monthly_cost'] for r in results) / len(results)
            avg_percentage = sum(r['percentage_of_official'] for r in results) / len(results)
            
            # Find highest burden locations
            highest_burden = results[:5]
            
            # Remote communities
            remote_results = [r for r in results if r['from'] in 
                            ['Mount Isa', 'Palm Island', 'Yarrabah', 'Doomadgee', 'Aurukun']]
            
            return {
                'all_routes': results,
                'average_monthly_cost': round(avg_monthly, 2),
                'average_percentage_of_official': round(avg_percentage, 1),
                'highest_burden_routes': highest_burden,
                'remote_community_average': round(
                    sum(r['monthly_cost'] for r in remote_results) / len(remote_results), 2
                ) if remote_results else 0,
                'total_routes_analyzed': len(results)
            }
        
        return {}