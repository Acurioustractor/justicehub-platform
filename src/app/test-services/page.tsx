'use client';

import { useEffect, useState } from 'react';

export default function TestServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        console.log('Fetching services...');
        const response = await fetch('/api/services?limit=10');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
          setServices(data.data);
        } else {
          setError(data.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Services Test Page</h1>
      <p className="mb-4">Found {services.length} services</p>

      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.id} className="border p-4 rounded">
            <h2 className="font-bold">{service.name}</h2>
            <p className="text-sm text-gray-600">{service.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              Organization: {service.organization?.name || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              Youth Specific: {service.youth_specific ? 'Yes' : 'No'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
