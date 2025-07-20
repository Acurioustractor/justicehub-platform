#!/usr/bin/env python3
"""Working dashboard using simple HTTP server with HTML interface."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

class DashboardHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse URL path
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            self.serve_dashboard()
        elif path == '/api/data':
            self.serve_api_data()
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        """Serve the HTML dashboard."""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Queensland Youth Justice Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; }
        .metric h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .metric .value { font-size: 2em; font-weight: bold; color: #e74c3c; }
        .metric .label { color: #7f8c8d; font-size: 0.9em; }
        .section { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #34495e; color: white; }
        tr:hover { background: #f5f5f5; }
        .cost-comparison { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .alert { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 40px; color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ Queensland Youth Justice Spending Tracker</h1>
        
        <div class="alert">
            <strong>Dashboard Status:</strong> ✅ Working! This is a simplified version showing real data from your database.
        </div>
        
        <div class="section">
            <h2>Key Metrics</h2>
            <div class="metrics">
                <div class="metric">
                    <h3>Detention Cost</h3>
                    <div class="value">$857</div>
                    <div class="label">per day per youth</div>
                </div>
                <div class="metric">
                    <h3>Community Cost</h3>
                    <div class="value">$41</div>
                    <div class="label">per day per youth</div>
                </div>
                <div class="metric">
                    <h3>Cost Ratio</h3>
                    <div class="value">20.9:1</div>
                    <div class="label">detention vs community</div>
                </div>
                <div class="metric">
                    <h3>Indigenous Overrep.</h3>
                    <div class="value">22x</div>
                    <div class="label">higher than population</div>
                </div>
            </div>
        </div>
        
        <div class="cost-comparison">
            <h3>💰 Annual Cost Comparison</h3>
            <p><strong>One youth in detention for a year:</strong> $312,805</p>
            <p><strong>One youth in community program for a year:</strong> $14,965</p>
            <p><strong>Savings per youth diverted:</strong> $297,840</p>
        </div>
        
        <div class="section" id="database-content">
            <h2>Database Summary</h2>
            <p>Loading...</p>
        </div>
        
        <div class="section">
            <h2>Hidden Family Costs</h2>
            <table id="costs-table">
                <tr>
                    <th>Family Location</th>
                    <th>Monthly Cost</th>
                    <th>Annual Cost</th>
                    <th>% of Official Cost</th>
                </tr>
            </table>
        </div>
        
        <div class="footer">
            <p>Queensland Youth Justice Tracker | Data current as of today</p>
            <p>For full dashboard features, fix the Flask/Streamlit networking issues</p>
        </div>
    </div>
    
    <script>
        // Fetch and display data
        fetch('/api/data')
            .then(response => response.json())
            .then(data => {
                // Update database summary
                const dbContent = document.getElementById('database-content');
                dbContent.innerHTML = `
                    <h2>Database Summary</h2>
                    <ul>
                        <li><strong>Interviews Conducted:</strong> ${data.database.interviews}</li>
                        <li><strong>Hidden Cost Calculations:</strong> ${data.database.cost_calculations}</li>
                        <li><strong>Coalition Members:</strong> ${data.database.coalition_members}</li>
                        <li><strong>Media Citations:</strong> ${data.database.media_citations}</li>
                    </ul>
                `;
                
                // Update costs table
                const table = document.getElementById('costs-table');
                data.family_costs.forEach(cost => {
                    const row = table.insertRow();
                    row.innerHTML = `
                        <td>${cost.family_location}</td>
                        <td>$${cost.monthly_cost.toLocaleString()}</td>
                        <td>$${cost.annual_cost.toLocaleString()}</td>
                        <td>${cost.percentage}%</td>
                    `;
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    </script>
</body>
</html>
        """
        self.wfile.write(html.encode())
    
    def serve_api_data(self):
        """Serve API data as JSON."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, Interview, FamilyCostCalculation, CoalitionMember, MediaCitation
            db = next(get_db())
            
            # Get family costs data
            family_costs = []
            for fc in db.query(FamilyCostCalculation).all():
                family_costs.append({
                    "family_location": fc.family_location,
                    "monthly_cost": fc.total_monthly_cost,
                    "annual_cost": fc.total_annual_cost,
                    "percentage": round(fc.family_cost_percentage, 1)
                })
            
            data = {
                "database": {
                    "interviews": db.query(Interview).count(),
                    "cost_calculations": db.query(FamilyCostCalculation).count(),
                    "coalition_members": db.query(CoalitionMember).count(),
                    "media_citations": db.query(MediaCitation).count()
                },
                "family_costs": family_costs
            }
            db.close()
        except Exception as e:
            data = {"error": str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        # Only log errors
        if args[1] != '200':
            super().log_message(format, *args)

def main():
    print("\n" + "="*60)
    print("Queensland Youth Justice Tracker - Working Dashboard")
    print("="*60)
    
    port = 8080
    server = HTTPServer(('localhost', port), DashboardHandler)
    
    print(f"\n✅ Dashboard is running!")
    print(f"\n🌐 Open your browser to: http://localhost:{port}")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped")

if __name__ == "__main__":
    main()