import { createServiceClient } from '@/lib/supabase/service';
import { GrassrootsContent } from './page-content';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Grassroots Programs - JusticeHub',
  description: 'Curated deep-dive profiles of programs that demonstrably work. Quality over quantity. Behind-the-scenes insights into community-led solutions.',
};

async function getGrassrootsData() {
  const supabase = createServiceClient();

  try {
    // Fetch featured/curated community programs for grassroots page
    const { data: programs, error } = await supabase
      .from('community_programs')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('success_rate', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching grassroots programs:', error);
      return { programs: [] };
    }

    return { programs: programs || [] };
  } catch (error) {
    console.error('Error fetching grassroots data:', error);
    return { programs: [] };
  }
}

export default async function GrassrootsPage() {
  const { programs } = await getGrassrootsData();

  return <GrassrootsContent initialPrograms={programs} />;
}
