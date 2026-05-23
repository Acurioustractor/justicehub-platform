'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

export default function AddServicePage() {
  const [state, setState] = useState<'form' | 'submitting' | 'done' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    setState('submitting');
    try {
      const res = await fetch('/api/exhibition/add-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json?.error || 'Submission failed');
        setState('error');
        return;
      }
      setState('done');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Nav />
        <section className="px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Check className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">Thank you.</h1>
            <p className="text-stone-700 text-lg mb-6">
              Your service has been added to the JusticeHub queue. A reviewer will check it within
              a few days. If you provided an email, we&apos;ll let you know when it goes live.
            </p>
            <Link
              href="/exhibition"
              className="inline-block px-5 py-3 rounded-md bg-stone-900 text-stone-50 font-medium hover:bg-stone-700"
            >
              Back to search
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav />

      <section className="bg-stone-900 text-stone-50 px-6 py-16 border-b border-stone-700">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3">JusticeHub · Add your service</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
            Tell us about your service.
          </h1>
          <p className="mt-4 max-w-2xl text-stone-300">
            JusticeHub catalogues organisations and programs that support young people across Australia.
            Add yours below. A reviewer will check the details before it appears in search.
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
          <Field label="Organisation or service name" name="name" required placeholder="e.g. BG Fit" />
          <Field label="Website" name="website_url" type="url" placeholder="https://" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectField label="State" name="state" required options={['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']} />
            <Field label="City / Suburb" name="city" placeholder="e.g. Mount Isa" />
          </div>
          <Field label="ABN (optional but recommended)" name="abn" pattern="^[0-9 ]{11,14}$" placeholder="11 digits, e.g. 12 345 678 901" />
          <Textarea label="What does the service do?" name="description" required placeholder="Brief description of the program — diversion, on-Country mentoring, post-release support, etc." />
          <SelectField
            label="Best category fit"
            name="proposed_sector"
            options={[
              'primary_frontline (diversion / bail / on-Country / post-release)',
              'legal_service',
              'peak_body',
              'advocacy',
              'research_academic',
              'other',
            ]}
          />
          <Field label="Contact email (for verification)" name="contact_email" type="email" placeholder="optional" />
          <Field label="Your name (so we can credit the submission)" name="submitter_name" placeholder="optional" />

          <Checkbox name="acco_certified" label="This organisation is Aboriginal Community Controlled (ORIC-registered or community-recognised)" />
          <Checkbox name="cultural_authority" label="Programs operate under cultural authority of local Elders" />

          {state === 'error' && <p className="text-rose-700 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={state === 'submitting'}
            className="w-full md:w-auto px-6 py-3 rounded-md bg-stone-900 text-stone-50 font-medium hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {state === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit for review
          </button>

          <p className="text-xs text-stone-500 max-w-prose">
            JusticeHub will review your submission before publishing. We may contact you to verify
            details. The platform uses your information to display your service in search and on
            related civic intelligence pages. We will not share your contact email publicly without
            permission.
          </p>
        </form>
      </section>
    </div>
  );
}

function Nav() {
  return (
    <nav className="bg-white border-b border-stone-200 px-6 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-6 text-sm">
        <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
        <Link href="/exhibition" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to search
        </Link>
      </div>
    </nav>
  );
}

function Field({ label, name, type = 'text', required = false, placeholder, pattern }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; pattern?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-800 mb-1 block">
        {label}{required && <span className="text-rose-600 ml-1">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        className="w-full px-4 py-2.5 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
      />
    </label>
  );
}

function SelectField({ label, name, required = false, options }: {
  label: string; name: string; required?: boolean; options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-800 mb-1 block">
        {label}{required && <span className="text-rose-600 ml-1">*</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="w-full px-4 py-2.5 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
      >
        <option value="" disabled>Choose one…</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

function Textarea({ label, name, required = false, placeholder }: {
  label: string; name: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-800 mb-1 block">
        {label}{required && <span className="text-rose-600 ml-1">*</span>}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-2.5 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
      />
    </label>
  );
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-baseline gap-3 cursor-pointer">
      <input type="checkbox" name={name} value="true" className="w-4 h-4 mt-1" />
      <span className="text-sm text-stone-700">{label}</span>
    </label>
  );
}
