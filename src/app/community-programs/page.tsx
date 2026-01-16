import { createServiceClient } from '@/lib/supabase/service';
import { CommunityProgramsContent } from './page-content';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Community Programs - JusticeHub',
  description: 'Curated profiles of programs that work. Indigenous knowledge. Community connection. Grassroots approaches that transform lives.',
};

async function getCommunityProgramsData() {
  const supabase = createServiceClient();

  try {
    const { data: programs, error } = await supabase
      .from('registered_services')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching community programs:', error);
      return { programs: [] };
    }

    return { programs: programs || [] };
  } catch (error) {
    console.error('Error fetching community programs data:', error);
    return { programs: [] };
  }
}

export default async function CommunityProgramsPage() {
  const { programs } = await getCommunityProgramsData();

  return <CommunityProgramsContent initialPrograms={programs} />;
}
