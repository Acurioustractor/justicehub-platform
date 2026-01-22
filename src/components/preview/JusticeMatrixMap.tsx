'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Scale, Users, Award } from 'lucide-react';

interface Case {
  id: string;
  jurisdiction: string;
  case_citation: string;
  year: number;
  court: string;
  strategic_issue: string;
  key_holding: string;
  authoritative_link: string;
  region: string;
  country_code: string;
  lat: number;
  lng: number;
  categories: string[];
  outcome: string;
  precedent_strength: string;
}

interface Campaign {
  id: string;
  country_region: string;
  campaign_name: string;
  lead_organizations: string;
  goals: string;
  notable_tactics: string;
  outcome_status: string;
  campaign_link: string;
  is_ongoing: boolean;
  start_year: number;
  end_year?: number;
  country_code: string;
  lat: number;
  lng: number;
  categories: string[];
}

interface JusticeMatrixMapProps {
  cases: Case[];
  campaigns: Campaign[];
  onCaseSelect?: (c: Case) => void;
  onCampaignSelect?: (c: Campaign) => void;
}

export default function JusticeMatrixMap({
  cases,
  campaigns,
  onCaseSelect,
  onCampaignSelect
}: JusticeMatrixMapProps) {
  const [showCases, setShowCases] = useState(true);
  const [showCampaigns, setShowCampaigns] = useState(true);

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'favorable': return '#22c55e';
      case 'adverse': return '#ef4444';
      case 'pending': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const getCaseRadius = (c: Case) => {
    return c.precedent_strength === 'high' ? 12 : 8;
  };

  const getCampaignRadius = (c: Campaign) => {
    return c.is_ongoing ? 10 : 8;
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg border shadow-lg p-4 w-56">
        <h4 className="font-bold text-sm mb-3">Map Layers</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCases}
              onChange={() => setShowCases(!showCases)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Scale className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Cases ({cases.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCampaigns}
              onChange={() => setShowCampaigns(!showCampaigns)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm">Campaigns ({campaigns.length})</span>
          </label>
        </div>
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Favorable</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Adverse</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Pending</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[30, 0]}
        zoom={2}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Cases Layer */}
        {showCases && (
          <LayerGroup>
            {cases.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={getCaseRadius(c)}
                pathOptions={{
                  color: '#000000',
                  weight: 2,
                  fillColor: getOutcomeColor(c.outcome),
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => onCaseSelect?.(c),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} sticky>
                  <div className="text-center max-w-[200px]">
                    <div className="font-bold text-sm">{c.jurisdiction}</div>
                    <div className="text-xs text-gray-600">{c.year} • {c.court}</div>
                    <div className={`text-xs font-medium mt-1 ${
                      c.outcome === 'favorable' ? 'text-green-600' :
                      c.outcome === 'adverse' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {c.outcome.charAt(0).toUpperCase() + c.outcome.slice(1)}
                      {c.precedent_strength === 'high' && ' • High Precedent'}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">Click for details</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {/* Campaigns Layer */}
        {showCampaigns && (
          <LayerGroup>
            {campaigns.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={getCampaignRadius(c)}
                pathOptions={{
                  color: '#000000',
                  weight: 2,
                  fillColor: c.is_ongoing ? '#a855f7' : '#9ca3af',
                  fillOpacity: 0.8,
                }}
                eventHandlers={{
                  click: () => onCampaignSelect?.(c),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} sticky>
                  <div className="text-center max-w-[200px]">
                    <div className="font-bold text-sm">{c.campaign_name}</div>
                    <div className="text-xs text-gray-600">{c.country_region}</div>
                    <div className={`text-xs font-medium mt-1 ${
                      c.is_ongoing ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {c.is_ongoing ? 'Ongoing' : 'Completed'} • {c.start_year}-{c.end_year || 'Present'}
                    </div>
                    <div className="text-xs text-purple-500 mt-1">Click for details</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}
      </MapContainer>
    </div>
  );
}
