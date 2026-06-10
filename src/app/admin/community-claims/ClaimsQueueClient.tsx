'use client';

import { useState } from 'react';

export interface ClaimRow {
  id: string;
  organization_id: string;
  claimant_email: string;
  claimant_name: string;
  role_in_org: string | null;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  invite_token: string | null;
  invite_expires_at: string | null;
  created_at: string;
  organizations: { id: string; name: string; slug: string | null } | null;
}

const STATUS_STYLES: Record<ClaimRow['status'], string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  declined: 'bg-neutral-200 text-neutral-700',
  expired: 'bg-neutral-200 text-neutral-700',
};

export function ClaimsQueueClient({ initialClaims }: { initialClaims: ClaimRow[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteUrls, setInviteUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function act(id: string, action: 'approve' | 'decline') {
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/community-claims/${id}/${action}`, {
        method: 'POST',
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.error ?? 'Action failed');
        return;
      }
      setClaims((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: action === 'approve' ? 'approved' : 'declined' }
            : c
        )
      );
      if (action === 'approve' && body.invite_url) {
        setInviteUrls((prev) => ({ ...prev, [id]: body.invite_url }));
      }
    } finally {
      setBusy(null);
    }
  }

  if (claims.length === 0) {
    return (
      <p className="text-sm opacity-70">
        No claims recorded yet. Record one with{' '}
        <code className="text-xs">POST /api/admin/community-claims</code> after
        the confirming conversation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-red-700 border border-red-200 rounded px-3 py-2">
          {message}
        </p>
      )}
      {claims.map((c) => (
        <div key={c.id} className="border rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold">
                {c.organizations?.name ?? c.organization_id}
              </span>
              <span
                className={`ml-3 text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}
              >
                {c.status}
              </span>
            </div>
            <span className="text-xs opacity-60">
              {new Date(c.created_at).toLocaleDateString('en-AU')}
            </span>
          </div>
          <p className="text-sm">
            {c.claimant_name} &lt;{c.claimant_email}&gt;
            {c.role_in_org ? ` · ${c.role_in_org}` : ''}
          </p>
          {c.status === 'pending' && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => act(c.id, 'approve')}
                disabled={busy === c.id}
                className="text-sm px-3 py-1.5 rounded bg-emerald-700 text-white disabled:opacity-50"
              >
                Approve and create invite
              </button>
              <button
                onClick={() => act(c.id, 'decline')}
                disabled={busy === c.id}
                className="text-sm px-3 py-1.5 rounded border disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}
          {inviteUrls[c.id] && (
            <div className="mt-1 text-sm bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              <p className="font-medium mb-1">
                Invite link (send this to {c.claimant_email} personally):
              </p>
              <code className="text-xs break-all select-all">{inviteUrls[c.id]}</code>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
