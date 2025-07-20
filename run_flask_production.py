#!/usr/bin/env python3
"""
Run the Flask dashboard in production mode with Gunicorn.
"""

import sys
import os
import multiprocessing
from loguru import logger

# Add src to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import init_db

def main():
    """Run the Flask dashboard with Gunicorn."""
    logger.info("Initializing database...")
    init_db()
    
    # Number of worker processes
    workers = multiprocessing.cpu_count() * 2 + 1
    
    # Gunicorn command
    bind = "0.0.0.0:5000"
    
    logger.info(f"Starting Flask dashboard with {workers} workers on http://localhost:5000")
    
    # Run gunicorn
    os.system(f"gunicorn --worker-class eventlet -w 1 --bind {bind} --reload src.flask_dashboard.app:app")

if __name__ == "__main__":
    main()