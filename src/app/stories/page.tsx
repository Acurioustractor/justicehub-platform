'use client';

import { useState, useEffect } from 'react';
import { 
  PenSquare, 
  TrendingUp,
  Users,
  Globe,
  Shield,
  Search,
  Filter,
  Heart,
  BookOpen,
  Play,
  Camera,
  Mic,
  FileText,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Calendar,
  Tag,
  ExternalLink,
  Quote
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

// Sample story data for testing
const sampleStories = [
  {
    id: 1,
    title: "From Prison to Purpose: Marcus's Welding Journey",
    author: "Marcus Thompson",
    age: 19,
    location: "Armidale, NSW",
    program: "BackTrack Youth Works",
    theme: "Transformation",
    summary: "After multiple run-ins with the law, Marcus found his calling through BackTrack's unique combination of dog training, welding, and mentorship. Now he's a qualified welder mentoring other at-risk youth.",
    heroImage: "/placeholder-hero-marcus.jpg",
    quote: "BackTrack didn't just teach me welding. They taught me I was worth something. Now I'm mentoring other kids who've been where I was.",
    videoUrl: "https://youtube.com/embed/sample-marcus",
    tags: ["Welding", "Mentorship", "Second Chances", "Rural NSW"],
    contactEmail: "marcus@backtrack.org.au",
    programLink: "/grassroots/backtrack-youth-works",
    publishDate: "2024-01-15",
    readTime: "8 min read",
    featured: true
  },
  {
    id: 2,
    title: "Finding My Voice: Aisha's Social Work Path",
    author: "Aisha Patel",
    age: 21,
    location: "Logan, QLD",
    program: "Logan Youth Collective",
    theme: "Education",
    summary: "From being labeled a 'problem student' to studying social work at university, Aisha's journey shows how community support can unlock potential that others couldn't see.",
    heroImage: "/placeholder-hero-aisha.jpg",
    quote: "Everyone else saw a problem kid. The Youth Collective saw someone with potential. Three years later, I'm studying social work to give back.",
    videoUrl: null,
    tags: ["Education", "Social Work", "Community Support", "Queensland"],
    contactEmail: "aisha@loganyouth.org.au",
    programLink: "/grassroots/logan-youth-collective",
    publishDate: "2024-01-08",
    readTime: "6 min read",
    featured: true
  },
  {
    id: 3,
    title: "Culture Saved My Life: Jayden's Healing Journey",
    author: "Jayden Williams",
    age: 18,
    location: "Alice Springs, NT",
    program: "Healing Circles Program",
    theme: "Healing",
    summary: "Through traditional Aboriginal healing practices and elder mentorship, Jayden overcame trauma and substance abuse. Now he helps other young Aboriginal people reconnect with culture.",
    heroImage: "/placeholder-hero-jayden.jpg",
    quote: "Connecting with elders and learning traditional ways helped me understand who I am. Now I help other young Aboriginal kids find their way too.",
    videoUrl: "https://youtube.com/embed/sample-jayden",
    tags: ["Aboriginal Culture", "Healing", "Trauma Recovery", "Northern Territory"],
    contactEmail: "jayden@healingcircles.org.au",
    programLink: "/grassroots/healing-circles-program",
    publishDate: "2023-12-20",
    readTime: "10 min read",
    featured: true
  },
  {
    id: 4,
    title: "From Foster Care to Film: Sarah's Creative Journey",
    author: "Sarah Chen",
    age: 20,
    location: "Melbourne, VIC",
    program: "Creative Futures Collective",
    theme: "Foster Care",
    summary: "Aging out of foster care with nowhere to go, Sarah discovered filmmaking through a community arts program. Her documentary about youth homelessness just won a national award.",
    heroImage: "/placeholder-hero-sarah.jpg",
    quote: "Nobody expected the foster kid to win awards. But when you give young people cameras and trust them to tell their stories, magic happens.",
    videoUrl: "https://youtube.com/embed/sample-sarah",
    tags: ["Foster Care", "Creative Arts", "Filmmaking", "Victoria"],
    contactEmail: "sarah@creativefutures.org.au",
    programLink: "/grassroots/creative-futures-collective",
    publishDate: "2023-12-10",
    readTime: "7 min read",
    featured: false
  },
  {
    id: 5,
    title: "Breaking Cycles: Tommy's Community Leadership",
    author: "Tommy Rodriguez",
    age: 22,
    location: "Redfern, NSW",
    program: "Young Leaders Initiative",
    theme: "Advocacy",
    summary: "Growing up in public housing with family members in and out of prison, Tommy chose a different path. Now he runs community workshops helping other young people navigate the justice system.",
    heroImage: "/placeholder-hero-tommy.jpg",
    quote: "I knew every police officer in my neighborhood by age 12. Now I'm training them on how to better support young people in crisis.",
    videoUrl: null,
    tags: ["Community Leadership", "Justice Reform", "Public Housing", "NSW"],
    contactEmail: "tommy@youngleaders.org.au",
    programLink: "/grassroots/young-leaders-initiative",
    publishDate: "2023-11-28",
    readTime: "9 min read",
    featured: false
  },
  {
    id: 6,
    title: "Coding My Way Forward: Alex's Tech Journey",
    author: "Alex Kim",
    age: 17,
    location: "Adelaide, SA",
    program: "TechStart Youth",
    theme: "Education",
    summary: "Suspended from school multiple times for 'behavioral issues,' Alex found focus and purpose through coding. Now they're building apps to help other neurodivergent young people succeed.",
    heroImage: "/placeholder-hero-alex.jpg",
    quote: "They said I couldn't focus, but give me a coding problem and I'll work on it for 12 hours straight. Different doesn't mean broken.",
    videoUrl: "https://youtube.com/embed/sample-alex",
    tags: ["Technology", "Neurodiversity", "Education", "South Australia"],
    contactEmail: "alex@techstartyouth.org.au",
    programLink: "/grassroots/techstart-youth",
    publishDate: "2023-11-15",
    readTime: "5 min read",
    featured: false
  }
];

export default function StoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = ['All', 'Transformation', 'Education', 'Healing', 'Foster Care', 'Advocacy'];
  const contentTypes = ['All', 'Blog Posts', 'Videos', 'Photos', 'Interviews'];

  const filteredStories = sampleStories.filter(story => {
    const matchesSearch = !searchQuery || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTheme = selectedTheme === 'All' || story.theme === selectedTheme;
    
    return matchesSearch && matchesTheme;
  });

  const featuredStories = sampleStories.filter(story => story.featured);

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
              <div className="mb-4 text-sm uppercase tracking-wider text-black font-bold">
                STORIES & VOICES
              </div>
              <h1 className="headline-truth mb-6">
                Stories That Inspire Change
              </h1>
              <p className="text-xl text-black mb-10 leading-relaxed font-medium">
                Discover stories from youth across communities, share your journey, 
                and connect with others who understand your path.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/stories/new">
                  <button className="cta-primary">
                    <PenSquare className="h-5 w-5 mr-2" />
                    Share Your Story
                  </button>
                </Link>
                <Link href="/stories/browse">
                  <button className="cta-secondary">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Browse All Stories
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container-justice py-8">
          {/* Enhanced Stats Section with Multimedia */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">1,200+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Blog Posts</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Play className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">250+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Video Stories</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Camera className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">800+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Photo Stories</div>
            </div>
            <div className="text-center py-6 border-r border-black last:border-r-0">
              <Mic className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">150+</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Interviews</div>
            </div>
            <div className="text-center py-6">
              <TrendingUp className="h-8 w-8 mx-auto mb-3 text-black" />
              <div className="text-3xl font-bold text-black">85%</div>
              <div className="text-sm uppercase tracking-wider text-black font-medium mt-1">Impact Rate</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-12">
            <div className="flex gap-4 items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                <input
                  type="search"
                  placeholder="Search stories by title, content, or themes..."
                  value={mounted ? searchQuery : ''}
                  onChange={(e) => mounted && setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
                  disabled={!mounted}
                />
              </div>
              <button className="cta-secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Enhanced Content Type and Story Filters */}
            <div className="space-y-4">
              {/* Content Type Filters */}
              <div>
                <h3 className="text-sm font-bold text-black mb-2 uppercase tracking-wider">Content Types</h3>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <button 
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`border-2 px-3 py-1 text-sm font-bold transition-all flex items-center gap-1 ${
                        selectedType === type
                          ? 'border-blue-800 bg-blue-800 text-white'
                          : 'border-blue-800 bg-blue-50 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      {type === 'Blog Posts' && <FileText className="h-3 w-3" />}
                      {type === 'Videos' && <Play className="h-3 w-3" />}
                      {type === 'Photos' && <Camera className="h-3 w-3" />}
                      {type === 'Interviews' && <Mic className="h-3 w-3" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story Theme Filters */}
              <div>
                <h3 className="text-sm font-bold text-black mb-2 uppercase tracking-wider">Story Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button 
                      key={theme}
                      onClick={() => setSelectedTheme(theme)}
                      className={`border-2 px-3 py-1 text-sm font-bold transition-all ${
                        selectedTheme === theme
                          ? 'border-black bg-black text-white'
                          : 'border-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Stories Section */}
          <div className="mb-12">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-black" />
                <span className="text-sm uppercase tracking-wider text-black font-bold">FEATURED STORIES</span>
              </div>
              <h2 className="text-3xl font-bold text-black">Stories That Move, Inspire & Connect</h2>
              <p className="text-black font-medium mt-2">
                Powerful journeys of transformation, healing, and hope from young people across Australia.
              </p>
            </div>
            
            {/* Featured Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {featuredStories.map((story) => (
                <div key={story.id} className="data-card">
                  <div className="aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm">
                      HERO IMAGE: {story.author}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block bg-blue-800 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
                      {story.theme}
                    </span>
                    <span className="text-sm text-gray-600">{story.readTime}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-3 line-clamp-2">{story.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{story.location}</span>
                    <span>•</span>
                    <span>{story.program}</span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">{story.summary}</p>
                  
                  <div className="border-l-4 border-orange-600 pl-4 mb-4 bg-orange-50 py-2">
                    <Quote className="h-4 w-4 text-orange-600 mb-2" />
                    <p className="text-sm italic text-gray-700 line-clamp-2">"{story.quote}"</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link href={`/stories/${story.id}`} className="font-bold underline text-blue-800 hover:text-blue-600">
                      Read full story →
                    </Link>
                    {story.videoUrl && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Play className="h-4 w-4" />
                        <span>Video</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* All Stories Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-8">All Stories</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <div key={story.id} className="data-card">
                  <div className="aspect-video bg-gray-200 mb-4 border-2 border-black overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm">
                      IMAGE: {story.author}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider text-white ${
                      story.theme === 'Transformation' ? 'bg-blue-800' :
                      story.theme === 'Education' ? 'bg-orange-600' :
                      story.theme === 'Healing' ? 'bg-blue-600' :
                      story.theme === 'Foster Care' ? 'bg-orange-700' :
                      story.theme === 'Advocacy' ? 'bg-blue-900' :
                      'bg-gray-800'
                    }`}>
                      {story.theme}
                    </span>
                    <span className="text-sm text-gray-600">{story.readTime}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{story.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{story.location}</span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-2">{story.summary}</p>
                  
                  <div className="flex items-center justify-between">
                    <Link href={`/stories/${story.id}`} className="text-sm font-bold underline text-blue-800 hover:text-blue-600">
                      Read more →
                    </Link>
                    <div className="flex items-center gap-2">
                      {story.videoUrl && <Play className="h-4 w-4 text-gray-600" />}
                      <Calendar className="h-4 w-4 text-gray-600" />
                      {mounted && <span className="text-xs text-gray-600">{new Date(story.publishDate).toLocaleDateString('en-AU')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredStories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No stories found matching your search.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setSelectedTheme('All'); setSelectedType('All');}}
                  className="mt-4 cta-secondary"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          
          {/* Content Type Showcase */}
          <div className="mb-12 py-12 border-t-2 border-b-2 border-black">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3 text-black">Stories in Every Format</h2>
              <p className="text-black font-medium">
                Choose how you want to experience and share your story
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 border-2 border-blue-800 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-800" />
                </div>
                <h3 className="font-bold mb-2 text-black">Blog Posts</h3>
                <p className="text-sm text-black font-medium">
                  Share your journey through detailed written narratives with photos and multimedia.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-50 border-2 border-orange-600 flex items-center justify-center mx-auto mb-4">
                  <Play className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold mb-2 text-black">Video Stories</h3>
                <p className="text-sm text-black font-medium">
                  Create powerful video documentaries and vlogs that capture your authentic voice.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 border-2 border-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2 text-black">Photo Essays</h3>
                <p className="text-sm text-black font-medium">
                  Tell your story through compelling photography and visual narratives.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-50 border-2 border-orange-700 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-8 w-8 text-orange-700" />
                </div>
                <h3 className="font-bold mb-2 text-black">Interviews</h3>
                <p className="text-sm text-black font-medium">
                  Participate in or conduct interviews that explore important themes and experiences.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Safety Notice */}
          <div className="mb-12 border-2 border-black bg-gray-50 p-8">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-black mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-3 text-black">Your Stories, Your Control</h3>
                <p className="text-black font-medium mb-6">
                  At JusticeHub, you decide who sees your story. Choose from public sharing to inspire others, 
                  organization-only for trusted networks, or anonymous options to protect your identity.
                </p>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-black" />
                    <span className="text-black"><span className="font-bold">Public:</span> Inspire everyone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-black" />
                    <span className="text-black"><span className="font-bold">Network:</span> Share safely</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-black" />
                    <span className="text-black"><span className="font-bold">Anonymous:</span> Stay protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How Stories Create Impact */}
          <div className="mb-12 py-12 border-t-2 border-b-2 border-black">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3 text-black">How Your Story Creates Impact</h2>
              <p className="text-black font-medium">
                Every story shared creates ripples of change in our community
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-black" />
                </div>
                <h3 className="font-bold mb-2 text-black">Inspire Others</h3>
                <p className="text-sm text-black font-medium">
                  Your journey shows others what's possible and gives them hope for their own transformation.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <h3 className="font-bold mb-2 text-black">Build Community</h3>
                <p className="text-sm text-black font-medium">
                  Connect with others who understand your experience and create lasting support networks.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <h3 className="font-bold mb-2 text-black">Drive Change</h3>
                <p className="text-sm text-black font-medium">
                  Influence policy, funding decisions, and program development with real-world impact data.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-black text-white border-2 border-black p-12 text-center">
            <h3 className="text-3xl font-bold mb-4 text-white">Ready to Share Your Story?</h3>
            <p className="text-lg mb-8 max-w-2xl mx-auto font-medium text-white">
              Your experience matters. Your voice can change lives. Join our community of storytellers 
              who are turning their journeys into opportunities.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/stories/new">
                <button className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                  <PenSquare className="h-5 w-5 mr-2 inline" />
                  Start Writing
                </button>
              </Link>
              <Link href="/mentors">
                <button className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
                  <Users className="h-5 w-5 mr-2 inline" />
                  Find a Mentor
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}