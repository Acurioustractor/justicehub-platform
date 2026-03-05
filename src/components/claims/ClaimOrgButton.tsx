'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Shield, Loader2 } from 'lucide-react';

interface ClaimOrgButtonProps {
  orgId: string;
  orgSlug: string;
}

const ROLE_OPTIONS = [
  { value: 'founder', label: 'Founder' },
  { value: 'ceo', label: 'CEO / Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'board', label: 'Board Member' },
  { value: 'volunteer', label: 'Volunteer' },
];

export function ClaimOrgButton({ orgId, orgSlug }: ClaimOrgButtonProps) {
  const router = useRouter();
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [roleAtOrg, setRoleAtOrg] = useState('');
  const [abn, setAbn] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function checkClaim() {
      try {
        const res = await fetch(`/api/organizations/${orgId}/claim`);
        const data = await res.json();
        if (data.claim) {
          setClaimStatus(data.claim.status);
        }
      } catch {
        // Not logged in or error — show default button
      } finally {
        setLoading(false);
      }
    }
    checkClaim();
  }, [orgId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName,
          contact_email: contactEmail,
          role_at_org: roleAtOrg,
          message: message || undefined,
          abn: abn || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/organizations/${orgSlug}`);
          return;
        }
        setError(data.error || 'Something went wrong');
        return;
      }

      setClaimStatus('pending');
      setShowForm(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  // Already claimed states
  if (claimStatus === 'verified') {
    return (
      <div className="inline-flex items-center gap-2 bg-eucalyptus-100 text-eucalyptus-800 px-6 py-3 font-bold border-2 border-eucalyptus-600">
        <CheckCircle className="w-5 h-5" />
        Verified Organization
      </div>
    );
  }

  if (claimStatus === 'pending') {
    return (
      <div className="inline-flex items-center gap-2 bg-ochre-100 text-ochre-800 px-6 py-3 font-bold border-2 border-ochre-400">
        <Loader2 className="w-5 h-5" />
        Claim Pending Review
      </div>
    );
  }

  if (claimStatus === 'rejected') {
    return (
      <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 font-bold border-2 border-red-300">
        Claim Not Approved
      </div>
    );
  }

  return (
    <>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 font-bold border-2 border-black transition-colors"
        >
          <Shield className="w-5 h-5" />
          Claim this Organization
        </button>
      ) : (
        <div className="w-full max-w-lg bg-white border-2 border-black p-6 mt-4">
          <h3 className="text-lg font-bold mb-4">Claim this Organization</h3>
          <p className="text-sm text-earth-600 mb-4">
            Verify your connection to this organization. An admin will review your claim.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                Your Role *
              </label>
              <select
                required
                value={roleAtOrg}
                onChange={(e) => setRoleAtOrg(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select a role...</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                ABN <span className="font-normal text-earth-500">(optional)</span>
              </label>
              <input
                type="text"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="e.g. 12345678901"
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-earth-700 mb-1">
                Message <span className="font-normal text-earth-500">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Tell us about your connection to this organization..."
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold border-2 border-black transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-6 py-2 border-2 border-black font-bold hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
