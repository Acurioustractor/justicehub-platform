'use client';

import { useEffect, useRef } from 'react';

interface GHLFormProps {
  /** GHL form ID (from form embed code) */
  formId: string;
  /** Optional custom height */
  height?: string;
  /** Optional className for container */
  className?: string;
  /** Loading placeholder text */
  loadingText?: string;
}

/**
 * Embeds a GoHighLevel form directly into the page.
 *
 * To get the form ID:
 * 1. Go to GHL > Sites > Forms
 * 2. Click on your form > Share/Embed
 * 3. Copy the form ID from the embed code
 *
 * Example embed code from GHL:
 * <iframe src="https://link.msgsndr.com/widget/form/ABC123xyz" ...>
 * The form ID would be: ABC123xyz
 *
 * Usage:
 * <GHLForm formId="ABC123xyz" />
 * <GHLForm formId="steward-signup-form" height="800px" />
 */
export function GHLForm({
  formId,
  height = '600px',
  className = '',
  loadingText = 'Loading form...'
}: GHLFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // GHL forms use msgsndr.com domain
  const formUrl = `https://link.msgsndr.com/widget/form/${formId}`;

  return (
    <div
      ref={containerRef}
      className={`ghl-form-container ${className}`}
    >
      <iframe
        src={formUrl}
        style={{
          width: '100%',
          height,
          border: 'none',
          borderRadius: '4px',
        }}
        scrolling="no"
        title="Registration Form"
        loading="lazy"
      />
      <noscript>
        <p className="text-center text-earth-600 py-8">
          Please enable JavaScript to view this form, or{' '}
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ochre-600 underline"
          >
            open the form directly
          </a>.
        </p>
      </noscript>
    </div>
  );
}

/**
 * GHL Form IDs - centralized configuration
 * Update these when you create/update forms in GHL
 */
export const GHL_FORM_IDS = {
  // Main signup forms
  SIGNUP: process.env.NEXT_PUBLIC_GHL_FORM_SIGNUP || '',
  STEWARD_SIGNUP: process.env.NEXT_PUBLIC_GHL_FORM_STEWARD || '',

  // Event registration
  EVENT_REGISTRATION: process.env.NEXT_PUBLIC_GHL_FORM_EVENT || '',
  CONTAINED_LAUNCH: process.env.NEXT_PUBLIC_GHL_FORM_CONTAINED || '',

  // Newsletter
  NEWSLETTER: process.env.NEXT_PUBLIC_GHL_FORM_NEWSLETTER || '',

  // Contact
  CONTACT: process.env.NEXT_PUBLIC_GHL_FORM_CONTACT || '',
} as const;

export default GHLForm;
