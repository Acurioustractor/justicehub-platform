'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';
import ResearchForm from '@/components/admin/coe/ResearchForm';

export default function EditResearchPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    async function loadItem() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('research_items')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        alert('Research item not found');
        router.push('/admin/coe/research');
        return;
      }

      setItem(data);
      setLoading(false);
    }

    loadItem();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 page-content">
        <Navigation />
        <div className="pt-8 pb-16">
          <div className="container-justice">
            <div className="text-center py-16">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />
      <div className="pt-8 pb-16">
        <div className="container-justice">
          <ResearchForm initialData={item} />
        </div>
      </div>
    </div>
  );
}
