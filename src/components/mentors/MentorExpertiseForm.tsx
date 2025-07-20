'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search,
  Plus,
  X,
  Upload,
  Award,
  Briefcase,
  GraduationCap,
  Users,
  Star,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  SKILL_CATEGORIES, 
  INTEREST_CATEGORIES, 
  searchSkills, 
  searchInterests,
  type Skill,
  type Interest 
} from '@/lib/skills-taxonomy';

interface MentorExpertiseFormProps {
  onSubmit: (data: MentorExpertiseData) => void;
  initialData?: Partial<MentorExpertiseData>;
}

export interface MentorExpertiseData {
  expertise: Array<{
    id: string;
    name: string;
    level: 'proficient' | 'expert' | 'master';
    yearsExperience: number;
    description: string;
    verified: boolean;
  }>;
  interests: string[];
  experience: {
    currentRole: string;
    organization: string;
    yearsExperience: number;
    previousRoles: Array<{
      title: string;
      organization: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
      relevant: boolean;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      year: string;
      verified: boolean;
    }>;
  };
  mentoring: {
    previousExperience: boolean;
    yearsAsMentor: number;
    numberOfMentees: number;
    specializations: string[];
    approach: string;
    successStories: string;
  };
  availability: {
    hoursPerWeek: number;
    preferredDays: string[];
    timeZone: string;
    meetingTypes: ('in-person' | 'virtual' | 'phone' | 'email')[];
    responseTime: string;
  };
  verification: {
    linkedinProfile?: string;
    portfolioUrl?: string;
    references: Array<{
      name: string;
      relationship: string;
      contact: string;
    }>;
    backgroundCheck: boolean;
    backgroundCheckDate?: string;
  };
}

