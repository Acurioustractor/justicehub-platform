'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Users, Heart, MapPin, Mic, Shield, HandHeart,
  ArrowRight, CheckCircle, Sparkles, Globe,
  BookOpen, MessageCircle, Phone, Mail, Loader2,
  Lock, Database, FileCheck, Download
} from 'lucide-react';

interface Basecamp {
  slug: string;
  name: string;
  region: string;
  description: string;
  stats: { label: string; value: string }[];
}

const FALLBACK_ANCHORS: Basecamp[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Mparntwe (Alice Springs), NT',
    description: 'Eastern Arrernte Country. Cultural authority leads. 21 active young people.',
    stats: [{ label: 'diversion', value: '95%' }],
  },
  {
    slug: 'palm-island-community-company',
    name: 'Palm Island Community Company',
    region: 'The Centre, Townsville, QLD',
    description: 'Bwgcolman / Manbarra Country. Stretch Beds enterprise live.',
    stats: [{ label: 'live', value: 'Stretch Beds' }],
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    description: 'Kalkadoon Country. 400+ young people each year.',
    stats: [{ label: 'diversion', value: '85%' }],
  },
  {
    slug: 'mmeic',
    name: 'MMEIC',
    region: 'Minjerribah / North Stradbroke Island, QLD',
    description: 'Quandamooka Country. Minjerribah Moorgumpin Elders-in-Council. Elder-led.',
    stats: [{ label: 'authority', value: 'Elder-led' }],
  },
];

