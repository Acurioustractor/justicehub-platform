/**
 * Vercel Serverless Function: Geocoding Analysis
 */

import { Pool } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'geocoding-analysis-api' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Analyze current geocoding coverage
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    logger.info('Analyzing geocoding coverage');
    
    // Get basic coverage statistics
    const coverageQuery = `
      SELECT 
        COUNT(*) as total_services,
        COUNT(CASE WHEN 
          (location->'coordinates'->>'lat') IS NOT NULL 
          AND (location->'coordinates'->>'lng') IS NOT NULL 
          AND (location->'coordinates'->>'lat')::text != ''
          AND (location->'coordinates'->>'lng')::text != ''
        THEN 1 END) as geocoded_services,
        COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as services_with_location,
        ROUND(
          COUNT(CASE WHEN 
            (location->'coordinates'->>'lat') IS NOT NULL 
            AND (location->'coordinates'->>'lng') IS NOT NULL 
            AND (location->'coordinates'->>'lat')::text != ''
            AND (location->'coordinates'->>'lng')::text != ''
          THEN 1 END) * 100.0 / COUNT(*), 2
        ) as geocoding_percentage
      FROM services
    `;
    
    const coverageResult = await pool.query(coverageQuery);
    const coverage = coverageResult.rows[0];
    
    // Get state-by-state breakdown
    const stateQuery = `
      SELECT 
        location->>'state' as state,
        COUNT(*) as total,
        COUNT(CASE WHEN 
          (location->'coordinates'->>'lat') IS NOT NULL 
          AND (location->'coordinates'->>'lng') IS NOT NULL 
        THEN 1 END) as geocoded
      FROM services 
      WHERE location IS NOT NULL
      GROUP BY location->>'state'
      ORDER BY COUNT(*) DESC
    `;
    
    const stateResult = await pool.query(stateQuery);
    const byState = stateResult.rows.map(row => ({
      state: row.state || 'Unknown',
      total: parseInt(row.total),
      geocoded: parseInt(row.geocoded),
      percentage: row.total > 0 ? (row.geocoded / row.total * 100).toFixed(1) : '0'
    }));
    
    // Generate recommendations
    const recommendations = generateRecommendations(coverage, byState);
    
    res.json({
      success: true,
      coverage: {
        totalServices: parseInt(coverage.total_services),
        geocodedServices: parseInt(coverage.geocoded_services),
        servicesWithLocation: parseInt(coverage.services_with_location),
        geocodingPercentage: parseFloat(coverage.geocoding_percentage),
        missing: parseInt(coverage.services_with_location) - parseInt(coverage.geocoded_services)
      },
      byState,
      recommendations
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to analyze geocoding coverage');
    res.status(500).json({
      success: false,
      error: 'Failed to analyze geocoding coverage',
      details: error.message
    });
  }
}

// Generate recommendations based on geocoding analysis
function generateRecommendations(coverage, byState) {
  const recommendations = [];
  
  const geocodingPercentage = parseFloat(coverage.geocoding_percentage);
  const totalServices = parseInt(coverage.total_services);
  const missing = parseInt(coverage.services_with_location) - parseInt(coverage.geocoded_services);
  
  if (geocodingPercentage < 50) {
    recommendations.push({
      type: 'urgent',
      title: 'Low Geocoding Coverage',
      message: `Only ${geocodingPercentage}% of services have coordinates. Run systematic geocoding to improve map coverage.`,
      action: 'Start geocoding process'
    });
  } else if (geocodingPercentage < 80) {
    recommendations.push({
      type: 'warning',
      title: 'Moderate Geocoding Coverage',
      message: `${geocodingPercentage}% of services have coordinates. Consider running geocoding for the remaining ${missing} services.`,
      action: 'Geocode missing services'
    });
  } else {
    recommendations.push({
      type: 'success',
      title: 'Good Geocoding Coverage',
      message: `${geocodingPercentage}% of services have coordinates. Good coverage for map display.`,
      action: 'Monitor and maintain'
    });
  }
  
  // Check for states with poor coverage
  const poorStates = byState.filter(state => parseFloat(state.percentage) < 50 && state.total > 10);
  if (poorStates.length > 0) {
    recommendations.push({
      type: 'info',
      title: 'State-Specific Issues',
      message: `Low geocoding coverage in: ${poorStates.map(s => s.state).join(', ')}. Focus geocoding efforts on these states.`,
      action: 'Target state-specific geocoding'
    });
  }
  
  if (totalServices > 1000) {
    recommendations.push({
      type: 'info',
      title: 'Large Dataset',
      message: `${totalServices} total services. Consider batch processing with smaller batch sizes for better performance.`,
      action: 'Use batch processing'
    });
  }
  
  return recommendations;
}