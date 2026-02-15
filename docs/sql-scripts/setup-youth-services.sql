-- Youth Justice Service Finder Database Setup
-- Generated: 2025-07-20T06:21:17.898Z


-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[],
  keywords TEXT[],
  minimum_age INTEGER,
  maximum_age INTEGER,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  name TEXT NOT NULL,
  website TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table  
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  street_address TEXT,
  locality TEXT,
  region TEXT,
  state TEXT DEFAULT 'QLD',
  postcode TEXT,
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project TEXT DEFAULT 'youth-justice-service-finder',
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_type TEXT DEFAULT 'general', -- general, phone, email, website
  phone TEXT,
  email TEXT,
  website TEXT,
  hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_project ON services(project);
CREATE INDEX IF NOT EXISTS idx_services_categories ON services USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_organizations_project ON organizations(project);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
CREATE INDEX IF NOT EXISTS idx_contacts_project ON contacts(project);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY IF NOT EXISTS "Public read access for services" ON services FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for locations" ON locations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for contacts" ON contacts FOR SELECT USING (true);





      INSERT INTO services (id, project, name, description, categories, keywords, minimum_age, maximum_age, organization_id) VALUES 
      
      ('e54877ab-0f27-4280-baa3-96b0b76fcaf3', 'youth-justice-service-finder', 'ATSILS Youth Legal Service - Brisbane', 
       'Free culturally appropriate legal services for Aboriginal and Torres Strait Islander young people. Services include:
- Criminal law representation in Children''s Court
- Bail applications and support
- Legal advice for police matters
- Child protection representation
- Victims of crime assistance
- Stolen Wages applications
- Family law matters
- Anti-discrimination matters

Culturally safe service with Aboriginal and Torres Strait Islander lawyers and support workers. Field officers provide support beyond legal representation.', 
       ARRAY['legal_aid','court_support','advocacy','cultural_support'],
       ARRAY['aboriginal','torres strait islander','indigenous','legal','court','cultural','youth'],
       NULL, NULL,
       NULL)
    ,
      ('56089fea-e9dc-4215-bd09-a3e2f01b4021', 'youth-justice-service-finder', 'ATSILS Youth Legal Service - Cairns', 
       'Culturally appropriate legal support for Aboriginal and Torres Strait Islander youth in Far North Queensland. Services include court representation, bail support, and connection to cultural programs.', 
       ARRAY['legal_aid','court_support','cultural_support'],
       ARRAY['aboriginal','torres strait islander','legal','cairns','youth'],
       NULL, NULL,
       NULL)
    ,
      ('abc22ff8-8e88-4903-a2a4-8103255b3b55', 'youth-justice-service-finder', 'ATSILS Youth Legal Service - Townsville', 
       'Free legal services for Aboriginal and Torres Strait Islander young people in North Queensland. Includes criminal law, child protection, and cultural support services.', 
       ARRAY['legal_aid','court_support','cultural_support'],
       ARRAY['aboriginal','torres strait islander','legal','townsville','youth'],
       NULL, NULL,
       NULL)
    ,
      ('56cb151f-e3b7-4486-84d3-42b231bd492b', 'youth-justice-service-finder', 'Aboriginal & Torres Strait Islander Youth Health Service', 
       'Holistic health and wellbeing services for Aboriginal and Torres Strait Islander young people. Services include:
- Youth health checks and immunizations
- Mental health and social emotional wellbeing support
- Sexual health education and services
- Drug and alcohol programs
- Nutrition and healthy lifestyle programs
- Cultural activities and camps
- Deadly Choices program
- School-based health promotion

Bulk billing available. No referral needed. Transport assistance available.', 
       ARRAY['mental_health','substance_abuse','health','cultural_support'],
       ARRAY['aboriginal','torres strait islander','health','youth','mental health','cultural'],
       NULL, NULL,
       NULL)
    ,
      ('daf88bf5-1882-48b4-a83b-065566358fe6', 'youth-justice-service-finder', 'Murri Youth Diversion Program - Logan', 
       'Culturally appropriate diversion program for Aboriginal and Torres Strait Islander young people. Services include:
- Pre and post court support
- Cultural mentoring and activities
- Connection to Elders
- Bush camps and cultural healing
- Education and employment pathways
- Family support and mediation
- Substance abuse counselling
- Life skills development

Program aims to reduce reoffending through cultural connection and intensive support.', 
       ARRAY['diversion','cultural_support','case_management','mentoring'],
       ARRAY['murri','aboriginal','diversion','cultural','youth','logan'],
       NULL, NULL,
       NULL)
    ,
      ('d70aa911-69e6-4aa8-bf8b-6f897b08e1f8', 'youth-justice-service-finder', 'Murri Youth Homelessness Service', 
       'Specialist homelessness support for Aboriginal and Torres Strait Islander young people aged 12-21. Services include:
- Emergency accommodation
- Transitional housing support
- Case management
- Cultural activities and connection
- Education and training support
- Health and wellbeing programs
- Family reconciliation
- Independent living skills

Culturally safe service with Aboriginal workers and regular Elder involvement.', 
       ARRAY['housing','case_management','cultural_support'],
       ARRAY['murri','aboriginal','homeless','housing','youth','accommodation'],
       NULL, NULL,
       NULL)
    ,
      ('7406450e-33d0-4fdc-9bbd-bd625e3d35f3', 'youth-justice-service-finder', 'Strong Young Mums Program', 
       'Support program for young Aboriginal and Torres Strait Islander mothers aged 14-25. Services include:
- Antenatal and postnatal care
- Parenting support and education
- Baby health checks
- Breastfeeding support
- Cultural activities for mums and bubs
- Playgroups and social support
- Connection to childcare and education
- Housing and Centrelink assistance

Home visits available. Partner and family involvement encouraged.', 
       ARRAY['family_support','health','cultural_support'],
       ARRAY['aboriginal','torres strait islander','young mothers','parenting','health'],
       NULL, NULL,
       NULL)
    ,
      ('f0bab27c-ae4b-448b-b4fa-403938604987', 'youth-justice-service-finder', '1800RESPECT - Youth Sexual Assault and Family Violence Support', 
       '24/7 national sexual assault, domestic and family violence counselling service with specialist youth support. Services include:
- Crisis counselling for sexual assault
- Domestic and family violence support
- Safety planning for young people
- Support for young people who have experienced abuse
- Information about consent and healthy relationships
- Referrals to local youth services
- Support for friends and family
- Interpreter service available

Free, confidential service available 24/7. Trained counsellors understand issues facing young people. Online chat available.', 
       ARRAY['crisis_support','family_support','mental_health'],
       ARRAY['sexual assault','family violence','domestic violence','crisis','abuse','counselling'],
       NULL, NULL,
       NULL)
    ,
      ('5723f200-1816-417e-bfed-105b06d29c67', 'youth-justice-service-finder', 'Brisbane Youth Service - Crisis Accommodation', 
       'Emergency and crisis accommodation for young people aged 12-25 who are homeless or at risk. Services include:
- 24/7 crisis accommodation
- Emergency beds (up to 3 nights)
- Medium-term accommodation (up to 3 months)
- Meals and basic necessities
- Case management and support planning
- Health services on-site
- Education and employment support
- Life skills programs
- Referrals to permanent housing

Drop-in centre open 7 days. No referral needed. Priority given to young people escaping violence or with nowhere safe to sleep.', 
       ARRAY['housing','crisis_support','case_management'],
       ARRAY['homeless','crisis','accommodation','emergency','housing','shelter'],
       NULL, NULL,
       NULL)
    ,
      ('c381a9d3-eccf-4d51-b973-282a98e92eaa', 'youth-justice-service-finder', 'Brisbane Youth Service - Mobile Support Team', 
       'Outreach service finding and supporting young people experiencing homelessness. Services include:
- Street outreach in Brisbane CBD and surrounds
- Mobile support across greater Brisbane
- Emergency relief (food, clothing, hygiene packs)
- Transport to safe accommodation
- Connection to health services
- Advocacy and crisis intervention
- Flexible support based on young person''s needs
- After-hours response for crisis situations

Team operates 7 days a week including evenings. Can be contacted through BYS main number.', 
       ARRAY['crisis_support','housing','outreach'],
       ARRAY['outreach','mobile','homeless','street','crisis','emergency'],
       NULL, NULL,
       NULL)
    ,
      ('412286ef-47a3-4c53-b775-466eb2a78552', 'youth-justice-service-finder', 'Kids Helpline - 24/7 Phone and Online Counselling', 
       'Free, confidential 24/7 phone and online counselling service for young people aged 5-25. Services include:
- Crisis support and suicide prevention
- Mental health and emotional wellbeing support
- Family and relationship issues
- Bullying and cyberbullying support
- School and study stress
- Alcohol and drug concerns
- Sexual health and identity
- Self-harm and eating disorders
- Abuse and violence support

Professional counsellors available 24/7 by phone (1800 55 1800), WebChat, or email. No issue too big or small.', 
       ARRAY['mental_health','crisis_support','family_support'],
       ARRAY['crisis','counselling','helpline','mental health','suicide','emergency','24/7'],
       NULL, NULL,
       NULL)
    ,
      ('79a2218e-225c-4a1c-9e1f-3176248fb071', 'youth-justice-service-finder', 'Kids Helpline @ School Program', 
       'Free counselling sessions delivered in Queensland schools. Services include:
- Individual counselling sessions at school
- Group sessions on mental health topics
- Crisis response for schools
- Support for students affected by critical incidents
- Referrals to other services
- Follow-up support

Available to primary and secondary schools across Queensland. Schools can request this service for students who need extra support.', 
       ARRAY['mental_health','education_training'],
       ARRAY['school','counselling','mental health','students'],
       NULL, NULL,
       NULL)
    ,
      ('5765731d-b295-4c44-8dcd-e66597512400', 'youth-justice-service-finder', 'Yarning Circle - Aboriginal and Torres Strait Islander Support Line', 
       'Culturally appropriate crisis support through 1800RESPECT for Aboriginal and Torres Strait Islander people affected by family violence and sexual assault. Services include:
- Yarning with Aboriginal and Torres Strait Islander counsellors
- Cultural safety and understanding
- Support in language where available
- Connection to local Aboriginal services
- Support for stolen generations survivors
- Family violence and sexual assault counselling
- Safety planning with cultural considerations

Available 24/7 through 1800RESPECT. Ask to speak with an Aboriginal or Torres Strait Islander counsellor.', 
       ARRAY['crisis_support','cultural_support','family_support'],
       ARRAY['aboriginal','torres strait islander','yarning','crisis','family violence','cultural'],
       NULL, NULL,
       NULL)
    ,
      ('000a0eef-bec2-4594-b4b8-caf95cbae372', 'youth-justice-service-finder', 'Brisbane Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('c5ba1a0c-e5a3-444e-950a-e89f6d983a1f', 'youth-justice-service-finder', 'Gold Coast Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('40c2925f-9cc9-4bbd-b3c8-f69f993d939f', 'youth-justice-service-finder', 'Legal Aid Queensland - Townsville', 
       'Legal representation for young people in criminal matters, with specialist youth lawyers available for serious charges and Children''s Court matters.', 
       ARRAY['legal_aid','court_support'],
       ARRAY['legal_aid','court_support'],
       NULL, NULL,
       NULL)
    ,
      ('416a4419-b8b4-4133-b681-fa084ae00071', 'youth-justice-service-finder', 'Townsville Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('5de3b602-779c-4298-a25b-a3bdcab395c8', 'youth-justice-service-finder', 'Youth Advocacy Centre', 
       'Free advocacy and support for young people in contact with youth justice, child protection, education, and housing systems. Provides individual advocacy and systemic reform.', 
       ARRAY['advocacy','legal_aid','housing','education_training'],
       ARRAY['advocacy','legal_aid','housing','education_training'],
       NULL, NULL,
       NULL)
    ,
      ('dee945f6-a476-410f-8514-4432ef816d74', 'youth-justice-service-finder', 'Youth Legal Service - Brisbane', 
       'Free legal advice and representation for young people under 18. Specializes in criminal law, child protection matters, and education law. Available for court representation and police interviews.', 
       ARRAY['legal_aid','advocacy','court_support'],
       ARRAY['legal_aid','advocacy','court_support'],
       NULL, NULL,
       NULL)
    ,
      ('8b32f943-dd6e-4037-b726-25d03b8f5e63', 'youth-justice-service-finder', 'headspace Brisbane', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('dd3872a2-a186-4311-8e4f-f6194bce36e6', 'youth-justice-service-finder', 'headspace Cairns', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('71a6bb9d-f562-4a55-9594-5ade1c9fc013', 'youth-justice-service-finder', 'headspace Bundaberg', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('47f3493c-0ade-42b7-9054-740d33a4bcc4', 'youth-justice-service-finder', 'headspace Caboolture', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('73ab1521-913d-48e8-869f-0969b75ae080', 'youth-justice-service-finder', 'headspace Fraser Coast', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('3eca9f64-9a48-48ef-a109-6089b400142c', 'youth-justice-service-finder', 'headspace Gladstone', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('d52c3019-e32d-41cd-adea-8e7be2540255', 'youth-justice-service-finder', 'headspace Gold Coast', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('e9489b4b-2f2e-4a4e-bc61-371b70a6edaa', 'youth-justice-service-finder', 'headspace Ipswich', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('0c59f0a0-a88d-46f1-8e5e-aa2b7ea73635', 'youth-justice-service-finder', 'headspace Logan', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('cbaf3622-a641-4990-855a-485c81009547', 'youth-justice-service-finder', 'headspace Mackay', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('04617f25-2712-4a6a-b551-3deff7a75671', 'youth-justice-service-finder', 'headspace Mount Isa', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('7bb75d21-960b-4831-a64e-093fab94462b', 'youth-justice-service-finder', 'headspace Rockhampton', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('615734c5-c42b-4112-8079-08de879a69d7', 'youth-justice-service-finder', 'headspace Sunshine Coast', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('e15ebb44-9cb0-47f4-a4c1-6ceeb3927351', 'youth-justice-service-finder', 'headspace Toowoomba', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('f5273448-5fc9-4e03-88ff-e79fe1759f20', 'youth-justice-service-finder', 'headspace Townsville', 
       'Free mental health and wellbeing support for young people aged 12-25. Services include:
- Mental health support and counselling
- Physical and sexual health advice
- Alcohol and other drug services  
- Work, school and study support
- General health services
- Online and phone support available
- No referral needed - young people can self-refer
- Bulk billing available for most services', 
       ARRAY['mental_health','substance_abuse','education_training'],
       ARRAY['mental health','counselling','psychology','youth','wellbeing','drug','alcohol','education','employment'],
       NULL, NULL,
       NULL)
    ,
      ('4523601d-3bc5-4fc7-8e44-ad67a225eb95', 'youth-justice-service-finder', 'Legal Aid Queensland - Brisbane - Youth Legal Service', 
       'Free legal help for young people under 18 at the Brisbane office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('28f288e2-7ec1-427e-89c1-25481a68b266', 'youth-justice-service-finder', 'Legal Aid Queensland - Bundaberg - Youth Legal Service', 
       'Free legal help for young people under 18 at the Bundaberg office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('a6d89e3c-b2a8-4874-8675-f416bc002c34', 'youth-justice-service-finder', 'Legal Aid Queensland - Caboolture - Youth Legal Service', 
       'Free legal help for young people under 18 at the Caboolture office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('8c1f1065-0b86-453b-b04e-c4558d3704c0', 'youth-justice-service-finder', 'Legal Aid Queensland - Cairns - Youth Legal Service', 
       'Free legal help for young people under 18 at the Cairns office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('b776e8b8-1ced-4398-a51e-c7a83b78af63', 'youth-justice-service-finder', 'Legal Aid Queensland - Gold Coast - Youth Legal Service', 
       'Free legal help for young people under 18 at the Gold Coast office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('e2591fa8-856c-49be-9444-4aa26911ba57', 'youth-justice-service-finder', 'Legal Aid Queensland - Inala - Youth Legal Service', 
       'Free legal help for young people under 18 at the Inala office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('ce285aed-e304-4cfd-b435-3046dfd7762d', 'youth-justice-service-finder', 'Legal Aid Queensland - Ipswich - Youth Legal Service', 
       'Free legal help for young people under 18 at the Ipswich office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('6550b78c-4b4d-4467-b0df-abfdb3b9f508', 'youth-justice-service-finder', 'Legal Aid Queensland - Mackay - Youth Legal Service', 
       'Free legal help for young people under 18 at the Mackay office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('0c70e4d8-bfbd-469e-8986-dbfe95c7a520', 'youth-justice-service-finder', 'Legal Aid Queensland - Mount Isa - Youth Legal Service', 
       'Free legal help for young people under 18 at the Mount Isa office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('a1ca7bf6-fe63-4930-9593-20cabacb6733', 'youth-justice-service-finder', 'Legal Aid Queensland - Rockhampton - Youth Legal Service', 
       'Free legal help for young people under 18 at the Rockhampton office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('e182b0a3-5a6f-41cf-87ef-637fb4eb07b7', 'youth-justice-service-finder', 'Legal Aid Queensland - Sunshine Coast - Youth Legal Service', 
       'Free legal help for young people under 18 at the Sunshine Coast office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('0d83d34e-ad46-4852-9c3e-44081a97204b', 'youth-justice-service-finder', 'Legal Aid Queensland - Toowoomba - Youth Legal Service', 
       'Free legal help for young people under 18 at the Toowoomba office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('9b40bcaf-313f-49eb-9f29-b64075d57ebe', 'youth-justice-service-finder', 'Legal Aid Queensland - Townsville - Youth Legal Service', 
       'Free legal help for young people under 18 at the Townsville office. Services include:
- Criminal law advice and representation
- Children''s Court appearances  
- Police interview assistance
- Bail applications
- Child protection matters
- School suspensions and exclusions
- Fines and debt issues

Specialist youth lawyers available. No appointment needed for urgent matters. Phone advice available on 1300 651 188.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth','children''s court','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('11945b7e-9586-4bc0-aeec-74cf434c9df5', 'youth-justice-service-finder', 'Youth Legal Service - Legal Aid Queensland', 
       'Free specialist legal help for young people under 18 years. Services include:
- Criminal law representation in Children''s Court
- Legal advice for police interviews
- Bail applications and variations
- Representation for serious charges
- Child protection matters
- Education law (suspensions and exclusions)  
- Fines and SPER debt
- Victims of crime assistance
- Family law issues affecting young people

The Youth Legal Service has specialist youth lawyers who understand the unique needs of young people in the justice system. Interpreters available. Confidential service.', 
       ARRAY['legal_aid','court_support','advocacy'],
       ARRAY['legal aid','lawyer','court','criminal','youth justice','children''s court','bail','free legal help'],
       NULL, NULL,
       NULL)
    ,
      ('d52ca158-3aaa-408b-83dc-30a0ae010faf', 'youth-justice-service-finder', 'PCYC Beenleigh', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('24164194-95f5-49d7-838f-8afb19cb42e0', 'youth-justice-service-finder', 'PCYC Brisbane City', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('320e6c9e-0a65-485a-a902-7290de1f7d82', 'youth-justice-service-finder', 'PCYC Bundaberg', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('5c051304-e9d4-4980-badd-a28d67db192d', 'youth-justice-service-finder', 'PCYC Cairns', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('a9da6418-b3cc-42ee-9d09-fbf1e38b701a', 'youth-justice-service-finder', 'PCYC Gladstone', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('41a7c061-6f35-443e-b02f-f505ae6f0899', 'youth-justice-service-finder', 'PCYC Gold Coast', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('99b40d3f-d001-4074-b7ab-9be89475504b', 'youth-justice-service-finder', 'PCYC Ipswich', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('63bc19c8-6a2c-43a6-8e04-86943e034338', 'youth-justice-service-finder', 'PCYC Mackay', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('42e9ff0d-7415-48ad-9d5b-1c545be6d913', 'youth-justice-service-finder', 'PCYC Mount Isa', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('cea1104e-9f3e-477a-bd3a-09015ebb8688', 'youth-justice-service-finder', 'PCYC Pine Rivers', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('2577014d-c3d3-4a8e-944e-a3985dffe79c', 'youth-justice-service-finder', 'PCYC Redlands', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('a9432cdb-0b36-4417-8301-9847fa94271a', 'youth-justice-service-finder', 'PCYC Rockhampton', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('7cfbc6a4-8dff-4f3b-b656-abc2f35344b1', 'youth-justice-service-finder', 'PCYC Sunshine Coast', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('7e787612-e0cb-4bfb-8cba-f36174a347e6', 'youth-justice-service-finder', 'PCYC Toowoomba', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('6f2446c0-7224-4235-bfa1-bad33032f5fb', 'youth-justice-service-finder', 'PCYC Townsville', 
       'Police Citizens Youth Club providing safe activities and support programs for young people. Services include:
- Structured sport and recreation programs
- Youth development and leadership programs  
- School holiday activities
- Crime prevention programs
- Mentoring and life skills programs
- Aboriginal and Torres Strait Islander programs
- After school care and vacation care
- Gymnastics, martial arts, and fitness classes
- Safe driver education programs

PCYC provides a safe, supportive environment where young people can develop confidence, learn new skills, and build positive relationships with peers and police.', 
       ARRAY['recreation','education_training','diversion'],
       ARRAY['sports','recreation','youth programs','police','activities','gymnastics','martial arts','leadership','mentoring'],
       NULL, NULL,
       NULL)
    ,
      ('13c25fd4-c75c-4407-999e-9cb497ece8fe', 'youth-justice-service-finder', 'Bundaberg Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('17313e5f-a66d-4f60-a0d8-b4499d666ff9', 'youth-justice-service-finder', 'Caboolture Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('3a306f4f-0129-4578-990a-7a927c6a3c6c', 'youth-justice-service-finder', 'Cairns Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('5cbbcd45-78fc-4f73-b1e9-67f46cce82f7', 'youth-justice-service-finder', 'Hervey Bay Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('7f732d83-3bef-481d-b7f3-4a71eb427596', 'youth-justice-service-finder', 'Ipswich Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('ca55ee11-1b30-4e46-9a22-de8d181dba6c', 'youth-justice-service-finder', 'Logan Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('a5c10432-647c-491e-916b-285e978fda3f', 'youth-justice-service-finder', 'Mackay Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('342068c3-35c9-4414-a76b-448a48c1b685', 'youth-justice-service-finder', 'Mount Isa Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('3d1ebfb5-4e48-439c-92ee-5509dd31a6bc', 'youth-justice-service-finder', 'Rockhampton Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('5e8147ea-22bc-4e8f-aca7-6d0cc5495b80', 'youth-justice-service-finder', 'Sunshine Coast Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('ed489b3a-779e-47c6-97cb-47d085388984', 'youth-justice-service-finder', 'Toowoomba Youth Justice Service Centre', 
       'Youth Justice Service Centre providing comprehensive support for young people aged 10-17 in the youth justice system. Services include:
- Bail support and supervision
- Court-ordered supervision
- Restorative justice conferencing  
- Connection to education and training
- Family and parenting programs
- Cultural support for Aboriginal and Torres Strait Islander young people
- Referrals to specialist services', 
       ARRAY['supervision','court_support','diversion','family_support','cultural_support'],
       ARRAY['youth justice','bail','supervision','court','restorative justice','conferencing'],
       NULL, NULL,
       NULL)
    ,
      ('097a32c3-cc30-4ef6-a797-914a5feca43b', 'youth-justice-service-finder', 'Youth Advocacy Centre - Court Support Program', 
       'Support for young people attending Children''s Court. Services include:
- Pre-court preparation and explanation
- Support during court proceedings
- Liaison with lawyers and magistrates
- Referrals to support services
- Transport assistance to court
- Family support and information
- Post-court follow up
- Bail support planning

Available at Brisbane, Beenleigh, and Cleveland Children''s Courts. Free and confidential service.', 
       ARRAY['court_support','advocacy','case_management'],
       ARRAY['court','support','children''s court','youth','bail','magistrate'],
       NULL, NULL,
       NULL)
    ,
      ('0f17ffd8-468c-4d5a-b0c7-f962ecfab764', 'youth-justice-service-finder', 'Youth Advocacy Centre - Education Legal Service', 
       'Specialist education law service for students and families. Services include:
- School suspensions and exclusions
- Enrolment refusals and cancellations
- Special education needs and adjustments
- Bullying and discrimination
- School discipline matters
- Alternative education options
- Transition planning
- Advocacy at school meetings

Free service for young people in Queensland state schools. Phone advice available statewide.', 
       ARRAY['legal_aid','education_training','advocacy'],
       ARRAY['education','school','suspension','exclusion','legal','student','rights'],
       NULL, NULL,
       NULL)
    ,
      ('d5012604-41aa-4631-b974-a000d83f126d', 'youth-justice-service-finder', 'Youth Advocacy Centre - Homeless Young People Legal Clinic', 
       'Specialist legal clinic for young people experiencing or at risk of homelessness. Services include:
- Housing and tenancy advice
- Centrelink and income support issues
- Fines and debt matters
- ID documents and birth certificates
- Victims of crime compensation
- Family violence protection orders
- Criminal matters
- Consumer rights

Free drop-in clinic every Thursday at Brisbane Youth Service. No appointment needed.', 
       ARRAY['legal_aid','housing','advocacy'],
       ARRAY['homeless','housing','legal','clinic','youth','tenancy','centrelink'],
       NULL, NULL,
       NULL)
    ,
      ('4fcda756-c821-4481-8a17-7aaf7878ad2d', 'youth-justice-service-finder', 'Youth Advocacy Centre - Legal Service', 
       'Free and confidential legal service for young people under 18 and young adults leaving care. Services include:
- Criminal law matters in Children''s Court and adult courts
- Police powers and interviews
- Bail applications and variations
- Legal representation for serious offences
- Child protection and care matters
- Education law (suspensions, exclusions, enrolment)
- Victims of crime assistance
- Fines and SPER debt
- Employment law issues
- Housing and homelessness
- Discrimination matters

YAC provides holistic support with social workers and youth workers alongside lawyers.', 
       ARRAY['legal_aid','advocacy','court_support'],
       ARRAY['legal','advocacy','youth','court','criminal','bail','education','rights'],
       NULL, NULL,
       NULL)
    ,
      ('bc7b53d1-9dfd-42eb-8112-11bab3d83050', 'youth-justice-service-finder', 'Brisbane CBD Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('a371af05-02ad-456e-8d6f-fef3982959f8', 'youth-justice-service-finder', 'South Brisbane Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('98ea1ff6-5d1d-4374-b13e-f8504aa3f6f8', 'youth-justice-service-finder', 'Caboolture Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('54beb5a3-85e6-4b07-a10f-ccd1cb0bb79a', 'youth-justice-service-finder', 'Beenleigh Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('4826649d-4ebf-41dc-9125-d89424b1a49d', 'youth-justice-service-finder', 'Cleveland Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('34b7ea2d-9976-4190-a509-f62a48eb9432', 'youth-justice-service-finder', 'Ipswich Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('e6409e25-0ac3-4126-85f0-e5d9b7bfe8e2', 'youth-justice-service-finder', 'Southport Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('8ca0439f-bcc9-418c-825b-acf7249e6f4b', 'youth-justice-service-finder', 'Robina Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('10dadaf4-fd4c-4bdd-ad65-6e8e63fae43c', 'youth-justice-service-finder', 'Maroochydore Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('839c9334-83ed-4bf9-8060-ccf5cd66be95', 'youth-justice-service-finder', 'Nambour Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('e06082e2-ea51-492d-8868-1e17c4885bfa', 'youth-justice-service-finder', 'Toowoomba Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('907a6434-b2ce-4bfa-b661-5c357d73dd72', 'youth-justice-service-finder', 'Warwick Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('ce035c1d-45fc-41d4-a3fc-f418e5c7d7be', 'youth-justice-service-finder', 'Cairns Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('0225025f-93c8-4559-9f04-39a0dcd4a6f1', 'youth-justice-service-finder', 'Townsville Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('dd0e9932-c5f5-4fd0-920f-6ac9b874b2e8', 'youth-justice-service-finder', 'Mackay Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('7f63b45e-9839-411d-92e8-13284c7462d5', 'youth-justice-service-finder', 'Rockhampton Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('26b2768e-801b-460a-b050-bac75b08fb5b', 'youth-justice-service-finder', 'Bundaberg Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('9cd2093a-460d-4540-a124-d72bd5296bee', 'youth-justice-service-finder', 'Hervey Bay Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('7b78b473-2960-44f9-909b-5393d882fe9b', 'youth-justice-service-finder', 'Maryborough Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('f76e6398-f128-4fd2-b1df-9f42b8f275c8', 'youth-justice-service-finder', 'Mount Isa Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('7e035efe-6a07-4f44-9010-9b35d4a6f551', 'youth-justice-service-finder', 'Roma Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ,
      ('98b59ff1-2ae2-41e9-8830-70a2b28cd7b6', 'youth-justice-service-finder', 'Charleville Youth Legal Service', 
       'Free legal representation and advice for young people aged 10-25. Services include criminal law representation, police interviews, court representation, bail applications, and legal education.', 
       ARRAY['legal_aid','court_support','criminal_law'],
       ARRAY['legal','court','lawyer','criminal','youth','bail','police'],
       10, 25,
       '0b9d67b3-1a4a-4997-a330-ba92caf02a34')
    ;
    



