'use client';

import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import { Users, Sparkles } from 'lucide-react';

interface ProfileData {
  profile: {
    id: string;
    name?: string;
    preferred_name?: string;
    bio?: string;
    profile_picture_url?: string;
    organization?: {
      name: string;
    };
  };
  justiceStories: any[];
  appearanceRole?: string;
  appearanceExcerpt?: string;
  isFeatured?: boolean;
}

export default function FeaturedStories() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedProfiles() {
      try {
        const response = await fetch('/api/featured-profiles');
        if (response.ok) {
          const data = await response.json();
          setProfiles(data.profiles || []);
        }
      } catch (error) {
        console.error('Error loading featured profiles:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedProfiles();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 border-t-2 border-b-2 border-black">
        <div className="container-justice">
          <div className="text-center text-gray-600">
            <div className="animate-pulse">Loading stories...</div>
          </div>
        </div>
      </section>
    );
  }

  if (profiles.length === 0) {
    return null; // Don't show section if no featured profiles
  }

  return (
    <section className="section-padding bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 border-t-2 border-b-2 border-black">
      <div className="container-justice">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border-2 border-yellow-600 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <span className="font-bold text-yellow-800 uppercase tracking-wider text-sm">
              Featured Stories
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Real People. Real Change.
          </h2>

          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-4">
            These aren't case studies. They're lives transformed by community-led programs.
          </p>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every story shared through <strong>Empathy Ledger</strong>, an Indigenous-led storytelling platform
            that maintains data sovereignty and cultural protocols.
          </p>
        </div>

        {/* Featured Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {profiles.map((profileData, index) => (
            <div
              key={profileData.profile.id + index}
              className="transform transition-all hover:scale-105"
            >
              <ProfileCard
                profile={profileData.profile}
                role={profileData.appearanceRole}
                storyExcerpt={profileData.appearanceExcerpt}
                isFeatured={true}
              />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center p-8 bg-white/80 border-2 border-black">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-6 w-6" />
            <h3 className="text-2xl font-bold">Your Story Matters</h3>
          </div>

          <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
            Have you or someone you know been helped by a youth justice program?
            Share your story to help others find hope.
          </p>

          <a
            href="https://empathy-ledger.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-all"
          >
            Share Your Story
          </a>

          <p className="text-sm text-gray-600 mt-4">
            All stories are shared with explicit consent and honor cultural protocols
          </p>
        </div>
      </div>
    </section>
  );
}
