'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

type DraftRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  applicationId?: string | null;
  narrativeDraft?: string | null;
  supportMaterial?: string[];
  communityReviewNotes?: string[];
  budgetNotes?: string | null;
  draftStatus?: string | null;
  lastReviewRequestedAt?: string | null;
  lastReviewCompletedAt?: string | null;
  updatedAt?: string | null;
};

function ApplicationDraftWorkspaceAdminContent() {
  const searchParams = useSearchParams();
  const organizationId = String(searchParams.get('organizationId') || '').trim();
  const opportunityId = String(searchParams.get('opportunityId') || '').trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [narrativeDraft, setNarrativeDraft] = useState('');
  const [supportMaterial, setSupportMaterial] = useState('');
  const [communityReviewNotes, setCommunityReviewNotes] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [draftStatus, setDraftStatus] = useState('draft');

  const loadDraft = async () => {
    if (!organizationId || !opportunityId) {
      setLoading(false);
      setError('organizationId and opportunityId are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organizationId,
        opportunityId,
      });

      const response = await fetch(`/api/admin/funding/os/application-drafts?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load application draft workspace');
      }

      const nextDraft = payload.draft || null;
      setDraft(nextDraft);
      setNarrativeDraft(typeof nextDraft?.narrativeDraft === 'string' ? nextDraft.narrativeDraft : '');
      setSupportMaterial(Array.isArray(nextDraft?.supportMaterial) ? nextDraft.supportMaterial.join('\n') : '');
      setCommunityReviewNotes(
        Array.isArray(nextDraft?.communityReviewNotes) ? nextDraft.communityReviewNotes.join('\n') : ''
      );
      setBudgetNotes(typeof nextDraft?.budgetNotes === 'string' ? nextDraft.budgetNotes : '');
      setDraftStatus(
        typeof nextDraft?.draftStatus === 'string' ? nextDraft.draftStatus : 'draft'
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load application draft workspace'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, [organizationId, opportunityId]);

  const canSave = useMemo(
    () => Boolean(organizationId && opportunityId) && !saving,
    [organizationId, opportunityId, saving]
  );

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/funding/os/application-drafts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          opportunityId,
          narrativeDraft,
          supportMaterial: supportMaterial
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          communityReviewNotes: communityReviewNotes
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          budgetNotes,
          draftStatus,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save application draft workspace');
      }

      const nextDraft = payload.draft || null;
      setDraft(nextDraft);
      setNotice('Application draft workspace saved.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save application draft workspace'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/funding/os"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding OS
              </Link>
              <h1 className="text-4xl font-black text-black">Application Draft Editor</h1>
              <p className="text-base text-gray-600 mt-2">
                Durable draft record for proposal framing, support material, and pre-submission community review.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                  Org {organizationId || '—'}
                </span>
                <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                  Opportunity {opportunityId || '—'}
                </span>
                {draft?.updatedAt && (
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                    Updated {new Date(draft.updatedAt).toLocaleString('en-AU')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadDraft}
                disabled={loading || saving}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#1d4ed8] text-white border-2 border-black font-bold hover:bg-[#1e40af] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          {notice && (
            <div className="border-2 border-emerald-500 bg-emerald-50 text-emerald-800 p-4 mb-6 font-medium">
              {notice}
            </div>
          )}

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading application draft workspace…
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-2">Draft Status</div>
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-3 text-sm font-bold"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="ready_to_submit">Ready to Submit</option>
                  <option value="submitted">Submitted</option>
                  <option value="archived">Archived</option>
                </select>

                <div className="text-xs uppercase font-bold text-gray-600 mt-6 mb-2">Narrative Draft</div>
                <textarea
                  value={narrativeDraft}
                  onChange={(event) => setNarrativeDraft(event.target.value)}
                  rows={12}
                  className="w-full border-2 border-black bg-white px-3 py-3 text-sm"
                  placeholder="Write the working proposal narrative here…"
                />

                <div className="text-xs uppercase font-bold text-gray-600 mt-6 mb-2">Budget Notes</div>
                <textarea
                  value={budgetNotes}
                  onChange={(event) => setBudgetNotes(event.target.value)}
                  rows={6}
                  className="w-full border-2 border-black bg-white px-3 py-3 text-sm"
                  placeholder="Add budget framing, funding ask notes, and constraints…"
                />
              </section>

              <section className="space-y-6">
                <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    Support Material (one item per line)
                  </div>
                  <textarea
                    value={supportMaterial}
                    onChange={(event) => setSupportMaterial(event.target.value)}
                    rows={10}
                    className="w-full border-2 border-black bg-white px-3 py-3 text-sm"
                    placeholder="Support letter idea, evidence note, attachment checklist…"
                  />
                </div>

                <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    Community Review Notes (one item per line)
                  </div>
                  <textarea
                    value={communityReviewNotes}
                    onChange={(event) => setCommunityReviewNotes(event.target.value)}
                    rows={10}
                    className="w-full border-2 border-black bg-white px-3 py-3 text-sm"
                    placeholder="Community cautions, endorsement prompts, revision notes…"
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FundingApplicationDraftAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f6f2] page-content" />}>
      <ApplicationDraftWorkspaceAdminContent />
    </Suspense>
  );
}
