'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Send, ExternalLink, Sparkles, Database, Users, Building2, FileText, MapPin, Scale, Heart, TrendingUp } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
}

interface SearchResult {
  type: 'intervention' | 'service' | 'person' | 'organization' | 'evidence';
  id: string;
  name: string;
  description?: string;
  url: string;
}

interface Stats {
  interventions: number;
  withOutcomes: number;
  outcomesRate: number;
  services: number;
  people: number;
  organizations: number;
}

const TYPE_ICONS = {
  intervention: Database,
  service: FileText,
  person: Users,
  organization: Building2,
  evidence: FileText
};

const TYPE_COLORS = {
  intervention: 'text-green-600 bg-green-50',
  service: 'text-blue-600 bg-blue-50',
  person: 'text-purple-600 bg-purple-50',
  organization: 'text-orange-600 bg-orange-50',
  evidence: 'text-gray-600 bg-gray-50'
};

export function ALMAChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Fetch initial stats
      if (!stats) {
        fetch('/api/chat')
          .then(res => res.json())
          .then(data => setStats(data.stats))
          .catch(console.error);
      }
    }
  }, [isOpen, stats]);

  // Listen for hash changes to open chat via #alma-chat link
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#alma-chat') {
        setIsOpen(true);
        // Clear hash after opening
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          query: input
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources
      }]);

      if (data.stats) {
        setStats(data.stats);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or explore our [Intelligence Hub](/intelligence) directly.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Suggested questions with icons and categories
  const suggestedQuestions = [
    { text: "What programs work for youth diversion?", icon: Scale, category: "Programs" },
    { text: "Find Aboriginal-led programs in Queensland", icon: MapPin, category: "Location" },
    { text: "How much does detention cost per child?", icon: TrendingUp, category: "Data" },
    { text: "How can I support youth justice reform?", icon: Heart, category: "Action" }
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all ${isOpen ? 'hidden' : 'flex'} items-center gap-2`}
        aria-label="Open ALMA Chat"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-bold text-sm hidden sm:inline">Ask ALMA</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-black bg-black text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">ALMA</h3>
                <p className="text-xs text-gray-300">Youth Justice Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
              <span className="font-bold text-green-700">{stats.interventions} programs</span>
              <span className="text-gray-500">|</span>
              <span className="font-bold text-blue-700">{stats.services} services</span>
              <span className="text-gray-500">|</span>
              <span className="font-bold text-purple-700">{stats.people} people</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Welcome Message */}
                <div className="bg-green-50 border-2 border-green-700 p-4">
                  <p className="font-bold text-green-800 mb-2">Welcome to ALMA</p>
                  <p className="text-sm text-green-700">
                    I'm your guide to Australia's youth justice intelligence. Ask me about programs, services, people, or data.
                  </p>
                </div>

                {/* Suggested Questions */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Try asking:</p>
                  {suggestedQuestions.map((q, i) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(q.text);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-3 w-full text-left p-3 text-sm border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
                      >
                        <div className="p-1.5 bg-gray-100 group-hover:bg-green-100 transition-colors">
                          <Icon className="w-4 h-4 text-gray-600 group-hover:text-green-700" />
                        </div>
                        <span className="flex-1">{q.text}</span>
                        <span className="text-xs text-gray-400 hidden sm:inline">{q.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                  {/* Message Bubble */}
                  <div className={`p-3 ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-50 border-2 border-black'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">
                      {/* Parse markdown links in the message */}
                      {msg.content.split(/(\[.*?\]\(.*?\))/).map((part, j) => {
                        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                        if (linkMatch) {
                          return (
                            <Link
                              key={j}
                              href={linkMatch[2]}
                              className={`underline font-bold ${
                                msg.role === 'user' ? 'text-green-300' : 'text-green-700'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              {linkMatch[1]}
                            </Link>
                          );
                        }
                        return part;
                      })}
                    </div>
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase">Related:</p>
                      {msg.sources.slice(0, 3).map((source, j) => {
                        const Icon = TYPE_ICONS[source.type] || FileText;
                        const colorClass = TYPE_COLORS[source.type] || 'text-gray-600 bg-gray-50';
                        return (
                          <Link
                            key={j}
                            href={source.url}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 p-2 text-xs border border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
                          >
                            <div className={`p-1 rounded ${colorClass}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="font-bold flex-1 truncate">{source.name}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading indicator with typing animation */}
            {isLoading && (
              <div className="mr-8">
                <div className="bg-gray-50 border-2 border-black p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 bg-green-100 rounded">
                      <Sparkles className="w-4 h-4 text-green-700 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-700">ALMA is thinking</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Searching {stats?.interventions || 624} programs...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t-2 border-black">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about youth justice..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border-2 border-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-black text-white font-bold border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Powered by ALMA • <Link href="/intelligence" className="underline">Explore the data</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default ALMAChat;
