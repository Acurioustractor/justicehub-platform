'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, Loader2, X, ExternalLink, ArrowLeft, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface Source {
  type: string;
  id: string;
  name: string;
  description?: string;
  url: string;
}

interface Stats {
  interventions: number;
  services: number;
  evidence: number;
  inquiries: number;
  international: number;
}

const suggestedQuestions = [
  "What are the most effective youth diversion programs in Australia?",
  "How does Australia compare to international best practices?",
  "What did the NT Royal Commission recommend?",
  "What research exists on raising the age of criminal responsibility?",
  "Which states have the highest Indigenous youth incarceration rates?",
  "What are evidence-based alternatives to youth detention?",
];

export default function ReportChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial stats
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.',
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <div className="sticky top-32 z-10 bg-white border-b-2 border-black">
        <div className="container-justice max-w-5xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/youth-justice-report"
                className="flex items-center gap-2 text-earth-600 hover:text-ochre-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Report
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-ochre-600" />
                <h1 className="text-xl font-bold">Ask ALMA</h1>
              </div>
            </div>

            {stats && (
              <div className="hidden md:flex items-center gap-4 text-sm text-earth-600">
                <span>{stats.interventions.toLocaleString()} programs</span>
                <span>•</span>
                <span>{stats.evidence} studies</span>
                <span>•</span>
                <span>{stats.inquiries} inquiries</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="container-justice max-w-4xl py-8">
        <div className="bg-white border-2 border-black min-h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-ochre-100 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-ochre-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ask ALMA About Youth Justice</h2>
                <p className="text-earth-600 mb-8 max-w-md mx-auto">
                  Get instant answers powered by Australia&apos;s most comprehensive
                  youth justice intelligence database.
                </p>

                {/* Suggested Questions */}
                <div className="text-left max-w-lg mx-auto">
                  <div className="flex items-center gap-2 text-sm font-bold text-earth-600 mb-3">
                    <Lightbulb className="w-4 h-4" />
                    Try asking:
                  </div>
                  <div className="space-y-2">
                    {suggestedQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="w-full text-left p-3 border border-gray-200 hover:border-ochre-500 hover:bg-ochre-50 transition-colors text-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 ${
                      message.role === 'user'
                        ? 'bg-ochre-600 text-white'
                        : 'bg-sand-100 border border-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-300">
                        <div className="text-xs font-bold uppercase tracking-wider text-earth-500 mb-2">
                          Sources
                        </div>
                        <div className="space-y-1">
                          {message.sources.slice(0, 5).map((source, i) => (
                            <Link
                              key={i}
                              href={source.url}
                              className="flex items-center gap-2 text-sm text-ochre-700 hover:text-ochre-900"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{source.name}</span>
                              <span className="text-xs text-earth-500">({source.type})</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-sand-100 border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-earth-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ALMA is thinking...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-2 border-black p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about youth justice programs, research, or policy..."
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-black focus:border-ochre-500 focus:outline-none disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-ochre-600 text-white font-bold hover:bg-ochre-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-earth-500 mt-2">
              ALMA searches {stats?.interventions.toLocaleString() || '1000+'} programs,{' '}
              {stats?.evidence || '200+'} research papers, and {stats?.inquiries || '50+'} inquiries.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/youth-justice-report/interventions"
            className="p-4 border-2 border-black bg-white hover:bg-ochre-50 transition-colors text-center"
          >
            <div className="text-2xl font-bold text-ochre-600">
              {stats?.interventions.toLocaleString() || '1000+'}
            </div>
            <div className="text-sm text-earth-600">Programs</div>
          </Link>
          <Link
            href="/youth-justice-report/research"
            className="p-4 border-2 border-black bg-white hover:bg-eucalyptus-50 transition-colors text-center"
          >
            <div className="text-2xl font-bold text-eucalyptus-600">
              {stats?.evidence || '200+'}
            </div>
            <div className="text-sm text-earth-600">Research Papers</div>
          </Link>
          <Link
            href="/youth-justice-report/inquiries"
            className="p-4 border-2 border-black bg-white hover:bg-sand-100 transition-colors text-center"
          >
            <div className="text-2xl font-bold text-earth-600">
              {stats?.inquiries || '50+'}
            </div>
            <div className="text-sm text-earth-600">Inquiries</div>
          </Link>
          <Link
            href="/youth-justice-report/international"
            className="p-4 border-2 border-black bg-white hover:bg-blue-50 transition-colors text-center"
          >
            <div className="text-2xl font-bold text-blue-600">
              {stats?.international || '15+'}
            </div>
            <div className="text-sm text-earth-600">Countries</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
