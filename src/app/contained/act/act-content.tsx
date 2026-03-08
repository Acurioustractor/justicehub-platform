'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight,
  Check,
  Copy,
  Heart,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Share2,
  Smartphone,
  Users,
} from 'lucide-react';

const SITE_URL = 'https://justicehub.org.au';

// ── Shareable message templates ──────────────────────────────────
const SHARE_TEMPLATES = {
  general: {
    subject: 'You need to see this — CONTAINED',
    body: `I just found out about CONTAINED — a shipping container touring Australia that lets you experience 30 minutes of what youth detention is actually like.

$1.2 million per child per year. 84% reoffend. Community alternatives cost $75/day with 3% reoffending.

The evidence is overwhelming. Decision-makers need to experience this.

${SITE_URL}/contained`,
  },
  nominate: {
    subject: 'Nominate a decision-maker for CONTAINED',
    body: `CONTAINED is touring Australia in 2026 — a shipping container where decision-makers experience 30 minutes of youth detention reality.

I'm nominating leaders who need to see this. You can too:
${SITE_URL}/contained#nominate

Every nomination builds public pressure for change.`,
  },
  politician: {
    subject: 'CONTAINED: Your constituents are watching',
    body: `Dear [Name],

CONTAINED is an immersive experience touring Australia that reveals the reality of youth detention — and what works instead.

$1.2M per child per year in detention. 84% reoffend.
Community alternatives: $75/day. 3% reoffending.

I'm inviting you to experience 30 minutes inside this container. Your constituents have nominated you.

Learn more: ${SITE_URL}/contained
Nominations: ${SITE_URL}/contained#nominate`,
  },
  media: {
    subject: 'Story: CONTAINED tour reveals youth detention reality',
    body: `Hi,

CONTAINED is an immersive experience touring four Australian cities in 2026. One shipping container, three rooms, thirty minutes — the reality of youth detention, the therapeutic alternative (Diagrama, Spain), and local community solutions.

Key stats:
- $1.2M/child/year in detention, 84% reoffend
- Community programs: $75/day, 3% reoffending, 527 organisations on ALMA
- Therapeutic model (Spain): 73% success rate, €5.64 return per €1

Tour stops: Mount Druitt, Adelaide, Perth, Tennant Creek

Press kit & details: ${SITE_URL}/contained
Contact: hello@justicehub.org.au`,
  },
  funder: {
    subject: 'Investment opportunity: CONTAINED national tour',
    body: `CONTAINED is a national campaign proving that youth justice can be different — through immersive experience, evidence, and community voice.

The tour visits four cities in 2026, building the case for therapeutic alternatives that cost a fraction of detention and actually work.

We're seeking philanthropic partners at $10K–$250K+ to fund the tour, documentation, and the platform behind it.

Investment thesis: ${SITE_URL}/for-funders
Tour details: ${SITE_URL}/contained
Contact: hello@justicehub.org.au`,
  },
};

const SOCIAL_POSTS = {
  twitter: `CONTAINED: One shipping container. Three rooms. Thirty minutes. The reality of youth detention — and what works instead.

$1.2M/child/year. 84% reoffend. Community alternatives: $75/day, 3%.

Australian Tour 2026. Nominate a leader: ${SITE_URL}/contained#nominate

#CONTAINED #YouthJustice`,
  facebook: `Just learned about CONTAINED — a shipping container touring Australia that lets you experience 30 minutes of what youth detention is actually like.

The stats are staggering:
- $1.2 million per detained child per year
- 84% reoffending rate
- Community alternatives cost $75/day with 3% reoffending

Decision-makers need to experience this. Nominate someone: ${SITE_URL}/contained#nominate`,
  linkedin: `Australia spends $1.2M per child per year on youth detention. 84% reoffend.

Community alternatives cost $75/day with 3% reoffending and 527 organisations already doing what works.

CONTAINED is a national tour taking this evidence directly to decision-makers — 30 minutes inside a shipping container that makes you understand it in your bones.

Four cities. 2026. Nominate a leader: ${SITE_URL}/contained

#YouthJustice #CONTAINED #SocialImpact #PolicyReform`,
};

