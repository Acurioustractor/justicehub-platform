'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';

type UserRole = 'youth' | 'mentor';

interface OnboardingData {
  role: UserRole;
  profile: {
    name: string;
    bio: string;
    location: string;
    phone: string;
  };
  youthProfile?: {
    education: string;
    skills: string[];
    interests: string[];
    goals: string;
  };
  mentorProfile?: {
    skills: string[];
    experience: string;
    availability: string;
    backgroundConsent: boolean;
  };
  organization?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useUserContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    role: 'youth',
    profile: {
      name: user?.profile?.name || '',
      bio: '',
      location: '',
      phone: '',
    },
  });

  const totalSteps = data.role === 'youth' ? 3 : 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update user profile
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: data.role,
          profile: data.profile,
          youthProfile: data.role === 'youth' ? data.youthProfile : undefined,
          mentorProfile: data.role === 'mentor' ? data.mentorProfile : undefined,
        }),
      });

      if (response.ok) {
        await refreshUser();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Choose Your Role</h3>
              <RadioGroup
                value={data.role}
                onValueChange={(value: UserRole) => setData({ ...data, role: value })}
              >
                <div className="flex items-start space-x-3 mb-4">
                  <RadioGroupItem value="youth" id="youth" />
                  <Label htmlFor="youth" className="cursor-pointer">
                    <div>
                      <p className="font-medium">Youth Member</p>
                      <p className="text-sm text-gray-500">
                        I'm here to share my story, find opportunities, and connect with mentors
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="mentor" id="mentor" />
                  <Label htmlFor="mentor" className="cursor-pointer">
                    <div>
                      <p className="font-medium">Mentor</p>
                      <p className="text-sm text-gray-500">
                        I want to guide and support youth on their journey
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={data.profile.name}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, name: e.target.value },
                  })
                }
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                value={data.profile.bio}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, bio: e.target.value },
                  })
                }
                placeholder="Tell us a bit about yourself"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={data.profile.location}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, location: e.target.value },
                  })
                }
                placeholder="City, State"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={data.profile.phone}
                onChange={(e) =>
                  setData({
                    ...data,
                    profile: { ...data.profile, phone: e.target.value },
                  })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        );

      case 3:
        if (data.role === 'youth') {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Your Journey</h3>
              <div>
                <Label htmlFor="education">Education Level</Label>
                <Input
                  id="education"
                  value={data.youthProfile?.education || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      youthProfile: {
                        ...data.youthProfile,
                        education: e.target.value,
                        skills: data.youthProfile?.skills || [],
                        interests: data.youthProfile?.interests || [],
                        goals: data.youthProfile?.goals || '',
                      },
                    })
                  }
                  placeholder="e.g., High School, Some College"
                />
              </div>
              <div>
                <Label htmlFor="skills">Skills & Interests</Label>
                <Textarea
                  id="skills"
                  value={data.youthProfile?.skills?.join(', ') || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      youthProfile: {
                        ...data.youthProfile,
                        education: data.youthProfile?.education || '',
                        skills: e.target.value.split(',').map(s => s.trim()),
                        interests: data.youthProfile?.interests || [],
                        goals: data.youthProfile?.goals || '',
                      },
                    })
                  }
                  placeholder="Enter your skills and interests, separated by commas"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="goals">Your Goals</Label>
                <Textarea
                  id="goals"
                  value={data.youthProfile?.goals || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      youthProfile: {
                        ...data.youthProfile,
                        education: data.youthProfile?.education || '',
                        skills: data.youthProfile?.skills || [],
                        interests: data.youthProfile?.interests || [],
                        goals: e.target.value,
                      },
                    })
                  }
                  placeholder="What do you hope to achieve?"
                  rows={3}
                />
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Mentor Profile</h3>
              <div>
                <Label htmlFor="mentor-skills">Areas of Expertise</Label>
                <Textarea
                  id="mentor-skills"
                  value={data.mentorProfile?.skills?.join(', ') || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      mentorProfile: {
                        ...data.mentorProfile,
                        skills: e.target.value.split(',').map(s => s.trim()),
                        experience: data.mentorProfile?.experience || '',
                        availability: data.mentorProfile?.availability || '',
                        backgroundConsent: data.mentorProfile?.backgroundConsent || false,
                      },
                    })
                  }
                  placeholder="e.g., Career counseling, Life skills, Academic support"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="experience">Relevant Experience</Label>
                <Textarea
                  id="experience"
                  value={data.mentorProfile?.experience || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      mentorProfile: {
                        ...data.mentorProfile,
                        skills: data.mentorProfile?.skills || [],
                        experience: e.target.value,
                        availability: data.mentorProfile?.availability || '',
                        backgroundConsent: data.mentorProfile?.backgroundConsent || false,
                      },
                    })
                  }
                  placeholder="Describe your experience working with youth"
                  rows={4}
                />
              </div>
            </div>
          );
        }

      case 4:
        if (data.role === 'mentor') {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Availability & Verification</h3>
              <div>
                <Label htmlFor="availability">When are you available?</Label>
                <Textarea
                  id="availability"
                  value={data.mentorProfile?.availability || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      mentorProfile: {
                        ...data.mentorProfile,
                        skills: data.mentorProfile?.skills || [],
                        experience: data.mentorProfile?.experience || '',
                        availability: e.target.value,
                        backgroundConsent: data.mentorProfile?.backgroundConsent || false,
                      },
                    })
                  }
                  placeholder="e.g., Weekday evenings, Weekend mornings"
                  rows={3}
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Background Check Required</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  To ensure the safety of our youth members, all mentors must complete a background check.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={data.mentorProfile?.backgroundConsent || false}
                    onChange={(e) =>
                      setData({
                        ...data,
                        mentorProfile: {
                          ...data.mentorProfile,
                          skills: data.mentorProfile?.skills || [],
                          experience: data.mentorProfile?.experience || '',
                          availability: data.mentorProfile?.availability || '',
                          backgroundConsent: e.target.checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="consent" className="text-sm cursor-pointer">
                    I consent to a background check
                  </Label>
                </div>
              </div>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return data.profile.name.trim() !== '';
      case 3:
        return true;
      case 4:
        return data.role === 'youth' || data.mentorProfile?.backgroundConsent === true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to JusticeHub!</CardTitle>
          <CardDescription>
            Let's get your profile set up so you can start your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}