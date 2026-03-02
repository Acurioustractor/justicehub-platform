'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { ArrowLeft, Plus, RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react';

type OutcomeDomain =
  | 'health'
  | 'housing'
  | 'education'
  | 'employment'
  | 'culture'
  | 'family'
  | 'community_safety'
  | 'self_determination'
  | 'system_accountability';

interface OutcomeDefinitionRow {
  id: string;
  name: string;
  outcome_domain: OutcomeDomain;
  unit?: string | null;
  description?: string | null;
  baseline_method?: string | null;
  community_defined: boolean;
  first_nations_data_sensitive: boolean;
  is_active: boolean;
  updated_at: string;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
}

const OUTCOME_DOMAINS: OutcomeDomain[] = [
  'health',
  'housing',
  'education',
  'employment',
  'culture',
  'family',
  'community_safety',
  'self_determination',
  'system_accountability',
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FundingOutcomeDefinitionsPage() {
  const [definitions, setDefinitions] = useState<OutcomeDefinitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({
    id: '',
    name: '',
    outcomeDomain: 'health' as OutcomeDomain,
    unit: '',
    description: '',
    baselineMethod: '',
    communityDefined: true,
    firstNationsDataSensitive: false,
    isActive: true,
  });

  const fetchData = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '120');
      if (showInactive) {
        params.set('includeInactive', 'true');
      }

      const response = await fetch(`/api/admin/funding/os/outcome-definitions?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load outcome definitions');
      }

      const nextDefinitions = payload.data || [];
      setDefinitions(nextDefinitions);

      if (!selectedDefinitionId && nextDefinitions[0]?.id) {
        setSelectedDefinitionId(nextDefinitions[0].id);
      } else if (
        selectedDefinitionId &&
        !nextDefinitions.some((definition: OutcomeDefinitionRow) => definition.id === selectedDefinitionId)
      ) {
        setSelectedDefinitionId(nextDefinitions[0]?.id || '');
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load outcome definitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showInactive]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectedDefinition = useMemo(
    () => definitions.find((definition) => definition.id === selectedDefinitionId) || null,
    [definitions, selectedDefinitionId]
  );

  useEffect(() => {
    if (!selectedDefinition) {
      return;
    }

    setForm({
      id: selectedDefinition.id,
      name: selectedDefinition.name,
      outcomeDomain: selectedDefinition.outcome_domain,
      unit: selectedDefinition.unit || '',
      description: selectedDefinition.description || '',
      baselineMethod: selectedDefinition.baseline_method || '',
      communityDefined: selectedDefinition.community_defined,
      firstNationsDataSensitive: selectedDefinition.first_nations_data_sensitive,
      isActive: selectedDefinition.is_active,
    });
  }, [selectedDefinition]);

  const startNew = () => {
    setSelectedDefinitionId('');
    setForm({
      id: '',
      name: '',
      outcomeDomain: 'health',
      unit: '',
      description: '',
      baselineMethod: '',
      communityDefined: true,
      firstNationsDataSensitive: false,
      isActive: true,
    });
  };

  const saveDefinition = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/outcome-definitions', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcomeDefinitionId: form.id || undefined,
          name: form.name.trim(),
          outcomeDomain: form.outcomeDomain,
          unit: form.unit.trim() || null,
          description: form.description.trim() || null,
          baselineMethod: form.baselineMethod.trim() || null,
          communityDefined: form.communityDefined,
          firstNationsDataSensitive: form.firstNationsDataSensitive,
          isActive: form.isActive,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save outcome definition');
      }

      setNotice({
        type: 'success',
        message: form.id ? 'Outcome definition updated.' : 'Outcome definition created.',
      });
      setSelectedDefinitionId(payload.outcomeDefinitionId || '');
      await fetchData(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save outcome definition');
      setNotice({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'Failed to save outcome definition',
      });
    } finally {
      setSaving(false);
    }
  };

  const archiveDefinition = async () => {
    if (!form.id) {
      setError('Select an existing outcome definition to archive');
      return;
    }

    setArchiving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/funding/os/outcome-definitions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcomeDefinitionId: form.id,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to archive outcome definition');
      }

      setNotice({
        type: 'success',
        message: 'Outcome definition archived.',
      });
      startNew();
      await fetchData(true);
    } catch (archiveError) {
      setError(
        archiveError instanceof Error ? archiveError.message : 'Failed to archive outcome definition'
      );
      setNotice({
        type: 'error',
        message:
          archiveError instanceof Error ? archiveError.message : 'Failed to archive outcome definition',
      });
    } finally {
      setArchiving(false);
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
                Back to Funding OS Review
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-500 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Outcome Definitions</h1>
                  <p className="text-base text-gray-600">
                    Define and maintain the community-owned outcomes that commitments can measure against.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-3 px-4 py-3 border-2 border-black bg-[#fafaf8] font-bold text-sm min-h-[52px]">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => setShowInactive(event.target.checked)}
                  className="h-4 w-4"
                />
                Show archived
              </label>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={startNew}
                className="inline-flex items-center gap-2 px-4 py-3 bg-[#fff7e6] border-2 border-black font-bold hover:bg-[#ffefc2] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Outcome
              </button>
            </div>
          </div>

          {notice && (
            <div
              className={`border-2 p-4 mb-6 font-medium ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              {notice.message}
            </div>
          )}

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-5 border-b-2 border-black">
                <h2 className="text-2xl font-black text-black">Definition Library</h2>
              </div>
              <div className="p-6 space-y-4 max-h-[52rem] overflow-auto">
                {loading && definitions.length === 0 ? (
                  <div className="text-sm text-gray-500">Loading outcome definitions…</div>
                ) : definitions.length === 0 ? (
                  <div className="text-sm text-gray-500">No outcome definitions yet.</div>
                ) : (
                  definitions.map((definition) => (
                    <button
                      key={definition.id}
                      onClick={() => setSelectedDefinitionId(definition.id)}
                      className={`w-full text-left border-2 p-4 transition-colors ${
                        definition.id === selectedDefinitionId
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-black bg-[#fafaf8] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-black">{definition.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {definition.outcome_domain}
                            {definition.unit ? ` · ${definition.unit}` : ''}
                          </div>
                        </div>
                        <div
                          className={`text-[11px] font-black uppercase tracking-[0.12em] ${
                            definition.is_active ? 'text-emerald-700' : 'text-gray-500'
                          }`}
                        >
                          {definition.is_active ? 'active' : 'archived'}
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-2">
                        Updated {formatDate(definition.updated_at)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-6 py-5 border-b-2 border-black">
                <h2 className="text-2xl font-black text-black">
                  {form.id ? 'Edit Outcome Definition' : 'Create Outcome Definition'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Domain
                    </label>
                    <select
                      value={form.outcomeDomain}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          outcomeDomain: event.target.value as OutcomeDomain,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    >
                      {OUTCOME_DOMAINS.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                      Unit
                    </label>
                    <input
                      value={form.unit}
                      onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                      className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Baseline Method
                  </label>
                  <textarea
                    value={form.baselineMethod}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, baselineMethod: event.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="inline-flex items-center gap-3 px-4 py-3 border-2 border-black bg-[#fafaf8] font-bold text-sm">
                    <input
                      type="checkbox"
                      checked={form.communityDefined}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          communityDefined: event.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Community defined
                  </label>
                  <label className="inline-flex items-center gap-3 px-4 py-3 border-2 border-black bg-[#fafaf8] font-bold text-sm">
                    <input
                      type="checkbox"
                      checked={form.firstNationsDataSensitive}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          firstNationsDataSensitive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    First Nations data sensitive
                  </label>
                  <label className="inline-flex items-center gap-3 px-4 py-3 border-2 border-black bg-[#fafaf8] font-bold text-sm">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Active
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={saveDefinition}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#eef4ff] text-[#1d4ed8] border-2 border-black font-bold hover:bg-[#dbeafe] transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Outcome'}
                  </button>

                  {form.id && (
                    <button
                      onClick={archiveDefinition}
                      disabled={archiving}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {archiving ? 'Archiving…' : 'Archive'}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
