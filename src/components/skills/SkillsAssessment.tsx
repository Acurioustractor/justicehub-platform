'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Lightbulb,
  Award,
  Heart
} from 'lucide-react';
import { 
  SKILL_CATEGORIES, 
  INTEREST_CATEGORIES, 
  searchSkills, 
  searchInterests,
  type Skill,
  type Interest 
} from '@/lib/skills-taxonomy';

interface SkillsAssessmentProps {
  onComplete: (data: AssessmentData) => void;
  initialData?: Partial<AssessmentData>;
}

export interface AssessmentData {
  skills: Array<{
    id: string;
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    experience?: string;
  }>;
  interests: string[];
  goals: {
    shortTerm: string[];
    longTerm: string[];
    careerPath?: string;
  };
  experience: {
    education: string;
    work: string[];
    volunteer: string[];
    challenges: string[];
    achievements: string[];
  };
  preferences: {
    mentorshipStyle: 'structured' | 'casual' | 'project-based' | 'goal-oriented';
    communicationFrequency: 'weekly' | 'biweekly' | 'monthly' | 'as-needed';
    meetingPreference: 'in-person' | 'virtual' | 'both';
    timeCommitment: 'low' | 'medium' | 'high';
  };
}

export function SkillsAssessment({ onComplete, initialData }: SkillsAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<AssessmentData>({
    skills: [],
    interests: [],
    goals: { shortTerm: [], longTerm: [] },
    experience: { education: '', work: [], volunteer: [], challenges: [], achievements: [] },
    preferences: {
      mentorshipStyle: 'goal-oriented',
      communicationFrequency: 'biweekly',
      meetingPreference: 'both',
      timeCommitment: 'medium'
    },
    ...initialData
  });

  const [skillSearch, setSkillSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const totalSteps = 5;

  const filteredSkills = skillSearch 
    ? searchSkills(skillSearch) 
    : SKILL_CATEGORIES.flatMap(cat => cat.skills);

  const filteredInterests = interestSearch 
    ? searchInterests(interestSearch) 
    : INTEREST_CATEGORIES.flatMap(cat => cat.interests);

  const addSkill = (skill: Skill, level: 'beginner' | 'intermediate' | 'advanced' | 'expert') => {
    if (!data.skills.find(s => s.id === skill.id)) {
      setData(prev => ({
        ...prev,
        skills: [...prev.skills, { id: skill.id, name: skill.name, level }]
      }));
    }
  };

  const removeSkill = (skillId: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== skillId)
    }));
  };

  const toggleInterest = (interestId: string, interestName: string) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const addGoal = (type: 'shortTerm' | 'longTerm') => {
    if (newGoal.trim()) {
      setData(prev => ({
        ...prev,
        goals: {
          ...prev.goals,
          [type]: [...prev.goals[type], newGoal.trim()]
        }
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (type: 'shortTerm' | 'longTerm', index: number) => {
    setData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [type]: prev.goals[type].filter((_, i) => i !== index)
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Award className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h2 className="text-2xl font-bold mb-2">What skills do you have?</h2>
              <p className="text-gray-600">
                Tell us about your current skills and experience level. This helps us match you with the right mentors.
              </p>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {SKILL_CATEGORIES.map(category => (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {category.skills
                        .filter(skill => 
                          !skillSearch || 
                          skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
                          skill.description.toLowerCase().includes(skillSearch.toLowerCase())
                        )
                        .map(skill => {
                          const userSkill = data.skills.find(s => s.id === skill.id);
                          return (
                            <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{skill.name}</p>
                                <p className="text-sm text-gray-600">{skill.description}</p>
                              </div>
                              {userSkill ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{userSkill.level}</Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeSkill(skill.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map(level => (
                                    <Button
                                      key={level}
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addSkill(skill, level)}
                                      className="text-xs"
                                    >
                                      {level}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Selected Skills ({data.skills.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map(skill => (
                      <Badge key={skill.id} variant="secondary" className="px-3 py-1">
                        {skill.name} ({skill.level})
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Heart className="h-12 w-12 mx-auto mb-4 text-pink-600" />
              <h2 className="text-2xl font-bold mb-2">What interests you?</h2>
              <p className="text-gray-600">
                Choose areas you're passionate about or want to explore. This helps us find mentors who share your interests.
              </p>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search interests..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {INTEREST_CATEGORIES.map(category => (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {category.interests
                        .filter(interest => 
                          !interestSearch || 
                          interest.name.toLowerCase().includes(interestSearch.toLowerCase()) ||
                          interest.description.toLowerCase().includes(interestSearch.toLowerCase())
                        )
                        .map(interest => (
                          <div key={interest.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={interest.id}
                              checked={data.interests.includes(interest.id)}
                              onCheckedChange={() => toggleInterest(interest.id, interest.name)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={interest.id} className="font-medium cursor-pointer">
                                {interest.name}
                              </Label>
                              <p className="text-sm text-gray-600 mt-1">{interest.description}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Selected Interests ({data.interests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.interests.map(interestId => {
                      const interest = filteredInterests.find(i => i.id === interestId);
                      return interest ? (
                        <Badge key={interestId} variant="secondary" className="px-3 py-1">
                          {interest.name}
                          <button
                            onClick={() => toggleInterest(interestId, interest.name)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Target className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold mb-2">What are your goals?</h2>
              <p className="text-gray-600">
                Share your short-term and long-term goals so mentors can help you achieve them.
              </p>
            </div>

            <Tabs defaultValue="short-term" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="short-term">Short-term (0-2 years)</TabsTrigger>
                <TabsTrigger value="long-term">Long-term (3+ years)</TabsTrigger>
              </TabsList>

              <TabsContent value="short-term" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Short-term Goals</CardTitle>
                    <CardDescription>
                      What do you want to achieve in the next 1-2 years?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a short-term goal..."
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addGoal('shortTerm');
                          }
                        }}
                      />
                      <Button onClick={() => addGoal('shortTerm')} disabled={!newGoal.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {data.goals.shortTerm.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{goal}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeGoal('shortTerm', index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="long-term" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Long-term Goals</CardTitle>
                    <CardDescription>
                      What do you want to achieve in the next 3+ years?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a long-term goal..."
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addGoal('longTerm');
                          }
                        }}
                      />
                      <Button onClick={() => addGoal('longTerm')} disabled={!newGoal.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {data.goals.longTerm.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>{goal}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeGoal('longTerm', index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Career Path (Optional)</CardTitle>
                <CardDescription>
                  What career direction are you interested in exploring?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe your ideal career path or industry..."
                  value={data.goals.careerPath || ''}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    goals: { ...prev.goals, careerPath: e.target.value }
                  }))}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
              <h2 className="text-2xl font-bold mb-2">Tell us about your experience</h2>
              <p className="text-gray-600">
                Share your background so mentors can understand your journey and provide relevant guidance.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Education Background</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe your education (high school, college, certifications, etc.)"
                  value={data.experience.education}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    experience: { ...prev.experience, education: e.target.value }
                  }))}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Challenges You've Overcome</CardTitle>
                <CardDescription>
                  What obstacles have you faced? This helps us find mentors with similar experiences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Share challenges you've overcome (optional but helpful for matching)"
                  value={data.experience.challenges.join('\n')}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    experience: { ...prev.experience, challenges: e.target.value.split('\n').filter(Boolean) }
                  }))}
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements & Successes</CardTitle>
                <CardDescription>
                  What are you proud of? Include any accomplishments, big or small.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Share your achievements and things you're proud of"
                  value={data.experience.achievements.join('\n')}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    experience: { ...prev.experience, achievements: e.target.value.split('\n').filter(Boolean) }
                  }))}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Check className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold mb-2">Mentorship preferences</h2>
              <p className="text-gray-600">
                Let us know how you prefer to work with mentors so we can find the best matches.
              </p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mentorship Style</CardTitle>
                  <CardDescription>How do you prefer to be mentored?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={data.preferences.mentorshipStyle}
                    onValueChange={(value: any) => setData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, mentorshipStyle: value }
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="structured" id="structured" />
                      <Label htmlFor="structured">Structured - Regular scheduled sessions with clear agendas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="casual" id="casual" />
                      <Label htmlFor="casual">Casual - Informal conversations and check-ins</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="project-based" id="project-based" />
                      <Label htmlFor="project-based">Project-based - Working together on specific projects</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="goal-oriented" id="goal-oriented" />
                      <Label htmlFor="goal-oriented">Goal-oriented - Focused on achieving specific objectives</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Frequency</CardTitle>
                  <CardDescription>How often would you like to connect?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={data.preferences.communicationFrequency}
                    onValueChange={(value: any) => setData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, communicationFrequency: value }
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly - Regular weekly check-ins</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="biweekly" id="biweekly" />
                      <Label htmlFor="biweekly">Bi-weekly - Every two weeks</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly">Monthly - Once per month</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="as-needed" id="as-needed" />
                      <Label htmlFor="as-needed">As needed - When questions or issues arise</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meeting Preference</CardTitle>
                  <CardDescription>How do you prefer to meet?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={data.preferences.meetingPreference}
                    onValueChange={(value: any) => setData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, meetingPreference: value }
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-person" id="in-person" />
                      <Label htmlFor="in-person">In-person - Face-to-face meetings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="virtual" id="virtual" />
                      <Label htmlFor="virtual">Virtual - Video calls and online meetings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Both - Flexible between in-person and virtual</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Skills Assessment</h1>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-8">
          {renderStep()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button onClick={nextStep}>
              {currentStep === totalSteps ? (
                <>
                  Complete Assessment
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}