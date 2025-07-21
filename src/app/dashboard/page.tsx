'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserContext } from '@/contexts/UserContext';
import { UnifiedStoryFeed } from '@/components/stories/UnifiedStoryFeed';
import { 
  PenSquare, 
  Users, 
  Target, 
  Trophy,
  Shield,
  Globe,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const { user: contextUser } = useUserContext();
  const router = useRouter();

  // Development bypass
  const isDev = process.env.NODE_ENV === 'development';
  const devUser = isDev ? {
    sub: 'auth0|dev-user',
    name: 'Dev User',
    email: 'dev@example.com',
    picture: 'https://placehold.co/100x100'
  } : null;

  const currentUser = isDev ? devUser : user;
  const currentIsLoading = isDev ? false : isLoading;

  useEffect(() => {
    if (!currentIsLoading && !currentUser && !isDev) {
      router.push('/api/auth/login');
    }
  }, [currentUser, currentIsLoading, router, isDev]);

  if (currentIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="font-mono text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser && !isDev) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Stark and functional */}
      <header className="border-b-2 border-black">
        <div className="container-justice py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight">
              JUSTICEHUB
            </Link>
            <div className="flex items-center gap-8">
              <span className="font-mono text-sm">
                {currentUser?.name || currentUser?.email}
              </span>
              <Link href="/api/auth/logout" className="font-bold underline">
                SIGN OUT
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-justice py-16">
        {/* Hero Statement */}
        <div className="mb-16">
          <h1 className="headline-truth mb-4">
            Your dashboard.<br />
            Your story.<br />
            Your power.
          </h1>
          <p className="text-xl max-w-2xl">
            No judgment. No lectures. Just tools that work and people who get it.
          </p>
        </div>

        {/* Quick Actions - Grid layout */}
        <div className="justice-grid grid-cols-1 md:grid-cols-4 mb-16">
          <Link href="/stories/new" className="group">
            <div className="p-8 h-full hover:bg-black hover:text-white transition-all">
              <PenSquare className="h-12 w-12 mb-4" />
              <h3 className="font-bold text-lg mb-2">SHARE YOUR STORY</h3>
              <p className="text-sm mb-4">Your words. Your truth. Your power.</p>
              <span className="font-bold group-hover:underline">Start writing →</span>
            </div>
          </Link>

          <Link href="/mentors" className="group">
            <div className="p-8 h-full hover:bg-black hover:text-white transition-all">
              <Users className="h-12 w-12 mb-4" />
              <h3 className="font-bold text-lg mb-2">FIND MENTORS</h3>
              <p className="text-sm mb-4">Real people. Real connection. Real help.</p>
              <span className="font-bold group-hover:underline">Connect now →</span>
            </div>
          </Link>

          <Link href="/opportunities" className="group">
            <div className="p-8 h-full hover:bg-black hover:text-white transition-all">
              <Target className="h-12 w-12 mb-4" />
              <h3 className="font-bold text-lg mb-2">OPPORTUNITIES</h3>
              <p className="text-sm mb-4">Jobs. Programs. Pathways that work.</p>
              <span className="font-bold group-hover:underline">Explore →</span>
            </div>
          </Link>

          <Link href="/profile" className="group">
            <div className="p-8 h-full hover:bg-black hover:text-white transition-all">
              <Trophy className="h-12 w-12 mb-4" />
              <h3 className="font-bold text-lg mb-2">YOUR PROFILE</h3>
              <p className="text-sm mb-4">Track progress. Celebrate wins.</p>
              <span className="font-bold group-hover:underline">View profile →</span>
            </div>
          </Link>
        </div>

        {/* Privacy Statement */}
        <div className="border-2 border-black p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8" />
            YOUR PRIVACY. YOUR CONTROL.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                PUBLIC STORIES
              </h3>
              <p>Inspire others. Change the narrative. Stay anonymous if you want.</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                TRUSTED NETWORK
              </h3>
              <p>Share with mentors and organizations only. Safe space guaranteed.</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                ANONYMOUS MODE
              </h3>
              <p>Share your truth without your name. Power without exposure.</p>
            </div>
          </div>
        </div>

        {/* Story Feed - Simplified */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b-2 border-black pb-4">
            <h2 className="text-2xl font-bold">STORIES FROM YOUR COMMUNITY</h2>
            <div className="flex gap-4">
              <button className="font-bold underline">ALL</button>
              <button className="font-bold hover:underline">MINE</button>
              <button className="font-bold hover:underline">NETWORK</button>
              <button className="font-bold hover:underline">PUBLIC</button>
            </div>
          </div>

          {/* Story Feed Component */}
          <div className="space-y-0">
            <UnifiedStoryFeed 
              showHeader={false}
              showStats={false}
              limit={5}
            />
          </div>

          <div className="text-center pt-8">
            <Link href="/stories" className="cta-primary inline-block">
              VIEW ALL STORIES
            </Link>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-12 bg-black text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to change your story?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start with one step. One connection. One opportunity.
            We're here to make it happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/stories/new" className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100">
              SHARE YOUR STORY
            </Link>
            <Link href="/dashboard/dreamtrack" className="inline-block border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              LAUNCH DREAMTRACK
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}