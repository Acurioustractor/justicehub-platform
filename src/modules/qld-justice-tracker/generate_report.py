#!/usr/bin/env python3
"""
Script to generate and send weekly reports.
"""

import sys
import os
from loguru import logger

from src.reports import WeeklyReporter
from src.analysis import CostAnalyzer
from src.database import init_db

# Configure logging
logger.add("logs/reporter_{time}.log", rotation="1 week")

def main():
    """Generate and send weekly report."""
    logger.info("Starting weekly report generation...")
    
    # Initialize database
    init_db()
    
    # Save daily cost comparison
    analyzer = CostAnalyzer()
    analyzer.save_comparison()
    
    # Generate weekly report
    reporter = WeeklyReporter()
    
    # Get email recipients from environment
    recipients = os.getenv('REPORT_EMAIL_TO', '').split(',')
    recipients = [r.strip() for r in recipients if r.strip()]
    
    reporter.run(recipients)
    
    logger.info("Report generation complete")

if __name__ == "__main__":
    main()