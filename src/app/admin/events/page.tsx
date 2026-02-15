'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Edit2, Calendar, MapPin, Eye, FileText } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) console.error('Error fetching events:', error);
            else setEvents(data || []);
            setLoading(false);
        }
        fetchEvents();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black mb-2">Events Management</h1>
                        <p className="text-gray-600">Manage campaign launches, workshops, and community events.</p>
                    </div>
                    <Link
                        href="/admin/events/new"
                        className="bg-black text-white px-6 py-3 font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" /> Create New Event
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20">Loading events...</div>
                ) : events.length === 0 ? (
                    <div className="bg-white border-2 border-black p-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
                        <p className="text-gray-500 mb-6">Get started by creating your first event.</p>
                        <Link
                            href="/admin/events/new"
                            className="inline-flex items-center gap-2 text-black font-bold border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors"
                        >
                            Create Event &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {event.featured_image_url ? (
                                                    <img src={event.featured_image_url} alt="" className="w-12 h-12 object-cover rounded bg-gray-100" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-gray-900">{event.title}</div>
                                                    <div className="text-xs text-gray-500 font-mono">/{event.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {new Date(event.start_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(event.start_date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{event.location_name}</div>
                                            <div className="text-xs text-gray-500">{event.location_state}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {event.is_public ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                                        Public
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                                                        Private
                                                    </span>
                                                )}
                                                {event.is_featured && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/events/${event.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                    title="View Public Page"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/events/${event.id}`}
                                                    className="bg-white border-2 border-black text-gray-700 px-3 py-1.5 text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit2 className="w-3 h-3" /> Edit
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
