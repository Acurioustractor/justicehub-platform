/**
 * Storyteller Registration Page
 * 
 * Allows new storytellers to join the Empathy Ledger platform through JusticeHub.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorytellerRegistrationForm } from '@/components/storyteller/registration-form';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function StorytellerRegister() {
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [storyteller, setStoryteller] = useState<any>(null);
  const router = useRouter();

  const handleRegistrationSuccess = (newStoryteller: any) => {
    setStoryteller(newStoryteller);
    setRegistrationComplete(true);
  };

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error);
    // Error is handled by the form component
  };

  if (registrationComplete && storyteller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="pt-24 pb-16">
          <div className="container-justice">
            <div className="max-w-2xl mx-auto text-center">
              <Card variant="success">
                <CardContent className="p-8">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-4">Welcome to the Empathy Ledger!</h1>
                  <p className="text-gray-700 mb-6">
                    Your storyteller profile has been created successfully. You're now part of a community 
                    of voices working to create positive change through storytelling.
                  </p>
                  
                  <div className="bg-white p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Your Profile:</h3>
                    <p><strong>Name:</strong> {storyteller.name}</p>
                    {storyteller.location && <p><strong>Location:</strong> {storyteller.location}</p>}
                    <p><strong>Status:</strong> <span className="text-green-600">Active Storyteller</span></p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => router.push('/storyteller/create-story')}
                      className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Share Your First Story
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                    <button
                      onClick={() => router.push('/stories')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Explore Other Stories
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container-justice">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Become a Storyteller</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join the Empathy Ledger community and share your story to inspire others 
              and drive positive change in youth justice and community support.
            </p>
          </div>

          <StorytellerRegistrationForm
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
          />

          {/* Why Share Your Story */}
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Why Share Your Story?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Inspire Others</h3>
                  <p className="text-gray-600 text-sm">
                    Your story can provide hope and guidance to other young people facing similar challenges.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Drive Change</h3>
                  <p className="text-gray-600 text-sm">
                    Your experiences help inform better policies and programs that actually work.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Build Community</h3>
                  <p className="text-gray-600 text-sm">
                    Connect with others who understand your journey and build lasting relationships.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}