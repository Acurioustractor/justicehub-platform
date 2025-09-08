'use client';

import { useState } from 'react';
import { 
  Palette,
  Music,
  Camera,
  Film,
  Mic,
  Brush,
  Image,
  Headphones,
  Award,
  Upload,
  Eye,
  Download,
  Share,
  Star,
  Users,
  Calendar,
  Trophy,
  Play,
  Heart,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

export default function ArtAndInnovationPage() {
  const [activeTab, setActiveTab] = useState('featured');

  const featuredArt = [
    {
      id: 1,
      title: "Voices from the Inside",
      artist: "Marcus Thompson",
      age: 17,
      type: "Digital Art",
      medium: "Procreate on iPad",
      story: "Created during his time in a youth facility, Marcus uses digital art to express the journey from isolation to hope.",
      image: "/art/marcus-voices.jpg",
      program: "BackTrack Youth Works",
      tags: ["Hope", "Transformation", "Digital"],
      views: 1247,
      likes: 89
    },
    {
      id: 2,
      title: "Country Strong",
      artist: "Sarah Williams",
      age: 19,
      type: "Photography",
      medium: "35mm Film",
      story: "A series documenting cultural healing practices on Groote Eylandt, showing the power of connection to country.",
      image: "/art/sarah-country.jpg",
      program: "Groote Eylandt Cultural Healing",
      tags: ["Culture", "Healing", "Photography"],
      views: 2156,
      likes: 143
    },
    {
      id: 3,
      title: "Future Me",
      artist: "Jordan Chen",
      age: 16,
      type: "Music",
      medium: "Original Hip-Hop Track",
      story: "A rap song about seeing beyond current circumstances and building toward goals, created in youth mentorship program.",
      audio: "/audio/jordan-future-me.mp3",
      program: "Transition 2 Success",
      tags: ["Music", "Goals", "Hip-Hop"],
      views: 3421,
      likes: 287
    }
  ];

  const communityGallery = [
    {
      id: 4,
      title: "Breaking Cycles",
      artist: "Alex Rodriguez",
      age: 18,
      type: "Poetry",
      medium: "Spoken Word Performance",
      story: "A powerful piece about breaking generational patterns.",
      program: "Youth Voice Collective",
      tags: ["Poetry", "Change"]
    },
    {
      id: 5,
      title: "New Dawn",
      artist: "Lily Aboriginal Name",
      age: 15,
      type: "Painting",
      medium: "Acrylic on Canvas",
      story: "Traditional dot painting with contemporary themes.",
      program: "Cultural Arts Program",
      tags: ["Traditional", "Contemporary"]
    },
    {
      id: 6,
      title: "Street Symphony",
      artist: "Devon Smith",
      age: 20,
      type: "Music",
      medium: "Electronic Beats",
      story: "Mixing urban sounds with orchestral elements.",
      program: "Music Production Workshop",
      tags: ["Electronic", "Urban"]
    }
  ];

  const currentChallenge = {
    title: "New Beginnings",
    theme: "Create art that represents hope, change, or new opportunities",
    deadline: "January 31, 2025",
    submissions: 47,
    prize: "Art supplies + featured gallery spot",
    type: "All mediums welcome"
  };

  const upcomingChallenge = {
    title: "Rhythm & Rhyme",
    theme: "Create music, rap, or spoken word about your journey",
    startDate: "February 1, 2025",
    duration: "4 weeks",
    prize: "Studio time + mentorship session",
    type: "Audio submissions"
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Unified Navigation */}
      <Navigation />

      <main id="main-content">
        {/* Hero Section */}
        <section className="header-offset pb-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-4">
                <span className="inline-block bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-wider">
                  Art & Innovation Hub
                </span>
              </div>
              <h1 className="headline-truth mb-6">
                Where Creativity Meets Change
              </h1>
              <p className="text-xl text-black font-medium max-w-3xl mx-auto leading-relaxed mb-8">
                Showcasing the artistic talents and innovative solutions created by young people in justice programs. 
                Real art, real innovation, real impact.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold">47</div>
                  <p className="text-sm font-medium">Art pieces</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold">23</div>
                  <p className="text-sm font-medium">Young artists</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold">8</div>
                  <p className="text-sm font-medium">Programs</p>
                </div>
                <div className="text-center">
                  <div className="font-mono text-3xl font-bold">12K</div>
                  <p className="text-sm font-medium">Views</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="border-b-2 border-black">
          <div className="container-justice py-6">
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setActiveTab('featured')}
                className={`px-6 py-3 font-bold tracking-wider transition-all ${
                  activeTab === 'featured' 
                    ? 'bg-black text-white' 
                    : 'border-2 border-black hover:bg-black hover:text-white'
                }`}
              >
                FEATURED ART
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-6 py-3 font-bold tracking-wider transition-all ${
                  activeTab === 'gallery' 
                    ? 'bg-black text-white' 
                    : 'border-2 border-black hover:bg-black hover:text-white'
                }`}
              >
                COMMUNITY GALLERY
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`px-6 py-3 font-bold tracking-wider transition-all ${
                  activeTab === 'challenges' 
                    ? 'bg-black text-white' 
                    : 'border-2 border-black hover:bg-black hover:text-white'
                }`}
              >
                CREATIVE CHALLENGES
              </button>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="container-justice py-12">
          {/* Featured Art Tab */}
          {activeTab === 'featured' && (
            <div>
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-8 w-8" />
                  Featured Artists
                </h2>
                <p className="text-xl text-black font-medium mb-8">
                  Spotlight on exceptional creative work from young people in our community.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredArt.map((art) => (
                    <div key={art.id} className="group">
                      <div className="aspect-[4/3] bg-gray-200 mb-4 relative overflow-hidden border-2 border-black">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {art.type === 'Music' ? (
                            <div className="text-center">
                              <Music className="h-16 w-16 mb-4 text-black mx-auto" />
                              <span className="font-mono text-black text-lg font-bold">{art.type.toUpperCase()}</span>
                            </div>
                          ) : art.type === 'Photography' ? (
                            <div className="text-center">
                              <Camera className="h-16 w-16 mb-4 text-black mx-auto" />
                              <span className="font-mono text-black text-lg font-bold">{art.type.toUpperCase()}</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Palette className="h-16 w-16 mb-4 text-black mx-auto" />
                              <span className="font-mono text-black text-lg font-bold">{art.type.toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-4 right-4">
                          <div className="bg-black text-white px-2 py-1 text-xs font-bold">
                            {art.type}
                          </div>
                        </div>
                        {art.type === 'Music' && (
                          <div className="absolute bottom-4 left-4">
                            <button className="bg-white text-black p-2 hover:bg-gray-100 transition-colors">
                              <Play className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-2 border-black p-6">
                        <h3 className="text-xl font-bold mb-2">{art.title}</h3>
                        <p className="text-sm font-medium mb-1">by {art.artist}, age {art.age}</p>
                        <p className="text-sm text-black mb-3">{art.medium}</p>
                        <p className="text-black font-medium mb-4">{art.story}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs">
                              <Eye className="h-3 w-3" />
                              {art.views}
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                              <Heart className="h-3 w-3" />
                              {art.likes}
                            </span>
                          </div>
                          <p className="text-xs font-bold">{art.program}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {art.tags.map((tag) => (
                              <span key={tag} className="border border-black px-2 py-1 text-xs font-bold">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button className="cta-primary text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>
                            <button className="border border-black px-2 py-1 text-xs font-bold hover:bg-black hover:text-white transition-all">
                              <Share className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Artist Spotlight */}
              <div className="bg-gray-50 border-2 border-black p-8 mb-12">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Artist Spotlight: Marcus Thompson
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-black font-medium mb-4">
                      Marcus discovered digital art during his time in a youth facility. What started as a way to pass time 
                      became a powerful form of expression and healing. His work now inspires other young people to find 
                      their creative voice.
                    </p>
                    <p className="text-black font-medium mb-6">
                      "Art helped me see that my story doesn't end with my mistakes. It's just the beginning of something better."
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold">Pieces created:</span>
                        <span>12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Total views:</span>
                        <span>4,892</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Awards:</span>
                        <span>Youth Artist of the Month</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold">Recent Works</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                          <Palette className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Hope Rising</p>
                          <p className="text-xs text-black">Digital painting - 234 views</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                          <Palette className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Tomorrow's Promise</p>
                          <p className="text-xs text-black">Mixed media - 156 views</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Community Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Users className="h-8 w-8" />
                Community Gallery
              </h2>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                {communityGallery.map((art) => (
                  <div key={art.id} className="group">
                    <div className="aspect-square bg-gray-200 mb-3 relative overflow-hidden border border-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {art.type === 'Music' ? (
                          <Music className="h-8 w-8 text-black" />
                        ) : art.type === 'Poetry' ? (
                          <Mic className="h-8 w-8 text-black" />
                        ) : art.type === 'Photography' ? (
                          <Camera className="h-8 w-8 text-black" />
                        ) : (
                          <Palette className="h-8 w-8 text-black" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{art.title}</h3>
                    <p className="text-xs font-medium">{art.artist}, {art.age}</p>
                    <p className="text-xs text-black">{art.program}</p>
                    <div className="flex gap-1 mt-2">
                      {art.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="border border-black px-1 py-0.5 text-xs font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Art CTA */}
              <div className="bg-black text-white p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Share Your Creative Work</h2>
                <p className="mb-6 font-medium max-w-2xl mx-auto">
                  Are you creating art, music, poetry, photography, or other creative work? 
                  We want to showcase your talents and share your voice with the community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white text-black px-6 py-3 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                    <Upload className="h-4 w-4 mr-2 inline" />
                    Submit Your Art
                  </button>
                  <button className="border-2 border-white px-6 py-3 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                    <Eye className="h-4 w-4 mr-2 inline" />
                    View Guidelines
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Creative Challenges Tab */}
          {activeTab === 'challenges' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Monthly Creative Challenges</h2>
                <p className="text-xl text-black font-medium max-w-2xl mx-auto">
                  Join our community challenges to explore new creative skills and share your perspective.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Current Challenge */}
                <div className="border-2 border-black p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Camera className="h-8 w-8" />
                    <h3 className="text-2xl font-bold">January 2025: "{currentChallenge.title}"</h3>
                  </div>
                  <p className="text-black font-medium mb-6">
                    {currentChallenge.theme}
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="font-bold">Submissions:</span>
                      <span>{currentChallenge.submissions} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Deadline:</span>
                      <span>{currentChallenge.deadline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Prize:</span>
                      <span>{currentChallenge.prize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Medium:</span>
                      <span>{currentChallenge.type}</span>
                    </div>
                  </div>
                  <button className="cta-primary w-full">
                    Submit Entry
                  </button>
                </div>

                {/* Upcoming Challenge */}
                <div className="border-2 border-black p-8 bg-gray-50">
                  <div className="flex items-center gap-3 mb-4">
                    <Music className="h-8 w-8" />
                    <h3 className="text-2xl font-bold">February 2025: "{upcomingChallenge.title}"</h3>
                  </div>
                  <p className="text-black font-medium mb-6">
                    {upcomingChallenge.theme}
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="font-bold">Opens:</span>
                      <span>{upcomingChallenge.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Duration:</span>
                      <span>{upcomingChallenge.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Prize:</span>
                      <span>{upcomingChallenge.prize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Medium:</span>
                      <span>{upcomingChallenge.type}</span>
                    </div>
                  </div>
                  <button className="border-2 border-black w-full py-3 font-bold hover:bg-black hover:text-white transition-all">
                    Get Notified
                  </button>
                </div>
              </div>

              {/* Past Challenge Winners */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Recent Winners
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="border border-black p-4">
                    <div className="aspect-square bg-gray-200 mb-3 flex items-center justify-center">
                      <Award className="h-8 w-8 text-black" />
                    </div>
                    <h4 className="font-bold">December: "Reflection"</h4>
                    <p className="text-sm font-medium">Winner: Maya K., 18</p>
                    <p className="text-xs text-black">"Mirror of Growth" - Photography series</p>
                  </div>
                  <div className="border border-black p-4">
                    <div className="aspect-square bg-gray-200 mb-3 flex items-center justify-center">
                      <Award className="h-8 w-8 text-black" />
                    </div>
                    <h4 className="font-bold">November: "Community"</h4>
                    <p className="text-sm font-medium">Winner: Tyler R., 16</p>
                    <p className="text-xs text-black">"Together We Rise" - Digital mural</p>
                  </div>
                  <div className="border border-black p-4">
                    <div className="aspect-square bg-gray-200 mb-3 flex items-center justify-center">
                      <Award className="h-8 w-8 text-black" />
                    </div>
                    <h4 className="font-bold">October: "Change"</h4>
                    <p className="text-sm font-medium">Winner: Sam P., 19</p>
                    <p className="text-xs text-black">"Phoenix Rising" - Rap song</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-8 text-white">
              Every piece of art tells a story.<br />
              Every story changes lives.<br />
              Every life has value.
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto font-medium">
              Join our creative community. Share your art. Inspire others. 
              Be part of a movement that values your voice and your vision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/innovation" className="inline-block bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                <ArrowRight className="inline mr-2 h-5 w-5" />
                INNOVATION LAB
              </Link>
              <Link href="/stories/new" className="inline-block border-2 border-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                <Mic className="inline mr-2 h-5 w-5" />
                SHARE YOUR STORY
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}