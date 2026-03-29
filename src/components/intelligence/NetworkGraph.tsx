'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';

/* ── Types ──────────────────────────────────────────────────── */

export interface NetworkNode {
  id: string;
  label: string;
  entity_type: string | null;
  state: string | null;
  abn: string | null;
  power_score: number | null;
  procurement_dollars: number | null;
  justice_dollars: number | null;
  donation_dollars: number | null;
  foundation_dollars: number | null;
  board_connections: number | null;
  alma_intervention_count: number | null;
  jh_org_id: string | null;
  jh_org_slug: string | null;
  is_center: boolean;
}

export interface NetworkEdge {
  source: string;
  target: string;
  relationship_type: string;
  dollar_amount: number | null;
  description: string | null;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centerId: string;
  onNodeClick: (node: NetworkNode) => void;
  onNodeHover: (node: NetworkNode | null) => void;
  selectedNodeId: string | null;
}

/* ── Colors ─────────────────────────────────────────────────── */

const EDGE_COLORS: Record<string, string> = {
  grant: '#059669',
  funding: '#059669',
  contract: '#9CA3AF',
  procurement: '#9CA3AF',
  directorship: '#0A0A0A',
  shared_director: '#0A0A0A',
  donation: '#DC2626',
  political_donation: '#DC2626',
  lobbies_for: '#DC2626',
};

const NODE_COLORS: Record<string, string> = {
  company: '#6B7280',
  government: '#3B82F6',
  individual: '#8B5CF6',
  charity: '#059669',
  trust: '#D97706',
  default: '#6B7280',
};

/* ── Helpers ────────────────────────────────────────────────── */

function truncateLabel(label: string, maxLen: number = 24): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + '\u2026';
}

function nodeSize(node: NetworkNode): number {
  if (node.is_center) return 60;
  const score = node.power_score ?? 0;
  if (score > 80) return 50;
  if (score > 50) return 40;
  if (score > 20) return 35;
  return 28;
}

function edgeWidth(edge: NetworkEdge): number {
  const amt = edge.dollar_amount ?? 0;
  if (amt > 10_000_000) return 5;
  if (amt > 1_000_000) return 3.5;
  if (amt > 100_000) return 2.5;
  return 1.5;
}

function edgeColor(type: string): string {
  return EDGE_COLORS[type] || '#D1D5DB';
}

function nodeColor(type: string | null): string {
  return NODE_COLORS[type || 'default'] || NODE_COLORS.default;
}

/* ── Component ──────────────────────────────────────────────── */

