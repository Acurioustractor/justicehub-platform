'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export function ContributeForm() {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'sending' });
    const fd = new FormData(e.currentTarget);
    const payload = {
      contributor_name: fd.get('contributor_name'),
      contributor_email: fd.get('contributor_email'),
      contributor_org: fd.get('contributor_org'),
      item_type: fd.get('item_type'),
      title: fd.get('title'),
      jurisdiction_or_region: fd.get('jurisdiction_or_region'),
      year: fd.get('year') || null,
      summary: fd.get('summary'),
      link: fd.get('link'),
      notes: fd.get('notes'),
      hp: fd.get('hp'),
    };
    try {
      const res = await fetch('/api/justice-matrix/contribute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setState({ kind: 'success' });
        (e.target as HTMLFormElement).reset();
      } else {
        setState({
          kind: 'error',
          message: (json.details && json.details[0]) || json.error || 'Submission failed.',
        });
      }
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message || 'Network error' });
    }
  }

  if (state.kind === 'success') {
    return (
      <div
        className="rounded-[22px] border p-8 text-center"
        style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
      >
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#3d6f4a' }} />
        <h3
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, color: '#2b2530' }}
          className="text-3xl mb-2 leading-tight"
        >
          Thank you. Your contribution is in the review queue.
        </h3>
        <p className="text-sm leading-6 mb-4" style={{ color: '#584b40' }}>
          A curator will review it shortly. If it&apos;s accepted, you&apos;ll see it appear in the public matrix. We may contact you at the email you provided if we need clarification.
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: 'idle' })}
          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold border hover:bg-white transition-colors"
          style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[22px] border p-6 md:p-8 space-y-6"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', boxShadow: '0 16px 40px rgba(49,31,15,0.06)' }}
    >
      {/* honeypot: hidden from real users, irresistible to naive bots */}
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
      />

      <FormSection title="Who you are">
        <Field name="contributor_name" label="Your name" required />
        <Field name="contributor_email" label="Email" type="email" required />
        <Field name="contributor_org" label="Organisation (optional)" />
      </FormSection>

      <FormSection title="What you&rsquo;re contributing">
        <Select
          name="item_type"
          label="Type"
          required
          options={[
            ['case', 'Strategic litigation case'],
            ['campaign', 'Advocacy campaign'],
          ]}
        />
        <Field name="title" label="Title or citation" required placeholder="e.g. Hirsi Jamaa v Italy or Lift the Ban" />
        <Field
          name="jurisdiction_or_region"
          label="Jurisdiction or region"
          placeholder="e.g. ECtHR / United Kingdom / Australia"
        />
        <Field name="year" label="Year (optional)" type="number" placeholder="2024" />
        <Field name="link" label="Authoritative link (optional)" type="url" placeholder="https://…" />
        <Textarea
          name="summary"
          label="Summary"
          required
          placeholder="For a case: the strategic issue, the holding, why it matters. For a campaign: the goal, lead organisations, tactics, where it stands."
        />
        <Textarea
          name="notes"
          label="Anything else we should know (optional)"
          placeholder="Connections to existing entries, request for confidentiality, source you can&apos;t link to publicly, etc."
        />
      </FormSection>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={state.kind === 'sending'}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border disabled:opacity-60 transition-colors"
          style={{ background: '#4a2560', color: '#f8f1e6', borderColor: '#4a2560' }}
        >
          {state.kind === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
          {state.kind === 'sending' ? 'Submitting…' : 'Submit for review'}
        </button>
        {state.kind === 'error' && (
          <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: '#8a2a2a' }}>
            <AlertCircle className="w-4 h-4" />
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3"
        style={{ color: '#8d6a44' }}
      >
        <span dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
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
    <label className="block text-xs sm:col-span-1">
      <span className="font-semibold" style={{ color: '#2b2530' }}>
        {label}
        {required && <span style={{ color: '#8a2a2a' }}> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-[12px] px-3 py-2 text-sm border focus:outline-none"
        style={{ background: '#f8f1e6', borderColor: '#e6d7c1', color: '#2b2530' }}
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
  options: Array<[string, string]>;
}) {
  return (
    <label className="block text-xs sm:col-span-2">
      <span className="font-semibold" style={{ color: '#2b2530' }}>
        {label}
        {required && <span style={{ color: '#8a2a2a' }}> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="mt-1 w-full rounded-[12px] px-3 py-2 text-sm border focus:outline-none"
        style={{ background: '#f8f1e6', borderColor: '#e6d7c1', color: '#2b2530' }}
      >
        <option value="" disabled>
          Choose one…
        </option>
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
  required,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs sm:col-span-2">
      <span className="font-semibold" style={{ color: '#2b2530' }}>
        {label}
        {required && <span style={{ color: '#8a2a2a' }}> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={5}
        className="mt-1 w-full rounded-[12px] px-3 py-2 text-sm border focus:outline-none leading-6"
        style={{ background: '#f8f1e6', borderColor: '#e6d7c1', color: '#2b2530' }}
      />
    </label>
  );
}