export function MentorExpertiseForm({ onSubmit, initialData }: MentorExpertiseFormProps) {
  const [data, setData] = useState<MentorExpertiseData>({
    expertise: [],
    interests: [],
    experience: {
      currentRole: '',
      organization: '',
      yearsExperience: 0,
      previousRoles: [],
      education: [],
      certifications: []
    },
    mentoring: {
      previousExperience: false,
      yearsAsMentor: 0,
      numberOfMentees: 0,
      specializations: [],
      approach: '',
      successStories: ''
    },
    availability: {
      hoursPerWeek: 2,
      preferredDays: [],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meetingTypes: ['virtual'],
      responseTime: 'within-24-hours'
    },
    verification: {
      references: [],
      backgroundCheck: false
    },
    ...initialData
  });

  const [skillSearch, setSkillSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  const [currentTab, setCurrentTab] = useState('expertise');

  const addExpertise = (skill: Skill) => {
    if (!data.expertise.find(e => e.id === skill.id)) {
      setData(prev => ({
        ...prev,
        expertise: [...prev.expertise, {
          id: skill.id,
          name: skill.name,
          level: 'proficient',
          yearsExperience: 1,
          description: '',
          verified: false
        }]
      }));
    }
  };

  const updateExpertise = (skillId: string, updates: Partial<typeof data.expertise[0]>) => {
    setData(prev => ({
      ...prev,
      expertise: prev.expertise.map(exp => 
        exp.id === skillId ? { ...exp, ...updates } : exp
      )
    }));
  };

  const removeExpertise = (skillId: string) => {
    setData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e.id !== skillId)
    }));
  };

  const toggleInterest = (interestId: string) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const addReference = () => {
    setData(prev => ({
      ...prev,
      verification: {
        ...prev.verification,
        references: [...prev.verification.references, { name: '', relationship: '', contact: '' }]
      }
    }));
  };

  const updateReference = (index: number, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      verification: {
        ...prev.verification,
        references: prev.verification.references.map((ref, i) => 
          i === index ? { ...ref, [field]: value } : ref
        )
      }
    }));
  };

  const removeReference = (index: number) => {
    setData(prev => ({
      ...prev,
      verification: {
        ...prev.verification,
        references: prev.verification.references.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (data.expertise.length === 0) {
      alert('Please add at least one area of expertise');
      return;
    }
    if (!data.experience.currentRole || !data.experience.organization) {
      alert('Please fill in your current role and organization');
      return;
    }
    
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mentor Expertise Profile</h1>
        <p className="text-gray-600">
          Help us understand your expertise so we can match you with the right mentees
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="expertise">Expertise</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="mentoring">Mentoring</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="expertise" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Areas of Expertise
              </CardTitle>
              <CardDescription>
                Select skills where you can mentor others. Add details about your experience level and background.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for skills to add..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {skillSearch && (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {searchSkills(skillSearch)
                    .filter(skill => !data.expertise.find(e => e.id === skill.id))
                    .slice(0, 10)
                    .map(skill => (
                      <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{skill.name}</p>
                          <p className="text-sm text-gray-600">{skill.description}</p>
                        </div>
                        <Button size="sm" onClick={() => addExpertise(skill)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">Your Expertise Areas ({data.expertise.length})</h4>
                {data.expertise.map(expertise => (
                  <Card key={expertise.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h5 className="font-medium">{expertise.name}</h5>
                          {expertise.verified && (
                            <Badge variant="secondary" className="mt-1">
                              <Check className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeExpertise(expertise.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Expertise Level</Label>
                            <Select
                              value={expertise.level}
                              onValueChange={(value: any) => updateExpertise(expertise.id, { level: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="proficient">Proficient (Can mentor beginners)</SelectItem>
                                <SelectItem value="expert">Expert (Can mentor intermediate learners)</SelectItem>
                                <SelectItem value="master">Master (Can mentor at all levels)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Years of Experience</Label>
                            <Input
                              type="number"
                              min="0"
                              value={expertise.yearsExperience}
                              onChange={(e) => updateExpertise(expertise.id, { yearsExperience: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description & Context</Label>
                          <Textarea
                            placeholder="Describe your experience with this skill..."
                            value={expertise.description}
                            onChange={(e) => updateExpertise(expertise.id, { description: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Areas of Interest</CardTitle>
              <CardDescription>
                What topics are you passionate about or interested in discussing with mentees?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search interests..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {INTEREST_CATEGORIES.map(category => (
                  <div key={category.id}>
                    <h5 className="font-medium text-sm text-gray-600 mb-2">{category.name}</h5>
                    <div className="grid gap-2 mb-4">
                      {category.interests
                        .filter(interest => 
                          !interestSearch || 
                          interest.name.toLowerCase().includes(interestSearch.toLowerCase())
                        )
                        .map(interest => (
                          <div key={interest.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={interest.id}
                              checked={data.interests.includes(interest.id)}
                              onCheckedChange={() => toggleInterest(interest.id)}
                            />
                            <Label htmlFor={interest.id} className="text-sm cursor-pointer">
                              {interest.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Role</Label>
                  <Input
                    value={data.experience.currentRole}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      experience: { ...prev.experience, currentRole: e.target.value }
                    }))}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label>Organization</Label>
                  <Input
                    value={data.experience.organization}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      experience: { ...prev.experience, organization: e.target.value }
                    }))}
                    placeholder="e.g., Tech Company Inc."
                  />
                </div>
              </div>
              <div>
                <Label>Total Years of Professional Experience</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.experience.yearsExperience}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    experience: { ...prev.experience, yearsExperience: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education & Certifications
              </CardTitle>
              <CardDescription>
                Add relevant education and certifications that support your mentoring expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Key Education Background</Label>
                  <Textarea
                    placeholder="List relevant degrees, institutions, and years..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Professional Certifications</Label>
                  <Textarea
                    placeholder="List relevant certifications, issuing organizations, and years..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mentoring Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="previous-mentoring"
                  checked={data.mentoring.previousExperience}
                  onCheckedChange={(checked) => setData(prev => ({
                    ...prev,
                    mentoring: { ...prev.mentoring, previousExperience: checked as boolean }
                  }))}
                />
                <Label htmlFor="previous-mentoring">I have previous mentoring experience</Label>
              </div>

              {data.mentoring.previousExperience && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Years as a Mentor</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.mentoring.yearsAsMentor}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        mentoring: { ...prev.mentoring, yearsAsMentor: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Number of Mentees (Approximate)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.mentoring.numberOfMentees}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        mentoring: { ...prev.mentoring, numberOfMentees: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Mentoring Approach</Label>
                <Textarea
                  placeholder="Describe your mentoring style and approach..."
                  value={data.mentoring.approach}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    mentoring: { ...prev.mentoring, approach: e.target.value }
                  }))}
                  rows={4}
                />
              </div>

              <div>
                <Label>Success Stories (Optional)</Label>
                <Textarea
                  placeholder="Share examples of successful mentoring relationships or outcomes..."
                  value={data.mentoring.successStories}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    mentoring: { ...prev.mentoring, successStories: e.target.value }
                  }))}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Commitment & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hours per week you can dedicate to mentoring</Label>
                <Select
                  value={data.availability.hoursPerWeek.toString()}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, hoursPerWeek: parseInt(value) }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour per week</SelectItem>
                    <SelectItem value="2">2 hours per week</SelectItem>
                    <SelectItem value="3">3 hours per week</SelectItem>
                    <SelectItem value="4">4 hours per week</SelectItem>
                    <SelectItem value="5">5+ hours per week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Response Time</Label>
                <Select
                  value={data.availability.responseTime}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, responseTime: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="within-24-hours">Within 24 hours</SelectItem>
                    <SelectItem value="within-48-hours">Within 48 hours</SelectItem>
                    <SelectItem value="within-week">Within a week</SelectItem>
                    <SelectItem value="as-available">When available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preferred Meeting Types (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'virtual', label: 'Video calls' },
                    { value: 'phone', label: 'Phone calls' },
                    { value: 'in-person', label: 'In-person meetings' },
                    { value: 'email', label: 'Email mentoring' }
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={data.availability.meetingTypes.includes(option.value as any)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setData(prev => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                meetingTypes: [...prev.availability.meetingTypes, option.value as any]
                              }
                            }));
                          } else {
                            setData(prev => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                meetingTypes: prev.availability.meetingTypes.filter(type => type !== option.value)
                              }
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Verification</CardTitle>
              <CardDescription>
                Help us verify your expertise and build trust with potential mentees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>LinkedIn Profile (Optional)</Label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={data.verification.linkedinProfile || ''}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    verification: { ...prev.verification, linkedinProfile: e.target.value }
                  }))}
                />
              </div>

              <div>
                <Label>Portfolio/Website (Optional)</Label>
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={data.verification.portfolioUrl || ''}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    verification: { ...prev.verification, portfolioUrl: e.target.value }
                  }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Professional References</Label>
                  <Button size="sm" onClick={addReference}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reference
                  </Button>
                </div>
                {data.verification.references.map((ref, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Reference {index + 1}</h5>
                        <Button size="sm" variant="outline" onClick={() => removeReference(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Full Name"
                          value={ref.name}
                          onChange={(e) => updateReference(index, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Relationship (e.g., Former Manager, Colleague)"
                          value={ref.relationship}
                          onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                        />
                        <Input
                          placeholder="Contact Information (Email or Phone)"
                          value={ref.contact}
                          onChange={(e) => updateReference(index, 'contact', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Background Check Required</p>
                  <p className="text-sm text-blue-700 mt-1">
                    All mentors must complete a background check before being approved to mentor youth. 
                    We'll contact you about this process after you submit your application.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <div className="text-sm text-gray-500">
          {data.expertise.length > 0 && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              {data.expertise.length} expertise area{data.expertise.length !== 1 ? 's' : ''} added
            </div>
          )}
        </div>
        <Button onClick={handleSubmit} size="lg">
          Submit Mentor Application
        </Button>
      </div>
    </div>
  );
}