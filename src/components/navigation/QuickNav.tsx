'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface QuickNavProps {
    backLink?: string;
    backLabel?: string;
    title?: string;
    actions?: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }>;
}

export function QuickNav({
    backLink,
    backLabel = "Back",
    title,
    actions = []
}: QuickNavProps) {
    return (
        <section className="pt-24 pb-4 border-b border-gray-200 bg-gray-50">
            <div className="container-justice">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {backLink && (
                            <Link
                                href={backLink}
                                className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                aria-label={`${backLabel} - Return to previous page`}
                            >
                                <ChevronDown className="h-4 w-4 rotate-90" aria-hidden="true" />
                                {backLabel}
                            </Link>
                        )}
                        {title && (
                            <h1 className="text-xl font-bold text-black">{title}</h1>
                        )}
                    </div>

                    {actions.length > 0 && (
                        <div className="flex items-center gap-3">
                            {actions.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className={action.variant === 'primary' ? 'cta-primary' : 'cta-secondary'}
                                >
                                    {action.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