const SMS_TEMPLATE = `Check this out — CONTAINED is a shipping container touring Australia showing what youth detention is really like. $1.2M/child/year, 84% reoffend. Community alternatives: $75/day, 3%. Nominate a leader: ${SITE_URL}/contained#nominate`;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };
  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border transition-colors flex items-center gap-2 ${
        copied
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'border-black hover:bg-black hover:text-white'
      }`}
    >
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> {label || 'Copy'}</>}
    </button>
  );
}

function EmailTemplate({
  title,
  description,
  template,
}: {
  title: string;
  description: string;
  template: { subject: string; body: string };
}) {
  const mailtoLink = `mailto:?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`;

  return (
    <div className="border-2 border-black bg-white">
      <div className="p-4 border-b-2 border-black bg-gray-50">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Subject</div>
        <p className="text-sm font-bold mb-3">{template.subject}</p>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Body</div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed mb-4 max-h-40 overflow-y-auto">
          {template.body}
        </pre>
        <div className="flex flex-wrap gap-3">
          <a
            href={mailtoLink}
            className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <Mail className="w-3 h-3" /> Open in Email
          </a>
          <CopyButton text={`${template.subject}\n\n${template.body}`} label="Copy All" />
        </div>
      </div>
    </div>
  );
}

interface CampaignStats {
  nominations: number;
  backers: number;
  reactions: number;
  raised: number;
  donors: number;
}

export function ActContent() {
  const [stats, setStats] = useState<CampaignStats>({
    nominations: 0,
    backers: 0,
    reactions: 0,
    raised: 0,
    donors: 0,
  });

  useEffect(() => {
    // Fetch all campaign stats in parallel
    Promise.all([
      fetch('/api/projects/the-contained/nominations').then((r) => r.json()).catch(() => ({ count: 0 })),
      fetch('/api/projects/the-contained/backers').then((r) => r.json()).catch(() => ({ count: 0 })),
      fetch('/api/projects/the-contained/reactions').then((r) => r.json()).catch(() => ({ count: 0 })),
      fetch('/api/campaign/stats').then((r) => r.json()).catch(() => ({ total_raised_cents: 0, donor_count: 0 })),
    ]).then(([noms, backers, reactions, campaign]) => {
      setStats({
        nominations: noms.count || 0,
        backers: backers.count || 0,
        reactions: reactions.count || 0,
        raised: (campaign.total_raised_cents || 0) / 100,
        donors: campaign.donor_count || 0,
      });
    });
  }, []);

  const smsLink = `sms:?&body=${encodeURIComponent(SMS_TEMPLATE)}`;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                Take Action
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Everything you need to spread the word, nominate decision-makers,
                and make this campaign successful. Copy, paste, send.
              </p>

              {/* Live stats */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-3xl font-black">{stats.nominations}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-red-400">Nominations</div>
                </div>
                <div>
                  <div className="text-3xl font-black">{stats.backers}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Backers</div>
                </div>
                <div>
                  <div className="text-3xl font-black">{stats.reactions}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-400">Reactions</div>
                </div>
                {stats.raised > 0 && (
                  <div>
                    <div className="text-3xl font-black">${stats.raised.toLocaleString()}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-400">Raised</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/contained#nominate"
                className="border-2 border-red-600 bg-red-50 p-6 hover:bg-red-100 transition-colors group"
              >
                <Megaphone className="w-6 h-6 text-red-600 mb-3" />
                <h3 className="font-bold mb-1">Nominate a Leader</h3>
                <p className="text-sm text-gray-600">Force decision-makers to experience this.</p>
                <ArrowRight className="w-4 h-4 text-red-600 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contained#back-this-tour"
                className="border-2 border-emerald-600 bg-emerald-50 p-6 hover:bg-emerald-100 transition-colors group"
              >
                <Heart className="w-6 h-6 text-emerald-600 mb-3" />
                <h3 className="font-bold mb-1">Back the Tour</h3>
                <p className="text-sm text-gray-600">Add your name to build public pressure.</p>
                <ArrowRight className="w-4 h-4 text-emerald-600 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/back-this"
                className="border-2 border-blue-600 bg-blue-50 p-6 hover:bg-blue-100 transition-colors group"
              >
                <Users className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-bold mb-1">Donate</h3>
                <p className="text-sm text-gray-600">Fund the tour and the infrastructure.</p>
                <ArrowRight className="w-4 h-4 text-blue-600 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contained/tour/social"
                className="border-2 border-purple-600 bg-purple-50 p-6 hover:bg-purple-100 transition-colors group"
              >
                <Share2 className="w-6 h-6 text-purple-600 mb-3" />
                <h3 className="font-bold mb-1">Social Media Kit</h3>
                <p className="text-sm text-gray-600">Ready-to-post content for all platforms.</p>
                <ArrowRight className="w-4 h-4 text-purple-600 mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Text & SMS */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-6 h-6" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                Text a Friend
              </h2>
            </div>
            <div className="max-w-2xl">
              <div className="border-2 border-black bg-gray-50 p-6 mb-4">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                  {SMS_TEMPLATE}
                </pre>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={smsLink}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Open in Messages
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(SMS_TEMPLATE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <CopyButton text={SMS_TEMPLATE} />
              </div>
            </div>
          </div>
        </section>

        {/* Email Templates */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                Email Templates
              </h2>
            </div>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Copy-paste emails for different audiences. Customise with names and personal touches.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EmailTemplate
                title="Share with Anyone"
                description="General awareness — send to friends, family, colleagues"
                template={SHARE_TEMPLATES.general}
              />
              <EmailTemplate
                title="Ask Someone to Nominate"
                description="Recruit others to nominate decision-makers"
                template={SHARE_TEMPLATES.nominate}
              />
              <EmailTemplate
                title="Email a Politician"
                description="Direct to their office — replace [Name] with theirs"
                template={SHARE_TEMPLATES.politician}
              />
              <EmailTemplate
                title="Pitch to Media"
                description="Press release format for journalists and editors"
                template={SHARE_TEMPLATES.media}
              />
              <EmailTemplate
                title="Approach a Funder"
                description="Investment pitch for philanthropic partners"
                template={SHARE_TEMPLATES.funder}
              />
            </div>
          </div>
        </section>

        {/* Social Media Posts */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-6 h-6" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                Social Media — Quick Post
              </h2>
            </div>
            <p className="text-gray-600 mb-8 max-w-2xl">
              One-click share or copy these posts. For the full social kit with images and
              platform-specific content, visit the{' '}
              <Link href="/contained/tour/social" className="font-bold underline">
                Social Media Kit
              </Link>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Twitter/X */}
              <div className="border-2 border-black">
                <div className="p-4 border-b-2 border-black bg-gray-100">
                  <span className="font-bold">X / Twitter</span>
                  <span className="text-xs text-gray-500 ml-2">{SOCIAL_POSTS.twitter.length} chars</span>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed mb-4">
                    {SOCIAL_POSTS.twitter}
                  </pre>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SOCIAL_POSTS.twitter)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-900 transition-colors"
                    >
                      Post on X
                    </a>
                    <CopyButton text={SOCIAL_POSTS.twitter} />
                  </div>
                </div>
              </div>

              {/* Facebook */}
              <div className="border-2 border-black">
                <div className="p-4 border-b-2 border-black bg-blue-50">
                  <span className="font-bold text-blue-700">Facebook</span>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed mb-4">
                    {SOCIAL_POSTS.facebook}
                  </pre>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/contained`)}&quote=${encodeURIComponent(SOCIAL_POSTS.facebook)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Share on Facebook
                    </a>
                    <CopyButton text={SOCIAL_POSTS.facebook} />
                  </div>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="border-2 border-black">
                <div className="p-4 border-b-2 border-black bg-blue-50">
                  <span className="font-bold text-blue-800">LinkedIn</span>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed mb-4">
                    {SOCIAL_POSTS.linkedin}
                  </pre>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${SITE_URL}/contained`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-blue-800 text-white hover:bg-blue-900 transition-colors"
                    >
                      Share on LinkedIn
                    </a>
                    <CopyButton text={SOCIAL_POSTS.linkedin} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Stats — for copying into conversations */}
        <section className="py-12 border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
              Key Stats — Copy Into Any Conversation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {[
                { stat: '$1.2M per child per year in youth detention', source: 'AIHW' },
                { stat: '84% of detained young people reoffend within 12 months', source: 'Productivity Commission' },
                { stat: '$3,320 per day per child in detention', source: 'AIHW' },
                { stat: 'Community programs cost $75/day with 3% reoffending', source: 'ALMA Database' },
                { stat: '527 community organisations on ALMA across Australia', source: 'JusticeHub' },
                { stat: "Diagrama (Spain): 73% success rate, €5.64 return per €1 invested", source: 'University of Valencia' },
                { stat: 'Indigenous young people are 17x more likely to be detained', source: 'AIHW' },
                { stat: '18% education completion rate in detention vs 88% in community programs', source: 'AIHW / ALMA' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{item.stat}</p>
                    <p className="text-xs text-gray-500 mt-1">Source: {item.source}</p>
                  </div>
                  <CopyButton text={item.stat} label="" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Links Hub */}
        <section className="py-12">
          <div className="container-justice">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
              Share These Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {[
                { label: 'CONTAINED Tour', url: `${SITE_URL}/contained`, desc: 'Main campaign page' },
                { label: 'Nominate a Leader', url: `${SITE_URL}/contained#nominate`, desc: 'Nomination form' },
                { label: 'Back the Tour', url: `${SITE_URL}/contained#back-this-tour`, desc: 'Add your name' },
                { label: 'Donate', url: `${SITE_URL}/back-this`, desc: 'Fund the infrastructure' },
                { label: 'All Nominations', url: `${SITE_URL}/contained/nominations`, desc: 'Public nominations wall' },
                { label: 'Share Your Story', url: `${SITE_URL}/contained/share`, desc: 'Tour attendee stories' },
                { label: 'Social Media Kit', url: `${SITE_URL}/contained/tour/social`, desc: 'Ready-to-post content' },
                { label: 'For Funders', url: `${SITE_URL}/for-funders`, desc: 'Investment thesis' },
                { label: 'Community Map', url: `${SITE_URL}/community-map`, desc: '527 organisations' },
                { label: 'Tour Events', url: `${SITE_URL}/events`, desc: 'Dates and registration' },
                { label: 'Take Action', url: `${SITE_URL}/contained/act`, desc: 'This page — share it!' },
              ].map((link) => (
                <div key={link.url} className="border border-gray-200 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{link.label}</p>
                    <p className="text-xs text-gray-500">{link.desc}</p>
                  </div>
                  <CopyButton text={link.url} label="" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
