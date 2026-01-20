'use client';

import { useState } from 'react';
import Link from 'next/link';
import { footerSections } from '@/config/navigation';

export function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In real app, would handle newsletter subscription here
        setSubscribed(true);
        setEmail('');
    };

    return (
        <footer className="bg-black text-white pt-16 pb-8 border-t-4 border-red-600">
            <div className="container-justice">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-block mb-6 group">
                            <div className="text-3xl font-black tracking-tighter">
                                <span className="text-white group-hover:text-red-500 transition-colors">JUSTICE</span>
                                <span className="text-red-500 group-hover:text-white transition-colors">HUB</span>
                            </div>
                            <div className="text-xs font-bold tracking-widest text-gray-400 mt-1">
                                TRUTH • ACTION • JUSTICE
                            </div>
                        </Link>
                        <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">
                            A digital platform transforming how grassroots organizations, communities, and governments work together to support young people.
                        </p>

                        <div className="bg-gray-900 p-6 border border-gray-800 rounded-sm">
                            <p className="font-bold text-white mb-2 uppercase tracking-wider text-sm" role="heading" aria-level={2}>Stay Updated</p>
                            <p className="text-gray-400 text-sm mb-4">Join our community newsletter for the latest updates.</p>

                            {subscribed ? (
                                <div className="bg-green-900/30 text-green-400 p-3 text-sm font-medium border border-green-900 rounded-sm">
                                    Thanks for subscribing! Check your inbox soon.
                                </div>
                            ) : (
                                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="bg-black border border-gray-700 text-white px-3 py-2 text-sm w-full focus:outline-none focus:border-red-500 rounded-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors rounded-sm"
                                    >
                                        Join
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Links Columns */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <p className="font-bold text-white mb-6 uppercase tracking-wider text-sm border-b border-gray-800 pb-2 inline-block" role="heading" aria-level={2}>
                                {section.title}
                            </p>
                            <ul className="space-y-4">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors text-sm font-medium block group"
                                        >
                                            <span className="group-hover:translate-x-1 transition-transform inline-block duration-200">
                                                {link.label}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <div>
                        &copy; {new Date().getFullYear()} JusticeHub Platform. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/about" className="hover:text-white transition-colors">About</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
