from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple
import json
import os
from collections import defaultdict
from loguru import logger

from ..database import get_db, RTIRequest, MediaCitation, PolicyChange, ImpactMetric, CoalitionMember, CoalitionAction

class ImpactTracker:
    """Track and measure the impact of coalition activities."""
    
    def __init__(self):
        self.metric_types = {
            'rti_filed': 'RTI Requests Filed',
            'rti_answered': 'RTI Requests Answered',
            'media_mentions': 'Media Mentions',
            'media_reach': 'Estimated Media Reach',
            'members_engaged': 'Coalition Members Engaged',
            'documents_shared': 'Documents Downloaded',
            'events_held': 'Events Organized',
            'policy_changes': 'Policy Changes Influenced',
            'budget_shifted': 'Budget Shifted to Community ($)',
            'youth_diverted': 'Youth Diverted from Detention'
        }
        
        self.media_reach_estimates = {
            'The Guardian': 500000,
            'Brisbane Times': 400000,
            'Courier Mail': 350000,
            'ABC News': 600000,
            'SBS': 300000,
            'Local Paper': 50000,
            'Online Blog': 10000,
            'Radio Interview': 100000,
            'TV Interview': 500000
        }
    
    def record_rti_filed(self, rti_id: int):
        """Record that an RTI request was filed."""
        self._record_metric('rti_filed', 1, f"RTI Request ID: {rti_id}")
    
    def record_rti_answered(self, rti_id: int):
        """Record that an RTI request was answered."""
        db = next(get_db())
        
        try:
            rti = db.query(RTIRequest).filter_by(id=rti_id).first()
            if rti:
                rti.status = 'complete'
                rti.response_date = date.today()
                db.commit()
                
                self._record_metric('rti_answered', 1, f"RTI Request ID: {rti_id}")
                
        except Exception as e:
            logger.error(f"Error recording RTI answer: {e}")
            db.rollback()
        finally:
            db.close()
    
    def record_media_citation(self, citation_data: Dict) -> Optional[int]:
        """Record a media citation of our data."""
        db = next(get_db())
        
        try:
            # Estimate reach
            publication = citation_data['publication']
            reach = self.media_reach_estimates.get(
                publication, 
                citation_data.get('reach_estimate', 10000)
            )
            
            citation = MediaCitation(
                publication=publication,
                article_title=citation_data['article_title'],
                article_url=citation_data.get('article_url'),
                publication_date=citation_data['publication_date'],
                author=citation_data.get('author'),
                citation_type=citation_data.get('citation_type', 'mention'),
                quoted_text=citation_data.get('quoted_text'),
                reach_estimate=reach,
                sentiment=citation_data.get('sentiment', 'neutral'),
                notes=citation_data.get('notes')
            )
            
            db.add(citation)
            db.commit()
            
            # Record metrics
            self._record_metric('media_mentions', 1, f"{publication}: {citation_data['article_title']}")
            self._record_metric('media_reach', reach, f"{publication}")
            
            logger.info(f"Recorded media citation: {publication}")
            return citation.id
            
        except Exception as e:
            logger.error(f"Error recording media citation: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def record_policy_change(self, change_data: Dict) -> Optional[int]:
        """Record a policy change influenced by our work."""
        db = next(get_db())
        
        try:
            policy_change = PolicyChange(
                title=change_data['title'],
                description=change_data.get('description'),
                change_type=change_data.get('change_type', 'other'),
                date_announced=change_data.get('date_announced'),
                date_implemented=change_data.get('date_implemented'),
                department=change_data.get('department'),
                impact_estimate=change_data.get('impact_estimate'),
                our_contribution=change_data.get('our_contribution'),
                supporting_documents=json.dumps(change_data.get('supporting_documents', [])),
                verified=change_data.get('verified', False)
            )
            
            db.add(policy_change)
            db.commit()
            
            # Record metric
            self._record_metric('policy_changes', 1, policy_change.title)
            
            # If budget shift, record amount
            if 'budget_amount' in change_data:
                self._record_metric('budget_shifted', change_data['budget_amount'], 
                                  policy_change.title)
            
            logger.info(f"Recorded policy change: {policy_change.title}")
            return policy_change.id
            
        except Exception as e:
            logger.error(f"Error recording policy change: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def record_member_engagement(self, member_count: int, activity: str):
        """Record coalition member engagement."""
        self._record_metric('members_engaged', member_count, activity)
    
    def _record_metric(self, metric_type: str, value: float, details: str = None):
        """Record a generic impact metric."""
        db = next(get_db())
        
        try:
            metric = ImpactMetric(
                metric_date=date.today(),
                metric_type=metric_type,
                value=value,
                details=details
            )
            
            db.add(metric)
            db.commit()
            
            logger.debug(f"Recorded metric: {metric_type} = {value}")
            
        except Exception as e:
            logger.error(f"Error recording metric: {e}")
            db.rollback()
        finally:
            db.close()
    
    def get_impact_summary(self, days: int = 30) -> Dict:
        """Get summary of impact metrics."""
        db = next(get_db())
        
        try:
            start_date = date.today() - timedelta(days=days)
            
            # Get metrics
            metrics = db.query(ImpactMetric).filter(
                ImpactMetric.metric_date >= start_date
            ).all()
            
            # Aggregate by type
            summary = defaultdict(float)
            for metric in metrics:
                summary[metric.metric_type] += metric.value
            
            # Get RTI statistics
            total_rtis = db.query(RTIRequest).count()
            answered_rtis = db.query(RTIRequest).filter(
                RTIRequest.status == 'complete'
            ).count()
            pending_rtis = db.query(RTIRequest).filter(
                RTIRequest.status == 'pending'
            ).count()
            
            # Get media statistics
            media_citations = db.query(MediaCitation).filter(
                MediaCitation.publication_date >= start_date
            ).all()
            
            total_reach = sum(c.reach_estimate or 0 for c in media_citations)
            
            # Get policy changes
            policy_changes = db.query(PolicyChange).filter(
                PolicyChange.date_announced >= start_date
            ).all()
            
            # Get coalition statistics
            active_members = db.query(CoalitionMember).filter(
                CoalitionMember.active == True
            ).count()
            
            recent_actions = db.query(CoalitionAction).filter(
                CoalitionAction.action_date >= datetime.now() - timedelta(days=days)
            ).count()
            
            return {
                'period_days': days,
                'metrics': dict(summary),
                'rti_statistics': {
                    'total': total_rtis,
                    'answered': answered_rtis,
                    'pending': pending_rtis,
                    'response_rate': (answered_rtis / total_rtis * 100) if total_rtis > 0 else 0
                },
                'media_impact': {
                    'citations': len(media_citations),
                    'total_reach': total_reach,
                    'average_reach': total_reach / len(media_citations) if media_citations else 0,
                    'top_publications': self._get_top_publications(media_citations)
                },
                'policy_changes': [
                    {
                        'title': p.title,
                        'type': p.change_type,
                        'date': p.date_announced,
                        'verified': p.verified
                    }
                    for p in policy_changes
                ],
                'coalition_activity': {
                    'active_members': active_members,
                    'recent_actions': recent_actions,
                    'engagement_rate': (recent_actions / active_members) if active_members > 0 else 0
                }
            }
            
        finally:
            db.close()
    
    def _get_top_publications(self, citations: List[MediaCitation]) -> List[Dict]:
        """Get top publications by citation count."""
        pub_counts = defaultdict(int)
        pub_reach = defaultdict(int)
        
        for citation in citations:
            pub_counts[citation.publication] += 1
            pub_reach[citation.publication] += citation.reach_estimate or 0
        
        # Sort by count
        top_pubs = sorted(pub_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return [
            {
                'publication': pub,
                'citations': count,
                'total_reach': pub_reach[pub]
            }
            for pub, count in top_pubs
        ]
    
    def generate_impact_report(self) -> Dict:
        """Generate comprehensive impact report."""
        # Get data for different time periods
        week_data = self.get_impact_summary(7)
        month_data = self.get_impact_summary(30)
        year_data = self.get_impact_summary(365)
        
        db = next(get_db())
        
        try:
            # Calculate key achievements
            achievements = []
            
            # RTI success
            if year_data['rti_statistics']['response_rate'] > 50:
                achievements.append({
                    'title': 'RTI Transparency Success',
                    'description': f"{year_data['rti_statistics']['answered']} RTI requests answered, "
                                 f"{year_data['rti_statistics']['response_rate']:.0f}% response rate"
                })
            
            # Media reach
            if year_data['media_impact']['total_reach'] > 1000000:
                achievements.append({
                    'title': 'Media Impact Milestone',
                    'description': f"Reached {year_data['media_impact']['total_reach']:,} people through "
                                 f"{year_data['media_impact']['citations']} media citations"
                })
            
            # Policy influence
            verified_changes = [p for p in year_data['policy_changes'] if p['verified']]
            if verified_changes:
                achievements.append({
                    'title': 'Policy Change Achievement',
                    'description': f"Influenced {len(verified_changes)} verified policy changes"
                })
            
            # Coalition growth
            growth_rate = (month_data['coalition_activity']['active_members'] / 
                         (year_data['coalition_activity']['active_members'] - 
                          month_data['coalition_activity']['active_members']) * 100) \
                         if year_data['coalition_activity']['active_members'] > month_data['coalition_activity']['active_members'] else 0
            
            if growth_rate > 10:
                achievements.append({
                    'title': 'Coalition Growth',
                    'description': f"{growth_rate:.0f}% growth in active coalition members"
                })
            
            return {
                'generated': datetime.now().isoformat(),
                'summary': {
                    'week': week_data,
                    'month': month_data,
                    'year': year_data
                },
                'achievements': achievements,
                'trends': self._calculate_trends(week_data, month_data, year_data)
            }
            
        finally:
            db.close()
    
    def _calculate_trends(self, week: Dict, month: Dict, year: Dict) -> Dict:
        """Calculate trend indicators."""
        trends = {}
        
        # Media trend
        if month['media_impact']['citations'] > 0:
            weekly_avg = week['media_impact']['citations'] / (week['period_days'] / 7)
            monthly_avg = month['media_impact']['citations'] / (month['period_days'] / 7)
            trends['media_momentum'] = 'increasing' if weekly_avg > monthly_avg else 'stable'
        
        # Engagement trend
        if month['coalition_activity']['active_members'] > 0:
            trends['engagement_trend'] = 'high' if month['coalition_activity']['engagement_rate'] > 2 else 'moderate'
        
        return trends
    
    def export_impact_data(self, format: str = 'json') -> str:
        """Export impact data for external use."""
        report = self.generate_impact_report()
        
        filename = f"impact_report_{datetime.now().strftime('%Y%m%d')}.{format}"
        filepath = os.path.join('data', 'processed', filename)
        
        if format == 'json':
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Exported impact report: {filepath}")
        return filepath