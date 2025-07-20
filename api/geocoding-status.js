/**
 * Vercel Serverless Function: Geocoding Status
 */

import { Pool } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'geocoding-status-api' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get geocoding status and progress
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
    // Check geocoding status and recent activity
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN location->'coordinates'->>'geocoded_at' IS NOT NULL THEN 1 END) as recently_geocoded,
        COUNT(CASE WHEN 
          (location->'coordinates'->>'lat') IS NOT NULL 
          AND (location->'coordinates'->>'lng') IS NOT NULL 
          AND (location->'coordinates'->>'lat')::text != ''
          AND (location->'coordinates'->>'lng')::text != ''
        THEN 1 END) as total_geocoded,
        MAX(CASE WHEN location->'coordinates'->>'geocoded_at' IS NOT NULL 
          THEN (location->'coordinates'->>'geocoded_at')::timestamp 
          ELSE NULL END) as last_geocoded
      FROM services
      WHERE location IS NOT NULL
    `;
    
    const result = await pool.query(query);
    const status = result.rows[0];
    
    // Get recent geocoding activity (last 24 hours)
    const recentQuery = `
      SELECT 
        COUNT(*) as recent_count,
        MIN((location->'coordinates'->>'geocoded_at')::timestamp) as earliest_recent,
        MAX((location->'coordinates'->>'geocoded_at')::timestamp) as latest_recent
      FROM services
      WHERE 
        location IS NOT NULL 
        AND location->'coordinates'->>'geocoded_at' IS NOT NULL
        AND (location->'coordinates'->>'geocoded_at')::timestamp > NOW() - INTERVAL '24 hours'
    `;
    
    const recentResult = await pool.query(recentQuery);
    const recentActivity = recentResult.rows[0];
    
    res.json({
      success: true,
      status: {
        isRunning: false, // Simplified - would need process tracking for real implementation
        totalServices: parseInt(status.total),
        totalGeocoded: parseInt(status.total_geocoded),
        recentlyGeocoded: parseInt(status.recently_geocoded),
        lastGeocodedAt: status.last_geocoded,
        recentActivity: {
          count: parseInt(recentActivity.recent_count),
          earliest: recentActivity.earliest_recent,
          latest: recentActivity.latest_recent
        },
        progress: {
          completed: parseInt(status.total_geocoded),
          total: parseInt(status.total),
          percentage: status.total > 0 ? (status.total_geocoded / status.total * 100).toFixed(1) : '0'
        }
      }
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get geocoding status');
    res.status(500).json({
      success: false,
      error: 'Failed to get geocoding status',
      details: error.message
    });
  }
}