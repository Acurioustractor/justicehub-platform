#!/usr/bin/env python3
"""
Run the automation scheduler for youth justice tracker.
"""

import sys
import signal
import time
from loguru import logger

from src.automation import AutomationScheduler
from src.database import init_db

# Global scheduler instance
scheduler = None

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logger.info("Received shutdown signal, stopping scheduler...")
    if scheduler:
        scheduler.stop()
    sys.exit(0)

def main():
    """Run the automation scheduler."""
    global scheduler
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("Starting Youth Justice Tracker Automation System")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Create and start scheduler
    scheduler = AutomationScheduler()
    scheduler.start()
    
    # Print scheduled jobs
    logger.info("\nScheduled Jobs:")
    status = scheduler.get_status()
    for job in status['jobs']:
        logger.info(f"  - {job['name']}: Next run at {job['next_run']}")
    
    logger.info("\nAutomation system is running. Press Ctrl+C to stop.")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(60)
            
            # Log status every hour
            if int(time.time()) % 3600 == 0:
                status = scheduler.get_status()
                logger.info(f"Scheduler status: {status['running']}, Jobs: {len(status['jobs'])}")
                
    except KeyboardInterrupt:
        logger.info("Stopping automation system...")
        scheduler.stop()

if __name__ == "__main__":
    main()