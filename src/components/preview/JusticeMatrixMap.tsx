'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Scale, Users, ExternalLink, Award } from 'lucide-react';

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
    // Base radius + bonus for high precedent
    return c.precedent_strength === 'high' ? 12 : 8;
  };

  const getCampaignRadius = (c: Campaign) => {
    // Ongoing campaigns are slightly larger
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
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="font-bold text-xs">{c.jurisdiction}</div>
                  <div className="text-xs text-gray-600">{c.year}</div>
                </Tooltip>
                <Popup className="justice-matrix-popup">
                  <div className="min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {c.jurisdiction}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {c.year}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-2 leading-tight">{c.case_citation}</h3>
                    <p className="text-xs text-gray-500 mb-2">{c.court}</p>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-3">{c.strategic_issue}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        c.outcome === 'favorable' ? 'bg-green-100 text-green-700' :
                        c.outcome === 'adverse' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.outcome}
                      </span>
                      {c.precedent_strength === 'high' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                          <Award className="w-3 h-3" /> High Precedent
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCaseSelect?.(c);
                        }}
                        className="flex-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <a
                        href={c.authoritative_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </Popup>
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
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="font-bold text-xs">{c.campaign_name}</div>
                  <div className="text-xs text-gray-600">{c.country_region}</div>
                </Tooltip>
                <Popup className="justice-matrix-popup">
                  <div className="min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        {c.country_region}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        c.is_ongoing
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.is_ongoing ? 'Ongoing' : 'Completed'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-2">{c.campaign_name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{c.lead_organizations}</p>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-3">{c.goals}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      {c.start_year} - {c.end_year || 'Present'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCampaignSelect?.(c);
                        }}
                        className="flex-1 text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors"
                      >
                        View Details
                      </button>
                      <a
                        href={c.campaign_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 px-2"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}
      </MapContainer>
    </div>
  );
}
