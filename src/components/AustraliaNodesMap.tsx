'use client';

import React, { useState } from 'react';

export interface JusticeHubNode {
  id: string;
  name: string;
  node_type: 'state' | 'territory' | 'international';
  state_code: string | null;
  country: string;
  description: string;
  status: 'active' | 'forming' | 'planned';
  latitude: number;
  longitude: number;
  contact_email?: string;
  website_url?: string;
  lead_organization?: {
    id: string;
    name: string;
  };
  upcoming_events?: number;
  intervention_count?: number;
}

interface AustraliaNodesMapProps {
  nodes: JusticeHubNode[];
  height?: string;
  onNodeSelect?: (node: JusticeHubNode) => void;
  selectedNodeId?: string;
}

// Hardcoded positions for Australian states/territories (percentage-based)
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  'NSW': { x: 84, y: 62 },
  'VIC': { x: 80, y: 75 },
  'QLD': { x: 85, y: 35 },
  'WA': { x: 22, y: 45 },
  'SA': { x: 58, y: 55 },
  'NT': { x: 52, y: 22 },
  'TAS': { x: 83, y: 92 },
  'ACT': { x: 87, y: 65 },
};

const statusColors: Record<string, string> = {
  active: '#059669',
  forming: '#d97706',
  planned: '#6b7280',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  forming: 'Forming',
  planned: 'Planned',
};

// Fixed marker size - no size changes on hover to prevent jumping
const MARKER_SIZE = 18;
const SELECTED_MARKER_SIZE = 22;

export default function AustraliaNodesMap({
  nodes,
  height = '600px',
  onNodeSelect,
  selectedNodeId
}: AustraliaNodesMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Filter to Australian nodes only and get position
  const australianNodes = nodes.filter(node => {
    return node.state_code && STATE_POSITIONS[node.state_code];
  });

  // International nodes (like New Zealand)
  const internationalNodes = nodes.filter(node => {
    return !node.state_code || !STATE_POSITIONS[node.state_code];
  });

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Australia map container */}
      <div
        className="absolute inset-0 border-2 border-black bg-blue-50"
        style={{
          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Australia_location_map.svg/1200px-Australia_location_map.svg.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Node markers */}
        {australianNodes.map(node => {
          const position = STATE_POSITIONS[node.state_code!];
          const color = statusColors[node.status] || statusColors.planned;
          const isSelected = node.id === selectedNodeId;
          const isHovered = node.id === hoveredNode;
          const markerSize = isSelected ? SELECTED_MARKER_SIZE : MARKER_SIZE;

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isHovered || isSelected ? 100 : 10,
              }}
            >
              {/* Marker container - fixed size to prevent layout shift */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: `${SELECTED_MARKER_SIZE + 8}px`,
                  height: `${SELECTED_MARKER_SIZE + 8}px`,
                }}
              >
                {/* Hover ring - shows on hover without changing marker size */}
                {isHovered && !isSelected && (
                  <div
                    className="absolute rounded-full animate-pulse"
                    style={{
                      width: `${markerSize + 10}px`,
                      height: `${markerSize + 10}px`,
                      backgroundColor: 'transparent',
                      border: `2px solid ${color}`,
                      opacity: 0.5,
                    }}
                  />
                )}
                {/* Marker dot - fixed size */}
                <button
                  onClick={() => onNodeSelect?.(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="block rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    width: `${markerSize}px`,
                    height: `${markerSize}px`,
                    backgroundColor: color,
                    border: isSelected ? '3px solid #111827' : '2px solid white',
                    boxShadow: isHovered
                      ? '0 4px 12px rgba(0,0,0,0.5)'
                      : '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                  aria-label={`${node.name} - ${statusLabels[node.status]}`}
                />
              </div>

              {/* Tooltip on hover - positioned relative to fixed container */}
              {isHovered && (
                <div
                  className="absolute left-1/2 bg-white border-2 border-black p-3 shadow-lg z-50 pointer-events-none"
                  style={{
                    transform: 'translateX(-50%)',
                    bottom: `${SELECTED_MARKER_SIZE + 16}px`,
                    minWidth: '180px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-xs font-bold uppercase"
                      style={{ color }}
                    >
                      {statusLabels[node.status]}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm">{node.name}</h3>
                  {node.description && (
                    <p className="text-xs text-gray-600 mt-1 whitespace-normal max-w-[200px]">
                      {node.description.substring(0, 80)}
                      {node.description.length > 80 ? '...' : ''}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Click to select
                  </div>
                  {/* Tooltip arrow */}
                  <div
                    className="absolute left-1/2 -bottom-2 w-3 h-3 bg-white border-r-2 border-b-2 border-black"
                    style={{ transform: 'translateX(-50%) rotate(45deg)' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 shadow-lg z-10">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
          Node Status
        </div>
        <div className="space-y-1">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
              <span className="text-gray-700">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* International nodes section */}
      {internationalNodes.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white border-2 border-black p-3 shadow-lg z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
            International
          </div>
          <div className="space-y-2">
            {internationalNodes.map(node => {
              const color = statusColors[node.status] || statusColors.planned;
              return (
                <button
                  key={node.id}
                  onClick={() => onNodeSelect?.(node)}
                  className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 -m-1 rounded w-full text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-gray-700">{node.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
