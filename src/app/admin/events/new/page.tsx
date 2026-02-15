'use client';

import { EventForm } from '@/components/admin/events/event-form';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewEventPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/admin/events" className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Events
                    </Link>
                    <h1 className="text-3xl font-black">Create New Event</h1>
                </div>

                <EventForm />
            </div>
        </div>
    );
}