export default function NetworkGraph({
  nodes,
  edges,
  centerId,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Build Cytoscape elements
  const buildElements = useCallback(() => {
    const cyNodes = nodes.map((n) => ({
      data: {
        id: n.id,
        label: truncateLabel(n.label),
        fullLabel: n.label,
        nodeType: n.entity_type,
        isCenter: n.is_center,
        size: nodeSize(n),
        color: n.is_center ? '#0A0A0A' : nodeColor(n.entity_type),
        borderColor: n.is_center ? '#059669' : 'transparent',
        borderWidth: n.is_center ? 4 : 0,
        textColor: n.is_center ? '#F5F0E8' : '#0A0A0A',
        // Store full node data for retrieval
        ...n,
      },
    }));

    const cyEdges = edges.map((e, i) => ({
      data: {
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        relType: e.relationship_type,
        width: edgeWidth(e),
        color: edgeColor(e.relationship_type),
        dollarAmount: e.dollar_amount,
        description: e.description,
      },
    }));

    return [...cyNodes, ...cyEdges];
  }, [nodes, edges]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(),
      style: [
        {
          selector: 'node',
          style: {
            width: 'data(size)',
            height: 'data(size)',
            'background-color': 'data(color)' as any,
            'border-width': 'data(borderWidth)' as any,
            'border-color': 'data(borderColor)' as any,
            label: 'data(label)',
            'font-size': '10px',
            'font-family': "'IBM Plex Mono', monospace",
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            color: '#0A0A0A',
            'text-outline-color': '#F5F0E8',
            'text-outline-width': 2,
            'text-max-width': '120px',
            'text-wrap': 'ellipsis',
            'overlay-opacity': 0,
            'transition-property':
              'background-color, border-color, border-width, width, height',
            'transition-duration': 150,
          } as any,
        },
        {
          selector: 'node[?isCenter]',
          style: {
            'font-size': '12px',
            'font-weight': 700,
            'text-outline-width': 3,
            'z-index': 999,
          } as any,
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#059669',
          } as any,
        },
        {
          selector: 'edge',
          style: {
            width: 'data(width)' as any,
            'line-color': 'data(color)' as any,
            'target-arrow-color': 'data(color)' as any,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            opacity: 0.7,
            'overlay-opacity': 0,
            'transition-property': 'opacity, width',
            'transition-duration': 150,
          } as any,
        },
        {
          selector: 'edge:selected',
          style: {
            opacity: 1,
            width: 4,
          } as any,
        },
        {
          selector: '.dimmed',
          style: {
            opacity: 0.15,
          } as any,
        },
        {
          selector: '.highlighted',
          style: {
            opacity: 1,
          } as any,
        },
      ],
      layout: {
        name: 'concentric',
        concentric: (node: any) => {
          return node.data('isCenter') ? 100 : 1;
        },
        levelWidth: () => 1,
        minNodeSpacing: 60,
        animate: true,
        animationDuration: 600,
      } as any,
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    // Node click handler
    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data();
      const networkNode: NetworkNode = {
        id: nodeData.id,
        label: nodeData.fullLabel,
        entity_type: nodeData.entity_type,
        state: nodeData.state,
        abn: nodeData.abn,
        power_score: nodeData.power_score,
        procurement_dollars: nodeData.procurement_dollars,
        justice_dollars: nodeData.justice_dollars,
        donation_dollars: nodeData.donation_dollars,
        foundation_dollars: nodeData.foundation_dollars,
        board_connections: nodeData.board_connections,
        alma_intervention_count: nodeData.alma_intervention_count,
        jh_org_id: nodeData.jh_org_id,
        jh_org_slug: nodeData.jh_org_slug,
        is_center: nodeData.isCenter,
      };
      onNodeClick(networkNode);
    });

    // Node hover handler
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data();
      // Highlight connected elements
      const connected = evt.target.connectedEdges().connectedNodes();
      cy.elements().addClass('dimmed');
      evt.target.removeClass('dimmed').addClass('highlighted');
      connected.removeClass('dimmed').addClass('highlighted');
      evt.target.connectedEdges().removeClass('dimmed').addClass('highlighted');

      onNodeHover({
        id: nodeData.id,
        label: nodeData.fullLabel,
        entity_type: nodeData.entity_type,
        state: nodeData.state,
        abn: nodeData.abn,
        power_score: nodeData.power_score,
        procurement_dollars: nodeData.procurement_dollars,
        justice_dollars: nodeData.justice_dollars,
        donation_dollars: nodeData.donation_dollars,
        foundation_dollars: nodeData.foundation_dollars,
        board_connections: nodeData.board_connections,
        alma_intervention_count: nodeData.alma_intervention_count,
        jh_org_id: nodeData.jh_org_id,
        jh_org_slug: nodeData.jh_org_slug,
        is_center: nodeData.isCenter,
      });
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('dimmed').removeClass('highlighted');
      onNodeHover(null);
    });

    // Fit view after layout
    cy.on('layoutstop', () => {
      cy.fit(undefined, 40);
      setIsReady(true);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [buildElements, onNodeClick, onNodeHover]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId) return;

    cy.nodes().forEach((node) => {
      if (node.data('id') === selectedNodeId) {
        node.select();
      } else {
        node.deselect();
      }
    });
  }, [selectedNodeId]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ backgroundColor: '#E8E3DB' }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#E8E3DB' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-sm text-[#0A0A0A]/60">Mapping network...</p>
          </div>
        </div>
      )}
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#F5F0E8]/95 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <p className="font-mono text-[10px] font-medium text-[#0A0A0A]/70 uppercase tracking-wider mb-2">
          Edge Types
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { color: '#059669', label: 'Grant / Funding' },
            { color: '#0A0A0A', label: 'Directorship' },
            { color: '#DC2626', label: 'Political Donation' },
            { color: '#9CA3AF', label: 'Contract' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-5 h-0.5 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-mono text-[10px] text-[#0A0A0A]/70">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
