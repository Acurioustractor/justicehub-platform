'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  MapPin, 
  Users, 
  Target,
  Phone,
  Mail,
  Globe,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Zap,
  Star
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

interface CommunityProgramDetail {
  id: string;
  name: string;
  organization: string;
  location: string;
  state: string;
  approach: 'Indigenous-led' | 'Community-based' | 'Grassroots' | 'Culturally-responsive';
  description: string;
  full_description: string;
  founded_year: number;
  founder_story: string;
  success_rate: number;
  cost_per_participant?: number;
  participants_served: number;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  photos: Array<{
    id: string;
    url: string;
    caption: string;
  }>;
  tags: string[];
  is_featured: boolean;
  indigenous_knowledge: boolean;
  community_connection_score: number;
  impact_stories: Array<{
    quote: string;
    author: string;
    age?: number;
    outcome: string;
  }>;
  outcomes: string[];
  eligibility: string[];
  community_partnerships: string[];
  cultural_practices?: string[];
  innovation_aspects: string[];
}

export default function CommunityProgramDetailPage() {
  const params = useParams();
  const [program, setProgram] = useState<CommunityProgramDetail | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - will be replaced with Supabase query
    const mockPrograms: { [key: string]: CommunityProgramDetail } = {
      '1': {
        id: '1',
        name: 'BackTrack Youth Works',
        organization: 'BackTrack',
        location: 'Armidale',
        state: 'NSW',
        approach: 'Community-based',
        description: 'Innovative program combining vocational training, animal therapy, and intensive mentoring for disengaged youth.',
        full_description: `BackTrack Youth Works was born from a simple observation: traditional youth services weren't working for the most disconnected young people. Founded in 2009 by Bernie Shakeshaft, BackTrack takes a radically different approach by combining hands-on vocational training with animal therapy and intensive mentoring.

        The program operates on the principle that every young person has potential, regardless of their past. Through working with rescue dogs, learning trades like welding and construction, and building genuine relationships with mentors, participants develop practical skills, emotional resilience, and most importantly, hope for the future.

        What makes BackTrack unique is its community-embedded approach. Rather than operating as an isolated service, BackTrack is woven into the fabric of Armidale's community. Local businesses provide work placements, community members volunteer as mentors, and the dogs that participants train often go on to serve the community as working dogs.

        The program's success lies in its understanding that healing happens through connection - to animals, to meaningful work, to caring adults, and to community. This isn't just a training program; it's a complete reimagining of how we support young people to build their futures.`,
        founded_year: 2009,
        founder_story: 'Bernie Shakeshaft founded BackTrack after working in mainstream youth services and recognizing that traditional approaches weren\'t reaching the most disconnected young people. His vision was to create a program that met young people where they were, not where the system thought they should be.',
        success_rate: 87,
        cost_per_participant: 58000,
        participants_served: 300,
        contact_phone: '02 6772 1234',
        contact_email: 'info@backtrack.org.au',
        website: 'https://backtrack.org.au',
        photos: [
          { id: '1', url: '/api/placeholder/800/600', caption: 'Youth working with rescue dogs in training session' },
          { id: '2', url: '/api/placeholder/800/600', caption: 'Welding workshop with mentor guidance' },
          { id: '3', url: '/api/placeholder/800/600', caption: 'Community project completion ceremony' },
          { id: '4', url: '/api/placeholder/800/600', caption: 'Graduates with their trained dogs' }
        ],
        tags: ['Vocational Training', 'Animal Therapy', 'Mentorship', 'Rural NSW', 'Community Integration'],
        is_featured: true,
        indigenous_knowledge: false,
        community_connection_score: 95,
        impact_stories: [
          {
            quote: "BackTrack saved my life. I went from sleeping rough and getting arrested every week to having a trade, a home, and a future. The dogs taught me how to care for something other than myself.",
            author: "Marcus Thompson",
            age: 19,
            outcome: "Now employed as a qualified welder and mentoring other youth"
          },
          {
            quote: "My son was written off by everyone - schools, services, even family. BackTrack saw potential where others saw problems. He's now training to be a mentor himself.",
            author: "Sarah Williams",
            outcome: "Son completed welding certification and gained stable employment"
          },
          {
            quote: "Working with the dogs taught me patience and responsibility. If I can train a traumatized rescue dog, I can handle anything life throws at me.",
            author: "Jamie Chen",
            age: 17,
            outcome: "Completed program and started apprenticeship in animal training"
          }
        ],
        outcomes: [
          '87% of participants do not reoffend within 24 months',
          '92% gain employment or return to education within 12 months',
          '100% report improved self-confidence and life skills',
          '85% maintain stable housing after program completion',
          '78% of participants maintain employment for 2+ years',
          '95% report improved mental health and wellbeing'
        ],
        eligibility: [
          'Ages 12-18 years',
          'Disengaged from mainstream education or employment',
          'May have justice system involvement',
          'Willing to participate in hands-on activities',
          'Committed to animal welfare and training'
        ],
        community_partnerships: [
          'Local businesses providing work placements',
          'RSPCA and animal rescue organizations',
          'Armidale community volunteers as mentors',
          'Regional employers offering apprenticeships',
          'Local schools for educational pathways'
        ],
        innovation_aspects: [
          'First program in Australia to combine animal therapy with vocational training',
          'Community-embedded approach rather than institutional model',
          'Long-term mentoring relationships extending beyond program completion',
          'Dual benefit model - helping youth while training rescue dogs',
          'Evidence-based practice influencing national youth policy'
        ]
      },
      '2': {
        id: '2',
        name: 'Healing Circles Program',
        organization: 'Antakirinja Matu-Yankunytjatjara',
        location: 'Alice Springs',
        state: 'NT',
        approach: 'Indigenous-led',
        description: 'Traditional Aboriginal healing practices combined with elder mentorship for young Aboriginal people experiencing trauma.',
        full_description: `The Healing Circles Program represents the profound wisdom of Aboriginal healing practices, adapted for contemporary challenges facing young Aboriginal people. Established in 2016 by the Antakirinja Matu-Yankunytjatjara Aboriginal Corporation, this program recognizes that healing from trauma requires connection to culture, country, and community.

        The program operates through traditional healing circles where young people sit with elders, sharing stories, learning traditional practices, and connecting with their cultural identity. This isn't therapy in the Western sense, but a return to ancient ways of healing that have sustained Aboriginal peoples for tens of thousands of years.

        Central to the program is the understanding that many issues facing young Aboriginal people - substance abuse, depression, disconnection, anger - stem from cultural disconnection and intergenerational trauma. By reconnecting young people with their traditional knowledge, language, and cultural practices, healing happens at a deep, spiritual level.

        The program includes traditional ceremonies, bush medicine preparation, storytelling, art creation, and connection to country through cultural visits. Elders serve not just as teachers but as living links to unbroken cultural knowledge that spans millennia.

        What makes this program extraordinary is its success in areas where mainstream services have failed. By working within Aboriginal cultural frameworks and honoring traditional knowledge systems, the program achieves healing outcomes that Western approaches alone cannot match.`,
        founded_year: 2016,
        founder_story: 'The program was developed by Aboriginal elders who recognized that young people were struggling with trauma and disconnection from culture. They understood that healing needed to happen through traditional ways, not just Western therapeutic approaches.',
        success_rate: 78,
        cost_per_participant: 25000,
        participants_served: 120,
        contact_phone: '08 8951 4251',
        contact_email: 'healing@amyac.org.au',
        website: 'https://amyac.org.au',
        photos: [
          { id: '1', url: '/api/placeholder/800/600', caption: 'Traditional healing circle with elders and youth' },
          { id: '2', url: '/api/placeholder/800/600', caption: 'Bush medicine preparation with traditional knowledge holders' },
          { id: '3', url: '/api/placeholder/800/600', caption: 'Cultural art creation session' },
          { id: '4', url: '/api/placeholder/800/600', caption: 'Connection to country ceremony' }
        ],
        tags: ['Cultural Healing', 'Elder Mentorship', 'Traditional Knowledge', 'Trauma Recovery', 'Indigenous Wisdom'],
        is_featured: true,
        indigenous_knowledge: true,
        community_connection_score: 98,
        impact_stories: [
          {
            quote: "Connecting with elders and learning traditional ways helped me understand who I am. The healing circles gave me back my identity and showed me my place in the world.",
            author: "Jayden Williams",
            age: 18,
            outcome: "Completed program and now helps facilitate healing circles for other youth"
          },
          {
            quote: "My grandson was lost to drugs and anger. Through the healing circles, he found his way back to culture and family. The elders saw what we couldn't see.",
            author: "Elder Mary Nganyinpa",
            outcome: "Grandson completed program and studying to become a cultural liaison worker"
          },
          {
            quote: "Learning about bush medicine and traditional healing showed me there are other ways to deal with pain. Ways that connect you to something bigger than yourself.",
            author: "Lisa Namatjira",
            age: 16,
            outcome: "Overcame substance abuse and pursuing traditional medicine training"
          }
        ],
        outcomes: [
          '78% report significant reduction in trauma symptoms',
          '85% maintain connection to cultural practices after program',
          '92% improve family and community relationships',
          '67% reduce or eliminate substance use',
          '88% report improved mental health and spiritual wellbeing',
          '75% become cultural mentors for other young people'
        ],
        eligibility: [
          'Aboriginal and Torres Strait Islander youth aged 12-25',
          'Experiencing trauma, substance abuse, or cultural disconnection',
          'Willing to participate in traditional healing practices',
          'Commitment to respectful engagement with elders and culture',
          'Family and community support preferred but not required'
        ],
        community_partnerships: [
          'Local Aboriginal community organizations',
          'Traditional knowledge holders and elders',
          'Regional health services providing wraparound support',
          'Cultural centers and keeping places',
          'Land councils for country access'
        ],
        cultural_practices: [
          'Traditional healing circles and storytelling',
          'Bush medicine preparation and application',
          'Cultural art and craft creation',
          'Connection to country ceremonies',
          'Traditional language learning',
          'Dreamtime story sharing'
        ],
        innovation_aspects: [
          'Integration of traditional Aboriginal healing with contemporary trauma treatment',
          'Elder-led program design respecting traditional knowledge systems',
          'Holistic approach addressing spiritual, cultural, and emotional wellbeing',
          'Model being adapted by other Aboriginal communities nationally',
          'Evidence documenting effectiveness of traditional healing approaches'
        ]
      }
    };

    const selectedProgram = mockPrograms[params.id as string];
    setProgram(selectedProgram || null);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="font-mono">Loading program details...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container-justice text-center">
            <h1 className="text-3xl font-bold mb-4">Program not found</h1>
            <p className="text-lg text-gray-600 mb-8">The community program you're looking for doesn't exist.</p>
            <Link href="/community-programs" className="cta-primary">
              Back to Community Programs
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % program.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + program.photos.length) % program.photos.length);
  };

  const getApproachColor = (approach: string) => {
    switch (approach) {
      case 'Indigenous-led': return 'bg-orange-600 text-white';
      case 'Community-based': return 'bg-blue-800 text-white';
      case 'Grassroots': return 'bg-blue-600 text-white';
      case 'Culturally-responsive': return 'bg-orange-700 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-24">
        {/* Back Navigation */}
        <section className="border-b border-gray-200 pb-4">
          <div className="container-justice">
            <Link 
              href="/community-programs" 
              className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community Programs
            </Link>
          </div>
        </section>

        {/* Program Header */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider ${getApproachColor(program.approach)}`}>
                    {program.approach}
                  </span>
                  {program.indigenous_knowledge && (
                    <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider bg-orange-600 text-white">
                      ✦ Indigenous Knowledge
                    </span>
                  )}
                  {program.is_featured && (
                    <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider bg-black text-white">
                      Featured Program
                    </span>
                  )}
                </div>

                <h1 className="headline-truth mb-4">{program.name}</h1>
                <p className="text-xl font-medium text-gray-700 mb-2">{program.organization}</p>
                <p className="text-lg flex items-center gap-2 mb-6 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  {program.location}, {program.state}
                </p>
                <p className="text-xl leading-relaxed text-gray-800">{program.description}</p>
              </div>

              <div className="space-y-6">
                <div className="data-card text-center bg-blue-50 border-l-4 border-blue-800">
                  <div className="font-mono text-6xl font-bold mb-2 text-blue-800">{program.success_rate}%</div>
                  <p className="text-lg font-bold">Success Rate</p>
                  <p className="text-sm text-gray-600">Community-measured outcomes</p>
                </div>

                <div className="space-y-4">
                  <div className="data-card">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="font-mono text-3xl font-bold text-orange-600">{program.participants_served}+</div>
                        <p className="text-sm font-medium">Lives Transformed</p>
                      </div>
                      <div>
                        <div className="font-mono text-3xl font-bold text-blue-600">{new Date().getFullYear() - program.founded_year}</div>
                        <p className="text-sm font-medium">Years Impact</p>
                      </div>
                    </div>
                  </div>

                  <div className="data-card">
                    <h3 className="font-bold mb-3">Community Connection</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-800 h-3 rounded-full transition-all duration-1000"
                          style={{width: `${program.community_connection_score}%`}}
                        />
                      </div>
                      <span className="ml-3 font-mono font-bold text-blue-800">{program.community_connection_score}%</span>
                    </div>
                    <p className="text-xs text-gray-600">Based on community partnerships and local integration</p>
                  </div>

                  {program.cost_per_participant && (
                    <div className="data-card">
                      <h3 className="font-bold mb-2">Annual Investment</h3>
                      <p className="font-mono text-xl font-bold">${program.cost_per_participant.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">per participant</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery */}
        {program.photos.length > 0 && (
          <section className="py-16 border-b-2 border-black">
            <div className="container-justice">
              <h2 className="text-3xl font-bold mb-8">PROGRAM IN ACTION</h2>
              
              <div className="relative">
                <div className="aspect-video bg-gray-200 relative overflow-hidden border-2 border-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-2xl text-gray-500">PROGRAM PHOTO</span>
                  </div>
                  
                  {/* Navigation */}
                  {program.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>
                
                <p className="mt-4 text-center">
                  <span className="font-bold">{currentPhotoIndex + 1} / {program.photos.length}:</span> {program.photos[currentPhotoIndex].caption}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Program Story and Details */}
        <section className="py-16">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                {/* About the Program */}
                <div>
                  <h2 className="text-3xl font-bold mb-6">ABOUT THE PROGRAM</h2>
                  <div className="prose prose-lg max-w-none">
                    {program.full_description.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-6 leading-relaxed text-gray-700">
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Founder Story */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">FOUNDED ON VISION</h3>
                  <div className="data-card bg-orange-50 border-l-4 border-orange-600">
                    <p className="text-lg leading-relaxed text-gray-700">{program.founder_story}</p>
                    <p className="mt-4 text-sm text-gray-600 font-medium">Established {program.founded_year}</p>
                  </div>
                </div>

                {/* Innovation Aspects */}
                <div>
                  <h3 className="text-2xl font-bold mb-6">WHAT MAKES IT INNOVATIVE</h3>
                  <div className="space-y-4">
                    {program.innovation_aspects.map((aspect, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Zap className="h-5 w-5 mt-1 text-orange-600 flex-shrink-0" />
                        <p className="text-lg leading-relaxed">{aspect}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cultural Practices (for Indigenous programs) */}
                {program.cultural_practices && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">CULTURAL PRACTICES</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {program.cultural_practices.map((practice, index) => (
                        <div key={index} className="data-card bg-orange-50">
                          <p className="font-medium">{practice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact Stories */}
                <div>
                  <h3 className="text-2xl font-bold mb-6">VOICES OF TRANSFORMATION</h3>
                  <div className="space-y-8">
                    {program.impact_stories.map((story, index) => (
                      <div key={index} className="data-card bg-blue-50">
                        <blockquote className="text-xl leading-relaxed mb-4 text-gray-800">
                          "{story.quote}"
                        </blockquote>
                        <div className="flex items-center justify-between">
                          <cite className="text-lg font-bold not-italic">
                            — {story.author}
                            {story.age && <span className="text-gray-600 font-normal">, {story.age}</span>}
                          </cite>
                        </div>
                        <p className="mt-2 text-sm text-blue-800 font-medium">{story.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Contact Information */}
                <div className="data-card">
                  <h3 className="font-bold text-xl mb-4">GET CONNECTED</h3>
                  <div className="space-y-4">
                    {program.contact_phone && (
                      <a href={`tel:${program.contact_phone}`} className="flex items-center gap-3 hover:text-blue-800 transition-colors">
                        <Phone className="h-5 w-5" />
                        <span className="font-medium">{program.contact_phone}</span>
                      </a>
                    )}
                    {program.contact_email && (
                      <a href={`mailto:${program.contact_email}`} className="flex items-center gap-3 hover:text-blue-800 transition-colors">
                        <Mail className="h-5 w-5" />
                        <span className="font-medium">{program.contact_email}</span>
                      </a>
                    )}
                    {program.website && (
                      <a href={program.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-blue-800 transition-colors">
                        <Globe className="h-5 w-5" />
                        <span className="font-medium">Visit website</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    {program.contact_phone && (
                      <a 
                        href={`tel:${program.contact_phone}`}
                        className="cta-primary w-full text-center block"
                      >
                        CONTACT PROGRAM
                      </a>
                    )}
                  </div>
                </div>

                {/* Eligibility */}
                <div className="data-card">
                  <h3 className="font-bold text-xl mb-4">WHO CAN PARTICIPATE</h3>
                  <ul className="space-y-3">
                    {program.eligibility.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-800 font-bold mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Proven Outcomes */}
                <div className="data-card">
                  <h3 className="font-bold text-xl mb-4">PROVEN OUTCOMES</h3>
                  <div className="space-y-3">
                    {program.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Award className="h-5 w-5 mt-0.5 text-blue-800 flex-shrink-0" />
                        <p>{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Partnerships */}
                <div className="data-card">
                  <h3 className="font-bold text-xl mb-4">COMMUNITY PARTNERSHIPS</h3>
                  <div className="space-y-2">
                    {program.community_partnerships.map((partnership, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Heart className="h-4 w-4 mt-1 text-orange-600 flex-shrink-0" />
                        <span className="text-sm">{partnership}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Program Features */}
                <div>
                  <h4 className="font-bold mb-3">PROGRAM FEATURES</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 border-2 border-black text-sm font-medium hover:bg-black hover:text-white transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to be part of this transformation?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              This program has transformed {program.participants_served}+ lives through community connection and 
              {program.indigenous_knowledge ? ' traditional wisdom' : ' innovative approaches'}. 
              Your journey could start here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {program.contact_phone && (
                <a 
                  href={`tel:${program.contact_phone}`}
                  className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all"
                >
                  CONTACT PROGRAM
                </a>
              )}
              <Link 
                href="/community-programs"
                className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
              >
                EXPLORE MORE PROGRAMS
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}