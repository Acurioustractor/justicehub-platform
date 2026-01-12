"use client";

import React from 'react';
import Link from 'next/link';

export function ClaimButton({ programId, programName }: { programId: string, programName: string }) {
    return (
        <Link
            href={`/claims/${programId}?name=${encodeURIComponent(programName)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold uppercase tracking-wider rounded transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Claim Impact
        </Link>
    );
}
