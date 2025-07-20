/**
 * Vercel Serverless Function - Service Insights API
 * 
 * Provides service analytics and insights data for the dashboard
 */

export default async function handler(req, res) {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Simulated insights data (in production, this would come from your database)
        const insights = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalServices: 1075,
                lastUpdated: '2025-07-16T03:31:58.247Z',
                version: '2.0.0'
            },
            summary: {
                totalServices: 1075,
                youthSpecific: 1002,
                youthFocusRate: '93.2%',
                dataQuality: 72,
                verificationRate: '100%',
                geographicCoverage: {
                    states: 8,
                    regions: 56,
                    locationCoverage: '100%'
                }
            },
            performance: {
                processingSpeed: '5000 services/sec',
                memoryUsage: '276MB',
                performanceScore: 90,
                scalabilityScore: 75
            },
            connections: {
                totalConnections: 449760,
                organizationalConnections: 46,
                geographicConnections: 402037,
                categoricalConnections: 47677,
                networkDensity: 0.779
            },
            categories: {
                totalCategories: 16,
                topCategories: [
                    { name: 'community_service', count: 1000 },
                    { name: 'youth_justice', count: 30 },
                    { name: 'family_support', count: 50 },
                    { name: 'mental_health', count: 25 },
                    { name: 'legal_aid', count: 20 }
                ]
            },
            geographic: {
                stateDistribution: {
                    'QLD': 350,
                    'NSW': 300,
                    'VIC': 200,
                    'WA': 100,
                    'SA': 75,
                    'TAS': 25,
                    'NT': 15,
                    'ACT': 10
                }
            },
            gaps: {
                totalGaps: 4,
                criticalGaps: 0,
                highPriorityGaps: 0,
                gapsByType: {
                    geographic: 1,
                    categorical: 2,
                    demographic: 1
                }
            },
            recommendations: [
                {
                    priority: 'high',
                    title: 'Establish Service Partnerships',
                    description: 'Connect isolated services with major hubs for referral networks'
                },
                {
                    priority: 'high', 
                    title: 'Implement Quality Assurance Program',
                    description: 'Systematic verification and enhancement of service data'
                },
                {
                    priority: 'medium',
                    title: 'Expand Legal Aid Services',
                    description: 'Increase legal aid service coverage in underserved areas'
                }
            ],
            healthMetrics: {
                systemStatus: 'operational',
                databaseHealth: 'partial',
                dataValidation: 'success',
                lastHealthCheck: new Date().toISOString()
            }
        };

        // Add query parameter support for specific data
        const { section } = req.query;
        
        if (section) {
            const sectionData = insights[section];
            if (sectionData) {
                res.status(200).json({
                    section,
                    data: sectionData,
                    timestamp: new Date().toISOString()
                });
                return;
            } else {
                res.status(404).json({
                    error: 'Section not found',
                    availableSections: Object.keys(insights)
                });
                return;
            }
        }

        res.status(200).json(insights);
        
    } catch (error) {
        console.error('Services insights error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}