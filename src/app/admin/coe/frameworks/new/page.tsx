'use client';

import { Navigation } from '@/components/ui/navigation';
import FrameworkForm from '@/components/admin/coe/FrameworkForm';

export default function NewFrameworkPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />
      <div className="pt-8 pb-16">
        <div className="container-justice">
          <FrameworkForm isNew />
        </div>
      </div>
    </div>
  );
}
