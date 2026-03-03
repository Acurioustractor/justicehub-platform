'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { InboxTable } from '@/app/admin/inbox/inbox-table';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category: string;
  message: string;
  organization?: string;
  organization_id?: string;
  status: string;
  created_at: string;
}

export function MessagesTab({ orgId }: { orgId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org-hub/${orgId}?section=contact_messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setSubmissions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchMessages} className="mt-3 px-4 py-2 font-bold bg-black text-white hover:bg-gray-800">
          Retry
        </button>
      </div>
    );
  }

  const counts = {
    new: submissions.filter((s) => s.status === 'new').length,
    read: submissions.filter((s) => s.status === 'read').length,
    replied: submissions.filter((s) => s.status === 'replied').length,
    archived: submissions.filter((s) => s.status === 'archived').length,
  };

  return <InboxTable initialSubmissions={submissions} counts={counts} organizationId={orgId} />;
}
