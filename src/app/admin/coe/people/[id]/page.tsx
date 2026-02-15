'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/client';
import PersonForm from '@/components/admin/coe/PersonForm';

export default function EditCoePersonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<any>(null);

  useEffect(() => {
    async function loadPerson() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('coe_key_people')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        alert('Person not found');
        router.push('/admin/coe/people');
        return;
      }

      setPerson(data);
      setLoading(false);
    }

    loadPerson();
  }, [id, router]);

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
          <PersonForm initialData={person} />
        </div>
      </div>
    </div>
  );
}
