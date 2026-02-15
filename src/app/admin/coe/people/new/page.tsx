'use client';

import { Navigation } from '@/components/ui/navigation';
import PersonForm from '@/components/admin/coe/PersonForm';

export default function NewCoePersonPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <Navigation />
      <div className="pt-8 pb-16">
        <div className="container-justice">
          <PersonForm isNew />
        </div>
      </div>
    </div>
  );
}
