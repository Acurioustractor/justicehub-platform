#!/usr/bin/env python3
"""
Script to run the Streamlit dashboard.
"""

import sys
import os
import subprocess

def main():
    """Run the Streamlit dashboard."""
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run streamlit
    subprocess.run([
        sys.executable, "-m", "streamlit", "run",
        "src/dashboard/app.py",
        "--server.port", os.getenv("DASHBOARD_PORT", "8501"),
        "--server.address", "0.0.0.0"
    ])

if __name__ == "__main__":
    main()