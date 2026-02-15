import { createClient } from '@supabase/supabase-js'

// Use the service role key for admin access
const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
)

async function insertSampleData() {
  console.log('Fetching existing organizations...')
  
  // Get some existing organizations
  const { data: organizations, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5)

  if (orgsError) {
    console.error('Error fetching organizations:', orgsError)
    return
  }

  if (!organizations || organizations.length === 0) {
    console.log('No organizations found. Please create some organizations first.')
    return
  }

  console.log('Found', organizations.length, 'organizations')
  
  // Use the first few organization IDs for our sample services
  const orgIds = organizations.map(org => org.id)

  console.log('Inserting sample services...')

  // Insert sample services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .insert([
      {
        organization_id: orgIds[0],
        name: 'Legal Advice',
        description: 'Free legal advice for youth under 25 facing criminal charges or legal issues',
        category: 'legal_support',
        contact_info: {
          phone: '1800-YOUTH-LAW',
          email: 'advice@youthlegalaid.org'
        },
        geographical_coverage: {
          type: 'state',
          boundaries: {
            states: ['QLD']
          }
        },
        active: true
      },
      {
        organization_id: orgIds[0],
        name: 'Court Representation',
        description: 'Legal representation in youth court matters with experienced lawyers',
        category: 'legal_support',
        contact_info: {
          phone: '1800-YOUTH-LAW',
          email: 'court@youthlegalaid.org'
        },
        geographical_coverage: {
          type: 'state',
          boundaries: {
            states: ['QLD']
          }
        },
        active: true
      },
      {
        organization_id: orgIds[1] || orgIds[0],
        name: 'Alternative Education Program',
        description: 'Flexible learning program for at-risk youth with individualized support',
        category: 'education_training',
        contact_info: {
          phone: '07-5555-0123',
          email: 'enroll@secondchance.edu'
        },
        geographical_coverage: {
          type: 'regional',
          boundaries: {
            regions: ['Logan', 'Brisbane']
          }
        },
        active: true
      },
      {
        organization_id: orgIds[2] || orgIds[0],
        name: 'Emergency Crisis Support',
        description: '24/7 crisis intervention and emergency support for youth in danger',
        category: 'crisis_intervention',
        contact_info: {
          phone: '1800-CRISIS',
          email: 'emergency@crisisresponse.org'
        },
        geographical_coverage: {
          type: 'state',
          boundaries: {
            states: ['QLD']
          }
        },
        active: true
      },
      {
        organization_id: orgIds[3] || orgIds[0],
        name: 'Youth Counseling',
        description: 'Confidential counseling and mental health support for young people',
        category: 'mental_health',
        contact_info: {
          phone: '1800-650-890',
          email: 'counseling@headspace.org.au'
        },
        geographical_coverage: {
          type: 'national',
          boundaries: {
            states: ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT']
          }
        },
        active: true
      }
    ])
    .select()

  if (servicesError) {
    console.error('Error inserting services:', servicesError)
    return
  }

  console.log('Inserted services:', services)
  console.log('Sample data insertion complete!')
}

insertSampleData()