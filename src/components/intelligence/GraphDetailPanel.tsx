"use client";

import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface GraphDetailPanelProps {
    node: any;
    onClose: () => void;
}

export function GraphDetailPanel({ node, onClose }: GraphDetailPanelProps) {
    if (!node) return null;

    return (
        <div className="w-96 bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in slide-in-from-bottom duration-300">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors"
                aria-label="Close panel"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="mb-4 border-b-2 border-black pb-2 flex justify-between items-start">
                <span className="text-xs font-bold bg-black text-white px-2 py-1 uppercase tracking-wider">
                    {node.group || 'Node'}
                </span>
                {/* Only show 'View' link if it's an intervention or relevant type */}
                {node.group === 'intervention' && (
                    <Link href={`/intelligence/interventions/${node.id}`} className="text-xs font-bold uppercase underline hover:text-emerald-600 flex items-center gap-1">
                        Full Record <ExternalLink className="w-3 h-3" />
                    </Link>
                )}
            </div>

            <h3 className="text-2xl font-black leading-none mb-4 uppercase">
                {node.name || node.title || 'Unknown Entity'}
            </h3>

            <p className="text-sm text-gray-700 font-mono mb-6 leading-relaxed">
                {node.description || "No description available for this data point."}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="border border-black p-2">
                    <div className="text-gray-500 uppercase">Connections</div>
                    <div className="text-xl font-bold">{node.val || 0}</div>
                </div>
                {/* Simulated Impact Score logic */}
                <div className="border border-black p-2 bg-emerald-50">
                    <div className="text-gray-500 uppercase">Impact Score</div>
                    <div className="text-xl font-bold text-emerald-700">
                        {((node.val || 1) * 1.2).toFixed(1)}
                    </div>
                </div>
            </div>
        </div>
    );
}
