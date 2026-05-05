import { requireAdmin } from '@/lib/supabase/admin-lite';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { EnrollmentAdminClient } from './enrollment-client';

export const dynamic = 'force-dynamic';

interface CodeRow {
  id: string;
  code: string;
  project_slug: string;
  event_name: string | null;
  tour_stop_slug: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

export default async function EnrollmentAdminPage() {
  const { supabase } = await requireAdmin('/admin/contained/enrollment');

  const { data: codes } = await supabase
    .from('enrollment_codes')
    .select('id, code, project_slug, event_name, tour_stop_slug, max_uses, current_uses, is_active, expires_at, notes, created_at')
    .order('created_at', { ascending: false });

  const { count: sessionCount } = await supabase
    .from('device_sessions')
    .select('id', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="pt-40 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/admin/contained" className="text-xs uppercase tracking-widest text-red-600 hover:text-red-700 mb-6 inline-block">
            ← Admin · Contained
          </Link>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3">
            Enrollment Codes
          </h1>
          <p className="text-gray-600 mb-10 max-w-2xl">
            Mint codes per tour stop. Visitors enter the code at <span className="font-mono">/contained/enroll</span> to start a device session — submit reflections, recommend others, opt up to public storyteller.
          </p>

          <EnrollmentAdminClient initialCodes={(codes ?? []) as CodeRow[]} totalSessions={sessionCount ?? 0} />
        </div>
      </main>
    </div>
  );
}
