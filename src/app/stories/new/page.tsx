'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { StoryEditor } from '@/components/stories/StoryEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewStoryPage() {
  const router = useRouter();
  const { user } = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on the client side before redirecting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push('/api/auth/login');
    }
  }, [isMounted, user, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSave = async (storyData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error('Failed to save story');
      }

      const story = await response.json();
      router.push(`/stories/${story.id}`);
    } catch (error) {
      console.error('Error saving story:', error);
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold">Create Your Story</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Share your journey, experiences, and insights with the community
            </p>
          </div>

          <StoryEditor
            onSave={handleSave}
            isSubmitting={isSubmitting}
            mode="create"
          />
        </div>
      </div>
    </div>
  );
}