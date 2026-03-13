'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Search, ExternalLink, Building2 } from 'lucide-react';

interface Claim {
  id: string;
  organization_id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  role_at_org: string;
  message: string;
  abn: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  verified_at: string | null;
  organizations: { name: string; slug: string } | null;
}

export default function OrgClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [acncResults, setAcncResults] = useState<Record<string, any>>({});

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/org-claims?status=${statusFilter}`);
      const data = await res.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  async function handleAcncLookup(abn: string, claimId: string) {
    try {
      const res = await fetch(`/api/admin/org-claims/acnc-lookup?abn=${abn}`);
      const data = await res.json();
      setAcncResults((prev) => ({ ...prev, [claimId]: data }));
    } catch {
      setAcncResults((prev) => ({ ...prev, [claimId]: { error: 'Lookup failed' } }));
    }
  }

  async function handleAction(claimId: string, action: 'verified' | 'rejected', notes?: string) {
    setActionLoading(claimId);
    try {
      const claim = claims.find((c) => c.id === claimId);
      const res = await fetch('/api/admin/org-claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          status: action,
          admin_notes: notes || null,
          abn: claim?.abn || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update claim');

      // If approving, also create org membership + set trial
      if (action === 'verified' && claim) {
        await fetch('/api/admin/org-claims/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claim_id: claimId,
            organization_id: claim.organization_id,
            user_id: claim.user_id,
          }),
        });
      }

      fetchClaims();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <div className="container-justice py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Organization Claims</h1>
            <p className="text-earth-600 mt-1">Review and approve organization ownership claims</p>
          </div>
          <Link href="/admin" className="text-sm font-bold text-earth-600 hover:text-black underline">
            Back to Admin
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'verified', 'rejected', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === 'all' ? '' : s)}
              className={`px-4 py-2 text-sm font-bold border-2 transition-colors ${
                statusFilter === (s === 'all' ? '' : s)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-earth-700 border-gray-300 hover:border-black'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-earth-500">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-gray-200">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-earth-500">No {statusFilter || ''} claims found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Building2 className="w-5 h-5 text-earth-600" />
                      <h3 className="text-lg font-black">
                        {claim.organizations?.name || 'Unknown Org'}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-0.5 ${
                        claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        claim.status === 'verified' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-sm text-earth-500">
                      Claimed {new Date(claim.created_at).toLocaleDateString('en-AU')}
                    </p>
                  </div>
                  {claim.organizations?.slug && (
                    <Link
                      href={`/admin/organizations/${claim.organizations.slug}`}
                      className="text-sm text-ochre-600 hover:text-ochre-800 flex items-center gap-1"
                    >
                      View Org <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-bold text-earth-500 block">Contact</span>
                    {claim.contact_name}
                  </div>
                  <div>
                    <span className="font-bold text-earth-500 block">Email</span>
                    {claim.contact_email}
                  </div>
                  <div>
                    <span className="font-bold text-earth-500 block">Role</span>
                    {claim.role_at_org}
                  </div>
                  <div>
                    <span className="font-bold text-earth-500 block">ABN</span>
                    {claim.abn || '—'}
                    {claim.abn && (
                      <button
                        onClick={() => handleAcncLookup(claim.abn!, claim.id)}
                        className="ml-2 text-xs text-ochre-600 hover:text-ochre-800 underline font-bold"
                      >
                        <Search className="w-3 h-3 inline" /> ACNC
                      </button>
                    )}
                  </div>
                </div>

                {claim.message && (
                  <div className="bg-gray-50 border border-gray-200 p-3 mb-4 text-sm">
                    <span className="font-bold text-earth-500 block mb-1">Message</span>
                    {claim.message}
                  </div>
                )}

                {acncResults[claim.id] && (
                  <div className="bg-blue-50 border border-blue-200 p-3 mb-4 text-sm">
                    <span className="font-bold text-blue-800 block mb-1">ACNC Lookup Result</span>
                    <pre className="text-xs overflow-auto">{JSON.stringify(acncResults[claim.id], null, 2)}</pre>
                  </div>
                )}

                {claim.admin_notes && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4 text-sm">
                    <span className="font-bold text-yellow-800 block mb-1">Admin Notes</span>
                    {claim.admin_notes}
                  </div>
                )}

                {claim.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleAction(claim.id, 'verified')}
                      disabled={actionLoading === claim.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white font-bold text-sm hover:bg-green-800 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve + Start Trial
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Rejection reason (optional):');
                        handleAction(claim.id, 'rejected', reason || undefined);
                      }}
                      disabled={actionLoading === claim.id}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 border-2 border-red-300 font-bold text-sm hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
