'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';

// Dynamically import the client component to turn off SSR for the Map
const EquityMapClient = dynamic(() => import('./EquityMapClient'), {
    ssr: false,
    loading: () => (
        <Card className="w-full h-[600px] flex items-center justify-center bg-slate-50 border-2 border-dashed border-gray-200">
            <div className="text-gray-400 font-mono text-sm">Loading Equity Map...</div>
        </Card>
    )
});

export default function EquityMap() {
    return <EquityMapClient />;
}
