import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DetentionDollarSection } from '@/components/landing/DetentionDollarSection';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-sm bg-neutral-900 dark:bg-neutral-100"></div>
              <h1 className="text-2xl font-medium tracking-wide text-neutral-900 dark:text-neutral-100">JusticeHub</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/talent-scout">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Talent Scout
                </Button>
              </Link>
              <Link href="/api/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/api/auth/login">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 mb-6">
            Empowering Youth Through
            <span className="text-accent-600">
              {' '}Storytelling
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            A digital platform that transforms how grassroots organizations support young people 
            by providing tools and human support that help youth understand their own stories 
            and connect them to opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/auth/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your Journey
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-sm bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-neutral-900 dark:text-neutral-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <CardTitle className="font-medium">Living Libraries</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Share your story and discover others' journeys through our interactive storytelling platform.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-sm bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-neutral-900 dark:text-neutral-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <CardTitle className="font-medium">Mentor Hub</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Connect with experienced mentors who understand your journey and can guide your growth.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-sm bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-neutral-900 dark:text-neutral-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle className="font-medium">Opportunity Matching</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Discover personalized opportunities for education, employment, and personal development.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Talent Scout Feature */}
        <div className="my-24">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-50 dark:bg-neutral-900">
            <CardContent className="p-12">
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="text-sm uppercase tracking-wider text-accent-600 mb-3">NEW</div>
                  <h3 className="text-3xl font-light mb-4 text-neutral-900 dark:text-neutral-100">JusticeHub Talent Scout</h3>
                  <p className="text-lg mb-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Transform your organization into a youth talent discovery powerhouse. 
                    Like Triple-J Unearthed for justice - spot, develop, and launch the next 
                    generation of community leaders.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/talent-scout">
                      <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                        Explore Talent Scout
                      </Button>
                    </Link>
                    <Link href="/dashboard/dreamtrack">
                      <Button size="lg" variant="outline" className="border-neutral-900 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800">
                        Try Youth Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-accent-600">
                    <path d="M9 2v6" />
                    <path d="M15 2v6" />
                    <path d="M12 17v5" />
                    <path d="M5 7h14" />
                    <path d="M6 2h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
                    <path d="M6 7h12v6H6z" />
                  </svg>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4">Launch careers,<br/>not just programs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detention Dollar Comparison - Outside container for full width impact */}
      <DetentionDollarSection />

      <main className="container mx-auto px-4">
        {/* CTA Section */}
        <div className="text-center my-24">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-900 dark:bg-neutral-100">
            <CardContent className="p-16">
              <h3 className="text-3xl font-light mb-6 text-white dark:text-neutral-900">Ready to Transform Your Story?</h3>
              <p className="text-xl mb-10 text-neutral-300 dark:text-neutral-700 max-w-2xl mx-auto">
                Join thousands of young people who are turning their experiences into opportunities.
              </p>
              <Link href="/api/auth/login">
                <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800">
                  Get Started Today
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-neutral-600 dark:text-neutral-400">
            <p className="text-sm">&copy; 2024 JusticeHub. Empowering youth through storytelling.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}