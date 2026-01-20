'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
    slug: string;
    full_name: string;
    photo_url: string | null;
    user_role?: string;
}

export function useNavigationAuth() {
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Create Supabase client only on client-side
        const supabase = createClient();

        // Check auth state
        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;

                setUser(user);

                if (user) {
                    // Fetch user's public profile (linked by user_id)
                    const { data: publicProfile, error: publicProfileError } = await supabase
                        .from('public_profiles')
                        .select('slug, full_name, photo_url')
                        .eq('user_id', user.id)
                        .single();

                    // Fetch admin status from profiles table
                    const { data: authProfile } = await supabase
                        .from('profiles')
                        .select('role, is_super_admin')
                        .eq('id', user.id)
                        .single();

                    // Check if super admin (role-based or is_super_admin flag)
                    const isAdmin = authProfile?.is_super_admin === true ||
                                    authProfile?.role === 'admin' ||
                                    authProfile?.role === 'super_admin';

                    if (publicProfileError && publicProfileError.code !== 'PGRST116') {
                        // PGRST116 = no rows returned, which is OK for users without public profile
                        console.error('Error fetching profile:', publicProfileError);
                    }

                    if (publicProfile) {
                        setUserProfile({
                            slug: publicProfile.slug || '',
                            full_name: publicProfile.full_name || '',
                            photo_url: publicProfile.photo_url,
                            user_role: isAdmin ? 'admin' : 'user'
                        });
                    } else {
                        // User has no public profile, use email as fallback
                        setUserProfile({
                            slug: '',
                            full_name: user.email?.split('@')[0] || 'User',
                            photo_url: null,
                            user_role: isAdmin ? 'admin' : 'user'
                        });
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setUserProfile(null);
            } else {
                // Re-check auth on sign in to get profile
                if (_event === 'SIGNED_IN') {
                    checkAuth();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        window.location.href = '/';
    };

    return {
        user,
        userProfile,
        mounted,
        signOut
    };
}
