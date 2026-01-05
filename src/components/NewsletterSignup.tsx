'use client';

import { useState } from 'react';
import { Mail, Loader2, Check, X } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'stacked' | 'minimal';
  subscriptionType?: 'general' | 'steward' | 'researcher' | 'youth';
  className?: string;
  showName?: boolean;
  showOrganization?: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  darkMode?: boolean;
}

export default function NewsletterSignup({
  variant = 'inline',
  subscriptionType = 'general',
  className = '',
  showName = false,
  showOrganization = false,
  title,
  description,
  buttonText = 'Subscribe',
  successMessage = "You're subscribed! Check your inbox for updates.",
  darkMode = false,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/ghl/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName || undefined,
          organization: organization || undefined,
          subscription_type: subscriptionType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setEmail('');
      setFullName('');
      setOrganization('');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  const baseInputClasses = darkMode
    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-ochre-500'
    : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-ochre-500';

  const baseButtonClasses = 'bg-ochre-600 text-white font-bold hover:bg-ochre-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-3 p-4 ${darkMode ? 'bg-eucalyptus-900/30 border-eucalyptus-500/50' : 'bg-eucalyptus-50 border-eucalyptus-200'} border ${className}`}>
        <Check className="w-5 h-5 text-eucalyptus-500 flex-shrink-0" />
        <p className={darkMode ? 'text-eucalyptus-200' : 'text-eucalyptus-800'}>
          {successMessage}
        </p>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className={`flex-1 px-4 py-2 border focus:outline-none ${baseInputClasses}`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`px-4 py-2 ${baseButtonClasses} flex items-center gap-2`}
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
        </button>
      </form>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={className}>
        {title && (
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
            {title}
          </h3>
        )}
        {description && (
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-earth-600'}`}>
            {description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {showName && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className={`w-full px-4 py-3 border focus:outline-none ${baseInputClasses}`}
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={`w-full px-4 py-3 border focus:outline-none ${baseInputClasses}`}
          />

          {showOrganization && (
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Organization (optional)"
              className={`w-full px-4 py-3 border focus:outline-none ${baseInputClasses}`}
            />
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <X className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full py-3 ${baseButtonClasses} flex items-center justify-center gap-2`}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                {buttonText}
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Default: inline variant
  return (
    <div className={className}>
      {title && (
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
          {title}
        </h3>
      )}
      {description && (
        <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-earth-600'}`}>
          {description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        {showName && (
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className={`sm:w-40 px-4 py-3 border focus:outline-none ${baseInputClasses}`}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className={`flex-1 px-4 py-3 border focus:outline-none ${baseInputClasses}`}
        />

        <button
          type="submit"
          disabled={status === 'loading'}
          className={`px-6 py-3 ${baseButtonClasses} flex items-center justify-center gap-2 whitespace-nowrap`}
        >
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            buttonText
          )}
        </button>
      </form>

      {status === 'error' && (
        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
          <X className="w-4 h-4" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
