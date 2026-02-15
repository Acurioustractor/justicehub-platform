'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Search, LayoutGrid } from 'lucide-react';
import { navigationItems } from '@/config/navigation';
import { UserProfile } from '@/hooks/useNavigationAuth';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isActivePath: (href: string) => boolean;
    user: any;
    userProfile: UserProfile | null;
    onSignOut: () => void;
    onSearchOpen?: () => void;
    onMegaMenuOpen?: () => void;
}

export function MobileMenu({
    isOpen,
    onClose,
    isActivePath,
    user,
    userProfile,
    onSignOut,
    onSearchOpen,
    onMegaMenuOpen
}: MobileMenuProps) {
    if (!isOpen) return null;

    return (
        <nav
            id="mobile-menu"
            className="lg:hidden mt-4 pb-4 border-t border-gray-200 block"
            role="navigation"
            aria-label="Mobile navigation"
        >
            <div className="flex flex-col space-y-4 mt-4">
                {/* Mobile Search Button */}
                {onSearchOpen && (
                    <button
                        onClick={() => {
                            onClose();
                            onSearchOpen();
                        }}
                        className="flex items-center gap-3 px-3 py-3 mx-3 text-left font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
                    >
                        <Search className="h-5 w-5" />
                        <span>Search programs, services...</span>
                    </button>
                )}

                {/* Mobile Full Menu Button */}
                {onMegaMenuOpen && (
                    <button
                        onClick={() => {
                            onClose();
                            onMegaMenuOpen();
                        }}
                        className="flex items-center gap-3 px-3 py-3 mx-3 text-left font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
                    >
                        <LayoutGrid className="h-5 w-5" />
                        <span>View all pages</span>
                    </button>
                )}

                {navigationItems.map((item) => (
                    <div key={item.label}>
                        {item.type === 'dropdown' ? (
                            <div>
                                <div className="text-sm font-bold text-gray-700 uppercase tracking-wider px-3 py-2 border-b border-gray-200">
                                    {item.label}
                                </div>
                                {item.items?.map((dropdownItem) => (
                                    dropdownItem.href && (
                                        <Link
                                            key={dropdownItem.href}
                                            href={dropdownItem.href}
                                            onClick={onClose}
                                            className={`text-base font-bold px-6 py-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 block ml-3 ${isActivePath(dropdownItem.href)
                                                ? 'text-black bg-gray-100'
                                                : 'text-black hover:text-black hover:bg-gray-100'
                                                }`}
                                            aria-current={isActivePath(dropdownItem.href) ? 'page' : undefined}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span>{dropdownItem.label}</span>
                                                </div>
                                                <div className="text-sm text-black mt-1 font-normal">{dropdownItem.description}</div>
                                            </div>
                                        </Link>
                                    )
                                ))}
                            </div>
                        ) : (
                            item.href && (
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={`text-base font-bold px-3 py-2 rounded transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 block ${isActivePath(item.href)
                                        ? 'text-black bg-gray-100'
                                        : 'text-black hover:text-black hover:bg-gray-100'
                                        }`}
                                    aria-current={isActivePath(item.href) ? 'page' : undefined}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span>{item.label}</span>
                                        </div>
                                        <div className="text-sm text-black mt-1 font-normal">{item.description}</div>
                                    </div>
                                </Link>
                            )
                        )}
                    </div>
                ))}

                {/* Mobile: Show SIGN UP or Profile Links based on auth state */}
                {user && userProfile ? (
                    <div className="border-t-2 border-gray-200 pt-4 mt-4">
                        <div className="flex items-center gap-3 px-3 mb-4">
                            {userProfile.photo_url ? (
                                <Image
                                    src={userProfile.photo_url}
                                    alt={userProfile.full_name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-black"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-600" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-black">{userProfile.full_name}</p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                        </div>
                        <Link
                            href={`/people/${userProfile.slug}`}
                            onClick={onClose}
                            className="block px-6 py-3 bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors mb-2 rounded-sm"
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                View Profile
                            </div>
                        </Link>
                        <Link
                            href={`/people/${userProfile.slug}/edit`}
                            onClick={onClose}
                            className="block px-6 py-3 bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors mb-2 rounded-sm"
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Edit Profile
                            </div>
                        </Link>
                        {userProfile.user_role === 'admin' && (
                            <Link
                                href="/admin"
                                onClick={onClose}
                                className="block px-6 py-3 bg-gray-100 text-black font-bold text-sm hover:bg-gray-200 transition-colors mb-2 rounded-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Admin Dashboard
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={() => {
                                onClose();
                                onSignOut();
                            }}
                            className="w-full px-6 py-3 bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors rounded-sm"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/login"
                            onClick={onClose}
                            className="px-6 py-3 bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors border-2 border-black text-center shadow-lg rounded-sm"
                            aria-label="Log in to your account"
                        >
                            LOG IN
                        </Link>
                        <Link
                            href="/signup"
                            onClick={onClose}
                            className="px-6 py-3 bg-black text-white font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors border-2 border-black text-center shadow-lg rounded-sm"
                            aria-label="Create your profile"
                        >
                            SIGN UP
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
