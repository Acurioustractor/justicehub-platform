import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <Header transparent />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Empowering Youth Through</span>
              <span className="block text-primary-600">Storytelling & Connection</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              JusticeHub bridges the gap between young people's life experiences and opportunities for growth, mentorship, and economic advancement.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button href="/stories" size="lg">Explore Stories</Button>
              <Button href="/auth/signup" variant="outline" size="lg">Join the Community</Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">How JusticeHub Works</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Our platform connects stories with opportunities and mentorship.
            </p>
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <div className="h-12 w-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Living Libraries</h3>
                <p className="mt-2 text-base text-gray-500">
                  Share your story and experiences through our unified storytelling platform.
                </p>
              </Card>
              
              <Card className="text-center">
                <div className="h-12 w-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Mentor Hub</h3>
                <p className="mt-2 text-base text-gray-500">
                  Connect with experienced mentors who can guide you on your journey.
                </p>
              </Card>
              
              <Card className="text-center">
                <div className="h-12 w-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Opportunity Matching</h3>
                <p className="mt-2 text-base text-gray-500">
                  Discover apprenticeships, jobs, and growth opportunities matched to your skills.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Voices from Our Community</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Hear from youth, mentors, and organizations who are part of JusticeHub.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  JD
                </div>
                <div className="ml-4">
                  <h4 className="font-medium">Jamie D.</h4>
                  <p className="text-sm text-gray-500">Youth Member</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Sharing my story on JusticeHub connected me with a mentor who helped me navigate college applications. Now I'm studying computer science at my dream school!"
              </p>
            </Card>
            
            <Card>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  MT
                </div>
                <div className="ml-4">
                  <h4 className="font-medium">Michael T.</h4>
                  <p className="text-sm text-gray-500">Mentor</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Being a mentor on JusticeHub has been incredibly rewarding. I've been able to guide young people and watch them grow into confident professionals."
              </p>
            </Card>
            
            <Card>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  CH
                </div>
                <div className="ml-4">
                  <h4 className="font-medium">Community Hope</h4>
                  <p className="text-sm text-gray-500">Partner Organization</p>
                </div>
              </div>
              <p className="text-gray-600">
                "JusticeHub has transformed how we connect with youth in our community. The platform makes it easy to share opportunities and find talented young people."
              </p>
            </Card>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-200">Join JusticeHub today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Button href="/auth/signup" size="lg" className="bg-white text-primary-600 hover:bg-gray-50">
                Sign Up
              </Button>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Button href="/stories" variant="outline" size="lg" className="border-white text-white hover:bg-primary-600">
                Explore Stories
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  )
}