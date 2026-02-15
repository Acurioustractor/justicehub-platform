'use client';

import { useEffect, useState } from 'react';
import { EventForm, EventFormData } from '@/components/admin/events/event-form';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

export default function EditEventPage() {
    const params = useParams();
    const [eventData, setEventData] = useState<EventFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvent() {
            const paramId = params['id'];
            if (!paramId) return;
            const id = Array.isArray(paramId) ? paramId[0] : paramId;

            const supabase = createClient();
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching event:', error);
                alert('Event not found');
            } else {
                setEventData(data as unknown as EventFormData);
            }
            setLoading(false);
        }
        fetchEvent();
    }, [params]);

    if (loading) return <div className="p-20 text-center">Loading event data...</div>;
    if (!eventData) return <div className="p-20 text-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/admin/events" className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Events
                    </Link>
                    <h1 className="text-3xl font-black">Edit Event: {eventData.title}</h1>
                </div>

                <EventForm initialData={eventData} />
            </div>
        </div>
    );
}
