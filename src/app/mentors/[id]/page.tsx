'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Star,
  Clock,
  Globe,
  Award,
  Briefcase,
  Calendar as CalendarIcon,
  MessageSquare,
  CheckCircle,
  Users,
  BookOpen,
  Target,
  Heart,
  Shield,
  Video,
  Mail,
  Linkedin,
  Twitter
} from 'lucide-react';
import Link from 'next/link';

interface MentorProfile {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  longBio: string;
  expertise: string[];
  skills: string[];
  experience: string;
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  certifications: string[];
  availability: {
    hours: number;
    timezone: string;
    preferredTimes: string[];
    schedule: {
      monday: string[];
      tuesday: string[];
      wednesday: string[];
      thursday: string[];
      friday: string[];
      saturday: string[];
      sunday: string[];
    };
  };
  mentees: {
    current: number;
    total: number;
    capacity: number;
  };
  rating: number;
  reviews: number;
  verified: boolean;
  languages: string[];
  focusAreas: string[];
  mentorshipStyle: string;
  successStories: number;
  responseTime: string;
  acceptanceRate: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

const mockMentor: MentorProfile = {
  id: '1',
  name: 'Sarah Chen',
  title: 'Senior Software Engineer',
  organization: 'Tech for Good',
  bio: 'Passionate about helping youth break into tech. 10+ years experience in web development and mentoring.',
  longBio: `I'm a senior software engineer with over 10 years of experience in web development and a deep passion for mentoring the next generation of tech talent. My journey in tech began as a self-taught programmer, and I understand the challenges that come with breaking into this field.

Throughout my career, I've worked at several startups and established tech companies, gaining expertise in full-stack development, system design, and technical leadership. I've mentored over 50 individuals, helping them land their first tech jobs, advance their careers, and build confidence in their abilities.

I believe in a personalized approach to mentoring, focusing on practical skills, real-world projects, and building a strong foundation in both technical and soft skills. Whether you're just starting out or looking to level up your career, I'm here to guide you on your journey.`,
  expertise: ['Web Development', 'Career Planning', 'Technical Interviews', 'System Design'],
  skills: ['JavaScript', 'React', 'Python', 'Node.js', 'AWS', 'Leadership', 'Communication'],
  experience: '10+ years',
  education: [
    {
      degree: 'MS Computer Science',
      school: 'Stanford University',
      year: '2014'
    },
    {
      degree: 'BS Computer Engineering',
      school: 'UC Berkeley',
      year: '2012'
    }
  ],
  certifications: ['AWS Solutions Architect', 'Google Cloud Professional', 'Certified Scrum Master'],
  availability: {
    hours: 5,
    timezone: 'PST',
    preferredTimes: ['Evenings', 'Weekends'],
    schedule: {
      monday: ['6:00 PM - 8:00 PM'],
      tuesday: ['6:00 PM - 8:00 PM'],
      wednesday: [],
      thursday: ['6:00 PM - 8:00 PM'],
      friday: [],
      saturday: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM'],
      sunday: ['2:00 PM - 4:00 PM']
    }
  },
  mentees: {
    current: 3,
    total: 24,
    capacity: 5
  },
  rating: 4.9,
  reviews: 48,
  verified: true,
  languages: ['English', 'Mandarin'],
  focusAreas: ['Technology', 'Career Development', 'Leadership'],
  mentorshipStyle: 'Supportive and goal-oriented with focus on practical, hands-on learning',
  successStories: 18,
  responseTime: 'Within 24 hours',
  acceptanceRate: 85,
  socialLinks: {
    linkedin: 'https://linkedin.com/in/sarahchen',
    twitter: 'https://twitter.com/sarahchen',
    website: 'https://sarahchen.dev'
  }
};

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [mentor] = useState<MentorProfile>(mockMentor);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const isAvailable = mentor.mentees.current < mentor.mentees.capacity;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mentors
        </Button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex-shrink-0 text-center">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold">{mentor.rating}</span>
                  <span className="text-gray-600">({mentor.reviews} reviews)</span>
                </div>
                {mentor.verified && (
                  <Badge variant="success" className="mb-4">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Mentor
                  </Badge>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold mb-2">{mentor.name}</h1>
                  <p className="text-xl text-gray-600">{mentor.title}</p>
                  <p className="text-gray-500">{mentor.organization}</p>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {mentor.bio}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-semibold">{mentor.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mentees</p>
                    <p className="font-semibold">{mentor.mentees.total} total</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Stories</p>
                    <p className="font-semibold">{mentor.successStories}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="font-semibold">{mentor.responseTime}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    size="lg"
                    disabled={!isAvailable}
                    onClick={() => setShowConnectionModal(true)}
                  >
                    {isAvailable ? 'Request Connection' : 'At Capacity'}
                  </Button>
                  <Button variant="outline" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" size="lg">
                    <Video className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                </div>

                {/* Social Links */}
                {mentor.socialLinks && (
                  <div className="flex gap-2 mt-4">
                    {mentor.socialLinks.linkedin && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={mentor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {mentor.socialLinks.twitter && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={mentor.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {mentor.socialLinks.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={mentor.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex-shrink-0 w-full md:w-64">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Availability</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Capacity</span>
                        <span className="text-sm font-medium">
                          {mentor.mentees.current}/{mentor.mentees.capacity}
                        </span>
                      </div>
                      <Progress 
                        value={(mentor.mentees.current / mentor.mentees.capacity) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{mentor.availability.hours} hours/week</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>{mentor.availability.timezone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span>{mentor.languages.join(', ')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Preferred Times</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.availability.preferredTimes.map((time) => (
                          <Badge key={time} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {mentor.longBio.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Education & Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Education</h4>
                    <div className="space-y-3">
                      {mentor.education.map((edu, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-sm text-gray-600">
                              {edu.school} • {edu.year}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {mentor.certifications.map((cert) => (
                        <Badge key={cert} variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mentorship Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {mentor.mentorshipStyle}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Goal-Oriented</p>
                      <p className="text-sm text-gray-600">Focus on measurable outcomes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Supportive</p>
                      <p className="text-sm text-gray-600">Empathetic and encouraging</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Educational</p>
                      <p className="text-sm text-gray-600">Continuous learning focus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Safe Space</p>
                      <p className="text-sm text-gray-600">Confidential and non-judgmental</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expertise" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Areas of Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mentor.expertise.map((exp) => (
                    <div key={exp} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{exp}</p>
                        <p className="text-sm text-gray-600">
                          Expert level knowledge and experience
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills & Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="py-1.5 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Focus Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mentor.focusAreas.map((area) => (
                    <div key={area} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">{area}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Available times in {mentor.availability.timezone} timezone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center mb-6">
                  {Object.entries(mentor.availability.schedule).map(([day, times]) => (
                    <div key={day} className="space-y-2">
                      <p className="font-medium capitalize text-sm">{day.slice(0, 3)}</p>
                      {times.length > 0 ? (
                        times.map((time, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {time}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">Unavailable</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Book a Session</h4>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Testimonials</CardTitle>
                <CardDescription>
                  What mentees say about {mentor.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Reviews coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Connection Request Modal */}
        {showConnectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle>Request Connection</CardTitle>
                <CardDescription>
                  Send a message to {mentor.name} to introduce yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Your Message
                  </label>
                  <textarea
                    className="w-full min-h-[120px] p-3 border rounded-lg resize-none"
                    placeholder="Hi! I'm interested in connecting with you because..."
                    value={connectionMessage}
                    onChange={(e) => setConnectionMessage(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConnectionModal(false);
                      setConnectionMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConnectionRequest}
                    disabled={!connectionMessage.trim() || requestConnection.isPending}
                  >
                    {requestConnection.isPending ? 'Sending...' : 'Send Request'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}