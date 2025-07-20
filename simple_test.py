#!/usr/bin/env python3
"""Simple test to verify the system is working."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing Queensland Youth Justice Tracker...")
print("=" * 50)

# Test 1: Database
try:
    from src.database import get_db, Interview, FamilyCostCalculation
    db = next(get_db())
    interviews = db.query(Interview).count()
    costs = db.query(FamilyCostCalculation).count()
    print(f"✓ Database: {interviews} interviews, {costs} cost calculations")
    db.close()
except Exception as e:
    print(f"✗ Database error: {e}")

# Test 2: Flask imports
try:
    from src.flask_dashboard.app import app
    print("✓ Flask app imported successfully")
except Exception as e:
    print(f"✗ Flask import error: {e}")

# Test 3: Simple HTTP server
print("\nStarting simple HTTP server on port 8888...")
print("Access at: http://localhost:8888")

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, Interview, FamilyCostCalculation, CoalitionMember
            db = next(get_db())
            
            data = {
                "status": "Queensland Youth Justice Tracker is working!",
                "database": {
                    "interviews": db.query(Interview).count(),
                    "cost_calculations": db.query(FamilyCostCalculation).count(),
                    "coalition_members": db.query(CoalitionMember).count()
                },
                "key_metrics": {
                    "detention_cost_per_day": 857,
                    "community_cost_per_day": 41,
                    "cost_ratio": "20.9:1",
                    "indigenous_overrepresentation": "22x"
                }
            }
            db.close()
        except Exception as e:
            data = {"error": str(e)}
        
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def log_message(self, format, *args):
        # Suppress request logging
        pass

try:
    server = HTTPServer(('localhost', 8888), SimpleHandler)
    print("Server started successfully!")
    print("Press Ctrl+C to stop")
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped")
except Exception as e:
    print(f"✗ Server error: {e}")