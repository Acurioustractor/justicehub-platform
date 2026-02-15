'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Users, Heart, MapPin, Mic, Shield, HandHeart,
  ArrowRight, CheckCircle, Sparkles, Home, Globe,
  BookOpen, MessageCircle, Phone, Mail, Loader2
} from 'lucide-react';

interface Basecamp {
  slug: string;
  name: string;
  region: string;
  description: string;
  stats: { label: string; value: string }[];
}

// Fallback data for initial render / SSR
const FALLBACK_BASECAMPS: Basecamp[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Alice Springs, NT',
    description: 'Cultural healing, on-country programs',
    stats: [{ label: 'Impact', value: '95% reduced anti-social behavior' }]
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    description: 'Fitness-based youth engagement',
    stats: [{ label: 'Engaged', value: '400+ young people yearly' }]
  },
  {
    slug: 'mounty-yarns',
    name: 'Mounty Yarns',
    region: 'Mount Druitt, NSW',
    description: 'Youth-led storytelling and media',
    stats: [{ label: 'Trained', value: '50+ young storytellers' }]
  },
  {
    slug: 'picc-townsville',
    name: 'PICC',
    region: 'Townsville, QLD',
    description: 'Pasifika family support',
    stats: [{ label: 'Supported', value: '300+ families annually' }]
  }
];

