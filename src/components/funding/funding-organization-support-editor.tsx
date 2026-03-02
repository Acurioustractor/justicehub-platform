'use client';

import { useEffect, useMemo, useState } from 'react';

type ParsedBusinessSupportNote = {
  sharedContext: string;
  supportNeeds: string;
  partnerAsks: string;
  operationalBlockers: string;
};

const BUSINESS_SUPPORT_MARKER = '[Business support]';

function parseBusinessSupportNote(note: string | null | undefined): ParsedBusinessSupportNote {
  const value = String(note || '').trim();

  if (!value) {
    return {
      sharedContext: '',
      supportNeeds: '',
      partnerAsks: '',
      operationalBlockers: '',
    };
  }

  const markerIndex = value.indexOf(BUSINESS_SUPPORT_MARKER);

  if (markerIndex === -1) {
    return {
      sharedContext: value,
      supportNeeds: '',
      partnerAsks: '',
      operationalBlockers: '',
    };
  }

  const sharedContext = value.slice(0, markerIndex).trim();
  const block = value.slice(markerIndex + BUSINESS_SUPPORT_MARKER.length).trim();

  const extractSection = (label: string) => {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)(?=\\n[A-Z][^\\n]*:\\s|$)`, 'i');
    const match = block.match(regex);
    return match?.[1]?.trim() || '';
  };

  return {
    sharedContext,
    supportNeeds: extractSection('Support needs'),
    partnerAsks: extractSection('Partner asks'),
    operationalBlockers: extractSection('Operational blockers'),
  };
}

function buildBusinessSupportNote(fields: ParsedBusinessSupportNote) {
  const sections = [
    fields.sharedContext.trim(),
    [
      BUSINESS_SUPPORT_MARKER,
      `Support needs: ${fields.supportNeeds.trim() || '—'}`,
      `Partner asks: ${fields.partnerAsks.trim() || '—'}`,
      `Operational blockers: ${fields.operationalBlockers.trim() || '—'}`,
    ].join('\n'),
  ].filter(Boolean);

  return sections.join('\n\n').trim();
}

export function FundingOrganizationSupportEditor({
  organizationId,
  initialNote,
}: {
  organizationId: string;
  initialNote: string | null;
}) {
  const parsedInitial = useMemo(() => parseBusinessSupportNote(initialNote), [initialNote]);
  const [sharedContext, setSharedContext] = useState(parsedInitial.sharedContext);
  const [supportNeeds, setSupportNeeds] = useState(parsedInitial.supportNeeds);
  const [partnerAsks, setPartnerAsks] = useState(parsedInitial.partnerAsks);
  const [operationalBlockers, setOperationalBlockers] = useState(parsedInitial.operationalBlockers);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  const canSave =
    sharedContext.trim() ||
    supportNeeds.trim() ||
    partnerAsks.trim() ||
    operationalBlockers.trim();

  async function saveBusinessSupport() {
    if (!canSave) return;

    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch('/api/funding/workspace/business-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          note: buildBusinessSupportNote({
            sharedContext,
            supportNeeds,
            partnerAsks,
            operationalBlockers,
          }),
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || json?.success !== true) {
        throw new Error(json?.error || 'Failed to save business support context');
      }

      setNotice('Business support context saved.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save business support context'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="border border-gray-200 bg-[#f8fafc] p-4">
      <div className="text-xs uppercase font-bold text-gray-600 mb-3">Working Business Support Note</div>

      <div className="space-y-3">
        <label className="block">
          <span className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
            Shared context
          </span>
          <textarea
            value={sharedContext}
            onChange={(event) => setSharedContext(event.target.value)}
            rows={3}
            disabled={!isInteractive || isSaving}
            className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black"
            placeholder="Capture the current business context, grant framing, and shared working note."
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
            Support needs
          </span>
          <textarea
            value={supportNeeds}
            onChange={(event) => setSupportNeeds(event.target.value)}
            rows={3}
            disabled={!isInteractive || isSaving}
            className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black"
            placeholder="What support is needed to strengthen readiness, delivery, or grant quality?"
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
            Partner asks
          </span>
          <textarea
            value={partnerAsks}
            onChange={(event) => setPartnerAsks(event.target.value)}
            rows={3}
            disabled={!isInteractive || isSaving}
            className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black"
            placeholder="Which letters, collaborators, or philanthropic partners should be engaged?"
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
            Operational blockers
          </span>
          <textarea
            value={operationalBlockers}
            onChange={(event) => setOperationalBlockers(event.target.value)}
            rows={3}
            disabled={!isInteractive || isSaving}
            className="w-full border-2 border-black bg-white px-3 py-2 text-sm text-black"
            placeholder="What is slowing submission readiness or business growth right now?"
          />
        </label>
      </div>

      {(notice || error) && (
        <div
          className={`mt-3 border px-3 py-2 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={saveBusinessSupport}
          disabled={!isInteractive || isSaving || !canSave}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold border-2 border-black hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save Business Support'}
        </button>
        <div className="text-[11px] text-gray-500">
          This updates the shared working note used across the funding and review flow.
        </div>
      </div>
    </div>
  );
}
