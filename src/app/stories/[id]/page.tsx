'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Play, 
  Quote, 
  ExternalLink,
  Mail,
  Tag,
  Clock,
  User
} from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { useParams } from 'next/navigation';

// Sample story data (in real app, this would come from Supabase)
const sampleStories = [
  {
    id: '1',
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
    featured: true,
    fullContent: [
      {
        type: "heading",
        content: "The Beginning"
      },
      {
        type: "paragraph",
        content: "I was 16 when I first got arrested. Nothing serious – just breaking into cars, looking for loose change or anything I could sell. But that was the start of a pattern that seemed impossible to break."
      },
      {
        type: "paragraph", 
        content: "Growing up in Armidale, there wasn't much for kids like me. My dad left when I was 8, mum was working two jobs just to keep the lights on, and I was pretty much raising myself. School felt pointless – the teachers had already written me off as a troublemaker."
      },
      {
        type: "paragraph",
        content: "By 17, I'd been in and out of juvenile detention three times. Each time I got out, I'd promise myself things would be different. But I'd go back to the same streets, same friends, same problems. The system was just teaching me how to be a better criminal."
      },
      {
        type: "heading",
        content: "Finding BackTrack"
      },
      {
        type: "paragraph",
        content: "The day I walked into BackTrack, I thought it was just another program trying to 'fix' me. I'd been through plenty of those – anger management, life skills, you name it. None of them stuck."
      },
      {
        type: "paragraph",
        content: "But BackTrack was different from day one. Instead of sitting in a circle talking about my feelings, they put me in a workshop with a welding torch and said 'learn this.' Instead of lectures about making better choices, they gave me a dog to train."
      },
      {
        type: "paragraph",
        content: "Bernie, the founder, didn't treat me like a statistic or a problem to solve. He saw something in me that I couldn't see in myself. 'You've got good hands,' he told me after watching me work for a week. 'And you're patient with the dogs. That tells me you can do this.'"
      },
      {
        type: "heading",
        content: "The Transformation"
      },
      {
        type: "paragraph",
        content: "Learning to weld wasn't easy. Your hands shake the first few weeks – partly from nerves, partly from whatever you've been putting in your body to cope. But there's something about welding that demands complete focus. You can't think about your problems when you're focused on laying a perfect bead."
      },
      {
        type: "paragraph",
        content: "The dogs taught me patience in a different way. You can't yell at a dog and expect it to respect you. You have to earn their trust, show them consistency, prove you're worth following. Turns out, that's pretty good training for life."
      },
      {
        type: "paragraph",
        content: "Six months in, I was welding structural steel. A year later, I had my certification. For the first time in my life, I had a skill that people valued – something I could build a future on."
      },
      {
        type: "heading",
        content: "Giving Back"
      },
      {
        type: "paragraph",
        content: "Two years later, I'm back at BackTrack – not as a participant, but as a mentor. I work full-time as a welder, but I spend my afternoons helping other young people learn the trades."
      },
      {
        type: "paragraph",
        content: "There's this kid, Jamie, who reminds me a lot of myself at 16. Angry, defensive, convinced the world is against him. Last week, he laid his first decent weld and the smile on his face was worth everything."
      },
      {
        type: "paragraph",
        content: "That's what BackTrack gave me – not just skills, but purpose. I'm not just working to pay my bills anymore. I'm building something bigger than myself."
      }
    ],
    additionalQuotes: [
      {
        text: "The dogs taught me that respect isn't demanded – it's earned through consistency and care.",
        context: "On learning patience through dog training"
      },
      {
        text: "When you're laying a perfect weld, nothing else matters. It's just you, the torch, and the metal. That focus saved my life.",
        context: "On the therapeutic nature of skilled work"
      }
    ],
    programDetails: {
      name: "BackTrack Youth Works",
      description: "A unique program combining dog training, welding, and mentorship for at-risk youth in rural NSW",
      location: "Armidale, NSW",
      contact: "info@backtrack.org.au",
      website: "https://backtrack.org.au",
      outcomes: {
        successRate: "87%",
        participantsServed: "300+",
        jobPlacement: "78%"
      }
    }
  },
  {
    id: '2',
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
    featured: true,
    fullContent: [
      {
        type: "heading",
        content: "The Problem Student"
      },
      {
        type: "paragraph",
        content: "By year 10, I'd been suspended four times. Not for anything violent – just for 'disrupting class' and 'talking back to teachers.' What they called disruptive, I called asking questions they couldn't answer."
      },
      {
        type: "paragraph",
        content: "Growing up in Logan as a first-generation Australian, I saw how the system treated families like mine. My parents worked multiple jobs, spoke English as a second language, and trusted that school would give me opportunities they never had. But school felt like a place designed to make me smaller, quieter, less curious."
      },
      {
        type: "heading",
        content: "Finding the Collective"
      },
      {
        type: "paragraph",
        content: "The Logan Youth Collective found me through a school partnership program. Instead of another 'at-risk youth intervention,' they offered something different: a space where my questions were welcome, where my perspective was valued."
      },
      {
        type: "paragraph",
        content: "They didn't try to fix my 'attitude problem.' They helped me channel my passion for justice into action. Youth-led research projects, community organizing, policy advocacy – suddenly my 'disruptions' became contributions."
      },
      {
        type: "heading",
        content: "University and Beyond"
      },
      {
        type: "paragraph",
        content: "Three years later, I'm in my second year of social work at Griffith University. I still ask difficult questions – but now they're called 'critical thinking' and 'advocacy skills.' The same qualities that got me in trouble at school are what make me a good social worker."
      },
      {
        type: "paragraph",
        content: "I'm back at the Collective as a peer mentor, working with young people who remind me of myself at 15. We're not problem students – we're future social workers, teachers, community leaders. We just needed someone to see our potential instead of our problems."
      }
    ],
    additionalQuotes: [
      {
        text: "They taught me that questioning authority isn't disrespect – it's democracy in action.",
        context: "On developing advocacy skills"
      }
    ],
    programDetails: {
      name: "Logan Youth Collective",
      description: "Youth-led organization focused on community organizing, leadership development, and social justice advocacy",
      location: "Logan, QLD",
      contact: "info@loganyouth.org.au",
      website: "https://loganyouth.org.au",
      outcomes: {
        successRate: "92%",
        participantsServed: "150+",
        jobPlacement: "85%"
      }
    }
  }
];

