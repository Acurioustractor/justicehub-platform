#!/usr/bin/env python3
"""
Scheduler for automated tasks.
"""

import schedule
import time
import subprocess
import sys
from datetime import datetime
from loguru import logger

# Configure logging
logger.add("logs/scheduler_{time}.log", rotation="1 week")

def run_scrapers():
    """Run data scrapers."""
    logger.info("Running scheduled scrapers...")
    subprocess.run([sys.executable, "scrape_data.py"])

def run_weekly_report():
    """Generate and send weekly report."""
    logger.info("Running scheduled weekly report...")
    subprocess.run([sys.executable, "generate_report.py"])

def main():
    """Set up and run scheduler."""
    logger.info("Starting scheduler...")
    
    # Schedule daily scraping at 2 AM
    schedule.every().day.at("02:00").do(run_scrapers)
    
    # Schedule weekly report on Mondays at 8 AM
    schedule.every().monday.at("08:00").do(run_weekly_report)
    
    logger.info("Scheduler configured:")
    logger.info("- Daily scraping at 2:00 AM")
    logger.info("- Weekly reports on Mondays at 8:00 AM")
    
    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()