export default function ForCommunityLeadersPage() {
  const [basecamps, setBasecamps] = useState<Basecamp[]>(FALLBACK_BASECAMPS);
  const [basecampsLoading, setBasecampsLoading] = useState(true);

  // Fetch basecamps from API (single source of truth)
  useEffect(() => {
    fetch('/api/basecamps')
      .then(res => res.json())
      .then((data: Basecamp[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBasecamps(data);
        }
      })
      .catch(console.error)
      .finally(() => setBasecampsLoading(false));
  }, []);

  const networkBenefits = [
    {
      title: "Connect with Other Leaders",
      description: "Join a network of community organizations across Australia doing similar work. Share learnings, resources, and support.",
      icon: Users
    },
    {
      title: "Amplify Your Voice",
      description: "Use JusticeHub to tell your story on your terms. Our Empathy Ledger ensures you control your narrative.",
      icon: Mic
    },
    {
      title: "Access Resources",
      description: "Training, capacity building, and funding opportunities curated specifically for community organizations.",
      icon: BookOpen
    },
    {
      title: "Evidence That Serves You",
      description: "Document your impact in ways that honor your work without extractive research practices.",
      icon: Shield
    }
  ];


  const whatWeOffer = [
    {
      title: "Your Story, Your Way",
      items: [
        "Profile page on JusticeHub platform",
        "Empathy Ledger integration for storytelling",
        "Photo and video hosting",
        "Impact metrics display"
      ]
    },
    {
      title: "Network Support",
      items: [
        "Connection to peer organizations",
        "State-based hub coordination",
        "Joint advocacy opportunities",
        "Shared resource library"
      ]
    },
    {
      title: "Capacity Building",
      items: [
        "Governance and compliance support",
        "Funding application assistance",
        "Evidence collection training",
        "Digital skills development"
      ]
    }
  ];

  const howToJoin = [
    {
      step: "1",
      title: "Express Interest",
      description: "Fill out our community partner inquiry form. We'll follow up within 48 hours."
    },
    {
      step: "2",
      title: "Yarn Together",
      description: "We'll have a conversation about your work, your community, and how JusticeHub can support you."
    },
    {
      step: "3",
      title: "Set Up Your Profile",
      description: "Work with our team to build your organization's presence on the platform."
    },
    {
      step: "4",
      title: "Join the Network",
      description: "Connect with your state hub and start engaging with the broader community."
    }
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
                For Community Organizations
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                YOUR COMMUNITY.<br />YOUR SOLUTIONS.<br />YOUR PLATFORM.
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                JusticeHub exists to <span className="font-bold text-black">amplify community-led work</span>,
                not replace it. Join a network of organizations transforming youth justice from the ground up.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact?source=community&type=partner"
                  className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-center"
                >
                  Join the Network
                </Link>
                <Link
                  href="/centre-of-excellence"
                  className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
                >
                  See Our Partners
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why JusticeHub */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Why Join JusticeHub?
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              We're not here to tell you what to do—you already know what works for your community.
              We're here to connect, amplify, and support your work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {networkBenefits.map((benefit, i) => (
                <div key={i} className="bg-white p-6 border-2 border-black">
                  <benefit.icon className="w-10 h-10 mb-4 text-emerald-700" />
                  <h3 className="font-bold text-xl mb-3">{benefit.title}</h3>
                  <p className="text-gray-700">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Basecamps */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Our Basecamps
            </h2>
            <p className="text-xl text-gray-700 mb-4 max-w-3xl">
              Basecamps are the place-based organizations that anchor the JusticeHub network.
              They hold local knowledge, launch community transformation, and prove that
              community-led approaches work.
            </p>
            <p className="text-lg text-gray-600 mb-12 max-w-3xl">
              Basecamps contribute intelligence to ALMA and get compensated for their expertise.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {basecampsLoading ? (
                <div className="col-span-2 flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                basecamps.map((basecamp) => (
                  <Link
                    key={basecamp.slug}
                    href={`/organizations/${basecamp.slug}`}
                    className="border-2 border-black hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-6 border-b-2 border-black">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-xl mb-1 group-hover:underline">
                            {basecamp.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {basecamp.region}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">{basecamp.description}</div>
                      {basecamp.stats?.[0] && (
                        <div className="text-lg font-bold text-emerald-700">
                          {basecamp.stats[0].value} {basecamp.stats[0].label.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">
              What We Offer Partners
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whatWeOffer.map((category, i) => (
                <div key={i} className="bg-white border-2 border-black">
                  <div className="p-4 bg-black text-white">
                    <h3 className="font-bold text-lg">{category.title}</h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {category.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Join */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">
              How to Join the Network
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {howToJoin.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-black text-white text-2xl font-black flex items-center justify-center mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/contact?source=community&type=partner"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
              >
                Start the Conversation <ArrowRight className="w-5 h-5" />
              </Link>
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
              <div className="flex items-start gap-4">
                <Heart className="w-8 h-8 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Community First</h3>
                  <p className="text-gray-300">
                    You know your community better than anyone. We follow your lead, not the other way around.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Data Sovereignty</h3>
                  <p className="text-gray-300">
                    Your data belongs to you. We never share without explicit consent, and you can leave anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Sparkles className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Strengths-Based</h3>
                  <p className="text-gray-300">
                    We focus on what's strong, not what's wrong. Your community has solutions—we help share them.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <HandHeart className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">No Strings Attached</h3>
                  <p className="text-gray-300">
                    Joining JusticeHub is free. We're here to support, not extract. No hidden agendas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              Get in Touch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 border-2 border-black">
                <Phone className="w-8 h-8 mb-4" />
                <h3 className="font-bold text-lg mb-2">Prefer to Yarn?</h3>
                <p className="text-gray-600 mb-4">
                  We'd love to have a conversation. Call us and we'll arrange a time that works for you.
                </p>
                <a href="tel:+61400000000" className="font-bold">
                  Call Us
                </a>
              </div>

              <div className="p-6 border-2 border-black">
                <Mail className="w-8 h-8 mb-4" />
                <h3 className="font-bold text-lg mb-2">Send a Message</h3>
                <p className="text-gray-600 mb-4">
                  Drop us an email and we'll respond within 48 hours.
                </p>
                <a href="mailto:partners@justicehub.org.au" className="font-bold">
                  partners@justicehub.org.au
                </a>
              </div>

              <div className="p-6 border-2 border-black">
                <MessageCircle className="w-8 h-8 mb-4" />
                <h3 className="font-bold text-lg mb-2">Online Form</h3>
                <p className="text-gray-600 mb-4">
                  Fill out our partner inquiry form and tell us about your organization.
                </p>
                <Link href="/contact?source=community&type=partner" className="font-bold">
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
              Your Work Matters. Let's Amplify It.
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join a network of community leaders who are transforming youth justice across Australia.
              Together, we're proving that community-led solutions work.
            </p>

            <Link
              href="/contact?source=community&type=partner"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors"
            >
              Join the Network <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
