'use client';

import React, { useState } from 'react';
import KnowledgeGraph from '@/components/intelligence/KnowledgeGraph';
import { Card } from '@/components/ui/card';
import { Network, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { GraphDetailPanel } from '@/components/intelligence/GraphDetailPanel';
import { Search } from 'lucide-react';

export default function KnowledgePage() {
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col">
            {/* Header - Stark Overlay */}
            <div className="absolute top-0 left-0 w-full z-20 p-6 flex flex-col md:flex-row justify-between items-start pointer-events-none gap-4">
                <div className="pointer-events-auto bg-white border-2 border-black p-4 shadow-lg min-w-[300px]">
                    <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Network className="w-5 h-5" /> Knowledge Graph
                    </h1>

                    {/* Integrated Search Input */}
                    <div className="relative border-b-2 border-black">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="SEARCH TOPOLOGY..."
                            className="w-full pl-8 pr-4 py-2 bg-gray-50 text-sm font-mono font-bold uppercase focus:outline-none focus:bg-white transition-colors placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="text-xs font-mono mt-4 flex justify-between items-center">
                        <span className="bg-black text-white px-1">442 NODES</span>
                        <span className="text-emerald-700 font-bold">● LIVE</span>
                    </div>
                </div>

                <div className="pointer-events-auto">
                    <Link href="/centre-of-excellence" className="bg-black text-white hover:bg-emerald-600 px-6 py-3 font-bold uppercase tracking-wider text-xs border-2 border-black transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-3 h-3" /> Exit The Cortex
                    </Link>
                </div>
            </div>

            {/* Main Graph Area */}
            <div className="flex-1 relative bg-gray-50 border-b-2 border-black">
                {/* We wrap the graph in a container. If the graph itself is dark, it acts as a 'window' into the data/void. */}
                <KnowledgeGraph onNodeSelect={setSelectedNode} searchTerm={searchTerm} />
            </div>

            {/* Floating Details Panel (Bottom Left) - Reusable Component */}
            <div className={`absolute bottom-6 left-6 z-30 transition-all duration-300 transform ${selectedNode ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <GraphDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            </div>
        </div>
    );
}
