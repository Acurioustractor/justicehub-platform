from datetime import datetime, timedelta
from typing import List, Dict
from loguru import logger

from ..database import get_db, RTIRequest, BudgetAllocation, YouthStatistics, HiddenCost

class RTIRequestGenerator:
    """Automatically generate RTI requests for missing data."""
    
    def __init__(self):
        self.departments = {
            'youth_justice': 'Department of Youth Justice, Employment, Small Business and Training',
            'treasury': 'Queensland Treasury',
            'police': 'Queensland Police Service',
            'attorney_general': 'Department of Justice and Attorney-General',
            'communities': 'Department of Children, Youth Justice and Multicultural Affairs'
        }
        
        self.data_requirements = {
            'facility_costs': {
                'description': 'Detailed operational costs by facility',
                'department': 'youth_justice',
                'priority': 'high',
                'fields': [
                    'Daily operational cost per youth by facility',
                    'Breakdown of costs (staffing, maintenance, programs)',
                    'Occupancy rates by month',
                    'Cost per vacant bed'
                ]
            },
            'program_outcomes': {
                'description': 'Program effectiveness and recidivism data',
                'department': 'youth_justice',
                'priority': 'high',
                'fields': [
                    'Recidivism rates by program type',
                    'Success metrics and definitions',
                    'Long-term tracking data (2+ years)',
                    'Cost per successful outcome'
                ]
            },
            'indigenous_data': {
                'description': 'Detailed Indigenous youth statistics',
                'department': 'youth_justice',
                'priority': 'critical',
                'fields': [
                    'Monthly Indigenous detention rates by facility',
                    'Average length of stay by Indigenous status',
                    'Access to cultural programs and participation rates',
                    'Indigenous-specific program funding'
                ]
            },
            'hidden_costs': {
                'description': 'Family and social costs of detention',
                'department': 'youth_justice',
                'priority': 'medium',
                'fields': [
                    'Average distance families travel for visits',
                    'Phone call usage and revenue data',
                    'Family support service utilization',
                    'Post-release support costs'
                ]
            },
            'police_data': {
                'description': 'Youth arrest and diversion statistics',
                'department': 'police',
                'priority': 'high',
                'fields': [
                    'Youth arrests by region and offense type',
                    'Diversion program referrals and outcomes',
                    'Police cautioning rates',
                    'Time from arrest to court appearance'
                ]
            },
            'court_data': {
                'description': 'Youth court proceedings and outcomes',
                'department': 'attorney_general',
                'priority': 'medium',
                'fields': [
                    'Youth court appearance numbers',
                    'Sentencing patterns by offense and region',
                    'Legal aid provision rates',
                    'Average time in remand'
                ]
            }
        }
    
    def identify_missing_data(self) -> List[Dict]:
        """Identify what data is missing or outdated."""
        missing_data = []
        db = next(get_db())
        
        try:
            # Check when data was last updated
            current_date = datetime.now()
            
            # Check facility cost data
            latest_cost = db.query(BudgetAllocation).filter(
                BudgetAllocation.fiscal_year == '2024-25'
            ).first()
            
            if not latest_cost or (current_date - latest_cost.scraped_date).days > 90:
                missing_data.append({
                    'type': 'facility_costs',
                    'reason': 'No recent facility-level cost breakdowns',
                    'last_updated': latest_cost.scraped_date if latest_cost else None
                })
            
            # Check youth statistics
            latest_stats = db.query(YouthStatistics).order_by(
                YouthStatistics.date.desc()
            ).first()
            
            if not latest_stats or (current_date - latest_stats.date).days > 30:
                missing_data.append({
                    'type': 'indigenous_data',
                    'reason': 'Youth statistics are outdated',
                    'last_updated': latest_stats.date if latest_stats else None
                })
            
            # Check for hidden costs data
            hidden_costs = db.query(HiddenCost).count()
            
            if hidden_costs < 10:  # Arbitrary threshold
                missing_data.append({
                    'type': 'hidden_costs',
                    'reason': 'Limited data on family costs',
                    'last_updated': None
                })
            
            # Check for outcome data
            # This would need a specific table, but checking if we have any
            missing_data.append({
                'type': 'program_outcomes',
                'reason': 'No comprehensive outcome tracking data',
                'last_updated': None
            })
            
            logger.info(f"Identified {len(missing_data)} categories of missing data")
            
        finally:
            db.close()
        
        return missing_data
    
    def generate_requests(self, missing_data: List[Dict]) -> List[Dict]:
        """Generate RTI requests for missing data."""
        requests = []
        
        for missing in missing_data:
            data_type = missing['type']
            
            if data_type in self.data_requirements:
                req_template = self.data_requirements[data_type]
                
                request = {
                    'department': self.departments[req_template['department']],
                    'subject': f"Request for {req_template['description']}",
                    'missing_data': missing['reason'],
                    'priority': req_template['priority'],
                    'body': self._generate_request_body(data_type, req_template)
                }
                
                requests.append(request)
        
        return requests
    
    def _generate_request_body(self, data_type: str, template: Dict) -> str:
        """Generate RTI request body text."""
        body = f"""I am writing to request information under the Right to Information Act 2009 regarding {template['description']} in Queensland's youth justice system.

This information is sought for public interest purposes, to improve transparency and inform public debate about youth justice spending and outcomes.

Specifically, I request the following information for the past 3 financial years (2021-22 to 2023-24) and the current financial year to date:

"""
        
        for i, field in enumerate(template['fields'], 1):
            body += f"{i}. {field}\n"
        
        body += """
I am happy to receive this information in electronic format (Excel, CSV, or PDF).

If any of this information is not readily available or would require substantial resources to compile, please contact me to discuss how the request might be refined.

If charges apply, please provide an estimate before proceeding with processing the request.

Thank you for your assistance with this request.
"""
        
        return body
    
    def save_request(self, request_data: Dict):
        """Save RTI request to database."""
        db = next(get_db())
        
        try:
            rti_request = RTIRequest(
                request_date=datetime.now().date(),
                department=request_data['department'],
                subject=request_data['subject'],
                request_text=request_data['body'],
                status='draft',
                reference_number=f"AUTO-{datetime.now().strftime('%Y%m%d-%H%M')}"
            )
            
            db.add(rti_request)
            db.commit()
            
            logger.info(f"Saved RTI request: {request_data['subject']}")
            
        except Exception as e:
            logger.error(f"Error saving RTI request: {e}")
            db.rollback()
        finally:
            db.close()
    
    def check_request_status(self):
        """Check status of pending RTI requests."""
        db = next(get_db())
        
        try:
            # Get pending requests older than 25 business days
            cutoff_date = datetime.now().date() - timedelta(days=35)  # ~25 business days
            
            overdue_requests = db.query(RTIRequest).filter(
                RTIRequest.status == 'pending',
                RTIRequest.request_date < cutoff_date
            ).all()
            
            if overdue_requests:
                logger.warning(f"Found {len(overdue_requests)} overdue RTI requests")
                
                # Could trigger follow-up actions here
                for req in overdue_requests:
                    logger.warning(f"Overdue: {req.subject} (submitted {req.request_date})")
            
        finally:
            db.close()
    
    def generate_followup_request(self, original_request_id: int) -> Dict:
        """Generate a follow-up request for an overdue RTI."""
        db = next(get_db())
        
        try:
            original = db.query(RTIRequest).filter_by(id=original_request_id).first()
            
            if not original:
                return None
            
            followup = {
                'department': original.department,
                'subject': f"Follow-up: {original.subject}",
                'body': f"""I am writing to follow up on my Right to Information request submitted on {original.request_date.strftime('%d %B %Y')} with reference number {original.reference_number}.

As more than 25 business days have passed since the submission of my request, I am writing to inquire about its status.

Original request summary:
{original.subject}

I would appreciate an update on:
1. The current status of my request
2. Any issues or delays encountered
3. An estimated timeframe for completion

If there are any problems with the request that are causing delays, I am happy to discuss ways to refine or narrow the scope to facilitate processing.

Thank you for your attention to this matter.
"""
            }
            
            return followup
            
        finally:
            db.close()