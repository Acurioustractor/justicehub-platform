'use client';

import { useState } from 'react';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  orgId: string;
  orgName: string;
}

export function ContactModal({ orgId, orgName }: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    setOpen(false);
    if (success) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: `Inquiry about ${orgName}`,
          category: 'support',
          message: message.trim(),
          organization: orgName,
          organization_id: orgId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true); }}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#43302b] text-white font-bold rounded-lg hover:bg-[#5c4033] transition-colors shadow-lg"
      >
        <Send className="w-5 h-5" /> Get in Touch
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-[#43302b] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">Contact {orgName}</h2>
              <button onClick={handleClose} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Message Sent</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for reaching out. {orgName} will get back to you soon.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-[#43302b] text-white font-bold rounded-lg hover:bg-[#5c4033] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={200}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                    placeholder="04XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={5000}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors resize-none"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
