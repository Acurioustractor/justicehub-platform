'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, ArrowRight, Star, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface EventData {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    location_name: string;
    location_address: string;
    image_url: string;
    video_url?: string;
    is_public: boolean;
    registration_url?: string;
}

interface ContainedEventDetailProps {
    slug: string; // The event slug to fetch
    isVip?: boolean;
    initialEvent?: EventData | null;
}

export function ContainedEventDetail({ slug, isVip = false, initialEvent = null }: ContainedEventDetailProps) {
    const [event, setEvent] = useState<EventData | null>(initialEvent);
    const [loading, setLoading] = useState(!initialEvent);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialEvent) {
            setEvent(initialEvent);
            setLoading(false);
            return;
        }

        async function fetchEvent() {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Error fetching event:', error);
            } else {
                setEvent(data as EventData);
            }
            setLoading(false);
        }

        fetchEvent();
    }, [slug, initialEvent]);

    const handleQuickRSVP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        setRsvpLoading(true);
        setError('');

        try {
            const res = await fetch('/api/ghl/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: event.id,
                    event_name: event.title,
                    email,
                    full_name: fullName,
                    // Default role for quick RSVP
                    role: 'community_member',
                    newsletter: true, // Default opt-in for quick RSVP
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setSubmitted(true);
        } catch (err: any) {
            console.error('RSVP Error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setRsvpLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse">Loading Event Details...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
                    <p className="text-gray-400">The event you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const startDate = new Date(event.start_date);
    const dateStr = startDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = startDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) +
        (event.end_date ? ' - ' + new Date(event.end_date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : '');

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
                    {event.image_url ? (
                        <>
                            <div className="absolute inset-0 bg-black/60 z-0" />
                            <img src={event.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm pointer-events-none" />
                        </>
                    ) : (
                        <div className="absolute inset-0 opacity-20">
                            <div className={`absolute top-0 left-0 w-full h-full ${isVip ? 'bg-[radial-gradient(circle_at_30%_30%,rgba(147,51,234,0.3),transparent_50%)]' : 'bg-[radial-gradient(circle_at_30%_30%,rgba(234,88,12,0.3),transparent_50%)]'}`} />
                            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(5,150,105,0.3),transparent_50%)]" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="relative z-10 container-justice text-center py-20 px-4">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 border text-sm font-bold uppercase tracking-wider mb-8 ${isVip ? 'bg-purple-900/40 border-purple-500/50 text-purple-200' : 'bg-ochre-600/40 border-ochre-500/50 text-ochre-200'} backdrop-blur-md`}>
                        {isVip ? <Lock className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        {isVip ? 'Private Invitation' : 'Community Launch'}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight max-w-5xl mx-auto leading-tight drop-shadow-xl">
                        {event.title}
                    </h1>

                    {/* Video Player if available */}
                    {event.video_url && (
                        <div className="max-w-4xl mx-auto mb-12 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                            <iframe
                                src={event.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    <div className="prose prose-invert prose-lg max-w-3xl mx-auto mb-12 text-gray-200 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                    />

                    <div className="flex flex-wrap justify-center gap-6 text-lg text-gray-300 mb-12 font-medium">
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-gray-700 backdrop-blur-sm">
                            <Calendar className={`w-5 h-5 ${isVip ? 'text-purple-400' : 'text-ochre-400'}`} />
                            {dateStr}
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-gray-700 backdrop-blur-sm">
                            <Clock className={`w-5 h-5 ${isVip ? 'text-purple-400' : 'text-ochre-400'}`} />
                            {timeStr}
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-gray-700 backdrop-blur-sm">
                            <MapPin className={`w-5 h-5 ${isVip ? 'text-purple-400' : 'text-ochre-400'}`} />
                            {event.location_name}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth' })}
                            className={`inline-flex items-center gap-2 px-8 py-4 font-bold text-lg transition-colors ${isVip ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-ochre-600 hover:bg-ochre-700 text-white'} shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200 rounded`}
                        >
                            RSVP Now <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Details & RSVP */}
            <section id="rsvp" className="py-20 border-t border-gray-800 bg-gray-950">
                <div className="container-justice">
                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

                        {/* Info Card */}
                        <div className="border border-gray-800 p-8 bg-black/50">
                            <h3 className="text-xl font-bold mb-6">Event Details</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Venue</div>
                                    <div className="font-bold text-lg text-white">{event.location_name}</div>
                                    <div className="text-gray-400">{event.location_address}</div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Schedule</div>
                                    <div className="font-bold text-lg text-white">{dateStr}</div>
                                    <div className="text-gray-400">{timeStr}</div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Access</div>
                                    <div className="font-bold text-lg text-white">{isVip ? 'Invited Guests Only' : 'Open to Public'}</div>
                                </div>
                            </div>
                        </div>

                        {/* RSVP Form */}
                        <div className={`p-8 border ${isVip ? 'border-purple-500/30 bg-purple-900/10' : 'border-ochre-500/30 bg-ochre-900/10'}`}>
                            {!submitted ? (
                                <>
                                    <h3 className="text-2xl font-bold mb-4">Secure Your Spot</h3>
                                    <p className="text-gray-300 mb-6 text-sm">
                                        {isVip
                                            ? "Please confirm your attendance for this private gathering."
                                            : "Register to receive event updates and reminders."}
                                    </p>

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-200 text-sm rounded">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleQuickRSVP} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="w-full bg-black border border-gray-700 px-4 py-3 text-white focus:border-white focus:outline-none placeholder-gray-600"
                                                placeholder="Jane Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full bg-black border border-gray-700 px-4 py-3 text-white focus:border-white focus:outline-none placeholder-gray-600"
                                                placeholder="jane@example.com"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={rsvpLoading}
                                            className={`w-full py-4 font-bold text-white transition-colors disabled:opacity-50 ${isVip ? 'bg-purple-700 hover:bg-purple-600' : 'bg-ochre-600 hover:bg-ochre-700'}`}
                                        >
                                            {rsvpLoading ? 'Confirming...' : 'Confirm Attendance'}
                                        </button>
                                        <p className="text-xs text-center text-gray-500 mt-4">
                                            By registering, you agree to receive updates about this event.
                                        </p>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center h-full flex flex-col items-center justify-center py-10">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${isVip ? 'bg-purple-500 text-white' : 'bg-ochre-500 text-white'}`}>✓</div>
                                    <h3 className="text-2xl font-bold mb-2">You're Confirmed!</h3>
                                    <p className="text-gray-400 mb-6">We've sent a calendar invite to <strong>{email}</strong>.</p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="text-sm font-bold underline hover:no-underline text-gray-500"
                                    >
                                        Register another person
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
