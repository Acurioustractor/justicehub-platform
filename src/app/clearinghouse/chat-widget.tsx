'use client';

import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

export default function ChatWidget() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch('/api/clearinghouse/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, limit: 6 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setAnswer(json.answer || 'No answer returned.');
    } catch (err: any) {
      setError(err.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <form onSubmit={handleAsk} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about cases, campaigns, docs..."
            className="flex-1 px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 text-sm text-red-700 font-bold border-2 border-red-600 bg-red-50 px-3 py-2">
          {error}
        </div>
      )}

      {answer && (
        <div className="mt-4 text-sm text-gray-900 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
