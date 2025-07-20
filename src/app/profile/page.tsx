'use client';

import { useUserContext } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, User, Shield, Bell, Eye } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useUserContext();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Form states
  const [profile, setProfile] = useState({
    name: user?.profile?.name || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    phone: user?.profile?.phone || '',
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareStories: user?.privacySettings?.shareStories ?? true,
    allowMentorContact: user?.privacySettings?.allowMentorContact ?? true,
    showProfile: user?.privacySettings?.showProfile ?? true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/api/auth/login');
    return null;
  }

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (response.ok) {
        await refreshUser();
        // Show success toast
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacySettings }),
      });

      if (response.ok) {
        await refreshUser();
        // Show success toast
      }
    } catch (error) {
      console.error('Privacy update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal information and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information that's visible to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profile?.picture} />
                  <AvatarFallback>
                    {getInitials(profile.name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-sm text-gray-500">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    Brief description for your profile. Max 500 characters.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {user.role === 'youth' && (
            <Card>
              <CardHeader>
                <CardTitle>Youth Profile</CardTitle>
                <CardDescription>
                  Additional information for your youth profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="education">Education Level</Label>
                  <Select>
                    <SelectTrigger id="education">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="middle-school">Middle School</SelectItem>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="ged">GED</SelectItem>
                      <SelectItem value="some-college">Some College</SelectItem>
                      <SelectItem value="associates">Associate's Degree</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Skills & Interests</Label>
                  <Textarea
                    placeholder="Enter your skills and interests, separated by commas"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your information and interact with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="share-stories">Share Stories Publicly</Label>
                  <p className="text-sm text-gray-500">
                    Allow your stories to be visible to all users
                  </p>
                </div>
                <Switch
                  id="share-stories"
                  checked={privacySettings.shareStories}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, shareStories: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mentor-contact">Allow Mentor Contact</Label>
                  <p className="text-sm text-gray-500">
                    Mentors can send you connection requests
                  </p>
                </div>
                <Switch
                  id="mentor-contact"
                  checked={privacySettings.allowMentorContact}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, allowMentorContact: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-profile">Public Profile</Label>
                  <p className="text-sm text-gray-500">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  id="show-profile"
                  checked={privacySettings.showProfile}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, showProfile: checked })
                  }
                />
              </div>

              <Button onClick={handlePrivacyUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Privacy Settings'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how JusticeHub looks for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Theme settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}