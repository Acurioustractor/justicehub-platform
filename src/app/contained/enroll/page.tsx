'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { campaignMedia } from '@/content/campaign';

function EnrollForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<'code' | 'details' | 'done'>('code');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [eventName, setEventName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [locationConsent, setLocationConsent] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-validate if code came from QR
  useEffect(() => {
    if (searchParams.get('code')) {
      validateCode(searchParams.get('code')!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateCode(codeValue: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enrollment/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeValue }),
      });
      const data = await res.json();
      if (data.valid) {
        setEventName(data.event_name);
        setStep('details');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function requestLocation() {
    setLocationConsent(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }

  async function handleEnroll() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enrollment/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          displayName: displayName || undefined,
          phone: phone || undefined,
          location: location || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Store auth tokens for Supabase client persistence
        if (data.authToken) {
          localStorage.setItem('jh-device-token', data.authToken);
          localStorage.setItem('jh-device-refresh', data.refreshToken || '');
          localStorage.setItem('jh-device-session', data.sessionId);
          localStorage.setItem('jh-device-name', data.displayName);
        }
        setStep('done');
        // Redirect after brief celebration
        setTimeout(() => router.push('/contained/experience'), 2000);
      } else {
        setError(data.error || 'Enrollment failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src={campaignMedia.logoSquare}
          alt="THE CONTAINED"
          width={120}
          height={120}
          className="mx-auto"
          priority
        />
      </div>

      {/* Step: Enter Code */}
      {step === 'code' && (
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold text-[#F5F0E8]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Welcome
          </h1>
          <p className="text-[#F5F0E8]/70 text-sm">
            Enter your enrollment code to begin the experience.
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CONT-XXXX"
            className="w-full px-4 py-3 bg-[#F5F0E8]/10 border border-[#F5F0E8]/20 rounded-lg text-center text-xl tracking-widest font-mono placeholder:text-[#F5F0E8]/30 focus:outline-none focus:border-[#DC2626] transition-colors"
            maxLength={12}
            autoFocus
          />

          {error && <p className="text-[#DC2626] text-sm">{error}</p>}

          <button
            onClick={() => validateCode(code)}
            disabled={!code || loading}
            className="w-full py-3 bg-[#DC2626] text-[#F5F0E8] font-bold rounded-lg disabled:opacity-40 hover:bg-[#DC2626]/90 transition-colors"
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step: Details */}
      {step === 'details' && (
        <div className="w-full max-w-sm space-y-6">
          {eventName && (
            <p className="text-center text-[#F5F0E8]/60 text-sm font-mono">{eventName}</p>
          )}

          <h2 className="text-xl font-bold text-center text-[#F5F0E8]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tell us a bit about yourself
          </h2>
          <p className="text-[#F5F0E8]/50 text-xs text-center">All fields are optional.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#F5F0E8]/70 mb-1 font-mono">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="First name is fine"
                className="w-full px-4 py-3 bg-[#F5F0E8]/10 border border-[#F5F0E8]/20 rounded-lg placeholder:text-[#F5F0E8]/30 focus:outline-none focus:border-[#DC2626] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[#F5F0E8]/70 mb-1 font-mono">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional — for follow-up only"
                className="w-full px-4 py-3 bg-[#F5F0E8]/10 border border-[#F5F0E8]/20 rounded-lg placeholder:text-[#F5F0E8]/30 focus:outline-none focus:border-[#DC2626] transition-colors"
              />
            </div>

            {!locationConsent ? (
              <button
                onClick={requestLocation}
                className="w-full py-2 border border-[#F5F0E8]/20 rounded-lg text-sm text-[#F5F0E8]/60 hover:border-[#F5F0E8]/40 transition-colors"
              >
                Allow location (helps us map our reach)
              </button>
            ) : (
              <p className="text-xs text-[#059669] text-center font-mono">
                {location ? `Location captured` : 'Requesting location...'}
              </p>
            )}
          </div>

          {error && <p className="text-[#DC2626] text-sm text-center">{error}</p>}

          <button
            onClick={handleEnroll}
            disabled={loading}
            className="w-full py-3 bg-[#DC2626] text-[#F5F0E8] font-bold rounded-lg disabled:opacity-40 hover:bg-[#DC2626]/90 transition-colors"
          >
            {loading ? 'Enrolling...' : 'Enter the Experience'}
          </button>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">&#10003;</div>
          <h2 className="text-2xl font-bold text-[#F5F0E8]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            You&apos;re in
          </h2>
          <p className="text-[#F5F0E8]/60 text-sm">
            Taking you to the experience...
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="mt-12 text-[#F5F0E8]/30 text-xs text-center max-w-xs">
        Your device stays enrolled. You can return anytime to submit reflections and recommend others.
      </p>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#F5F0E8]/50">Loading...</div>
      </div>
    }>
      <EnrollForm />
    </Suspense>
  );
}
