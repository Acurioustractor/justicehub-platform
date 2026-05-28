'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const SOURCE_TYPES = [
  'court_database',
  'legal_database',
  'advocacy_org',
  'regional_body',
  'research',
  'government',
  'community',
  'academic',
  'advocacy',
] as const;

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'success'; id: string }
  | { kind: 'error'; message: string };

export function NewSourceForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'sending' });
    const fd = new FormData(e.currentTarget);
    const jurisdictionsRaw = String(fd.get('jurisdictions') ?? '');
    const payload = {
      name: fd.get('name'),
      source_type: fd.get('source_type'),
      url: fd.get('url'),
      region: fd.get('region'),
      jurisdictions: jurisdictionsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      organization: fd.get('organization'),
      description: fd.get('description'),
      data_format: fd.get('data_format'),
      scrape_frequency: fd.get('scrape_frequency'),
      scrape_priority: fd.get('scrape_priority'),
      is_active: fd.get('is_active') === 'on',
    };
    try {
      const res = await fetch('/api/justice-matrix/sources', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) setState({ kind: 'success', id: json.id });
      else
        setState({
          kind: 'error',
          message:
            (json.details && json.details[0]) || json.error || 'Add failed.',
        });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message || 'Network error' });
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-700" />
        <h3 className="font-black text-2xl mb-2">Source added</h3>
        <p className="text-sm text-gray-600 mb-4">
          New row id <code className="bg-gray-100 px-1">{state.id}</code>. The scanner picks it up on the next run.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => router.push('/admin/justice-matrix/sources')}
            className="px-4 py-2 bg-black text-white font-bold border-2 border-black"
          >
            Back to source health
          </button>
          <button
            onClick={() => setState({ kind: 'idle' })}
            className="px-4 py-2 bg-white text-black font-bold border-2 border-black"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6"
    >
      <Section title="Identity">
        <Field name="name" label="Name" required placeholder="e.g. CourtListener (US Federal Courts)" />
        <Field name="organization" label="Organisation" placeholder="e.g. Free Law Project" />
        <Field name="url" label="URL" type="url" required placeholder="https://..." />
      </Section>

      <Section title="Classification">
        <Select name="source_type" label="Source type" required options={SOURCE_TYPES.map((s) => [s, s])} />
        <Field name="region" label="Region" placeholder="e.g. global / europe / americas / Australia" />
        <Field
          name="jurisdictions"
          label="Jurisdictions (comma-separated)"
          placeholder="e.g. UK, IE  or  NSW, VIC, QLD"
        />
      </Section>

      <Section title="Scanning">
        <Select
          name="data_format"
          label="Data format"
          options={[
            ['html', 'html — Playwright + LLM extraction (default)'],
            ['json', 'json — direct API adapter (CJEU-style)'],
          ]}
        />
        <Select
          name="scrape_frequency"
          label="Frequency"
          options={[
            ['daily', 'daily'],
            ['weekly', 'weekly (default)'],
            ['monthly', 'monthly'],
            ['quarterly', 'quarterly'],
            ['yearly', 'yearly'],
          ]}
        />
        <Field name="scrape_priority" label="Priority (1=top, 10=last)" type="number" placeholder="5" />
        <label className="flex items-center gap-2 text-xs font-bold col-span-2">
          <input type="checkbox" name="is_active" defaultChecked className="w-4 h-4 accent-black" />
          Active (scanner picks it up)
        </label>
      </Section>

      <Section title="Notes">
        <Textarea name="description" label="Description" placeholder="What this source covers and any caveats" />
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={state.kind === 'sending'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-bold border-2 border-black disabled:opacity-60"
        >
          {state.kind === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
          {state.kind === 'sending' ? 'Adding…' : 'Add source'}
        </button>
        {state.kind === 'error' && (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="font-bold text-black">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
      />
    </label>
  );
}

function Select({
  name,
  label,
  required,
  options,
}: {
  name: string;
  label: string;
  required?: boolean;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <label className="block text-xs">
      <span className="font-bold text-black">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm bg-white"
      >
        {required && (
          <option value="" disabled>
            Choose one…
          </option>
        )}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs col-span-2">
      <span className="font-bold text-black">{label}</span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        className="mt-1 w-full px-2 py-1.5 border-2 border-gray-300 focus:border-black focus:outline-none text-sm"
      />
    </label>
  );
}
