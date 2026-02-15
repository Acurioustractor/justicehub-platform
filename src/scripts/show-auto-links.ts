import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.YJSF_SUPABASE_SERVICE_KEY!
);

async function showAllLinks() {
  const { data: links } = await supabase
    .from('organizations_profiles')
    .select(`
      id,
      role,
      is_current,
      public_profiles!inner(full_name, slug, synced_from_empathy_ledger),
      organizations(name, slug)
    `)
    .eq('public_profiles.synced_from_empathy_ledger', true)
    .order('created_at', { ascending: false });

  console.log('Auto-linked profiles from Empathy Ledger:\n');

  links?.forEach(link => {
    const profile = (link as any).public_profiles;
    const org = (link as any).organizations;
    console.log(`  ${profile.full_name} → ${org.name} (${link.role})`);
  });

  console.log(`\nTotal auto-linked profiles: ${links?.length || 0}`);
}

showAllLinks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
