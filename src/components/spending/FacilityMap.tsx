'use client';

import { Building2, MapPin } from 'lucide-react';

interface Facility {
  name: string;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  location: string | null;
  operator: string | null;
}

export default function FacilityMap({ facilities }: { facilities: Facility[] }) {
  if (!facilities.length) return null;

  const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);

  return (
    <section className="py-12 px-6 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Youth Detention Facilities
        </h2>
        <p className="font-mono text-xs text-gray-500 mb-6">
          {facilities.length} facilities, {totalCapacity} total capacity
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((f) => (
            <div
              key={f.name}
              className="bg-white border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm">{f.name}</h3>
                  {f.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {f.location}
                    </p>
                  )}
                  {f.operator && (
                    <p className="text-xs text-gray-400 mt-1">
                      Operator: {f.operator}
                    </p>
                  )}
                  {f.capacity != null && (
                    <p className="font-mono text-sm font-bold mt-2">
                      Capacity: {f.capacity}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
