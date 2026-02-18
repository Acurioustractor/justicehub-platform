'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { callItOutSchema, type CallItOutFormValues, SYSTEM_TYPES, AUSTRALIAN_STATES } from '@/lib/validation';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const SYSTEM_TYPE_LABELS: Record<typeof SYSTEM_TYPES[number], string> = {
  education: 'Education',
  health: 'Health',
  policing: 'Policing',
  housing: 'Housing',
  employment: 'Employment',
  'anti-discrimination': 'Anti-discrimination body',
  other: 'Other',
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface SuccessData {
  region: string | null;
  regionCount: number;
}

export function CallItOutForm() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CallItOutFormValues>({
    resolver: zodResolver(callItOutSchema),
  });

  const onSubmit = async (data: CallItOutFormValues) => {
    setFormState('submitting');
    setServerError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || 'Something went wrong');
        setFormState('error');
        return;
      }

      setSuccessData({
        region: result.region,
        regionCount: result.regionCount,
      });
      setFormState('success');
      reset();
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  };

  if (formState === 'success') {
    return (
      <div className="border-2 border-black bg-green-50 p-8 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-700 flex-shrink-0" />
          <h3 className="text-xl font-bold text-black">Report submitted</h3>
        </div>
        <p className="text-gray-700">
          Thank you for speaking up. Your report will be reviewed by our team before being
          included in aggregated data.
        </p>
        {successData?.region && successData.regionCount > 0 && (
          <div className="border border-green-300 bg-white p-4">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-black">{successData.regionCount}</span> approved
              reports in <span className="font-bold">{successData.region}</span> so far.
              Every report makes the picture clearer.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setFormState('idle');
            setSuccessData(null);
          }}
          className="px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white font-bold tracking-wide transition-colors text-sm"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Cultural safety notice */}
      <div className="border-2 border-amber-400 bg-amber-50 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-700 flex-shrink-0" />
          <h3 className="font-bold text-black uppercase tracking-wide text-sm">
            Cultural safety &amp; data sovereignty
          </h3>
        </div>
        <ul className="text-sm text-gray-700 space-y-1.5">
          <li>This form follows CARE principles for Indigenous data governance.</li>
          <li>Your individual report is <strong>never published</strong> — only aggregated, anonymous counts appear on the map.</li>
          <li>Description and contact details are optional. You control what you share.</li>
          <li>All reports are reviewed before inclusion. We do not store IP addresses.</li>
        </ul>
      </div>

      {/* System type (required) */}
      <fieldset className="space-y-3">
        <legend className="font-bold text-black uppercase tracking-wide text-sm">
          Which system was involved? <span className="text-red-600">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SYSTEM_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 border-2 border-black px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:bg-black has-[:checked]:text-white"
            >
              <input
                type="radio"
                value={type}
                {...register('systemType')}
                className="accent-black w-4 h-4"
              />
              <span className="font-semibold text-sm">{SYSTEM_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
        {errors.systemType && (
          <p className="text-red-600 text-sm flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.systemType.message}
          </p>
        )}
      </fieldset>

      {/* Date */}
      <div className="space-y-2">
        <label htmlFor="incidentDate" className="font-bold text-black uppercase tracking-wide text-sm block">
          When did it happen?
        </label>
        <input
          type="date"
          id="incidentDate"
          {...register('incidentDate')}
          className="w-full sm:w-64 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
        />
      </div>

      {/* Location */}
      <fieldset className="space-y-4">
        <legend className="font-bold text-black uppercase tracking-wide text-sm">
          Where did it happen?
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="suburb" className="text-sm font-semibold text-gray-700 block mb-1">
              Suburb
            </label>
            <input
              type="text"
              id="suburb"
              {...register('suburb')}
              placeholder="e.g. Bankstown"
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
            />
          </div>
          <div>
            <label htmlFor="postcode" className="text-sm font-semibold text-gray-700 block mb-1">
              Postcode
            </label>
            <input
              type="text"
              id="postcode"
              {...register('postcode')}
              placeholder="e.g. 2200"
              maxLength={4}
              inputMode="numeric"
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
            />
            {errors.postcode && (
              <p className="text-red-600 text-xs mt-1">{errors.postcode.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="state" className="text-sm font-semibold text-gray-700 block mb-1">
              State/Territory
            </label>
            <select
              id="state"
              {...register('state')}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base bg-white"
            >
              <option value="">Select...</option>
              {AUSTRALIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Description (optional) */}
      <div className="space-y-2">
        <label htmlFor="description" className="font-bold text-black uppercase tracking-wide text-sm block">
          What happened? <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <p className="text-sm text-gray-600">
          A brief description helps us understand patterns. This is never published individually.
        </p>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          maxLength={2000}
          placeholder="Describe the incident..."
          className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base resize-y"
        />
        {errors.description && (
          <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Contact email (optional) */}
      <div className="space-y-2">
        <label htmlFor="contactEmail" className="font-bold text-black uppercase tracking-wide text-sm block">
          Contact email <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <p className="text-sm text-gray-600">
          Only if you want follow-up from a legal service. Never shared publicly.
        </p>
        <input
          type="email"
          id="contactEmail"
          {...register('contactEmail')}
          placeholder="your@email.com"
          className="w-full sm:w-96 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black text-base"
        />
        {errors.contactEmail && (
          <p className="text-red-600 text-xs mt-1">{errors.contactEmail.message}</p>
        )}
      </div>

      {/* Consent (required) */}
      <div className="border-2 border-black p-6 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('consentToAggregate')}
            className="accent-black w-5 h-5 mt-0.5 flex-shrink-0"
          />
          <span className="text-sm text-gray-700">
            <strong className="text-black">I consent</strong> to my report being included in
            aggregated, anonymous statistics on the JusticeHub Racism Heatmap. I understand that my
            individual report will never be published and that I can request removal by emailing{' '}
            <span className="font-semibold">privacy@justicehub.au</span>.{' '}
            <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.consentToAggregate && (
          <p className="text-red-600 text-sm flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.consentToAggregate.message}
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="border-2 border-red-500 bg-red-50 text-red-800 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === 'submitting'}
        className="w-full sm:w-auto px-8 py-4 border-2 border-black bg-black text-white font-bold uppercase tracking-wide text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {formState === 'submitting' ? 'Submitting...' : 'Submit report'}
      </button>
    </form>
  );
}
