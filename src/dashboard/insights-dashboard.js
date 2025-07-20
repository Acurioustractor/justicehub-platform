/**
 * Advanced Insights Dashboard
 * 
 * Comprehensive dashboard for displaying database health,
 * service analytics, and actionable insights.
 */

import fs from 'fs/promises';
import path from 'path';

export class InsightsDashboard {
    constructor() {
        this.data = null;
        this.healthMetrics = null;
        this.lastUpdated = null;
    }

    /**
     * Load latest insights data
     */
    async loadLatestData() {
        try {
            // Load the latest insights report
            const files = await fs.readdir('.');
            const insightsFiles = files.filter(f => 
                f.includes('service-insights-report') && f.endsWith('.json')
            ).sort().reverse();

            if (insightsFiles.length > 0) {
                const content = await fs.readFile(insightsFiles[0], 'utf-8');
                this.data = JSON.parse(content);
                this.lastUpdated = new Date().toISOString();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to load insights data:', error);
            return false;
        }
    }

    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        if (!this.data) {
            return this.generateErrorHTML();
        }

        const insights = this.data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Youth Justice Service Finder - Insights Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            color: #4a5568;
            font-size: 1.1rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #4a5568;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .insight-panel {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .insight-panel h3 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .insight-list {
            list-style: none;
        }
        
