'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, UserCheck, Loader2 } from 'lucide-react';

interface ClaimProfileProps {
  profileId: string;
  profileName: string;
  profileSlug: string;
  profileEmail: string | null;
}

export function ClaimProfile({ profileId, profileName, profileSlug, profileEmail }: ClaimProfileProps) {
  const [email, setEmail] = useState(profileEmail || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const searchParams = useSearchParams();
  const claimParam = searchParams.get('claim');

  const supabase = createClient();

  // Auto-claim if user arrived via magic link with claim param
  useEffect(() => {
    if (claimParam === profileId) {
      handleClaim();
    }
  }, [claimParam]);

  async function handleClaim() {
    setClaiming(true);
    setError('');
    try {
      const res = await fetch('/api/profiles/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, step: 'link' }),
      });
      const data = await res.json();

      if (data.claimed) {
        setClaimed(true);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to claim profile');
    } finally {
      setClaiming(false);
    }
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/profiles/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, email: email.trim(), step: 'send-link' }),
      });
      const data = await res.json();

      if (data.sent) {
        setSent(true);
      } else if (data.claimed) {
        setError('This profile has already been claimed.');
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to send link');
    } finally {
      setSending(false);
    }
  }

  if (claimed) {
    return (
      <div className="bg-[#059669]/10 border-2 border-[#059669] p-6 mt-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-[#059669]" />
          <div>
            <p className="font-bold text-[#059669]">Profile claimed!</p>
            <p className="text-sm text-gray-600">
              You can now <a href={`/people/${profileSlug}/edit`} className="underline font-bold">edit your profile</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (claiming) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 p-6 mt-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        <p className="text-gray-600">Linking your account to this profile...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-600 text-sm font-bold hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
      >
        <UserCheck className="h-4 w-4" />
        Is this you? Claim this profile
      </button>
    );
  }

  return (
    <div className="bg-[#F5F0E8] border-2 border-[#0A0A0A] p-6 mt-6">
      <h3 className="font-bold text-lg mb-2">Claim this profile</h3>
      <p className="text-sm text-gray-600 mb-4">
        If you are {profileName}, enter your email and we&apos;ll send you a sign-in link.
        Once signed in, this profile will be linked to your account and you can edit it.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {sent ? (
        <div className="bg-[#059669]/10 border border-[#059669] p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#059669]" />
            <p className="text-[#059669] font-bold text-sm">
              Check your email for a sign-in link. Click it to claim this profile.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendLink} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 bg-[#0A0A0A] text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Link'}
          </button>
        </form>
      )}

      <button
        onClick={() => setShow(false)}
        className="mt-3 text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}
