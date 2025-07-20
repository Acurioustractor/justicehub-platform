#!/usr/bin/env python3
"""
Run the Flask real-time dashboard.
"""

import sys
import os
from loguru import logger

# Add src to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.flask_dashboard import app, socketio
from src.database import init_db

def main():
    """Run the Flask dashboard."""
    logger.info("Initializing database...")
    init_db()
    
    logger.info("Starting Flask dashboard on http://localhost:5555")
    logger.info("Press Ctrl+C to stop")
    
    # Run with SocketIO
    socketio.run(
        app,
        debug=True,
        host='0.0.0.0',
        port=5555,
        use_reloader=True
    )

if __name__ == "__main__":
    main()