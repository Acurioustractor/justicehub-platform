'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';
import FrameworkForm from '@/components/admin/coe/FrameworkForm';

export default function EditFrameworkPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [framework, setFramework] = useState<any>(null);

  useEffect(() => {
    async function loadFramework() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('australian_frameworks')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        alert('Framework not found');
        router.push('/admin/coe/frameworks');
        return;
      }

      setFramework(data);
      setLoading(false);
    }

    loadFramework();
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
          <FrameworkForm initialData={framework} />
        </div>
      </div>
    </div>
  );
}
