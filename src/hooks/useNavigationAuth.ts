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
                    // Fetch user's profile and role
                    // Using 'profiles' table instead of 'public_profiles' as per latest schema
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('slug, full_name, photo_url, is_super_admin')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                        return;
                    }

                    if (profile) {
                        setUserProfile({
                            slug: profile.slug || '',
                            full_name: profile.full_name || '',
                            photo_url: profile.photo_url,
                            user_role: profile.is_super_admin ? 'admin' : 'user'
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
