/**
 * Vercel Serverless Function: Working Search API
 */

import { Pool } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'working-search-api' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
    const {
      q = '',
      category = '',
      region = '',
      minimum_age = '',
      maximum_age = '',
      youth_specific = false,
      indigenous_specific = false,
      limit = 20,
      offset = 0
    } = req.query;

    logger.info({ query: req.query }, 'Processing working search request');

    // Build the SQL query
    let sqlQuery = `
      SELECT 
        s.id,
        s.name,
        s.description,
        s.location,
        s.contact,
        s.eligibility,
        s.categories,
        s.age_range,
        s.youth_specific,
        s.indigenous_specific,
        s.created_at,
        s.updated_at,
        o.id as organization_id,
        o.name as organization_name,
        o.description as organization_description,
        o.abn as organization_abn
      FROM services s
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Add search filters
    if (q) {
      sqlQuery += ` AND (
        s.name ILIKE $${paramIndex} OR 
        s.description ILIKE $${paramIndex} OR 
        o.name ILIKE $${paramIndex}
      )`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      sqlQuery += ` AND s.categories @> $${paramIndex}::jsonb`;
      params.push(JSON.stringify([category]));
      paramIndex++;
    }

    if (region) {
      sqlQuery += ` AND s.location->>'state' = $${paramIndex}`;
      params.push(region);
      paramIndex++;
    }

    if (minimum_age) {
      sqlQuery += ` AND (s.age_range->>'min')::int >= $${paramIndex}`;
      params.push(parseInt(minimum_age));
      paramIndex++;
    }

    if (maximum_age) {
      sqlQuery += ` AND (s.age_range->>'max')::int <= $${paramIndex}`;
      params.push(parseInt(maximum_age));
      paramIndex++;
    }

    if (youth_specific === 'true') {
      sqlQuery += ` AND s.youth_specific = true`;
    }

    if (indigenous_specific === 'true') {
      sqlQuery += ` AND s.indigenous_specific = true`;
    }

    // Add ordering and pagination
    sqlQuery += ` ORDER BY s.name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    // Execute the query
    const result = await pool.query(sqlQuery, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE 1=1
    `;

    const countParams = [];
    let countParamIndex = 1;

    // Add the same filters to count query
    if (q) {
      countQuery += ` AND (
        s.name ILIKE $${countParamIndex} OR 
        s.description ILIKE $${countParamIndex} OR 
        o.name ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${q}%`);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND s.categories @> $${countParamIndex}::jsonb`;
      countParams.push(JSON.stringify([category]));
      countParamIndex++;
    }

    if (region) {
      countQuery += ` AND s.location->>'state' = $${countParamIndex}`;
      countParams.push(region);
      countParamIndex++;
    }

    if (minimum_age) {
      countQuery += ` AND (s.age_range->>'min')::int >= $${countParamIndex}`;
      countParams.push(parseInt(minimum_age));
      countParamIndex++;
    }

    if (maximum_age) {
      countQuery += ` AND (s.age_range->>'max')::int <= $${countParamIndex}`;
      countParams.push(parseInt(maximum_age));
      countParamIndex++;
    }

    if (youth_specific === 'true') {
      countQuery += ` AND s.youth_specific = true`;
    }

    if (indigenous_specific === 'true') {
      countQuery += ` AND s.indigenous_specific = true`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Format the services
    const services = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      location: row.location,
      contact: row.contact,
      eligibility: row.eligibility,
      categories: row.categories,
      age_range: row.age_range,
      youth_specific: row.youth_specific,
      indigenous_specific: row.indigenous_specific,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: {
        id: row.organization_id,
        name: row.organization_name,
        description: row.organization_description,
        abn: row.organization_abn
      }
    }));

    // Calculate pagination
    const currentLimit = parseInt(limit);
    const currentOffset = parseInt(offset);
    const pages = Math.ceil(total / currentLimit);
    const currentPage = Math.floor(currentOffset / currentLimit) + 1;

    res.json({
      services,
      total,
      pagination: {
        limit: currentLimit,
        offset: currentOffset,
        total,
        pages,
        current_page: currentPage,
        has_next: currentOffset + currentLimit < total,
        has_prev: currentOffset > 0
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Working search failed');
    
    // Return demo data if database is unavailable
    res.json({
      services: [
        {
          id: 'demo-1',
          name: 'Brisbane Youth Legal Service',
          description: 'Free legal advice and representation for young people aged 10-17 in Brisbane.',
          organization: { name: 'Youth Advocacy Centre' },
          location: { 
            city: 'Brisbane', 
            state: 'QLD', 
            suburb: 'South Brisbane',
            coordinates: { lat: -27.4678, lng: 153.0281 }
          },
          contact: { phone: { primary: '07 3356 1002' }, website: 'https://yac.net.au' },
          categories: ['legal_aid', 'youth_development'],
          youth_specific: true
        },
        {
          id: 'demo-2', 
          name: 'Headspace Sydney',
          description: 'Mental health support for young people aged 12-25 in Sydney CBD.',
          organization: { name: 'Headspace' },
          location: { 
            city: 'Sydney', 
            state: 'NSW', 
            suburb: 'Sydney CBD',
            coordinates: { lat: -33.8688, lng: 151.2093 }
          },
          contact: { phone: { primary: '02 9114 4100' }, website: 'https://headspace.org.au' },
          categories: ['mental_health', 'counselling'],
          youth_specific: true
        }
      ],
      total: 2,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: 2,
        pages: 1,
        current_page: 1,
        has_next: false,
        has_prev: false
      },
      demo_mode: true,
      message: 'Demo results - database connection failed'
    });
  }
}