"use client";

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { ShieldCheck, ArrowLeft, Send } from 'lucide-react';

export default function ClaimPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const programId = params?.id as string;
    const programName = searchParams.get('name') || 'this program';

    const [role, setRole] = useState('founder');
    const [roleDesc, setRoleDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus('idle');
        setErrorMsg('');

        try {
            const res = await fetch('/api/claims/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId,
                    role,
                    roleDescription: roleDesc
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    alert("Please log in to claim a program.");
                    return;
                }
                throw new Error(data.error || 'Failed to submit claim');
            }

            setStatus('success');

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full border-2 border-black p-8 text-center bg-gray-50">
                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Claim Submitted</h1>
                    <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                        Verification Pending for <strong className="border-b-2 border-black">{programName}</strong>. <br />
                        Our team will review your credentials.
                    </p>
                    <button
                        onClick={() => router.push('/intelligence/dashboard')}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <Navigation />

            <main className="page-content bg-gray-50 min-h-screen flex items-center justify-center p-6">
                <div className="max-w-xl w-full border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                    {/* Header */}
                    <div className="bg-black text-white p-6 border-b-2 border-black">
                        <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                            <ShieldCheck className="w-4 h-4" /> Verification Protocol
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                            Claim Impact
                        </h1>
                    </div>

                    <div className="p-8">
                        <p className="text-gray-700 mb-8 border-l-4 border-emerald-500 pl-4 py-1 italic">
                            Verifying your relationship to <strong className="text-black">{programName}</strong> unlocks advanced analytics and funding pathways.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                                    I am the...
                                </label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border-2 border-black font-bold focus:outline-none focus:bg-white appearance-none rounded-none"
                                    >
                                        <option value="founder">Founder / CEO</option>
                                        <option value="manager">Program Manager</option>
                                        <option value="staff">Staff Member</option>
                                        <option value="board">Board Member</option>
                                        <option value="participant">Participant (Past/Present)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Verification Evidence
                                </label>
                                <textarea
                                    value={roleDesc}
                                    onChange={(e) => setRoleDesc(e.target.value)}
                                    placeholder="Describe your role or paste a LinkedIn/Website link..."
                                    className="w-full p-4 h-32 bg-gray-50 border-2 border-black font-medium focus:outline-none focus:bg-white resize-none rounded-none placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 font-bold text-sm border-2 border-red-100 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    {errorMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {submitting ? 'Verifying...' : 'Submit Claim'}
                                {!submitting && <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
