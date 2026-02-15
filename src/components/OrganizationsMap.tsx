'use client';

import React, { useState, useEffect } from 'react';
import { EcosystemMap, EcosystemData } from '@/components/EcosystemMap';
import { Maximize2, Minimize2, Building2, Heart, Briefcase, Users } from 'lucide-react';

interface OrganizationsMapProps {
  initialState?: string;
}

export function OrganizationsMap({ initialState = '' }: OrganizationsMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedState, setSelectedState] = useState(initialState);
  const [ecosystemData, setEcosystemData] = useState<EcosystemData>({
    facilities: [],
    programs: [],
    services: [],
    organizations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEcosystemData();
  }, [selectedState]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const fetchEcosystemData = async () => {
    try {
      setLoading(true);
      const url = selectedState
        ? `/api/transparency/ecosystem?state=${selectedState}`
        : '/api/transparency/ecosystem';
      const response = await fetch(url);
      const result = await response.json();
      setEcosystemData(result);
    } catch (error) {
      console.error('Failed to fetch ecosystem data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Controls Bar */}
        <div className="bg-white border-b-2 border-black p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 border-2 border-black font-bold text-sm bg-white"
            >
              <option value="">All States</option>
              <option value="NSW">New South Wales</option>
              <option value="VIC">Victoria</option>
              <option value="QLD">Queensland</option>
              <option value="SA">South Australia</option>
              <option value="WA">Western Australia</option>
              <option value="TAS">Tasmania</option>
              <option value="NT">Northern Territory</option>
              <option value="ACT">ACT</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-red-600" />
                <span className="font-bold">{ecosystemData.facilities?.length || 0}</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-green-600" />
                <span className="font-bold">{ecosystemData.programs?.length || 0}</span>
              </span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-sm bg-white hover:bg-gray-100"
            >
              <Minimize2 className="w-4 h-4" />
              Exit Fullscreen
            </button>
          </div>
        </div>
        {/* Map - flex-1 to fill remaining space */}
        <div className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Loading ecosystem data...</p>
              </div>
            </div>
          ) : (
            <EcosystemMap
              data={ecosystemData}
              selectedState={selectedState || undefined}
              height="100%"
            />
          )}
        </div>
      </div>
    );
  }

  // Normal embedded view - matching transparency page pattern exactly
  return (
    <div>
      {/* Controls Bar */}
      <div className="bg-white border-2 border-black border-b-0 p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 border-2 border-black font-bold text-sm bg-white"
          >
            <option value="">All States</option>
            <option value="NSW">New South Wales</option>
            <option value="VIC">Victoria</option>
            <option value="QLD">Queensland</option>
            <option value="SA">South Australia</option>
            <option value="WA">Western Australia</option>
            <option value="TAS">Tasmania</option>
            <option value="NT">Northern Territory</option>
            <option value="ACT">ACT</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4 text-red-600" />
              <span className="font-bold">{ecosystemData.facilities?.length || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-green-600" />
              <span className="font-bold">{ecosystemData.programs?.length || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="font-bold">{ecosystemData.services?.length || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="font-bold">{ecosystemData.organizations?.length || 0}</span>
            </span>
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-2 px-3 py-2 border-2 border-black font-bold text-sm bg-white hover:bg-gray-100"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Map - using exact same pattern as transparency page */}
      <div className="border-2 border-black bg-white">
        {loading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading ecosystem data...</p>
            </div>
          </div>
        ) : (
          <EcosystemMap
            data={ecosystemData}
            selectedState={selectedState || undefined}
            height="600px"
          />
        )}
      </div>
    </div>
  );
}
