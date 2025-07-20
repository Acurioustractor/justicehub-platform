import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from typing import List, Dict
from loguru import logger
from jinja2 import Template

class EmailAlertSystem:
    """Handles email notifications for the youth justice tracker."""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('SMTP_USERNAME', 'noreply@youthjusticetracker.qld')
        self.admin_email = os.getenv('ADMIN_EMAIL', '')
        
        # Email templates
        self.templates = {
            'new_documents': """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; }
        .content { padding: 20px; }
        .document { background-color: #f4f4f4; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }
        .budget { border-left-color: #e74c3c; }
        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>New Youth Justice Documents Found</h2>
        <p>{{ date }}</p>
    </div>
    <div class="content">
        <p>The following new documents have been detected:</p>
        
        <h3>Budget Documents ({{ budget_count }})</h3>
        {% for doc in budget_docs %}
        <div class="document budget">
            <h4>{{ doc.title }}</h4>
            <p>Amount: ${{ "{:,.0f}".format(doc.amount) }}</p>
            <p><a href="{{ doc.url }}">View Document</a></p>
        </div>
        {% endfor %}
        
        <h3>Parliamentary Documents ({{ parliament_count }})</h3>
        {% for doc in parliament_docs %}
        <div class="document">
            <h4>{{ doc.title }}</h4>
            <p>Type: {{ doc.type }}</p>
            <p>Date: {{ doc.date }}</p>
            {% if doc.mp %}<p>MP: {{ doc.mp }}</p>{% endif %}
        </div>
        {% endfor %}
        
        <p><strong>Action Required:</strong> Review these documents and update the analysis if needed.</p>
    </div>
    <div class="footer">
        <p>This is an automated alert from the Queensland Youth Justice Tracker</p>
    </div>
</body>
</html>
            """,
            
            'error_alert': """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #e74c3c; color: white; padding: 20px; }
        .content { padding: 20px; }
        .error-box { background-color: #ffebee; border: 1px solid #e74c3c; padding: 15px; margin: 20px 0; }
        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>System Error Alert</h2>
        <p>{{ date }}</p>
    </div>
    <div class="content">
        <p>An error occurred in the Youth Justice Tracker system:</p>
        
        <div class="error-box">
            <h3>{{ task }}</h3>
            <p><strong>Error:</strong> {{ error }}</p>
            <p><strong>Time:</strong> {{ timestamp }}</p>
        </div>
        
        <p><strong>Action Required:</strong> Please check the system logs and resolve the issue.</p>
    </div>
    <div class="footer">
        <p>This is an automated error alert</p>
    </div>
</body>
</html>
            """,
            
            'rti_notification': """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f39c12; color: white; padding: 20px; }
        .content { padding: 20px; }
        .request { background-color: #fffde7; padding: 15px; margin: 10px 0; border-left: 4px solid #f39c12; }
        .footer { background-color: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>RTI Requests Generated for Missing Data</h2>
        <p>{{ date }}</p>
    </div>
    <div class="content">
        <p>The following RTI requests have been automatically generated due to missing data:</p>
        
        {% for req in requests %}
        <div class="request">
            <h4>{{ req.subject }}</h4>
            <p><strong>Department:</strong> {{ req.department }}</p>
            <p><strong>Missing Data:</strong> {{ req.missing_data }}</p>
            <p><strong>Priority:</strong> {{ req.priority }}</p>
        </div>
        {% endfor %}
        
        <p><strong>Action Required:</strong> Review and submit these RTI requests to the relevant departments.</p>
        <p>Templates are available in the dashboard under RTI Templates.</p>
    </div>
    <div class="footer">
        <p>This is an automated notification from the Youth Justice Tracker</p>
    </div>
</body>
</html>
            """
        }
    
    def send_email(self, recipients: List[str], subject: str, html_content: str, 
                   attachment_path: str = None):
        """Send email to recipients."""
        if not self.smtp_username or not self.smtp_password:
            logger.warning("Email credentials not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = ', '.join(recipients)
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Attach file if provided
            if attachment_path and os.path.exists(attachment_path):
                with open(attachment_path, 'rb') as f:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename={os.path.basename(attachment_path)}'
                    )
                    msg.attach(part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent to {len(recipients)} recipients: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def send_new_documents_alert(self, documents: List[Dict]):
        """Send alert for new documents found."""
        # Separate documents by type
        budget_docs = [d for d in documents if d.get('type') == 'budget']
        parliament_docs = [d for d in documents if d.get('type') in ['hansard', 'qon']]
        
        # Render template
        template = Template(self.templates['new_documents'])
        html = template.render(
            date=datetime.now().strftime('%Y-%m-%d %H:%M'),
            budget_count=len(budget_docs),
            parliament_count=len(parliament_docs),
            budget_docs=budget_docs,
            parliament_docs=parliament_docs
        )
        
        # Get recipients
        recipients = os.getenv('ALERT_EMAIL_TO', '').split(',')
        recipients = [r.strip() for r in recipients if r.strip()]
        
        if not recipients and self.admin_email:
            recipients = [self.admin_email]
        
        if recipients:
            subject = f"[Youth Justice Tracker] {len(documents)} New Documents Found"
            self.send_email(recipients, subject, html)
    
    def send_error_alert(self, task: str, error: str):
        """Send error alert to admin."""
        if not self.admin_email:
            logger.warning("Admin email not configured for error alerts")
            return
        
        template = Template(self.templates['error_alert'])
        html = template.render(
            date=datetime.now().strftime('%Y-%m-%d'),
            task=task,
            error=error,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        
        subject = f"[Youth Justice Tracker] ERROR: {task}"
        self.send_email([self.admin_email], subject, html)
    
    def send_weekly_report(self, pdf_path: str, recipients: List[str]):
        """Send weekly PDF report."""
        if not recipients:
            logger.warning("No recipients configured for weekly report")
            return
        
        # Simple HTML email with attachment
        html = """
        <html>
        <body>
            <h2>Queensland Youth Justice Weekly Report</h2>
            <p>Please find attached the weekly youth justice spending report for the week ending {date}.</p>
            
            <h3>Key Highlights:</h3>
            <ul>
                <li>Current detention/community split: 90.6% / 9.4%</li>
                <li>Indigenous youth overrepresentation: 22-33x</li>
                <li>Hidden family costs: $2,000-3,000/month</li>
            </ul>
            
            <p>For real-time data and interactive visualizations, visit the dashboard.</p>
            
            <p>Best regards,<br>
            Queensland Youth Justice Tracker</p>
        </body>
        </html>
        """.format(date=datetime.now().strftime('%Y-%m-%d'))
        
        subject = f"[Youth Justice Tracker] Weekly Report - {datetime.now().strftime('%Y-%m-%d')}"
        self.send_email(recipients, subject, html, pdf_path)
    
    def send_rti_notification(self, requests: List[Dict]):
        """Send notification about generated RTI requests."""
        template = Template(self.templates['rti_notification'])
        html = template.render(
            date=datetime.now().strftime('%Y-%m-%d'),
            requests=requests
        )
        
        recipients = os.getenv('RTI_EMAIL_TO', '').split(',')
        recipients = [r.strip() for r in recipients if r.strip()]
        
        if not recipients and self.admin_email:
            recipients = [self.admin_email]
        
        if recipients:
            subject = f"[Youth Justice Tracker] {len(requests)} RTI Requests Generated"
            self.send_email(recipients, subject, html)