'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Heart,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface ChatCard {
  title: string;
  subtitle?: string;
  badge?: string;
  link?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: ChatCard[];
  followUps?: string[];
  timestamp: Date;
}

interface AlmaChatProps {
  className?: string;
  embedded?: boolean;
  initialMessage?: string;
}

export function AlmaChat({
  className,
  embedded = false,
  initialMessage,
}: AlmaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial greeting on mount
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage(initialMessage || 'hi');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Don't show "hi" as user message on initial load
    if (text !== 'hi' || messages.length > 0) {
      setMessages((prev) => [...prev, userMessage]);
    }

    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        cards: data.cards,
        followUps: data.followUps,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversationId);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "I'm having trouble right now. Please try again or visit the [ALMA Dashboard](/intelligence/dashboard) directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleFollowUpClick = (followUp: string) => {
    sendMessage(followUp);
  };

  const resetChat = () => {
    setMessages([]);
    setConversationId(null);
    sendMessage('hi');
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        embedded ? 'h-full' : 'h-[600px] max-h-[80vh]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-orange-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ALMA</h3>
            <p className="text-xs text-gray-500">
              Youth Justice Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetChat}
            title="Start new conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-4 py-3',
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              {/* Message content with markdown */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 mb-2">{children}</ul>
                    ),
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <Link
                        href={href || '#'}
                        className="text-orange-600 hover:underline"
                      >
                        {children}
                      </Link>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Cards */}
              {message.cards && message.cards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.cards.map((card, idx) => (
                    <Card key={idx} variant="story" className="bg-white">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {card.title}
                            </h4>
                            {card.subtitle && (
                              <p className="text-sm text-gray-500">
                                {card.subtitle}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {card.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {card.badge}
                              </Badge>
                            )}
                            {card.link && (
                              <Link
                                href={card.link}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Follow-up suggestions */}
              {message.followUps && message.followUps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.followUps.map((followUp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUpClick(followUp)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              <span className="text-sm text-gray-500">ALMA is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about youth justice evidence..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-black hover:bg-gray-800"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          ALMA watches systems, not people. I can&apos;t provide individual
          advice.
        </p>
      </form>
    </div>
  );
}

/**
 * Floating chat widget that can be placed anywhere
 */
export function AlmaChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-orange-500 to-purple-600',
          'flex items-center justify-center',
          'hover:scale-105 transition-transform',
          isOpen && 'scale-0'
        )}
        aria-label="Open ALMA chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)]">
          <Card className="shadow-2xl overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Close chat"
              >
                <span className="text-gray-500 text-lg">&times;</span>
              </button>
            </div>
            <AlmaChat embedded />
          </Card>
        </div>
      )}
    </>
  );
}
