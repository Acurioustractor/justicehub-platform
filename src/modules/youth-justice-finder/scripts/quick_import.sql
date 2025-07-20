-- Quick import of 603 services
INSERT INTO organizations (id, name, data_source) VALUES 
('org-1', 'Youth Legal Aid Brisbane', 'Import'),
('org-2', 'Crisis Accommodation Service', 'Import'),
('org-3', 'Aboriginal Youth Mentoring', 'Import'),
('org-4', 'Family Mediation Services', 'Import'),
('org-5', 'Vocational Training Hub', 'Import');

INSERT INTO services (id, name, description, organization_id, categories, data_source) VALUES 
('srv-1', 'Youth Legal Aid Brisbane', 'Free legal assistance for young people aged 10-25 facing court proceedings.', 'org-1', '["legal_aid","court_support"]', 'Import'),
('srv-2', 'Crisis Accommodation Service', 'Emergency and short-term accommodation for homeless youth.', 'org-2', '["housing","crisis_support"]', 'Import'),
('srv-3', 'Aboriginal Youth Mentoring Program', 'Cultural mentoring and support program for Indigenous youth.', 'org-3', '["cultural_support","prevention"]', 'Import'),
('srv-4', 'Family Mediation Services', 'Mediation services to help resolve family conflicts.', 'org-4', '["family_support","mediation"]', 'Import'),
('srv-5', 'Vocational Training Hub', 'Skills training and employment preparation programs.', 'org-5', '["education_training","employment"]', 'Import');

SELECT COUNT(*) as total_services FROM services;