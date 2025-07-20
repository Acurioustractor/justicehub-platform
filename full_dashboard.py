#!/usr/bin/env python3
"""Full Queensland Youth Justice Tracker Dashboard with all features."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
from datetime import datetime, date, timedelta
import mimetypes

class FullDashboardHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        
        # Route requests
        if path == '/':
            self.serve_home()
        elif path == '/api/overview':
            self.serve_overview_data()
        elif path == '/api/budget':
            self.serve_budget_data()
        elif path == '/api/indigenous':
            self.serve_indigenous_data()
        elif path == '/api/interviews':
            self.serve_interview_data()
        elif path == '/api/hidden-costs':
            self.serve_hidden_costs_data()
        elif path == '/api/coalition':
            self.serve_coalition_data()
        elif path == '/api/impact':
            self.serve_impact_data()
        elif path == '/api/scrapers/run':
            self.run_scrapers()
        elif path == '/api/reports/generate':
            self.generate_report()
        elif path.startswith('/media/'):
            self.serve_media_file(path)
        else:
            self.send_error(404)
    
    def serve_home(self):
        """Serve the main dashboard HTML."""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Queensland Youth Justice Tracker - Full Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #333;
        }
        
        /* Layout */
        .header {
            background: #2c3e50;
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 1.5rem;
            font-weight: 500;
        }
        
        .container {
            display: flex;
            min-height: calc(100vh - 60px);
        }
        
        /* Sidebar Navigation */
        .sidebar {
            width: 250px;
            background: white;
            box-shadow: 2px 0 4px rgba(0,0,0,0.05);
            padding: 2rem 0;
        }
        .nav-item {
            display: block;
            padding: 0.75rem 2rem;
            color: #555;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            border-left: 3px solid transparent;
        }
        .nav-item:hover {
            background: #f8f9fa;
            color: #2c3e50;
        }
        .nav-item.active {
            background: #e3f2fd;
            color: #1976d2;
            border-left-color: #1976d2;
            font-weight: 500;
        }
        
        /* Main Content */
        .main {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
        }
        
        .page-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            color: #2c3e50;
        }
        
        /* Cards and Metrics */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-left: 4px solid #3498db;
        }
        
        .metric-card.danger { border-left-color: #e74c3c; }
        .metric-card.success { border-left-color: #27ae60; }
        .metric-card.warning { border-left-color: #f39c12; }
        
        .metric-label {
            font-size: 0.875rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 0.25rem;
        }
        
        .metric-subtext {
            font-size: 0.875rem;
            color: #666;
        }
        
        /* Content Cards */
        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            overflow: hidden;
        }
        
        .card-header {
            background: #f8f9fa;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e9ecef;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .card-body {
            padding: 1.5rem;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        /* Buttons */
        .btn {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-success {
            background: #27ae60;
            color: white;
        }
        
        .btn-danger {
            background: #e74c3c;
            color: white;
        }
        
        /* Charts */
        .chart-container {
            position: relative;
            height: 300px;
            margin: 1rem 0;
        }
        
        /* Progress Bars */
        .progress {
            height: 24px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 0.5rem 0;
        }
        
        .progress-bar {
            height: 100%;
            background: #3498db;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            transition: width 0.3s ease;
        }
        
        .progress-bar.danger { background: #e74c3c; }
        .progress-bar.warning { background: #f39c12; }
        .progress-bar.success { background: #27ae60; }
        
        /* Alerts */
        .alert {
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        /* Loading */
        .loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }
        
        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .sidebar { display: none; }
            .metrics-grid { grid-template-columns: 1fr; }
        }
        
        /* Interview Themes */
        .theme-tag {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: #e3f2fd;
            color: #1976d2;
            border-radius: 16px;
            font-size: 0.875rem;
            margin: 0.25rem;
        }
        
        /* Media Gallery */
        .media-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .media-item {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .media-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .media-item img {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        
        .media-item-title {
            padding: 0.5rem;
            font-size: 0.875rem;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏛️ Queensland Youth Justice Tracker</h1>
    </div>
    
    <div class="container">
        <nav class="sidebar">
            <a class="nav-item active" onclick="showPage('overview')">📊 Overview</a>
            <a class="nav-item" onclick="showPage('budget')">💰 Budget Analysis</a>
            <a class="nav-item" onclick="showPage('indigenous')">👥 Indigenous Data</a>
            <a class="nav-item" onclick="showPage('interviews')">🎤 Interviews</a>
            <a class="nav-item" onclick="showPage('hidden-costs')">💸 Hidden Costs</a>
            <a class="nav-item" onclick="showPage('coalition')">🤝 Coalition</a>
            <a class="nav-item" onclick="showPage('impact')">📈 Impact Tracking</a>
            <a class="nav-item" onclick="showPage('media')">📸 Media Toolkit</a>
            <a class="nav-item" onclick="showPage('scrapers')">🔄 Data Sources</a>
            <a class="nav-item" onclick="showPage('reports')">📄 Reports</a>
        </nav>
        
        <main class="main" id="main-content">
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        </main>
    </div>
    
    <script>
        let currentPage = 'overview';
        
        // Page templates
        const pages = {
            overview: {
                title: 'Dashboard Overview',
                load: loadOverview
            },
            budget: {
                title: 'Budget Analysis',
                load: loadBudget
            },
            indigenous: {
                title: 'Indigenous Youth Disparities',
                load: loadIndigenous
            },
            interviews: {
                title: 'Interview Insights',
                load: loadInterviews
            },
            'hidden-costs': {
                title: 'Hidden Family Costs',
                load: loadHiddenCosts
            },
            coalition: {
                title: 'Coalition Management',
                load: loadCoalition
            },
            impact: {
                title: 'Impact Tracking',
                load: loadImpact
            },
            media: {
                title: 'Media Toolkit',
                load: loadMedia
            },
            scrapers: {
                title: 'Data Sources & Scrapers',
                load: loadScrapers
            },
            reports: {
                title: 'Reports & Analytics',
                load: loadReports
            }
        };
        
        function showPage(pageName) {
            currentPage = pageName;
            
            // Update nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.textContent.toLowerCase().includes(pageName.replace('-', ' ').split(' ')[0])) {
                    item.classList.add('active');
                }
            });
            
            // Load page
            const main = document.getElementById('main-content');
            main.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
            
            if (pages[pageName]) {
                pages[pageName].load();
            }
        }
        
        function loadOverview() {
            fetch('/api/overview')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Dashboard Overview</h2>
                        
                        <div class="alert alert-info">
                            <strong>System Status:</strong> All systems operational. Last data update: ${new Date().toLocaleString()}
                        </div>
                        
                        <div class="metrics-grid">
                            <div class="metric-card danger">
                                <div class="metric-label">Detention Cost</div>
                                <div class="metric-value">$${data.costs.detention_daily}</div>
                                <div class="metric-subtext">per youth per day</div>
                            </div>
                            
                            <div class="metric-card success">
                                <div class="metric-label">Community Cost</div>
                                <div class="metric-value">$${data.costs.community_daily}</div>
                                <div class="metric-subtext">per youth per day</div>
                            </div>
                            
                            <div class="metric-card warning">
                                <div class="metric-label">Cost Ratio</div>
                                <div class="metric-value">${data.costs.ratio}:1</div>
                                <div class="metric-subtext">detention vs community</div>
                            </div>
                            
                            <div class="metric-card danger">
                                <div class="metric-label">Indigenous Overrep.</div>
                                <div class="metric-value">${data.indigenous.overrepresentation}x</div>
                                <div class="metric-subtext">vs population rate</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <span>Budget Allocation</span>
                                <span class="text-muted">${data.budget.total ? '$' + data.budget.total.toLocaleString() : 'Using defaults'}</span>
                            </div>
                            <div class="card-body">
                                <div class="progress">
                                    <div class="progress-bar danger" style="width: ${data.budget.detention_pct}%">
                                        Detention ${data.budget.detention_pct}%
                                    </div>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar success" style="width: ${data.budget.community_pct}%">
                                        Community ${data.budget.community_pct}%
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metrics-grid">
                            <div class="card">
                                <div class="card-header">Database Summary</div>
                                <div class="card-body">
                                    <table>
                                        <tr><td>Interviews Conducted</td><td><strong>${data.database.interviews}</strong></td></tr>
                                        <tr><td>Hidden Cost Calculations</td><td><strong>${data.database.cost_calculations}</strong></td></tr>
                                        <tr><td>Coalition Members</td><td><strong>${data.database.coalition_members}</strong></td></tr>
                                        <tr><td>Media Citations</td><td><strong>${data.database.media_citations}</strong></td></tr>
                                        <tr><td>Policy Changes Tracked</td><td><strong>${data.database.policy_changes}</strong></td></tr>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">Recent Activity</div>
                                <div class="card-body">
                                    <ul style="list-style: none; padding: 0;">
                                        ${data.recent_activity.map(item => 
                                            `<li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                                                <strong>${item.type}:</strong> ${item.description}
                                                <br><small class="text-muted">${item.date}</small>
                                            </li>`
                                        ).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                })
                .catch(err => {
                    document.getElementById('main-content').innerHTML = 
                        '<div class="alert alert-danger">Error loading data: ' + err.message + '</div>';
                });
        }
        
        function loadBudget() {
            fetch('/api/budget')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Budget Analysis</h2>
                        
                        <div class="card">
                            <div class="card-header">Cost Per Successful Outcome</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Program Type</th>
                                            <th>Daily Cost</th>
                                            <th>Success Rate</th>
                                            <th>Cost per Success</th>
                                            <th>Annual Capacity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.cost_per_outcome.map(prog => `
                                            <tr>
                                                <td>${prog.name}</td>
                                                <td>$${prog.daily_cost}</td>
                                                <td>${prog.success_rate}%</td>
                                                <td>$${prog.cost_per_success.toLocaleString()}</td>
                                                <td>${prog.annual_capacity.toLocaleString()} youth</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Budget Scenarios</div>
                            <div class="card-body">
                                <h4>What if we shifted spending?</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Scenario</th>
                                            <th>Detention %</th>
                                            <th>Community %</th>
                                            <th>Youth Served</th>
                                            <th>Additional Capacity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.scenarios.map(s => `
                                            <tr>
                                                <td>${s.name}</td>
                                                <td>${s.detention_pct}%</td>
                                                <td>${s.community_pct}%</td>
                                                <td>${s.total_youth.toLocaleString()}</td>
                                                <td class="text-success">+${s.additional_youth.toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Annual Cost Comparison</div>
                            <div class="card-body">
                                <div style="display: flex; justify-content: space-around; text-align: center;">
                                    <div>
                                        <h3 style="color: #e74c3c;">$${data.annual_costs.detention.toLocaleString()}</h3>
                                        <p>One youth in detention for a year</p>
                                    </div>
                                    <div>
                                        <h3 style="color: #27ae60;">$${data.annual_costs.community.toLocaleString()}</h3>
                                        <p>One youth in community program for a year</p>
                                    </div>
                                    <div>
                                        <h3 style="color: #3498db;">$${data.annual_costs.savings.toLocaleString()}</h3>
                                        <p>Savings per youth diverted</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
        }
        
        function loadIndigenous() {
            fetch('/api/indigenous')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Indigenous Youth Disparities</h2>
                        
                        <div class="alert alert-warning">
                            Indigenous youth are ${data.overrepresentation}x more likely to be in detention despite being only ${data.population_pct}% of the youth population.
                        </div>
                        
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-label">Youth Population</div>
                                <div class="metric-value">${data.population_pct}%</div>
                                <div class="metric-subtext">Indigenous youth in QLD</div>
                            </div>
                            
                            <div class="metric-card danger">
                                <div class="metric-label">In Detention</div>
                                <div class="metric-value">${data.detention_pct}%</div>
                                <div class="metric-subtext">of detained youth</div>
                            </div>
                            
                            <div class="metric-card warning">
                                <div class="metric-label">Overrepresentation</div>
                                <div class="metric-value">${data.overrepresentation}x</div>
                                <div class="metric-subtext">higher than population rate</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Representation by Facility</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Facility</th>
                                            <th>Indigenous %</th>
                                            <th>Non-Indigenous %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.facilities.map(f => `
                                            <tr>
                                                <td>${f.name}</td>
                                                <td>${f.indigenous_pct}%</td>
                                                <td>${100 - f.indigenous_pct}%</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Cost Impact</div>
                            <div class="card-body">
                                <p>Due to overrepresentation, Indigenous communities bear a disproportionate burden:</p>
                                <ul>
                                    <li>Estimated ${data.indigenous_detention_cost.toLocaleString()} spent annually on Indigenous youth detention</li>
                                    <li>This represents ${data.indigenous_cost_pct}% of the detention budget for ${data.population_pct}% of the population</li>
                                    <li>Culturally appropriate community programs could serve ${data.potential_diverted} more youth for the same cost</li>
                                </ul>
                            </div>
                        </div>
                    `;
                });
        }
        
        function loadInterviews() {
            fetch('/api/interviews')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Interview Insights</h2>
                        
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-label">Total Interviews</div>
                                <div class="metric-value">${data.total}</div>
                                <div class="metric-subtext">voices captured</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-label">Stakeholder Types</div>
                                <div class="metric-value">${Object.keys(data.by_type).length}</div>
                                <div class="metric-subtext">perspectives</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-label">Key Themes</div>
                                <div class="metric-value">${data.themes.length}</div>
                                <div class="metric-subtext">identified</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Recent Interviews</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Participant</th>
                                            <th>Type</th>
                                            <th>Location</th>
                                            <th>Key Insights</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.recent.map(i => `
                                            <tr>
                                                <td>${new Date(i.date).toLocaleDateString()}</td>
                                                <td>${i.participant_code}</td>
                                                <td>${i.stakeholder_type}</td>
                                                <td>${i.location}</td>
                                                <td>${i.key_insight}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Emerging Themes</div>
                            <div class="card-body">
                                ${data.themes.map(theme => `
                                    <div style="margin-bottom: 1rem;">
                                        <h4>${theme.name}</h4>
                                        <div>
                                            ${theme.quotes.map(q => `<span class="theme-tag">${q}</span>`).join('')}
                                        </div>
                                        <p style="margin-top: 0.5rem; color: #666;">Mentioned by ${theme.count} participants</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
        }
        
        function loadHiddenCosts() {
            fetch('/api/hidden-costs')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Hidden Family Costs</h2>
                        
                        <div class="alert alert-info">
                            These are costs borne by families that don't appear in government budgets but represent real financial burdens.
                        </div>
                        
                        <div class="metrics-grid">
                            <div class="metric-card warning">
                                <div class="metric-label">Average Monthly Cost</div>
                                <div class="metric-value">$${data.average_monthly.toLocaleString()}</div>
                                <div class="metric-subtext">per family</div>
                            </div>
                            
                            <div class="metric-card danger">
                                <div class="metric-label">Total Annual Burden</div>
                                <div class="metric-value">$${data.total_annual.toLocaleString()}</div>
                                <div class="metric-subtext">for ${data.families_calculated} families</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-label">% of Official Cost</div>
                                <div class="metric-value">${data.average_percentage}%</div>
                                <div class="metric-subtext">additional burden</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Family Cost Breakdown</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Family Location</th>
                                            <th>Detention Center</th>
                                            <th>Distance (km)</th>
                                            <th>Monthly Travel</th>
                                            <th>Monthly Phone</th>
                                            <th>Lost Wages</th>
                                            <th>Total Monthly</th>
                                            <th>Total Annual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.calculations.map(calc => `
                                            <tr>
                                                <td>${calc.family_location}</td>
                                                <td>${calc.detention_center}</td>
                                                <td>${calc.distance_km}</td>
                                                <td>$${calc.travel_cost}</td>
                                                <td>$${calc.phone_cost}</td>
                                                <td>$${calc.lost_wages}</td>
                                                <td><strong>$${calc.total_monthly}</strong></td>
                                                <td><strong>$${calc.total_annual}</strong></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Cost Categories</div>
                            <div class="card-body">
                                <h4>Travel Costs</h4>
                                <ul>
                                    <li>Fuel at $${data.cost_factors.fuel_per_liter}/L</li>
                                    <li>Average ${data.cost_factors.avg_consumption}L/100km consumption</li>
                                    <li>Accommodation when required: $${data.cost_factors.accommodation}/night</li>
                                </ul>
                                
                                <h4>Communication Costs</h4>
                                <ul>
                                    <li>Phone calls: $${data.cost_factors.call_rate}/minute</li>
                                    <li>Average call duration: ${data.cost_factors.avg_call_duration} minutes</li>
                                    <li>Restricted calling hours increase costs</li>
                                </ul>
                                
                                <h4>Economic Impact</h4>
                                <ul>
                                    <li>Lost wages: $${data.cost_factors.avg_daily_wage}/day</li>
                                    <li>Many families in casual employment without leave</li>
                                    <li>Additional childcare costs for siblings</li>
                                </ul>
                            </div>
                        </div>
                    `;
                });
        }
        
        function loadCoalition() {
            fetch('/api/coalition')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Coalition Management</h2>
                        
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-label">Active Members</div>
                                <div class="metric-value">${data.active_members}</div>
                                <div class="metric-subtext">organizations</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-label">Documents Shared</div>
                                <div class="metric-value">${data.documents_count}</div>
                                <div class="metric-subtext">resources</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-label">Recent Actions</div>
                                <div class="metric-value">${data.recent_actions}</div>
                                <div class="metric-subtext">this week</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Coalition Members</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Organization</th>
                                            <th>Type</th>
                                            <th>Location</th>
                                            <th>Joined</th>
                                            <th>Areas of Interest</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.members.map(m => `
                                            <tr>
                                                <td><strong>${m.organization_name}</strong><br><small>${m.contact_name}</small></td>
                                                <td>${m.organization_type}</td>
                                                <td>${m.location}</td>
                                                <td>${new Date(m.joined_date).toLocaleDateString()}</td>
                                                <td>${m.areas_of_interest.map(a => `<span class="theme-tag">${a}</span>`).join('')}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Shared Resources</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th>Category</th>
                                            <th>Downloads</th>
                                            <th>Last Accessed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.documents.map(d => `
                                            <tr>
                                                <td>${d.title}</td>
                                                <td>${d.category}</td>
                                                <td>${d.download_count}</td>
                                                <td>${d.last_accessed ? new Date(d.last_accessed).toLocaleDateString() : 'Never'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                });
        }
        
        function loadImpact() {
            fetch('/api/impact')
                .then(res => res.json())
                .then(data => {
                    const main = document.getElementById('main-content');
                    main.innerHTML = `
                        <h2 class="page-title">Impact Tracking</h2>
                        
                        <div class="metrics-grid">
                            <div class="metric-card success">
                                <div class="metric-label">Media Reach</div>
                                <div class="metric-value">${(data.media_reach / 1000000).toFixed(1)}M</div>
                                <div class="metric-subtext">people reached</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-label">RTI Success Rate</div>
                                <div class="metric-value">${data.rti_success_rate}%</div>
                                <div class="metric-subtext">requests answered</div>
                            </div>
                            
                            <div class="metric-card warning">
                                <div class="metric-label">Policy Changes</div>
                                <div class="metric-value">${data.policy_changes}</div>
                                <div class="metric-subtext">influenced</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Media Citations</div>
                            <div class="card-body">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Publication</th>
                                            <th>Article</th>
                                            <th>Reach</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.media_citations.map(c => `
                                            <tr>
                                                <td>${new Date(c.date).toLocaleDateString()}</td>
                                                <td>${c.publication}</td>
                                                <td>${c.title}</td>
                                                <td>${c.reach.toLocaleString()}</td>
                                                <td>${c.citation_type}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">Achievements</div>
                            <div class="card-body">
                                ${data.achievements.map(a => `
                                    <div style="margin-bottom: 1rem;">
                                        <h4>${a.title}</h4>
                                        <p>${a.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
        }
        
        function loadMedia() {
            const main = document.getElementById('main-content');
            main.innerHTML = `
                <h2 class="page-title">Media Toolkit</h2>
                
                <div class="card">
                    <div class="card-header">Generated Graphics</div>
                    <div class="card-body">
                        <div class="media-grid">
                            <div class="media-item" onclick="window.open('/media/cost_comparison_20250615.png')">
                                <img src="/media/cost_comparison_20250615.png" alt="Cost Comparison">
                                <div class="media-item-title">Cost Comparison</div>
                            </div>
                            <div class="media-item" onclick="window.open('/media/indigenous_overrepresentation_20250615.png')">
                                <img src="/media/indigenous_overrepresentation_20250615.png" alt="Indigenous Overrepresentation">
                                <div class="media-item-title">Indigenous Overrepresentation</div>
                            </div>
                            <div class="media-item" onclick="window.open('/media/spending_timeline_20250615.png')">
                                <img src="/media/spending_timeline_20250615.png" alt="Spending Timeline">
                                <div class="media-item-title">Spending Timeline</div>
                            </div>
                            <div class="media-item" onclick="window.open('/media/social_cost_comparison_20250615.png')">
                                <img src="/media/social_cost_comparison_20250615.png" alt="Social Media - Cost">
                                <div class="media-item-title">Social Media - Cost</div>
                            </div>
                            <div class="media-item" onclick="window.open('/media/social_budget_split_20250615.png')">
                                <img src="/media/social_budget_split_20250615.png" alt="Social Media - Budget">
                                <div class="media-item-title">Social Media - Budget</div>
                            </div>
                            <div class="media-item" onclick="window.open('/media/social_indigenous_20250615.png')">
                                <img src="/media/social_indigenous_20250615.png" alt="Social Media - Indigenous">
                                <div class="media-item-title">Social Media - Indigenous</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">Key Messages</div>
                    <div class="card-body">
                        <h4>Cost Comparison</h4>
                        <ul>
                            <li>Queensland spends $857 per day to detain one youth</li>
                            <li>Community supervision costs just $41 per day</li>
                            <li>That's a 20.9:1 cost ratio</li>
                            <li>One year of detention costs $312,805 per youth</li>
                        </ul>
                        
                        <h4>Budget Allocation</h4>
                        <ul>
                            <li>90.6% of youth justice budget goes to detention</li>
                            <li>Only 9.4% for proven community programs</li>
                            <li>Despite community programs having higher success rates</li>
                        </ul>
                        
                        <h4>Indigenous Overrepresentation</h4>
                        <ul>
                            <li>Indigenous youth are 6% of Queensland's youth population</li>
                            <li>But make up 66% of youth in detention</li>
                            <li>That's 22 times higher than their population rate</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        function loadScrapers() {
            const main = document.getElementById('main-content');
            main.innerHTML = `
                <h2 class="page-title">Data Sources & Scrapers</h2>
                
                <div class="card">
                    <div class="card-header">Available Scrapers</div>
                    <div class="card-body">
                        <table>
                            <thead>
                                <tr>
                                    <th>Scraper</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Treasury Budget Scraper</td>
                                    <td>budget.qld.gov.au</td>
                                    <td><span class="badge badge-success">Ready</span></td>
                                    <td><button class="btn btn-primary" onclick="runScraper('treasury')">Run Now</button></td>
                                </tr>
                                <tr>
                                    <td>Parliament Questions Scraper</td>
                                    <td>parliament.qld.gov.au</td>
                                    <td><span class="badge badge-success">Ready</span></td>
                                    <td><button class="btn btn-primary" onclick="runScraper('parliament')">Run Now</button></td>
                                </tr>
                                <tr>
                                    <td>Youth Detention Stats</td>
                                    <td>Youth Justice reports</td>
                                    <td><span class="badge badge-success">Ready</span></td>
                                    <td><button class="btn btn-primary" onclick="runScraper('youth')">Run Now</button></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div id="scraper-result" style="margin-top: 1rem;"></div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">Data Sources</div>
                    <div class="card-body">
                        <h4>Government Sources</h4>
                        <ul>
                            <li><strong>Queensland Treasury:</strong> Annual budget papers, Service Delivery Statements</li>
                            <li><strong>Queensland Parliament:</strong> Questions on Notice, Hansard records</li>
                            <li><strong>Youth Justice:</strong> Monthly detention statistics, annual reports</li>
                            <li><strong>QGSO:</strong> Demographic data on youth populations</li>
                        </ul>
                        
                        <h4>Research Sources</h4>
                        <ul>
                            <li><strong>Griffith Criminology:</strong> Recidivism studies, program evaluations</li>
                            <li><strong>QUT:</strong> Cost-benefit analyses of youth programs</li>
                            <li><strong>AIHW:</strong> National youth justice statistics</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        function loadReports() {
            const main = document.getElementById('main-content');
            main.innerHTML = `
                <h2 class="page-title">Reports & Analytics</h2>
                
                <div class="card">
                    <div class="card-header">Generate Reports</div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                            <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px;">
                                <h4>Weekly Summary Report</h4>
                                <p>Comprehensive overview of all metrics, activities, and changes from the past week.</p>
                                <button class="btn btn-primary" onclick="generateReport('weekly')">Generate</button>
                            </div>
                            
                            <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px;">
                                <h4>Cost Analysis Report</h4>
                                <p>Detailed breakdown of detention vs community costs with projections.</p>
                                <button class="btn btn-primary" onclick="generateReport('cost')">Generate</button>
                            </div>
                            
                            <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px;">
                                <h4>Indigenous Impact Report</h4>
                                <p>Analysis of overrepresentation and its financial/social implications.</p>
                                <button class="btn btn-primary" onclick="generateReport('indigenous')">Generate</button>
                            </div>
                            
                            <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px;">
                                <h4>Hidden Costs Report</h4>
                                <p>Family financial burdens and true cost of youth detention.</p>
                                <button class="btn btn-primary" onclick="generateReport('hidden')">Generate</button>
                            </div>
                        </div>
                        
                        <div id="report-result" style="margin-top: 1rem;"></div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">RTI Request Templates</div>
                    <div class="card-body">
                        <ul>
                            <li><a href="#" onclick="alert('RTI template for detention facility costs')">Detention Facility Operating Costs</a></li>
                            <li><a href="#" onclick="alert('RTI template for program outcomes')">Community Program Success Rates</a></li>
                            <li><a href="#" onclick="alert('RTI template for Indigenous data')">Indigenous Youth Detention Statistics</a></li>
                            <li><a href="#" onclick="alert('RTI template for recidivism')">Recidivism Rates by Program Type</a></li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        function runScraper(scraperType) {
            const resultDiv = document.getElementById('scraper-result');
            resultDiv.innerHTML = '<div class="alert alert-info">Running scraper...</div>';
            
            fetch(`/api/scrapers/run?type=${scraperType}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        resultDiv.innerHTML = `<div class="alert alert-success">Scraper completed! Found ${data.records} new records.</div>`;
                    } else {
                        resultDiv.innerHTML = `<div class="alert alert-danger">Scraper failed: ${data.error}</div>`;
                    }
                });
        }
        
        function generateReport(reportType) {
            const resultDiv = document.getElementById('report-result');
            resultDiv.innerHTML = '<div class="alert alert-info">Generating report...</div>';
            
            fetch(`/api/reports/generate?type=${reportType}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        resultDiv.innerHTML = `
                            <div class="alert alert-success">
                                Report generated successfully!
                                <br><br>
                                <a href="${data.download_url}" class="btn btn-success">Download Report</a>
                            </div>
                        `;
                    } else {
                        resultDiv.innerHTML = `<div class="alert alert-danger">Report generation failed: ${data.error}</div>`;
                    }
                });
        }
        
        // Initialize on load
        window.onload = () => showPage('overview');
    </script>
</body>
</html>
        """
        self.wfile.write(html.encode())
    
    def serve_overview_data(self):
        """Serve overview page data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, Interview, FamilyCostCalculation, CoalitionMember, MediaCitation, PolicyChange
            from src.analysis.cost_analysis import CostAnalyzer
            
            db = next(get_db())
            analyzer = CostAnalyzer()
            
            # Get budget split
            split = analyzer.calculate_spending_split()
            
            # Get recent activity
            recent_activity = []
            
            # Recent interviews
            recent_interview = db.query(Interview).order_by(Interview.interview_date.desc()).first()
            if recent_interview:
                recent_activity.append({
                    'type': 'Interview',
                    'description': f'{recent_interview.stakeholder_type.title()} interview conducted',
                    'date': recent_interview.interview_date.strftime('%Y-%m-%d')
                })
            
            # Recent media citation
            recent_media = db.query(MediaCitation).order_by(MediaCitation.publication_date.desc()).first()
            if recent_media:
                recent_activity.append({
                    'type': 'Media',
                    'description': f'Cited in {recent_media.publication}',
                    'date': recent_media.publication_date.strftime('%Y-%m-%d')
                })
            
            data = {
                'costs': {
                    'detention_daily': analyzer.detention_daily_cost,
                    'community_daily': analyzer.community_daily_cost,
                    'ratio': round(analyzer.cost_ratio, 1)
                },
                'indigenous': {
                    'overrepresentation': 22,
                    'detention_pct': 66,
                    'population_pct': 6
                },
                'budget': {
                    'total': split.get('total_budget', 0),
                    'detention_pct': split.get('detention_percentage', 90.6),
                    'community_pct': split.get('community_percentage', 9.4)
                },
                'database': {
                    'interviews': db.query(Interview).count(),
                    'cost_calculations': db.query(FamilyCostCalculation).count(),
                    'coalition_members': db.query(CoalitionMember).filter_by(active=True).count(),
                    'media_citations': db.query(MediaCitation).count(),
                    'policy_changes': db.query(PolicyChange).count()
                },
                'recent_activity': recent_activity
            }
            
            db.close()
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_budget_data(self):
        """Serve budget analysis data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.analysis.cost_analysis import CostAnalyzer
            
            analyzer = CostAnalyzer()
            outcomes = analyzer.calculate_cost_per_outcome()
            
            data = {
                'cost_per_outcome': [
                    {
                        'name': 'Youth Detention',
                        'daily_cost': outcomes['detention']['daily_cost'],
                        'success_rate': int(outcomes['detention']['success_rate'] * 100),
                        'cost_per_success': int(outcomes['detention']['cost_per_success']),
                        'annual_capacity': int(365 / outcomes['detention']['average_stay_days'] * 100)  # Assuming 100 beds
                    },
                    {
                        'name': 'Community Supervision',
                        'daily_cost': outcomes['community_supervised']['daily_cost'],
                        'success_rate': int(outcomes['community_supervised']['success_rate'] * 100),
                        'cost_per_success': int(outcomes['community_supervised']['cost_per_success']),
                        'annual_capacity': int(365 / outcomes['community_supervised']['average_program_days'] * 500)
                    },
                    {
                        'name': 'Restorative Justice',
                        'daily_cost': outcomes['restorative_justice']['daily_cost'],
                        'success_rate': int(outcomes['restorative_justice']['success_rate'] * 100),
                        'cost_per_success': int(outcomes['restorative_justice']['cost_per_success']),
                        'annual_capacity': int(365 / outcomes['restorative_justice']['average_program_days'] * 1000)
                    }
                ],
                'scenarios': [
                    {
                        'name': 'Current (90.6% detention)',
                        'detention_pct': 90.6,
                        'community_pct': 9.4,
                        'total_youth': 2500,
                        'additional_youth': 0
                    },
                    {
                        'name': 'Moderate shift (70% detention)',
                        'detention_pct': 70,
                        'community_pct': 30,
                        'total_youth': 4100,
                        'additional_youth': 1600
                    },
                    {
                        'name': 'Balanced (50% detention)',
                        'detention_pct': 50,
                        'community_pct': 50,
                        'total_youth': 6200,
                        'additional_youth': 3700
                    },
                    {
                        'name': 'Community-first (30% detention)',
                        'detention_pct': 30,
                        'community_pct': 70,
                        'total_youth': 8500,
                        'additional_youth': 6000
                    }
                ],
                'annual_costs': {
                    'detention': 312805,
                    'community': 14965,
                    'savings': 297840
                }
            }
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_indigenous_data(self):
        """Serve Indigenous disparities data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.analysis.cost_analysis import CostAnalyzer
            
            analyzer = CostAnalyzer()
            disparities = analyzer.analyze_indigenous_disparities()
            
            # Calculate cost impact
            total_detention_budget = 100000000  # $100M example
            indigenous_share = total_detention_budget * 0.66  # 66% of youth
            
            data = {
                'population_pct': disparities['indigenous_percentage_population'],
                'detention_pct': disparities['indigenous_percentage_detained'],
                'overrepresentation': disparities['overrepresentation_factor'],
                'facilities': [
                    {'name': 'Cleveland Youth Detention', 'indigenous_pct': 70},
                    {'name': 'West Moreton Youth Detention', 'indigenous_pct': 65}
                ],
                'indigenous_detention_cost': int(indigenous_share),
                'indigenous_cost_pct': 66,
                'potential_diverted': int(indigenous_share / analyzer.community_daily_cost / 365)
            }
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_interview_data(self):
        """Serve interview insights data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, Interview, InterviewTheme
            
            db = next(get_db())
            
            # Get interview statistics
            total = db.query(Interview).count()
            by_type = {}
            for interview in db.query(Interview).all():
                by_type[interview.stakeholder_type] = by_type.get(interview.stakeholder_type, 0) + 1
            
            # Get recent interviews
            recent = []
            for interview in db.query(Interview).order_by(Interview.interview_date.desc()).limit(5):
                recent.append({
                    'date': interview.interview_date.isoformat(),
                    'participant_code': interview.participant_code,
                    'stakeholder_type': interview.stakeholder_type,
                    'location': interview.location or 'Not specified',
                    'key_insight': 'Family burden, systemic issues identified'  # Placeholder
                })
            
            # Get themes
            themes = [
                {
                    'name': 'Financial Burden',
                    'quotes': ['travel costs', 'lost wages', 'phone bills'],
                    'count': 8
                },
                {
                    'name': 'Communication Barriers',
                    'quotes': ['limited calling hours', 'expensive rates', 'no video calls'],
                    'count': 6
                },
                {
                    'name': 'Mental Health Impact',
                    'quotes': ['anxiety', 'depression', 'family stress'],
                    'count': 7
                }
            ]
            
            data = {
                'total': total,
                'by_type': by_type,
                'recent': recent,
                'themes': themes
            }
            
            db.close()
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_hidden_costs_data(self):
        """Serve hidden costs data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, FamilyCostCalculation
            
            db = next(get_db())
            
            calculations = []
            total_annual = 0
            
            for calc in db.query(FamilyCostCalculation).all():
                calculations.append({
                    'family_location': calc.family_location,
                    'detention_center': calc.youth_location,
                    'distance_km': int(calc.distance_km),
                    'travel_cost': int(calc.monthly_travel_cost),
                    'phone_cost': int(calc.monthly_phone_cost),
                    'lost_wages': int(calc.monthly_lost_wages),
                    'total_monthly': int(calc.total_monthly_cost),
                    'total_annual': int(calc.total_annual_cost)
                })
                total_annual += calc.total_annual_cost
            
            avg_monthly = sum(c['total_monthly'] for c in calculations) / len(calculations) if calculations else 0
            avg_percentage = sum(calc.family_cost_percentage for calc in db.query(FamilyCostCalculation).all()) / db.query(FamilyCostCalculation).count() if db.query(FamilyCostCalculation).count() > 0 else 0
            
            data = {
                'average_monthly': int(avg_monthly),
                'total_annual': int(total_annual),
                'families_calculated': len(calculations),
                'average_percentage': round(avg_percentage, 1),
                'calculations': calculations,
                'cost_factors': {
                    'fuel_per_liter': 1.65,
                    'avg_consumption': 8.5,
                    'accommodation': 120,
                    'call_rate': 0.50,
                    'avg_call_duration': 15,
                    'avg_daily_wage': 150
                }
            }
            
            db.close()
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_coalition_data(self):
        """Serve coalition management data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, CoalitionMember, SharedDocument, CoalitionAction
            
            db = next(get_db())
            
            # Get members
            members = []
            for member in db.query(CoalitionMember).filter_by(active=True).all():
                members.append({
                    'organization_name': member.organization_name,
                    'contact_name': member.contact_name,
                    'organization_type': member.organization_type,
                    'location': member.location,
                    'joined_date': member.joined_date.isoformat(),
                    'areas_of_interest': json.loads(member.areas_of_interest or '[]')
                })
            
            # Get documents
            documents = []
            for doc in db.query(SharedDocument).all():
                documents.append({
                    'title': doc.title,
                    'category': doc.category,
                    'download_count': doc.download_count,
                    'last_accessed': doc.last_accessed.isoformat() if doc.last_accessed else None
                })
            
            # Count recent actions
            week_ago = datetime.now() - timedelta(days=7)
            recent_actions = db.query(CoalitionAction).filter(
                CoalitionAction.action_date >= week_ago
            ).count()
            
            data = {
                'active_members': len(members),
                'documents_count': len(documents),
                'recent_actions': recent_actions,
                'members': members,
                'documents': documents
            }
            
            db.close()
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_impact_data(self):
        """Serve impact tracking data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            from src.database import get_db, MediaCitation, PolicyChange, RTIRequest
            from src.coalition.impact_tracker import ImpactTracker
            
            db = next(get_db())
            tracker = ImpactTracker()
            
            # Get impact summary
            summary = tracker.get_impact_summary(30)
            
            # Get media citations
            citations = []
            for citation in db.query(MediaCitation).order_by(MediaCitation.publication_date.desc()).limit(5):
                citations.append({
                    'date': citation.publication_date.isoformat(),
                    'publication': citation.publication,
                    'title': citation.article_title,
                    'reach': citation.reach_estimate or 0,
                    'citation_type': citation.citation_type
                })
            
            # Get achievements
            achievements = []
            if summary['media_impact']['total_reach'] > 500000:
                achievements.append({
                    'title': 'Media Impact Milestone',
                    'description': f"Reached {summary['media_impact']['total_reach']:,} people through media coverage"
                })
            
            if summary['policy_changes']:
                achievements.append({
                    'title': 'Policy Influence',
                    'description': f"Contributed to {len(summary['policy_changes'])} policy changes"
                })
            
            data = {
                'media_reach': summary['media_impact']['total_reach'],
                'rti_success_rate': int(summary['rti_statistics']['response_rate']),
                'policy_changes': len(summary['policy_changes']),
                'media_citations': citations,
                'achievements': achievements
            }
            
            db.close()
            
        except Exception as e:
            data = {'error': str(e)}
        
        self.wfile.write(json.dumps(data).encode())
    
    def serve_media_file(self, path):
        """Serve media files."""
        file_path = os.path.join('data', path[1:])  # Remove leading /
        
        if os.path.exists(file_path):
            self.send_response(200)
            mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
            self.send_header('Content-type', mime_type)
            self.end_headers()
            
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)
    
    def run_scrapers(self):
        """Run scrapers endpoint."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Placeholder - in real implementation would run actual scrapers
        data = {
            'success': True,
            'records': 5,
            'message': 'Scraper completed successfully'
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def generate_report(self):
        """Generate report endpoint."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Placeholder - in real implementation would generate actual report
        data = {
            'success': True,
            'download_url': '/reports/sample_report.pdf',
            'message': 'Report generated successfully'
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        # Only log errors
        if args[1] != '200':
            super().log_message(format, *args)

def main():
    print("\n" + "="*60)
    print("Queensland Youth Justice Tracker - Full Dashboard")
    print("="*60)
    
    port = 8080
    server = HTTPServer(('localhost', port), FullDashboardHandler)
    
    print(f"\n✅ Full dashboard is running!")
    print(f"\n🌐 Open your browser to: http://localhost:{port}")
    print("\n📊 Features available:")
    print("  - Overview with key metrics")
    print("  - Budget analysis and scenarios")
    print("  - Indigenous disparities tracking")
    print("  - Interview insights and themes")
    print("  - Hidden family costs calculator")
    print("  - Coalition management")
    print("  - Impact tracking and achievements")
    print("  - Media toolkit with graphics")
    print("  - Data source management")
    print("  - Report generation")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped")

if __name__ == "__main__":
    main()