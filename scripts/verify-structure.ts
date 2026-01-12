import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
);

async function verify() {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           JUSTICEHUB - REORGANIZED STRUCTURE                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');

  // Get coe_key_people with profiles
  const { data: coe } = await supabase.from('coe_key_people').select('*').order('display_order');
  const profileIds = coe?.map((c) => c.profile_id) || [];
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, full_name, current_organization, location')
    .in('id', profileIds);

  console.log('\n🏛️  KEY PEOPLE BY ROLE & PLACE');
  console.log('═══════════════════════════════════════════════════════════════════════');

  const grouped: Record<string, any[]> = {
    'National (Centre of Excellence)': [],
    'QLD Node (PICC)': [],
    'NT Node (Oonchiumpa)': [],
    'International Partners': [],
  };

  coe?.forEach((c) => {
    const profile = profiles?.find((p) => p.id === c.profile_id);
    const entry = {
      name: profile?.full_name,
      role: c.role_title,
      expertise: c.expertise_area,
      org: profile?.current_organization,
      location: profile?.location,
    };

    if (
      c.role_title.includes('Research Director') ||
      c.role_title.includes('Creative Director') ||
      c.role_title.includes('Policy Advisor')
    ) {
      grouped['National (Centre of Excellence)'].push(entry);
    } else if (c.role_title.includes('QLD')) {
      grouped['QLD Node (PICC)'].push(entry);
    } else if (c.role_title.includes('NT')) {
      grouped['NT Node (Oonchiumpa)'].push(entry);
    } else if (c.role_title.includes('International')) {
      grouped['International Partners'].push(entry);
    }
  });

  for (const [group, people] of Object.entries(grouped)) {
    console.log('\n' + group);
    console.log('─'.repeat(70));
    people.forEach((p) => {
      console.log('  • ' + p.name);
      console.log('    Role: ' + p.role);
      console.log('    Org: ' + p.org);
      console.log('    Location: ' + p.location);
    });
  }

  // Get nodes
  const { data: nodes } = await supabase
    .from('justicehub_nodes')
    .select('name, state_code, status, lead_organization_id, organizations(name)')
    .order('name');

  console.log('\n\n🌏 JUSTICEHUB NODES');
  console.log('═══════════════════════════════════════════════════════════════════════');

  const activeNodes = nodes?.filter((n: any) => n.status === 'active') || [];
  console.log('\nActive Nodes (' + activeNodes.length + '):');
  activeNodes.forEach((n: any) => {
    console.log('  ✅ ' + n.name + ' → ' + ((n as any).organizations?.name || 'Not linked'));
  });

  const otherNodes = nodes?.filter((n: any) => n.status !== 'active') || [];
  console.log('\nForming/Planned (' + otherNodes.length + '):');
  otherNodes.forEach((n: any) => {
    console.log('  ⏳ ' + n.name);
  });

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  Centre of Excellence: National umbrella organization');
  console.log('  Active Nodes: 3 (QLD, NT, NSW)');
  console.log('  Community Partners: PICC, Oonchiumpa, Mounty Yarns');
  console.log('  Key People: 10 (organized by place)');
  console.log('  International Programs: 67+');
}

verify().catch(console.error);