        .insight-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            color: #4a5568;
        }
        
        .insight-list li:last-child {
            border-bottom: none;
        }
        
        .recommendations {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .recommendation {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .recommendation.high {
            border-left-color: #e53e3e;
            background: #fef5e7;
        }
        
        .recommendation.medium {
            border-left-color: #d69e2e;
            background: #fffbeb;
        }
        
        .rec-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 5px;
        }
        
        .rec-description {
            color: #4a5568;
            font-size: 0.9rem;
        }
        
        .priority-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 10px;
        }
        
        .priority-high { background: #fed7d7; color: #c53030; }
        .priority-medium { background: #fefcbf; color: #975a16; }
        .priority-low { background: #c6f6d5; color: #22543d; }
        
        .progress-bar {
            background: #e2e8f0;
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .footer {
            text-align: center;
            color: rgba(255,255,255,0.8);
            margin-top: 30px;
            font-size: 0.9rem;
        }
        
        .emoji {
            font-size: 1.2em;
        }

        .network-viz {
            background: #f7fafc;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
        }
        
        .connection-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        
        .connection-stat {
            text-align: center;
            padding: 10px;
            background: #edf2f7;
            border-radius: 8px;
        }
        
        .connection-stat .number {
            font-size: 1.5rem;
            font-weight: 600;
            color: #667eea;
        }
        
        .connection-stat .label {
            font-size: 0.8rem;
            color: #4a5568;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="emoji">🎯</span> Youth Justice Service Insights</h1>
            <p>Comprehensive analysis of ${insights.metadata?.totalServices || 0} services across Australia</p>
            <p style="font-size: 0.9rem; color: #718096; margin-top: 10px;">
                Last updated: ${new Date(this.lastUpdated).toLocaleString()}
            </p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${insights.metadata?.totalServices || 0}</div>
                <div class="stat-label">Total Services</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${insights.geographic?.coverageMetrics?.statesCovered || 0}</div>
                <div class="stat-label">States Covered</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${insights.categories?.totalCategories || 0}</div>
                <div class="stat-label">Service Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${insights.youthFocus?.youthServiceMetrics?.youthSpecificRate || 0}%</div>
                <div class="stat-label">Youth-Specific</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round((insights.quality?.overallQuality?.averageCompleteness || 0) * 100)}%</div>
                <div class="stat-label">Data Quality</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${insights.connections?.totalConnections || 0}</div>
                <div class="stat-label">Service Connections</div>
            </div>
        </div>

        <div class="insights-grid">
            <div class="insight-panel">
                <h3><span class="emoji">🗺️</span> Geographic Coverage</h3>
                <ul class="insight-list">
                    <li>Coverage across ${insights.geographic?.coverageMetrics?.statesCovered || 0} states and territories</li>
                    <li>${insights.geographic?.coverageMetrics?.regionsCovered || 0} regions with active services</li>
                    <li>${insights.geographic?.coverageMetrics?.locationCoverageRate || 0}% of services have location data</li>
                    <li>${insights.geographic?.coverageMetrics?.remoteServiceCount || 0} services in remote areas</li>
                </ul>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${insights.geographic?.coverageMetrics?.locationCoverageRate || 0}%"></div>
                </div>
            </div>

            <div class="insight-panel">
                <h3><span class="emoji">🔗</span> Service Networks</h3>
                <div class="connection-stats">
                    <div class="connection-stat">
                        <div class="number">${insights.connections?.connectionTypes?.organizational || 0}</div>
                        <div class="label">Organizational</div>
                    </div>
                    <div class="connection-stat">
                        <div class="number">${insights.connections?.connectionTypes?.geographic || 0}</div>
                        <div class="label">Geographic</div>
                    </div>
                    <div class="connection-stat">
                        <div class="number">${insights.connections?.connectionTypes?.categorical || 0}</div>
                        <div class="label">Categorical</div>
                    </div>
                </div>
                <div class="network-viz">
                    <p><strong>Network Density:</strong> ${(insights.networks?.networkMetrics?.networkDensity || 0).toFixed(3)}</p>
                    <p><strong>Major Hubs:</strong> ${insights.networks?.networkMetrics?.totalHubs || 0}</p>
                    <p><strong>Isolated Services:</strong> ${insights.networks?.networkMetrics?.isolatedServices || 0}</p>
                </div>
            </div>

            <div class="insight-panel">
                <h3><span class="emoji">📊</span> Quality Metrics</h3>
                <ul class="insight-list">
                    <li>Average completeness: ${Math.round((insights.quality?.overallQuality?.averageCompleteness || 0) * 100)}%</li>
                    <li>Verification rate: ${insights.quality?.overallQuality?.verificationRate || 0}%</li>
                    <li>Youth-specific rate: ${insights.quality?.overallQuality?.youthSpecificRate || 0}%</li>
                    <li>Indigenous-specific: ${insights.quality?.overallQuality?.indigenousSpecificRate || 0}%</li>
                </ul>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.round((insights.quality?.overallQuality?.averageCompleteness || 0) * 100)}%"></div>
                </div>
            </div>

            <div class="insight-panel">
                <h3><span class="emoji">🎯</span> Youth Justice Focus</h3>
                <ul class="insight-list">
                    <li>${insights.youthFocus?.youthServiceMetrics?.youthSpecificCount || 0} youth-specific services</li>
                    <li>${insights.youthFocus?.youthServiceMetrics?.ageAppropriateCount || 0} age-appropriate services</li>
                    <li>${insights.youthFocus?.youthServiceMetrics?.transitionalSupportCount || 0} transitional support services</li>
                    <li>Youth justice alignment: ${insights.youthFocus?.youthJusticeAlignment?.alignmentRate || 0}%</li>
                </ul>
            </div>

            <div class="insight-panel">
                <h3><span class="emoji">🔍</span> Service Gaps</h3>
                <ul class="insight-list">
                    <li>Total gaps identified: ${insights.gaps?.totalGaps || 0}</li>
                    <li>Critical gaps: ${insights.gaps?.gapsBySeverity?.critical || 0}</li>
                    <li>High priority gaps: ${insights.gaps?.gapsBySeverity?.high || 0}</li>
                    <li>Geographic gaps: ${insights.gaps?.gapsByType?.geographic || 0}</li>
                    <li>Category gaps: ${insights.gaps?.gapsByType?.categorical || 0}</li>
                </ul>
            </div>

            <div class="insight-panel">
                <h3><span class="emoji">📈</span> Top Categories</h3>
                <ul class="insight-list">
                    ${this.generateTopCategoriesList(insights.categories?.categoryDistribution)}
                </ul>
            </div>
        </div>

        <div class="recommendations">
            <h3><span class="emoji">💡</span> Priority Recommendations</h3>
            ${this.generateRecommendationsHTML(insights.recommendations)}
        </div>

        <div class="footer">
            <p>Youth Justice Service Finder - Advanced Analytics Dashboard</p>
            <p>Empowering better outcomes through data-driven insights</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Generate top categories list HTML
     */
    generateTopCategoriesList(categoryDistribution) {
        if (!categoryDistribution) return '<li>No category data available</li>';
        
        return Object.entries(categoryDistribution)
            .slice(0, 6)
            .map(([category, count]) => `<li>${category.replace(/_/g, ' ')}: ${count} services</li>`)
            .join('');
    }

    /**
     * Generate recommendations HTML
     */
    generateRecommendationsHTML(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return '<p>No recommendations available</p>';
        }
        
        return recommendations.slice(0, 8).map(rec => `
            <div class="recommendation ${rec.priority}">
                <div class="rec-title">
                    ${rec.title}
                    <span class="priority-badge priority-${rec.priority}">${rec.priority}</span>
                </div>
                <div class="rec-description">${rec.description}</div>
            </div>
        `).join('');
    }

    /**
     * Generate error HTML
     */
    generateErrorHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Youth Justice Service Finder - Dashboard Error</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e53e3e; font-size: 1.2rem; }
    </style>
</head>
<body>
    <h1>Dashboard Error</h1>
    <p class="error">No insights data available. Please run the service analysis first.</p>
</body>
</html>`;
    }

    /**
     * Save dashboard HTML file
     */
    async saveDashboard() {
        const html = this.generateDashboardHTML();
        const filename = 'insights-dashboard.html';
        
        await fs.writeFile(filename, html);
        console.log(`📊 Dashboard saved: ${filename}`);
        
        return filename;
    }

    /**
     * Generate and save dashboard
     */
    async generateDashboard() {
        console.log('📊 Generating insights dashboard...');
        
        const loaded = await this.loadLatestData();
        if (!loaded) {
            console.log('⚠️  No insights data found - generating basic dashboard');
        }
        
        const filename = await this.saveDashboard();
        
        console.log('✅ Dashboard generated successfully!');
        console.log(`🌐 Open ${filename} in your web browser to view insights`);
        
        return filename;
    }
}

export default InsightsDashboard;