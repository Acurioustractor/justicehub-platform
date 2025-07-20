/**
 * Database Manager
 * 
 * Handles all database operations for the Youth Justice Service Finder
 * including service storage, querying, and data management.
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

export class DatabaseManager {
    constructor(config = {}) {
        this.config = {
            connectionString: config.connectionString || process.env.DATABASE_URL,
            ssl: config.ssl !== false,
            max: config.poolSize || 20,
            idleTimeoutMillis: config.idleTimeout || 30000,
            connectionTimeoutMillis: config.connectionTimeout || 2000,
            ...config
        };
        
        this.pool = new Pool(this.config);
        this.isConnected = false;
        
        // Set up error handling
        this.pool.on('error', (err) => {
            console.error('Database pool error:', err);
        });
    }
    
    /**
     * Initialize database connection and create tables if needed
     */
    async initialize() {
        try {
            console.log('Initializing database connection...');
            
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            console.log('Database connection established');
            this.isConnected = true;
            
            // Create tables if they don't exist (development mode)
            if (process.env.NODE_ENV === 'development') {
                await this.createTablesIfNotExists();
            }
            
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create database tables (for development)
     */
    async createTablesIfNotExists() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Enable required extensions
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            await client.query('CREATE EXTENSION IF NOT EXISTS "postgis"');
            
            // Create services table
            await client.query(`
                CREATE TABLE IF NOT EXISTS services (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
                    
                    completeness_score DECIMAL(3,2) CHECK (completeness_score BETWEEN 0 AND 1),
                    verification_status VARCHAR(20) DEFAULT 'unverified',
                    verification_score INTEGER CHECK (verification_score BETWEEN 0 AND 100),
                    
                    youth_specific BOOLEAN DEFAULT false,
                    indigenous_specific BOOLEAN DEFAULT false,
                    
                    data_source VARCHAR(100) NOT NULL,
                    source_id VARCHAR(100),
                    source_url TEXT,
                    
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_verified TIMESTAMP WITH TIME ZONE,
                    
                    search_vector tsvector
                )
            `);
            
            // Create organizations table
            await client.query(`
                CREATE TABLE IF NOT EXISTS organizations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    organization_type VARCHAR(50),
                    legal_status VARCHAR(100),
                    
                    abn VARCHAR(11),
                    acn VARCHAR(9),
                    tax_id VARCHAR(50),
                    website_url TEXT,
                    
                    data_source VARCHAR(100) NOT NULL,
                    verification_status VARCHAR(20) DEFAULT 'unverified',
                    
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            
            // Create locations table
            await client.query(`
                CREATE TABLE IF NOT EXISTS locations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                    
                    name VARCHAR(255),
                    address_1 VARCHAR(255),
                    address_2 VARCHAR(255),
                    city VARCHAR(100),
                    state_province VARCHAR(50),
                    postal_code VARCHAR(20),
                    country VARCHAR(2) DEFAULT 'AU',
                    
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    region VARCHAR(50),
                    
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            
            // Create contacts table
            await client.query(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                    
                    name VARCHAR(255),
                    email VARCHAR(255),
                    phone JSONB,
                    
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            
            // Create service_categories table
            await client.query(`
                CREATE TABLE IF NOT EXISTS service_categories (
                    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                    category VARCHAR(50) NOT NULL,
                    is_primary BOOLEAN DEFAULT false,
                    
                    PRIMARY KEY (service_id, category)
                )
            `);
            
            // Create indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_services_youth ON services(youth_specific)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_services_source ON services(data_source)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_locations_service ON locations(service_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts(service_id)');
            
            await client.query('COMMIT');
            console.log('Database tables created successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating tables:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Store a complete service with all related data
     * @param {Object} service - Service object with locations, contacts, etc.
     * @returns {String} Service ID
     */
    async storeService(service) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Insert or update organization
            let organizationId = null;
            if (service.organization) {
                const orgResult = await client.query(`
                    INSERT INTO organizations (
                        name, description, organization_type, legal_status,
                        abn, acn, tax_id, website_url, data_source, verification_status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (name, data_source) 
                    DO UPDATE SET
                        description = EXCLUDED.description,
                        updated_at = NOW()
                    RETURNING id
                `, [
                    service.organization.name,
                    service.organization.description,
                    service.organization.organization_type,
                    service.organization.legal_status,
                    service.organization.abn || service.organization.tax_id,
                    service.organization.acn,
                    service.organization.tax_id,
                    service.organization.url,
                    service.data_source,
                    service.organization.verification_status
                ]);
                
                organizationId = orgResult.rows[0].id;
            }
            
            // 2. Insert or update service
            const serviceResult = await client.query(`
                INSERT INTO services (
                    id, name, description, status, completeness_score, 
                    verification_status, verification_score, youth_specific, 
                    indigenous_specific, data_source, source_id, source_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (name, data_source)
                DO UPDATE SET
                    description = EXCLUDED.description,
                    status = EXCLUDED.status,
                    completeness_score = EXCLUDED.completeness_score,
                    updated_at = NOW()
                RETURNING id
            `, [
                service.id || crypto.randomUUID(),
                service.name,
                service.description,
                service.status || 'active',
                service.completeness_score,
                service.verification_status,
                service.verification_score,
                service.youth_specific || false,
                service.indigenous_specific || false,
                service.data_source,
                service.source_id,
                service.source_url
            ]);
            
            const serviceId = serviceResult.rows[0].id;
            
            // 3. Insert categories
            if (service.categories && service.categories.length > 0) {
                // Clear existing categories
                await client.query('DELETE FROM service_categories WHERE service_id = $1', [serviceId]);
                
                // Insert new categories
                for (const [index, category] of service.categories.entries()) {
                    await client.query(`
                        INSERT INTO service_categories (service_id, category, is_primary)
                        VALUES ($1, $2, $3)
                    `, [serviceId, category, index === 0]);
                }
            }
            
            // 4. Insert locations
            if (service.locations && service.locations.length > 0) {
                // Clear existing locations
                await client.query('DELETE FROM locations WHERE service_id = $1', [serviceId]);
                
                // Insert new locations
                for (const location of service.locations) {
                    await client.query(`
                        INSERT INTO locations (
                            service_id, name, address_1, address_2, city, 
                            state_province, postal_code, country, latitude, 
                            longitude, region
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    `, [
                        serviceId,
                        location.name,
                        location.address_1,
                        location.address_2,
                        location.city,
                        location.state_province,
                        location.postal_code,
                        location.country || 'AU',
                        location.latitude,
                        location.longitude,
                        location.region
                    ]);
                }
            }
            
            // 5. Insert contacts
            if (service.contacts && service.contacts.length > 0) {
                // Clear existing contacts
                await client.query('DELETE FROM contacts WHERE service_id = $1', [serviceId]);
                
                // Insert new contacts
                for (const contact of service.contacts) {
                    await client.query(`
                        INSERT INTO contacts (service_id, name, email, phone)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        serviceId,
                        contact.name,
                        contact.email,
                        JSON.stringify(contact.phone || [])
                    ]);
                }
            }
            
            await client.query('COMMIT');
            return serviceId;
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error storing service:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Search services with filters
     * @param {Object} filters - Search filters
     * @returns {Array} Array of services
     */
    async searchServices(filters = {}) {
        const {
            query,
            state,
            category,
            youthSpecific,
            limit = 50,
            offset = 0,
            orderBy = 'completeness_score DESC'
        } = filters;
        
        let whereConditions = ['s.status = $1'];
        let params = ['active'];
        let paramCount = 1;
        
        // Text search
        if (query) {
            paramCount++;
            whereConditions.push(`s.search_vector @@ plainto_tsquery('english', $${paramCount})`);
            params.push(query);
        }
        
        // State filter
        if (state) {
            paramCount++;
            whereConditions.push(`l.state_province = $${paramCount}`);
            params.push(state);
        }
        
        // Category filter
        if (category) {
            paramCount++;
            whereConditions.push(`sc.category = $${paramCount}`);
            params.push(category);
        }
        
        // Youth specific filter
        if (youthSpecific !== undefined) {
            paramCount++;
            whereConditions.push(`s.youth_specific = $${paramCount}`);
            params.push(youthSpecific);
        }
        
        // Add limit and offset
        paramCount++;
        const limitParam = paramCount;
        paramCount++;
        const offsetParam = paramCount;
        params.push(limit, offset);
        
        const sql = `
            SELECT DISTINCT
                s.*,
                json_agg(DISTINCT jsonb_build_object(
                    'id', l.id,
                    'name', l.name,
                    'address_1', l.address_1,
                    'address_2', l.address_2,
                    'city', l.city,
                    'state_province', l.state_province,
                    'postal_code', l.postal_code,
                    'latitude', l.latitude,
                    'longitude', l.longitude,
                    'region', l.region
                )) FILTER (WHERE l.id IS NOT NULL) as locations,
                json_agg(DISTINCT jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'email', c.email,
                    'phone', c.phone
                )) FILTER (WHERE c.id IS NOT NULL) as contacts,
                array_agg(DISTINCT sc.category) FILTER (WHERE sc.category IS NOT NULL) as categories
            FROM services s
            LEFT JOIN locations l ON s.id = l.service_id
            LEFT JOIN contacts c ON s.id = c.service_id
            LEFT JOIN service_categories sc ON s.id = sc.service_id
            WHERE ${whereConditions.join(' AND ')}
            GROUP BY s.id
            ORDER BY ${orderBy}
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `;
        
        const result = await this.pool.query(sql, params);
        return result.rows;
    }
    
    /**
     * Get service statistics
     * @returns {Object} Statistics object
     */
    async getStatistics() {
        const stats = await this.pool.query(`
            SELECT 
                COUNT(*) as total_services,
                COUNT(*) FILTER (WHERE status = 'active') as active_services,
                COUNT(*) FILTER (WHERE youth_specific = true) as youth_specific_services,
                COUNT(DISTINCT data_source) as data_sources,
                AVG(completeness_score) as avg_quality_score,
                COUNT(DISTINCT l.state_province) as states_covered
            FROM services s
            LEFT JOIN locations l ON s.id = l.service_id
        `);
        
        return stats.rows[0];
    }
    
    /**
     * Get services by data source
     * @param {String} dataSource - Data source name
     * @returns {Array} Services from that source
     */
    async getServicesBySource(dataSource) {
        const result = await this.pool.query(`
            SELECT s.*, 
                   COUNT(l.id) as location_count,
                   COUNT(c.id) as contact_count
            FROM services s
            LEFT JOIN locations l ON s.id = l.service_id
            LEFT JOIN contacts c ON s.id = c.service_id
            WHERE s.data_source = $1
            GROUP BY s.id
            ORDER BY s.updated_at DESC
        `, [dataSource]);
        
        return result.rows;
    }
    
    /**
     * Bulk upsert services (for data pipeline)
     * @param {Array} services - Array of service objects
     * @returns {Object} Results summary
     */
    async bulkUpsertServices(services) {
        if (!services || services.length === 0) {
            return { inserted: 0, updated: 0, errors: 0 };
        }
        
        let inserted = 0;
        let updated = 0;
        let errors = 0;
        
        for (const service of services) {
            try {
                await this.storeService(service);
                // Simple heuristic: if service has an ID, it's likely an update
                if (service.id) {
                    updated++;
                } else {
                    inserted++;
                }
            } catch (error) {
                errors++;
                console.error(`Error storing service ${service.name}:`, error.message);
            }
        }
        
        return { inserted, updated, errors, total: services.length };
    }
    
    /**
     * Clean up old or invalid data
     * @param {Object} options - Cleanup options
     */
    async cleanup(options = {}) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Remove services with very low quality scores
            if (options.removeLowestQuality) {
                const deleteResult = await client.query(`
                    DELETE FROM services 
                    WHERE completeness_score < 0.2 
                    AND status = 'active'
                `);
                console.log(`Removed ${deleteResult.rowCount} low-quality services`);
            }
            
            // Remove orphaned records
            await client.query(`
                DELETE FROM locations 
                WHERE service_id NOT IN (SELECT id FROM services)
            `);
            
            await client.query(`
                DELETE FROM contacts 
                WHERE service_id NOT IN (SELECT id FROM services)
            `);
            
            await client.query(`
                DELETE FROM service_categories 
                WHERE service_id NOT IN (SELECT id FROM services)
            `);
            
            await client.query('COMMIT');
            console.log('Database cleanup completed');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Cleanup failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Close database connections
     */
    async close() {
        await this.pool.end();
        this.isConnected = false;
        console.log('Database connections closed');
    }
    
    /**
     * Health check
     * @returns {Boolean} True if healthy
     */
    async healthCheck() {
        try {
            const result = await this.pool.query('SELECT NOW() as current_time');
            return {
                healthy: true,
                timestamp: result.rows[0].current_time,
                totalConnections: this.pool.totalCount,
                idleConnections: this.pool.idleCount,
                waitingConnections: this.pool.waitingCount
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }
}

export default DatabaseManager;