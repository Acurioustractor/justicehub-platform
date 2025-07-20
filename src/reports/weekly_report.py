import pandas as pd
from datetime import datetime, timedelta, date
from jinja2 import Template
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from loguru import logger
import os
from typing import Dict, List

from ..database import get_db, Report, BudgetAllocation, ParliamentaryDocument, YouthStatistics
from ..analysis.cost_analysis import CostAnalyzer

class WeeklyReporter:
    """Generate and send weekly reports on youth justice spending."""
    
    def __init__(self):
        self.analyzer = CostAnalyzer()
        self.report_template = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f4f4f4; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background-color: white; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 14px; color: #7f8c8d; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #34495e; color: white; }
        .alert { background-color: #e74c3c; color: white; padding: 10px; margin: 10px 0; }
        .recommendation { background-color: #3498db; color: white; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Queensland Youth Justice Weekly Report</h1>
        <p>Week ending {{ report_date }}</p>
    </div>
    
    <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric">
            <div class="metric-value">${{ detention_daily_cost }}/day</div>
            <div class="metric-label">Detention Cost</div>
        </div>
        <div class="metric">
            <div class="metric-value">${{ community_daily_cost }}/day</div>
            <div class="metric-label">Community Cost</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ detention_percentage }}%</div>
            <div class="metric-label">Budget to Detention</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ indigenous_percentage }}%</div>
            <div class="metric-label">Indigenous Youth Detained</div>
        </div>
    </div>
    
    <div class="section">
        <h2>Weekly Highlights</h2>
        <ul>
        {% for highlight in highlights %}
            <li>{{ highlight }}</li>
        {% endfor %}
        </ul>
    </div>
    
    {% if new_documents %}
    <div class="section">
        <h2>New Parliamentary Activity</h2>
        <table>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Title</th>
                <th>Key Topics</th>
            </tr>
            {% for doc in new_documents %}
            <tr>
                <td>{{ doc.date }}</td>
                <td>{{ doc.type }}</td>
                <td>{{ doc.title }}</td>
                <td>{{ doc.topics }}</td>
            </tr>
            {% endfor %}
        </table>
    </div>
    {% endif %}
    
    <div class="section">
        <h2>Cost Comparison Analysis</h2>
        <p>If the current 90.6% detention budget allocation was shifted to 70% detention / 30% community:</p>
        <ul>
            <li>Additional youth served: <strong>{{ additional_youth }}</strong></li>
            <li>Increased successful outcomes: <strong>{{ additional_successes }}</strong></li>
            <li>Projected annual savings: <strong>${{ projected_savings }}</strong></li>
        </ul>
    </div>
    
    {% if alerts %}
    <div class="alert">
        <h3>Alerts</h3>
        <ul>
        {% for alert in alerts %}
            <li>{{ alert }}</li>
        {% endfor %}
        </ul>
    </div>
    {% endif %}
    
    <div class="recommendation">
        <h3>Weekly Recommendations</h3>
        <ol>
        {% for rec in recommendations %}
            <li>{{ rec }}</li>
        {% endfor %}
        </ol>
    </div>
    
    <div class="section">
        <p><small>This report is automatically generated from publicly available data. 
        For more information or to correct any errors, please contact the system administrator.</small></p>
    </div>
