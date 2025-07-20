import os
import sys
from datetime import datetime, time, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
import pytz

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.scrapers import BudgetScraper, ParliamentScraper, TreasuryBudgetScraper, ParliamentQoNScraper
from src.reports import WeeklyReporter
from src.automation.email_alerts import EmailAlertSystem
from src.automation.pdf_generator import PDFReportGenerator
from src.automation.rti_generator import RTIRequestGenerator
from src.database import init_db
from src.analysis import CostAnalyzer

class AutomationScheduler:
    """Manages all automated tasks for the youth justice tracker."""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone=pytz.timezone('Australia/Brisbane'))
        self.email_alerts = EmailAlertSystem()
        self.pdf_generator = PDFReportGenerator()
        self.rti_generator = RTIRequestGenerator()
        self.analyzer = CostAnalyzer()
        
        # Track last run times
        self.last_runs = {}
        
    def run_all_scrapers(self):
        """Run all scrapers and check for new documents."""
        logger.info("Starting daily scraper run at {}".format(datetime.now()))
        
        new_documents = []
        
        try:
            # Initialize database
            init_db()
            
            # Run budget scraper
            logger.info("Running budget scraper...")
            budget_scraper = BudgetScraper()
            budget_data = budget_scraper.scrape_budget_papers('2024-25')
            allocations = budget_scraper.parse_youth_justice_allocations(budget_data)
            budget_scraper.save_to_database(allocations)
            
            # Run treasury PDF scraper
            logger.info("Running treasury PDF scraper...")
            treasury_scraper = TreasuryBudgetScraper()
            treasury_docs = treasury_scraper.scrape_and_save(['2024-25', '2023-24'])
            
            if treasury_docs:
                new_documents.extend([{
                    'type': 'budget',
                    'title': doc.get('source_document', 'Treasury Document'),
                    'url': doc.get('source_url', ''),
                    'amount': doc.get('amount', 0)
                } for doc in treasury_docs])
            
            # Run parliament scraper
            logger.info("Running parliament scraper...")
            parliament_scraper = ParliamentScraper()
            
            hansard_docs = parliament_scraper.scrape_hansard()
            if hansard_docs:
                parliament_scraper.save_to_database(hansard_docs)
                new_documents.extend([{
                    'type': 'hansard',
                    'title': doc.get('title', 'Hansard Record'),
                    'url': doc.get('url', ''),
                    'date': doc.get('date', datetime.now())
                } for doc in hansard_docs])
            
            # Run QoN scraper
            logger.info("Running Questions on Notice scraper...")
            qon_scraper = ParliamentQoNScraper()
            qon_docs = qon_scraper.search_questions_on_notice()
            if qon_docs:
                qon_scraper.save_to_database(qon_docs)
                new_documents.extend([{
                    'type': 'qon',
                    'title': f"QoN: {doc.get('question', '')[:100]}",
                    'mp': doc.get('mp_name', 'Unknown'),
                    'date': doc.get('date', datetime.now())
                } for doc in qon_docs if doc.get('spending_flag')])
            
            # Save daily cost comparison
            self.analyzer.save_comparison()
            
            logger.info(f"Daily scraper run complete. Found {len(new_documents)} new documents.")
            
            # Send email alerts if new documents found
            if new_documents:
                self.email_alerts.send_new_documents_alert(new_documents)
                
        except Exception as e:
            logger.error(f"Error in daily scraper run: {e}")
            self.email_alerts.send_error_alert('Daily Scraper Run', str(e))
    
    def generate_weekly_report(self):
        """Generate and send weekly PDF report."""
        logger.info("Generating weekly PDF report...")
        
        try:
            # Generate HTML report first
            reporter = WeeklyReporter()
            report_data = reporter.generate_report()
            report_html = reporter.render_report(report_data)
            
            # Convert to PDF
            pdf_path = self.pdf_generator.generate_spending_trends_report(report_data)
            
            # Send via email
            recipients = os.getenv('REPORT_EMAIL_TO', '').split(',')
            recipients = [r.strip() for r in recipients if r.strip()]
            
            if recipients:
                self.email_alerts.send_weekly_report(pdf_path, recipients)
                
            logger.info(f"Weekly report generated and sent to {len(recipients)} recipients")
            
        except Exception as e:
            logger.error(f"Error generating weekly report: {e}")
            self.email_alerts.send_error_alert('Weekly Report Generation', str(e))
    
    def check_missing_data(self):
        """Check for missing data and generate RTI requests."""
        logger.info("Checking for missing data...")
        
        try:
            missing_data = self.rti_generator.identify_missing_data()
            
            if missing_data:
                # Generate RTI requests
                requests = self.rti_generator.generate_requests(missing_data)
                
                # Save requests
                for req in requests:
                    self.rti_generator.save_request(req)
                
                # Send notification
                self.email_alerts.send_rti_notification(requests)
                
                logger.info(f"Generated {len(requests)} RTI requests for missing data")
                
        except Exception as e:
            logger.error(f"Error checking missing data: {e}")
    
    def hourly_health_check(self):
        """Perform hourly health check of the system."""
        try:
            # Check database connectivity
            from src.database import get_db
            db = next(get_db())
            db.execute("SELECT 1")
            db.close()
            
            # Update last run time
            self.last_runs['health_check'] = datetime.now()
            
            logger.debug("Health check passed")
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            self.email_alerts.send_error_alert('System Health Check', str(e))
    
    def setup_schedule(self):
        """Set up all scheduled tasks."""
        # Daily scrapers at 9 AM
        self.scheduler.add_job(
            func=self.run_all_scrapers,
            trigger=CronTrigger(hour=9, minute=0),
            id='daily_scrapers',
            name='Daily scraper run',
            replace_existing=True
        )
        
        # Weekly report on Mondays at 8 AM
        self.scheduler.add_job(
            func=self.generate_weekly_report,
            trigger=CronTrigger(day_of_week='mon', hour=8, minute=0),
            id='weekly_report',
            name='Weekly PDF report',
            replace_existing=True
        )
        
        # Check for missing data daily at 10 AM
        self.scheduler.add_job(
            func=self.check_missing_data,
            trigger=CronTrigger(hour=10, minute=0),
            id='missing_data_check',
            name='Missing data check',
            replace_existing=True
        )
        
        # Hourly health check
        self.scheduler.add_job(
            func=self.hourly_health_check,
            trigger=CronTrigger(minute=0),
            id='health_check',
            name='Hourly health check',
            replace_existing=True
        )
        
        logger.info("Scheduled tasks:")
        for job in self.scheduler.get_jobs():
            logger.info(f"  - {job.name}: {job.trigger}")
    
    def start(self):
        """Start the scheduler."""
        self.setup_schedule()
        self.scheduler.start()
        logger.info("Automation scheduler started")
        
        # Run health check immediately
        self.hourly_health_check()
    
    def stop(self):
        """Stop the scheduler."""
        self.scheduler.shutdown()
        logger.info("Automation scheduler stopped")
    
    def run_job_now(self, job_id):
        """Run a specific job immediately."""
        job = self.scheduler.get_job(job_id)
        if job:
            job.func()
            logger.info(f"Manually triggered job: {job_id}")
        else:
            logger.error(f"Job not found: {job_id}")
    
    def get_status(self):
        """Get scheduler status."""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run': job.next_run_time,
                'trigger': str(job.trigger)
            })
        
        return {
            'running': self.scheduler.running,
            'jobs': jobs,
            'last_runs': self.last_runs
        }