-- Create test organization
INSERT INTO organizations (name, description, organization_type, data_source)
VALUES ('Brisbane Youth Support Services', 'Comprehensive youth support services across Brisbane', 'government', 'test_data')
RETURNING id;

-- Create test services (use the org ID from above)
INSERT INTO services (organization_id, name, description, categories, keywords, minimum_age, maximum_age, youth_specific, data_source, status)
VALUES 
((SELECT id FROM organizations WHERE name = 'Brisbane Youth Support Services' LIMIT 1),
 'Youth Legal Aid Brisbane',
 'Free legal assistance for young people aged 10-25 facing court proceedings. Services include representation, advice, and advocacy.',
 ARRAY['legal_aid', 'court_support', 'advocacy'],
 ARRAY['legal', 'court', 'lawyer', 'advocacy', 'rights', 'juvenile'],
 10, 25, true, 'test_data', 'active'),

((SELECT id FROM organizations WHERE name = 'Brisbane Youth Support Services' LIMIT 1),
 'Crisis Accommodation Service',
 'Emergency and short-term accommodation for homeless youth and those leaving detention facilities.',
 ARRAY['housing', 'crisis_support', 'reintegration'],
 ARRAY['accommodation', 'housing', 'emergency', 'shelter', 'homeless'],
 16, 25, true, 'test_data', 'active'),

((SELECT id FROM organizations WHERE name = 'Brisbane Youth Support Services' LIMIT 1),
 'Aboriginal Youth Mentoring Program',
 'Cultural mentoring and support program specifically designed for Aboriginal and Torres Strait Islander youth.',
 ARRAY['cultural_support', 'prevention', 'mentoring'],
 ARRAY['aboriginal', 'indigenous', 'mentoring', 'cultural', 'elders'],
 12, 21, true, 'test_data', 'active');

-- Create locations for services
INSERT INTO locations (service_id, name, address_1, city, postal_code, region, latitude, longitude)
VALUES 
((SELECT id FROM services WHERE name = 'Youth Legal Aid Brisbane' LIMIT 1),
 'Youth Legal Aid Brisbane - Brisbane Office',
 '123 Legal Street',
 'Brisbane', '4000', 'brisbane', -27.4698, 153.0251),

((SELECT id FROM services WHERE name = 'Crisis Accommodation Service' LIMIT 1),
 'Crisis Accommodation Service - Brisbane Office',
 '456 Support Avenue',
 'Brisbane', '4000', 'brisbane', -27.4698, 153.0251),

((SELECT id FROM services WHERE name = 'Aboriginal Youth Mentoring Program' LIMIT 1),
 'Aboriginal Youth Mentoring Program - Brisbane Office',
 '789 Cultural Road',
 'Brisbane', '4000', 'brisbane', -27.4698, 153.0251);

-- Create contacts for services
INSERT INTO contacts (service_id, name, phone, email)
VALUES 
((SELECT id FROM services WHERE name = 'Youth Legal Aid Brisbane' LIMIT 1),
 'Youth Legal Aid Brisbane Coordinator',
 '["(07) 3000 1234"]',
 'info@youthlegalaidbrisbane.qld.gov.au'),

((SELECT id FROM services WHERE name = 'Crisis Accommodation Service' LIMIT 1),
 'Crisis Accommodation Service Coordinator',
 '["(07) 3000 5678"]',
 'info@crisisaccommodationservice.qld.gov.au'),

((SELECT id FROM services WHERE name = 'Aboriginal Youth Mentoring Program' LIMIT 1),
 'Aboriginal Youth Mentoring Program Coordinator',
 '["(07) 3000 9012"]',
 'info@aboriginalyouthmentoringprogram.qld.gov.au');

-- Record as scraping job
INSERT INTO scraping_jobs (source_name, source_url, job_type, status, pages_scraped, services_found, errors_count, started_at, completed_at)
VALUES ('manual_sql_creation', '/create-services-sql.sql', 'manual', 'completed', 1, 3, 0, NOW(), NOW());