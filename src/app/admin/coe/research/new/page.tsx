'use client';

import { Navigation } from '@/components/ui/navigation';
import ResearchForm from '@/components/admin/coe/ResearchForm';

export default function NewResearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />
      <div className="pt-8 pb-16">
        <div className="container-justice">
          <ResearchForm isNew />
        </div>
      </div>
    </div>
  );
}
