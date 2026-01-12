'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { UserProfile } from '@/hooks/useNavigationAuth';

interface UserMenuProps {
    user: any; // Supabase user
    userProfile: UserProfile;
    onSignOut: () => void;
}

export function UserMenu({ user, userProfile, onSignOut }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {userProfile.photo_url ? (
                    <Image
                        src={userProfile.photo_url}
                        alt={userProfile.full_name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border-2 border-black"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-black shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-bold text-black">{userProfile.full_name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                    <Link
                        href={`/people/${userProfile.slug}`}
                        className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            View Profile
                        </div>
                    </Link>
                    <Link
                        href={`/people/${userProfile.slug}/edit`}
                        className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Edit Profile
                        </div>
                    </Link>
                    {userProfile.user_role === 'admin' && (
                        <Link
                            href="/admin"
                            className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border-b border-gray-200"
                            onClick={() => setIsOpen(false)}
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Admin Dashboard
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={onSignOut}
                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
