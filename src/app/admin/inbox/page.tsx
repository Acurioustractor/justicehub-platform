import { requireAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { Navigation } from '@/components/ui/navigation';
import { MasterInbox } from './master-inbox';

export default async function AdminInboxPage() {
  await requireAdmin('/admin/inbox');

  const serviceClient = createServiceClient();

  // Fetch all 4 data sources in parallel
  const [
    { data: submissions },
    { data: registrations },
    { data: subscribers },
    { data: signups },
  ] = await Promise.all([
    (serviceClient as any)
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false }) as Promise<{ data: any[] | null }>,
    (serviceClient as any)
      .from('event_registrations')
      .select('*, event:events(title)')
      .order('created_at', { ascending: false }) as Promise<{ data: any[] | null }>,
    (serviceClient as any)
      .from('newsletter_subscriptions')
      .select('*')
      .order('subscribed_at', { ascending: false }) as Promise<{ data: any[] | null }>,
    (serviceClient as any)
      .from('profiles')
      .select('id, email, full_name, display_name, role, account_status, email_verified, primary_organization_id, created_at, organization:organizations!profiles_primary_organization_id_fkey(name)')
      .order('created_at', { ascending: false }) as Promise<{ data: any[] | null }>,
  ]);

  const subs = submissions || [];
  const regs = registrations || [];
  const news = subscribers || [];
  const users = signups || [];

  // Count submissions by status
  const submissionCounts = { new: 0, read: 0, replied: 0, archived: 0 };
  subs.forEach((s: any) => {
    const status = s.status as keyof typeof submissionCounts;
    if (status in submissionCounts) submissionCounts[status]++;
  });

  // Tab badge counts
  const tabCounts = {
    messages: submissionCounts.new || subs.length,
    registrations: regs.length,
    subscribers: news.length,
    signups: users.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-black mb-2">Inbox</h1>
            <p className="text-lg text-gray-600">
              Messages, registrations, subscribers, and signups across the platform
            </p>
          </div>

          <MasterInbox
            submissions={subs}
            submissionCounts={submissionCounts}
            registrations={regs}
            subscribers={news}
            signups={users}
            tabCounts={tabCounts}
          />
        </div>
      </div>
    </div>
  );
}
