'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client-lite';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

export interface UserProfile {
    slug: string;
    full_name: string;
    photo_url: string | null;
    user_role?: string;
}

export function useNavigationAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Create Supabase client only on client-side
        const supabase = createClient();

        // Check auth state
        const checkAuth = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    setUser(null);
                    setUserProfile(null);
                    return;
                }

                if (!session?.user) {
                    setUser(null);
                    setUserProfile(null);
                    return;
                }

                const user = session.user;

                setUser(user);

                if (user) {
                    // Fetch user's public profile (linked by user_id)
                    const { data: publicProfile, error: publicProfileError } = await supabase
                        .from('public_profiles')
                        .select('slug, full_name, photo_url')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    // Fetch admin status from profiles table
                    const { data: authProfile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    const isAdmin = authProfile?.role === 'admin';

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
                setUser(null);
                setUserProfile(null);
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
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
