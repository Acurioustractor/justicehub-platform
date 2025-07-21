'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Service {
  id: string;
  name: string;
  description?: string;
  organizations?: {
    name?: string;
  };
  locations?: {
    state?: string;
    locality?: string;
  };
}

export function SimpleServiceFinder() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Youth Justice Services</CardTitle>
          <CardDescription>Find youth justice services across Queensland</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input placeholder="Search services..." />
            <Button onClick={loadServices}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          services.slice(0, 12).map((service) => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-2">{service.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {service.organizations?.name && service.organizations.name !== '[object Object]' 
                    ? service.organizations.name 
                    : 'Organization details available'}
                </p>
                <p className="text-xs text-gray-500">
                  {service.locations?.state || 'QLD'}
                </p>
                {service.description && (
                  <p className="text-sm mt-2">
                    {service.description.length > 100 
                      ? service.description.substring(0, 100) + '...'
                      : service.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {services.length > 0 && (
        <div className="text-center">
          <p className="text-gray-600">Showing {Math.min(12, services.length)} of {services.length} services</p>
        </div>
      )}
    </div>
  );
}