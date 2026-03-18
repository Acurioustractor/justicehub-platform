'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  MessageCircle,
  Sparkles,
  Heart,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface AlmaChatProps {
  className?: string;
  embedded?: boolean;
  starterQuestions?: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function ToolResultCard({ toolType, part }: { toolType: string; part: any }) {
  const toolName = toolType.replace(/^tool-/, '');
  const result = part.output as Record<string, any> | undefined;
  if (!result || part.state !== 'result') return null;

  if (toolName === 'search_interventions' && Array.isArray(result.interventions)) {
    const items = result.interventions;
    if (items.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(items.length)} interventions
        </p>
        {items.slice(0, 5).map((item: any, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900">{String(item.name)}</span>
              {item.evidence_level && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {String(item.evidence_level)}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {item.geography && (
                <span>{Array.isArray(item.geography) ? item.geography.join(', ') : String(item.geography)}</span>
              )}
              {item.type && <span>{String(item.type)}</span>}
              {item.cost_per_young_person && (
                <span className="font-medium text-gray-700">
                  ${Number(item.cost_per_young_person).toLocaleString()}/person
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'get_spending_data' && Array.isArray(result.spending)) {
    return (
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1.5">
          <Database className="w-3 h-3" /> ROGS 2026 Spending Data
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1.5 pr-3 font-semibold text-gray-700">Category</th>
                {Object.keys(result.spending[0] || {})
                  .filter((k: string) => !['category', 'financial_year', 'unit'].includes(k))
                  .map((st: string) => (
                    <th key={st} className="py-1.5 px-2 font-semibold text-gray-700 text-right">
                      {st}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {result.spending.map((row: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5 pr-3 text-gray-600">{String(row.category)}</td>
                  {Object.entries(row)
                    .filter(([k]) => !['category', 'financial_year', 'unit'].includes(k))
                    .map(([st, val]) => (
                      <td key={st} className="py-1.5 px-2 text-right tabular-nums font-medium text-gray-900">
                        {val != null ? String(val) : '\u2014'}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.note && <p className="text-[10px] text-gray-400 mt-1">{String(result.note)}</p>}
      </div>
    );
  }

  if (toolName === 'compare_jurisdictions' && Array.isArray(result.comparison)) {
    const items = result.comparison;
    const valueKey = Object.keys(items[0] || {}).find((k: string) => k !== 'state') || '';
    return (
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1.5">
          <Database className="w-3 h-3" /> {String(result.metric)}
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
          <div className="grid grid-cols-4 gap-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="text-center p-1.5 rounded bg-white border border-gray-100">
                <div className="font-semibold text-gray-700 text-[11px]">{String(item.state)}</div>
                <div className="tabular-nums text-gray-900 font-medium mt-0.5">
                  {item[valueKey] != null ? Number(item[valueKey]).toLocaleString() : '\u2014'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (toolName === 'search_cases') {
    const cases = (result.cases || []) as any[];
    const inquiries = (result.inquiries || []) as any[];
    if (cases.length === 0 && inquiries.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.total)} cases/inquiries
        </p>
        {cases.slice(0, 3).map((c: any, i: number) => (
          <div key={`case-${i}`} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(c.case_citation)}</span>
            <div className="flex gap-2 mt-1 text-gray-500">
              {c.jurisdiction && <span>{String(c.jurisdiction)}</span>}
              {c.outcome && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {String(c.outcome)}
                </Badge>
              )}
            </div>
          </div>
        ))}
        {inquiries.slice(0, 3).map((inq: any, i: number) => (
          <div key={`inq-${i}`} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(inq.title)}</span>
            <div className="flex gap-2 mt-1 text-gray-500">
              {inq.jurisdiction && <span>{String(inq.jurisdiction)}</span>}
              {inq.year_published && <span>{String(inq.year_published)}</span>}
              {inq.recommendations_count && (
                <span className="font-medium">{String(inq.recommendations_count)} recommendations</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'get_coverage_stats') {
    return (
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1.5">
          <Database className="w-3 h-3" /> ALMA Coverage Stats
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(result)
            .filter(([k]) => !['source'].includes(k))
            .map(([key, val]) => (
              <div key={key} className="flex justify-between py-0.5">
                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium tabular-nums text-gray-900">{Number(val).toLocaleString()}</span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (toolName === 'search_funding' && Array.isArray(result.funding)) {
    if (result.funding.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> {String(result.count)} funding records ({String(result.total_amount_shown)})
        </p>
        {result.funding.slice(0, 5).map((f: any, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900 truncate">{String(f.recipient_name)}</span>
              {f.amount_dollars != null && (
                <span className="font-semibold text-gray-900 tabular-nums shrink-0">
                  ${Number(f.amount_dollars).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {f.program_name && <span>{String(f.program_name)}</span>}
              {f.state && <span>{String(f.state).toUpperCase()}</span>}
              {f.financial_year && <span>{String(f.financial_year)}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'search_evidence') {
    const evidence = (result.evidence || []) as any[];
    const findings = (result.findings || []) as any[];
    if (evidence.length === 0 && findings.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.total)} evidence items
        </p>
        {evidence.slice(0, 4).map((e: any, i: number) => (
          <div key={`ev-${i}`} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(e.title)}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {e.evidence_type && <span>{String(e.evidence_type)}</span>}
              {e.year_published && <span>{String(e.year_published)}</span>}
            </div>
          </div>
        ))}
        {findings.slice(0, 3).map((f: any, i: number) => (
          <div key={`fn-${i}`} className="bg-blue-50 border border-blue-200 rounded-md p-2.5 text-xs">
            <div className="flex items-center gap-2">
              {f.finding_type && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {String(f.finding_type)}
                </Badge>
              )}
              {f.confidence && (
                <span className="text-blue-600 text-[10px]">{String(f.confidence)} confidence</span>
              )}
            </div>
            <p className="text-gray-700 mt-1 line-clamp-2">{String(f.content)}</p>
          </div>
        ))}
      </div>
    );
  }

  // Generic fallback for search_campaigns, search_media
  if (toolName === 'search_campaigns' && Array.isArray(result.campaigns)) {
    if (result.campaigns.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.count)} campaigns
        </p>
        {result.campaigns.slice(0, 5).map((c: any, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(c.campaign_name)}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {c.country_region && <span>{String(c.country_region)}</span>}
              {c.outcome_status && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {String(c.outcome_status)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'search_media' && Array.isArray(result.articles)) {
    if (result.articles.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.count)} articles
        </p>
        {result.articles.slice(0, 5).map((a: any, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(a.headline)}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {a.source_name && <span>{String(a.source_name)}</span>}
              {a.published_date && <span>{String(a.published_date)}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'search_stories' && Array.isArray(result.stories)) {
    if (result.stories.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.count)} stories
        </p>
        {result.stories.slice(0, 5).map((s: any, i: number) => (
          <div key={i} className="bg-orange-50 border border-orange-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(s.title)}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {s.story_type && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {String(s.story_type).replace('_', ' ')}
                </Badge>
              )}
              {s.featured && <span className="text-orange-600 font-medium">Featured</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'search_organizations') {
    const orgs = (result.organizations || []) as any[];
    const charities = (result.charities || []) as any[];
    if (orgs.length === 0 && charities.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.total)} organizations
        </p>
        {orgs.slice(0, 5).map((o: any, i: number) => (
          <div key={`org-${i}`} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(o.name)}</span>
            {o.description && <p className="text-gray-500 mt-0.5 line-clamp-1">{String(o.description)}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'search_foundations' && Array.isArray(result.foundations)) {
    if (result.foundations.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.count)} foundations
        </p>
        {result.foundations.slice(0, 5).map((f: any, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900 truncate">{String(f.name)}</span>
              {f.total_giving_annual && (
                <span className="font-semibold text-gray-900 tabular-nums shrink-0">
                  {String(f.total_giving_annual)}/yr
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              {Array.isArray(f.thematic_focus) && f.thematic_focus.slice(0, 3).map((t: string, j: number) => (
                <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === 'search_events' && Array.isArray(result.events)) {
    if (result.events.length === 0) return null;
    return (
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Found {String(result.count)} events
        </p>
        {result.events.slice(0, 5).map((ev: any, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs">
            <span className="font-medium text-gray-900">{String(ev.title)}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-gray-500">
              {ev.location_name && <span>{String(ev.location_name)}</span>}
              {ev.start_date && <span>{String(ev.start_date).slice(0, 10)}</span>}
              {ev.event_type && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {String(ev.event_type)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Generic count fallback
  const count = result.count ?? result.total;
  if (count != null) {
    return (
      <div className="mt-2">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Database className="w-3 h-3" /> Queried {String(count)} results
        </p>
      </div>
    );
  }

  return null;
}

/** Get the text content from a UIMessage's parts array */
function getMessageText(parts: any[]): string {
  return parts
    .filter((p: any) => p.type === 'text')
    .map((p: any) => p.text as string)
    .join('');
}

/** Check if any part is a tool invocation that hasn't completed yet */
function hasActiveToolCall(parts: any[]): boolean {
  return parts.some(
    (p: any) => typeof p.type === 'string' && p.type.startsWith('tool-') && p.state !== 'result'
  );
}

const chatTransport = new DefaultChatTransport({ api: '/api/chat/stream' });

export function AlmaChat({
  className,
  embedded = false,
  starterQuestions,
}: AlmaChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    transport: chatTransport,
    onError: (err) => {
      console.error('[ALMA Chat] Error:', err);
      setError('Something went wrong. Please try again.');
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Focus input after loading completes
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    setError(null);
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const resetChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleStarterClick = (question: string) => {
    setError(null);
    sendMessage({ text: question });
  };

  const showStarters = messages.length === 0 && !isLoading;

  return (
    <div
      className={cn(
        'flex flex-col bg-white',
        embedded ? 'h-full' : 'h-[600px] max-h-[80vh]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 tracking-tight">ALMA</h3>
            <p className="text-[11px] text-gray-500">Youth Justice Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-gray-300 text-gray-500">
            <Sparkles className="w-3 h-3 mr-1" />
            Live Data
          </Badge>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetChat}
              className="h-7 w-7"
              title="New conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Starter questions when empty */}
        {showStarters && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">Ask ALMA anything</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                826 programs, ROGS spending data, research evidence, and legal cases — all queryable.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {(starterQuestions || [
                'How much does Australia spend on youth detention?',
                'What programs reduce recidivism?',
                'Compare NT and VIC youth justice spending',
                'What campaigns are active for Raise the Age?',
              ]).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleStarterClick(q)}
                  className="text-left text-sm px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message: any) => {
          const isUser = message.role === 'user';
          const text = getMessageText(message.parts);
          const toolParts = message.parts.filter(
            (p: any) => typeof p.type === 'string' && p.type.startsWith('tool-')
          );

          return (
            <div
              key={message.id}
              className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                  isUser
                    ? 'bg-gray-100 text-gray-900 border border-gray-200'
                    : 'bg-transparent'
                )}
              >
                {/* User messages: plain text, no markdown */}
                {isUser && text && (
                  <p className="text-sm leading-relaxed">{text}</p>
                )}

                {/* Assistant messages: rich markdown */}
                {!isUser && text && (
                  <div className="text-sm text-gray-900 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">{children}</strong>
                        ),
                        a: ({ href, children }) => (
                          <Link
                            href={href || '#'}
                            className="text-orange-600 hover:underline"
                          >
                            {children}
                          </Link>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3 rounded-md border border-gray-200">
                            <table className="text-xs border-collapse w-full">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border-b border-gray-200 px-3 py-1.5 bg-gray-50 text-left font-semibold text-gray-700">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border-b border-gray-100 px-3 py-1.5 tabular-nums">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Tool invocation results */}
                {toolParts.map((part: any, idx: number) => (
                  <ToolResultCard key={idx} toolType={part.type} part={part} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              <span className="text-sm text-gray-500">
                {messages.some((m: any) => hasActiveToolCall(m.parts))
                  ? 'Querying data...'
                  : status === 'submitted'
                    ? 'ALMA is thinking...'
                    : 'Streaming response...'}
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 ml-1"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about youth justice data, spending, programs..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-orange-600 hover:bg-orange-700 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-gray-400 text-center">
          ALMA watches systems, not people. Data from ROGS, AIHW, and verified programs.
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