</body>
</html>
        """
        
    def generate_report(self) -> Dict:
        """Generate weekly report data."""
        db = next(get_db())
        
        try:
            # Get date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            
            # Get spending split
            split = self.analyzer.calculate_spending_split()
            
            # Get Indigenous statistics
            disparities = self.analyzer.analyze_indigenous_disparities()
            
            # Get new parliamentary documents
            new_docs = db.query(ParliamentaryDocument).filter(
                ParliamentaryDocument.scraped_date >= start_date,
                ParliamentaryDocument.mentions_youth_justice == True
            ).all()
            
            # Process documents
            doc_list = []
            for doc in new_docs:
                topics = []
                if doc.mentions_spending:
                    topics.append("Spending")
                if doc.mentions_indigenous:
                    topics.append("Indigenous")
                
                doc_list.append({
                    'date': doc.date.strftime('%Y-%m-%d') if doc.date else 'Unknown',
                    'type': doc.document_type,
                    'title': doc.title[:80] + '...' if len(doc.title) > 80 else doc.title,
                    'topics': ', '.join(topics) or 'Youth Justice'
                })
            
            # Calculate alternative scenario
            total_budget = split['total_budget'] or 500_000_000
            scenarios = self.analyzer.calculate_alternative_scenarios(total_budget)
            
            # Find 70/30 scenario
            scenario_70_30 = next((s for s in scenarios if s['detention_percentage'] == 70), None)
            current_scenario = scenarios[0]
            
            if scenario_70_30:
                additional_youth = int(scenario_70_30['total_youth_days'] / 90 - current_scenario['total_youth_days'] / 90)
                additional_successes = int((scenario_70_30['youth_days_community'] / 90 * 0.55) - 
                                         (current_scenario['youth_days_community'] / 90 * 0.55))
                projected_savings = f"{additional_successes * 150000:,.0f}"
            else:
                additional_youth = 0
                additional_successes = 0
                projected_savings = "0"
            
            # Generate highlights
            highlights = []
            
            if new_docs:
                highlights.append(f"{len(new_docs)} new parliamentary documents mention youth justice")
            
            highlights.append(f"Current detention/community split: {split['detention_percentage']:.1f}% / {split['community_percentage']:.1f}%")
            highlights.append(f"Indigenous youth represent {disparities['indigenous_percentage_detained']:.0f}% of detention population")
            highlights.append(f"Cost ratio remains {split['cost_ratio']:.1f}:1 (detention:community)")
            
            # Generate alerts
            alerts = []
            
            if split['detention_percentage'] > 90:
                alerts.append("Detention spending exceeds 90% of total budget")
            
            if disparities['overrepresentation_factor'] > 20:
                alerts.append(f"Indigenous youth overrepresented by {disparities['overrepresentation_factor']:.0f}x in detention")
            
            # Generate recommendations
            recommendations = [
                "Continue monitoring parliamentary activity for youth justice policy changes",
                "Submit RTI requests for detailed facility-level cost breakdowns",
                "Advocate for increased investment in evidence-based community programs",
                "Track outcomes data to demonstrate community program effectiveness"
            ]
            
            report_data = {
                'report_date': end_date.strftime('%Y-%m-%d'),
                'detention_daily_cost': 857,
                'community_daily_cost': 41,
                'detention_percentage': f"{split['detention_percentage']:.1f}",
                'indigenous_percentage': f"{disparities['indigenous_percentage_detained']:.0f}",
                'highlights': highlights,
                'new_documents': doc_list if doc_list else None,
                'additional_youth': f"{additional_youth:,}",
                'additional_successes': f"{additional_successes:,}",
                'projected_savings': projected_savings,
                'alerts': alerts if alerts else None,
                'recommendations': recommendations
            }
            
            return report_data
            
        finally:
            db.close()
    
    def render_report(self, report_data: Dict) -> str:
        """Render report data to HTML."""
        template = Template(self.report_template)
        return template.render(**report_data)
    
    def save_report(self, report_html: str, report_data: Dict) -> str:
        """Save report to file and database."""
        # Save to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"weekly_report_{timestamp}.html"
        filepath = f"data/processed/{filename}"
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            f.write(report_html)
        
        # Save to database
        db = next(get_db())
        
        try:
            db_report = Report(
                report_date=date.today(),
                report_type='weekly',
                title=f"Weekly Youth Justice Report - {report_data['report_date']}",
                summary=' '.join(report_data['highlights']),
                key_findings=' '.join(report_data.get('alerts', [])),
                recommendations=' '.join(report_data['recommendations']),
                file_path=filepath
            )
            
            db.add(db_report)
            db.commit()
            
            logger.info(f"Report saved to {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving report to database: {e}")
            db.rollback()
        finally:
            db.close()
        
        return filepath
    
    def send_report(self, report_html: str, recipients: List[str]):
        """Send report via email."""
        if not recipients or not os.getenv('SMTP_SERVER'):
            logger.warning("Email not configured or no recipients specified")
            return
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Queensland Youth Justice Weekly Report - {datetime.now().strftime('%Y-%m-%d')}"
        msg['From'] = os.getenv('SMTP_USERNAME', 'noreply@youthjusticetracker.qld')
        msg['To'] = ', '.join(recipients)
        
        # Attach HTML
        html_part = MIMEText(report_html, 'html')
        msg.attach(html_part)
        
        try:
            with smtplib.SMTP(os.getenv('SMTP_SERVER'), int(os.getenv('SMTP_PORT', 587))) as server:
                server.starttls()
                if os.getenv('SMTP_USERNAME') and os.getenv('SMTP_PASSWORD'):
                    server.login(os.getenv('SMTP_USERNAME'), os.getenv('SMTP_PASSWORD'))
                
                server.send_message(msg)
                logger.info(f"Report sent to {len(recipients)} recipients")
                
        except Exception as e:
            logger.error(f"Error sending email: {e}")
    
    def run(self, recipients: List[str] = None):
        """Generate and distribute weekly report."""
        logger.info("Generating weekly report...")
        
        # Generate report data
        report_data = self.generate_report()
        
        # Render to HTML
        report_html = self.render_report(report_data)
        
        # Save report
        filepath = self.save_report(report_html, report_data)
        
        # Send via email if configured
        if recipients:
            self.send_report(report_html, recipients)
        
        logger.info("Weekly report generation complete")