export default function StoryPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const story = sampleStories.find(s => s.id === params.id);

  if (!mounted) {
    return <div className="min-h-screen bg-white" />; // Prevent hydration issues
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container-justice text-center">
            <h1 className="text-3xl font-bold mb-4">Story not found</h1>
            <p className="text-lg text-gray-600 mb-8">The story you're looking for doesn't exist.</p>
            <Link href="/stories" className="cta-primary">
              Back to Stories
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-24">
        {/* Back Navigation */}
        <section className="border-b border-gray-200 pb-4">
          <div className="container-justice">
            <Link 
              href="/stories" 
              className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Stories
            </Link>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-block px-3 py-1 text-sm font-bold uppercase tracking-wider text-white ${
                    story.theme === 'Transformation' ? 'bg-blue-800' :
                    story.theme === 'Education' ? 'bg-orange-600' :
                    story.theme === 'Healing' ? 'bg-blue-600' :
                    story.theme === 'Foster Care' ? 'bg-orange-700' :
                    story.theme === 'Advocacy' ? 'bg-blue-900' :
                    'bg-gray-800'
                  }`}>
                    {story.theme}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {story.readTime}
                  </span>
                </div>
                
                <h1 className="headline-truth mb-6">{story.title}</h1>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="h-5 w-5" />
                    <span className="font-medium">{story.author}, {story.age}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-5 w-5" />
                    <span>{story.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-5 w-5" />
                    {mounted && <span>Published {new Date(story.publishDate).toLocaleDateString('en-AU')}</span>}
                  </div>
                </div>

                <p className="text-xl text-gray-700 leading-relaxed">{story.summary}</p>
              </div>
              
              <div>
                <div className="aspect-video bg-gray-200 border-2 border-black overflow-hidden mb-4">
                  <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono">
                    HERO IMAGE: {story.author}
                  </div>
                </div>
                
                {story.videoUrl && (
                  <div className="text-center">
                    <button className="cta-secondary">
                      <Play className="h-5 w-5 mr-2" />
                      Watch Video Story
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Quote */}
        <section className="py-12 bg-orange-50 border-b border-orange-200">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto text-center">
              <Quote className="h-12 w-12 text-orange-600 mx-auto mb-6" />
              <blockquote className="text-2xl font-bold text-gray-900 mb-4">
                "{story.quote}"
              </blockquote>
              <p className="text-lg text-orange-800 font-medium">— {story.author}</p>
            </div>
          </div>
        </section>

        {/* Story Content */}
        <section className="py-16">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {story.fullContent.map((section, index) => {
                  if (section.type === 'heading') {
                    return (
                      <h2 key={index} className="text-2xl font-bold mt-12 mb-6 text-black">
                        {section.content}
                      </h2>
                    );
                  }
                  if (section.type === 'paragraph') {
                    return (
                      <p key={index} className="text-lg text-gray-700 leading-relaxed mb-6">
                        {section.content}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Quotes */}
        {story.additionalQuotes && (
          <section className="py-12 bg-blue-50 border-t border-blue-200">
            <div className="container-justice">
              <h2 className="text-2xl font-bold text-center mb-8">Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {story.additionalQuotes.map((quote, index) => (
                  <div key={index} className="data-card bg-white">
                    <Quote className="h-6 w-6 text-blue-800 mb-4" />
                    <blockquote className="text-lg font-medium text-gray-900 mb-3">
                      "{quote.text}"
                    </blockquote>
                    <p className="text-sm text-blue-800 font-medium">{quote.context}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Program Information */}
        <section className="py-16 border-t-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">About {story.programDetails.name}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="data-card">
                  <h3 className="text-xl font-bold mb-4">Program Details</h3>
                  <p className="text-gray-700 mb-4">{story.programDetails.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span>{story.programDetails.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>{story.programDetails.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                      <span>{story.programDetails.website}</span>
                    </div>
                  </div>
                  
                  <Link href={story.programLink} className="cta-primary w-full text-center block">
                    Learn More About This Program
                  </Link>
                </div>
                
                <div className="data-card">
                  <h3 className="text-xl font-bold mb-4">Program Outcomes</h3>
                  <div className="space-y-4">
                    <div className="text-center py-4 border-l-4 border-blue-800 bg-blue-50">
                      <div className="text-3xl font-bold text-blue-800 mb-1">
                        {story.programDetails.outcomes.successRate}
                      </div>
                      <p className="text-sm font-medium">Success Rate</p>
                    </div>
                    
                    <div className="text-center py-4 border-l-4 border-orange-600 bg-orange-50">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {story.programDetails.outcomes.participantsServed}
                      </div>
                      <p className="text-sm font-medium">Youth Served</p>
                    </div>
                    
                    <div className="text-center py-4 border-l-4 border-blue-600 bg-blue-50">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {story.programDetails.outcomes.jobPlacement}
                      </div>
                      <p className="text-sm font-medium">Job Placement Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tags and Categories */}
        <section className="py-12 bg-gray-50">
          <div className="container-justice">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-white border-2 border-black px-3 py-1 text-sm font-medium hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact and Connect */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Connect with {story.author}</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white">
              Want to learn more about this journey or connect with similar programs? 
              Get in touch or explore related opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={`mailto:${story.contactEmail}`}
                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-100 transition-all"
              >
                <Mail className="h-5 w-5 mr-2 inline" />
                Get in Touch
              </a>
              <Link 
                href="/services"
                className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
              >
                Find Similar Programs
              </Link>
            </div>
          </div>
        </section>

        {/* More Stories */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-bold text-center mb-8">More Stories</h2>
            <div className="text-center">
              <Link href="/stories" className="cta-primary">
                Read More Stories of Change
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}