export default function ForCommunityLeadersPage() {
  const [anchors, setAnchors] = useState<Basecamp[]>(FALLBACK_ANCHORS);
  const [anchorsLoading, setAnchorsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/basecamps')
      .then((res) => res.json())
      .then((data: Basecamp[]) => {
        if (Array.isArray(data) && data.length > 0) setAnchors(data);
      })
      .catch(console.error)
      .finally(() => setAnchorsLoading(false));
  }, []);

  const onramp = [
    {
      n: '01',
      title: 'Claim your organisation',
      body:
        'Your org already has an entry on JusticeHub, drawn from public records. Claiming it puts the page under your control. We verify with you, not over you. ACNC lookup, an introduction call, a yarn on Country if you prefer.',
      icon: FileCheck,
    },
    {
      n: '02',
      title: 'Own your data',
      body:
        'Per-storyteller consent. Per-young-person journal. Per-community volume. Withdrawable any moment. OCAP-aligned. The infrastructure is audited externally and the audit is published.',
      icon: Lock,
    },
    {
      n: '03',
      title: 'Publish on your terms',
      body:
        'You decide what is public, what is private, and what travels. Stories sit in Empathy Ledger with the storyteller named and credited. Programs sit on JusticeHub with the metrics you choose.',
      icon: Mic,
    },
    {
      n: '04',
      title: 'Travel when you choose',
      body:
        'Your work becomes findable through the Australian Living Map of Alternatives, indexed nationally on your terms. CivicGraph reads the funding map against the work map, so funders find you.',
      icon: Globe,
    },
  ];

  const sovereigntyMechanics = [
    {
      kicker: 'Consent',
      title: 'Per-storyteller, withdrawable.',
      body:
        'Every story carries the storyteller&apos;s name and a consent record they can revoke. No aggregate clauses. No buried opt-outs. If a story is withdrawn, it leaves the public layer that day.',
      icon: Shield,
    },
    {
      kicker: 'OCAP-aligned',
      title: 'Ownership, control, access, possession.',
      body:
        'The four OCAP principles are the architecture, not a footnote. Communities own the data. Communities control how it is used. Communities access it on their schedule. Communities possess the canonical copy.',
      icon: Database,
    },
    {
      kicker: 'Audited',
      title: 'External technical audit, published.',
      body:
        'In Year 1 the consent layer is audited by an external technical reviewer and the audit lands as a public partnership artefact. You do not have to take our word for it.',
      icon: FileCheck,
    },
    {
      kicker: 'No vendor lock',
      title: 'Your data is portable. Always.',
      body:
        'Export everything you have given JusticeHub at any time, in open formats. If the partnership ends, the data is yours and travels with you. No exit fee. No retention clause.',
      icon: Download,
    },
  ];

  const platformLayer = [
    { name: 'JusticeHub', role: 'Your organisation page, your programs, your impact metrics, your case studies. The public face of the work.' },
    { name: 'Empathy Ledger', role: 'The story layer. Per-storyteller consent, transcripts, galleries, films. Where narratives sit when the storyteller has said yes.' },
    { name: 'Australian Living Map of Alternatives', role: 'The national database of community-led models. You appear here on your terms, with the evidence you chose to share.' },
    { name: 'CivicGraph', role: 'The funding map read against the work map. Surfaces communities currently overlooked. Helps funders find the work, not the other way around.' },
  ];

  const principles = [
    { icon: Heart, title: 'Community First', body: 'You know your community. We follow your lead, not the other way around. The framework is downstream of your practice.' },
    { icon: Shield, title: 'Data Sovereignty', body: 'Your data belongs to you. We never share without explicit consent. You can leave any time and take everything.' },
    { icon: Sparkles, title: 'Strengths-Based', body: 'We focus on what is strong, not what is wrong. Your community has solutions. We help share them.' },
    { icon: HandHeart, title: 'No Strings Attached', body: 'Joining JusticeHub is free. We are here to support, not extract. No hidden agendas.' },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="container-justice">
            <div className="max-w-4xl">
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                For Community-Controlled Organisations
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                YOUR ORGANISATION.<br />YOUR DATA.<br />YOUR STORY.
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                JusticeHub is the platform layer for community-controlled organisations. You{' '}
                <span className="font-bold text-black">claim your page</span>, own your data, and
                publish on your terms. The system never tells you what your work means.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact?source=community&type=claim"
                  className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-center"
                >
                  Claim Your Organisation
                </Link>
                <Link
                  href="/centre-of-excellence"
                  className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
                >
                  See the Four Anchors
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Four Anchors */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              The Four Anchors, Named
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              These are not pilots. They are the work. JusticeHub is the layer that makes their
              practice visible, indexable, and able to travel without flattening place.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {anchorsLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                anchors.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/organizations/${a.slug}`}
                    className="border-2 border-black bg-white hover:bg-gray-50 transition-colors group flex flex-col"
                  >
                    <div className="p-6 border-b-2 border-black flex-grow">
                      <h3 className="font-bold text-xl mb-2 group-hover:underline">{a.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                        <MapPin className="w-3 h-3" />
                        {a.region}
                      </div>
                      <p className="text-sm text-gray-700">{a.description}</p>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      {a.stats?.[0] && (
                        <div className="text-sm">
                          <span className="font-bold text-emerald-700">{a.stats[0].value}</span>
                          <span className="text-gray-600 ml-1">{a.stats[0].label}</span>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* The On-Ramp */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Claim. Own. Publish. Travel.
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Four steps, in this order, on your timeline. We never start at travel and work
              back. We start at claim and only go further when you say so.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {onramp.map((s) => (
                <article key={s.n} className="border-2 border-black bg-white p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-black text-white text-xl font-black flex items-center justify-center flex-shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <s.icon className="w-5 h-5 text-emerald-700" />
                        <h3 className="font-bold text-xl">{s.title}</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Data Sovereignty Mechanics */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Data Sovereignty, Named
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Most platforms put data sovereignty on page seventeen of the terms. JusticeHub puts
              it in the architecture. Four mechanics, each named, each verifiable.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sovereigntyMechanics.map((m) => (
                <div key={m.kicker} className="bg-white p-6 border-2 border-black">
                  <m.icon className="w-10 h-10 mb-4 text-emerald-700" />
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
                    {m.kicker}
                  </div>
                  <h3 className="font-bold text-xl mb-3">{m.title}</h3>
                  <p
                    className="text-gray-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: m.body }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Layer */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              The Platform Layer
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Four pieces, one ring. Each one does a specific job for your organisation.
            </p>

            <div className="border-2 border-black bg-white">
              {platformLayer.map((p, i) => (
                <div
                  key={p.name}
                  className={`grid grid-cols-1 md:grid-cols-[280px_1fr] ${i > 0 ? 'border-t-2 border-black' : ''}`}
                >
                  <div className="bg-black text-white p-5 font-bold text-lg flex items-center">
                    {p.name}
                  </div>
                  <div className="p-5 text-gray-700">{p.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              Our Principles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {principles.map((p) => (
                <div key={p.title} className="flex items-start gap-4">
                  <p.icon className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                    <p className="text-gray-300">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">Get in Touch</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border-2 border-black">
                <Phone className="w-8 h-8 mb-4" />
                <h3 className="font-bold text-lg mb-2">Prefer to Yarn?</h3>
                <p className="text-gray-600 mb-4">
                  We&apos;d love a conversation. Call us and we&apos;ll arrange a time that works
                  for you and for Country.
                </p>
                <a href="mailto:partners@justicehub.com.au" className="font-bold underline">
                  Email to arrange a call
                </a>
              </div>

              <div className="p-6 border-2 border-black">
                <Mail className="w-8 h-8 mb-4" />
                <h3 className="font-bold text-lg mb-2">Send a Message</h3>
                <p className="text-gray-600 mb-4">
                  Drop us an email and we&apos;ll respond within 48 hours.
                </p>
                <a href="mailto:partners@justicehub.com.au" className="font-bold underline">
                  partners@justicehub.com.au
                </a>
              </div>

              <div className="p-6 border-2 border-black">
                <MessageCircle className="w-8 h-8 mb-4" />
                <h3 className="font-bold text-lg mb-2">Online Form</h3>
                <p className="text-gray-600 mb-4">
                  Tell us about your organisation through our partner inquiry form.
                </p>
                <Link href="/contact?source=community&type=claim" className="font-bold underline">
                  Partner Inquiry Form
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-emerald-600 text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              Your Work Matters. Let&apos;s Make It Visible On Your Terms.
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Claim your organisation. Own your data. Publish on your terms. Travel when you
              choose. The system never flattens what you built.
            </p>

            <Link
              href="/contact?source=community&type=claim"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors"
            >
              Claim Your Organisation <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
