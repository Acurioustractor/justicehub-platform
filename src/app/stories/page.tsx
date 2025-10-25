import { Suspense } from 'react';
import { StoriesPageContent } from './page-content';
import { Navigation, Footer } from '@/components/ui/navigation';

export const metadata = {
  title: 'Stories from the Movement - JusticeHub',
  description: 'Real stories, evidence-based insights, and updates from communities transforming youth justice across Australia',
};

function LoadingFallback() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen page-content">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">Loading stories...</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function StoriesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StoriesPageContent />
    </Suspense>
  );
}
