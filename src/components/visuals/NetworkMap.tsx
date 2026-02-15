'use client';

import React, { useEffect, useRef } from 'react';

interface NetworkMapProps {
  width?: number;
  height?: number;
}

export function NetworkMap({ width = 1200, height = 600 }: NetworkMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Communities data
    const communities = [
      { id: 'alice', name: 'Alice Springs', x: 100, y: 100, connected: false },
      { id: 'bourke', name: 'Bourke', x: 200, y: 150, connected: false },
      { id: 'moree', name: 'Moree', x: 150, y: 250, connected: false },
      { id: 'darwin', name: 'Darwin', x: 250, y: 80, connected: false },
      { id: 'sydney', name: 'Sydney', x: 300, y: 200, connected: false },
      { id: 'brisbane', name: 'Brisbane', x: 350, y: 120, connected: false },
    ];

    const connectedCommunities = [
      { id: 'alice', name: 'Alice Springs', x: 700, y: 150, connected: true },
      { id: 'bourke', name: 'Bourke', x: 850, y: 100, connected: true },
      { id: 'moree', name: 'Moree', x: 900, y: 250, connected: true },
      { id: 'darwin', name: 'Darwin', x: 800, y: 50, connected: true },
      { id: 'sydney', name: 'Sydney', x: 950, y: 180, connected: true },
      { id: 'brisbane', name: 'Brisbane', x: 1000, y: 80, connected: true },
    ];

    const hub = { x: 850, y: 150, name: 'JusticeHub' };

    // Connections
    const connections = [
      ['alice', 'bourke'],
      ['bourke', 'moree'],
      ['moree', 'darwin'],
      ['darwin', 'sydney'],
      ['sydney', 'brisbane'],
      ['alice', 'sydney'],
      ['bourke', 'darwin'],
    ];

    const svg = svgRef.current;
    svg.innerHTML = '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // BEFORE (Left Side)
    const beforeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(beforeG);

    // Title BEFORE
    const beforeTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    beforeTitle.setAttribute('x', '200');
    beforeTitle.setAttribute('y', '40');
    beforeTitle.setAttribute('text-anchor', 'middle');
    beforeTitle.setAttribute('font-size', '24');
    beforeTitle.setAttribute('font-weight', 'bold');
    beforeTitle.setAttribute('fill', '#DC2626');
    beforeTitle.textContent = 'BEFORE: Isolated Communities';
    beforeG.appendChild(beforeTitle);

    const beforeSubtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    beforeSubtitle.setAttribute('x', '200');
    beforeSubtitle.setAttribute('y', '70');
    beforeSubtitle.setAttribute('text-anchor', 'middle');
    beforeSubtitle.setAttribute('font-size', '14');
    beforeSubtitle.setAttribute('fill', '#666');
    beforeSubtitle.textContent = 'Knowledge stays local, invisible to others';
    beforeG.appendChild(beforeSubtitle);

    // Draw isolated communities
    communities.forEach(community => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(community.x));
      circle.setAttribute('cy', String(community.y + 50));
      circle.setAttribute('r', '25');
      circle.setAttribute('fill', '#DC2626');
      circle.setAttribute('opacity', '0.3');
      circle.setAttribute('stroke', '#DC2626');
      circle.setAttribute('stroke-width', '2');
      beforeG.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(community.x));
      text.setAttribute('y', String(community.y + 100));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#1F2937');
      text.textContent = community.name;
      beforeG.appendChild(text);
    });

    // AFTER (Right Side)
    const afterG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(afterG);

    // Title AFTER
    const afterTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    afterTitle.setAttribute('x', '850');
    afterTitle.setAttribute('y', '40');
    afterTitle.setAttribute('text-anchor', 'middle');
    afterTitle.setAttribute('font-size', '24');
    afterTitle.setAttribute('font-weight', 'bold');
    afterTitle.setAttribute('fill', '#059669');
    afterTitle.textContent = 'AFTER: Connected Network';
    afterG.appendChild(afterTitle);

    const afterSubtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    afterSubtitle.setAttribute('x', '850');
    afterSubtitle.setAttribute('y', '70');
    afterSubtitle.setAttribute('text-anchor', 'middle');
    afterSubtitle.setAttribute('font-size', '14');
    afterSubtitle.setAttribute('fill', '#666');
    afterSubtitle.textContent = 'Community intelligence scales nationwide';
    afterG.appendChild(afterSubtitle);

    // Draw connections first (so they're behind nodes)
    connections.forEach(([from, to]) => {
      const fromNode = connectedCommunities.find(c => c.id === from);
      const toNode = connectedCommunities.find(c => c.id === to);
      if (fromNode && toNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(fromNode.x));
        line.setAttribute('y1', String(fromNode.y + 50));
        line.setAttribute('x2', String(toNode.x));
        line.setAttribute('y2', String(toNode.y + 50));
        line.setAttribute('stroke', '#059669');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.4');
        afterG.appendChild(line);
      }
    });

    // Draw central hub
    const hubCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hubCircle.setAttribute('cx', String(hub.x));
    hubCircle.setAttribute('cy', String(hub.y + 50));
    hubCircle.setAttribute('r', '40');
    hubCircle.setAttribute('fill', '#2563EB');
    hubCircle.setAttribute('stroke', '#1E40AF');
    hubCircle.setAttribute('stroke-width', '3');
    afterG.appendChild(hubCircle);

    const hubText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hubText.setAttribute('x', String(hub.x));
    hubText.setAttribute('y', String(hub.y + 55));
    hubText.setAttribute('text-anchor', 'middle');
    hubText.setAttribute('font-size', '14');
    hubText.setAttribute('font-weight', 'bold');
    hubText.setAttribute('fill', 'white');
    hubText.textContent = hub.name;
    afterG.appendChild(hubText);

    // Draw connected communities
    connectedCommunities.forEach(community => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(community.x));
      circle.setAttribute('cy', String(community.y + 50));
      circle.setAttribute('r', '25');
      circle.setAttribute('fill', '#059669');
      circle.setAttribute('opacity', '0.8');
      circle.setAttribute('stroke', '#047857');
      circle.setAttribute('stroke-width', '2');
      afterG.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(community.x));
      text.setAttribute('y', String(community.y + 100));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#1F2937');
      text.textContent = community.name;
      afterG.appendChild(text);
    });

    // Arrow between
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowPath.setAttribute('d', 'M 450 300 L 550 300');
    arrowPath.setAttribute('stroke', '#6B7280');
    arrowPath.setAttribute('stroke-width', '4');
    arrowPath.setAttribute('marker-end', 'url(#arrowhead)');
    arrow.appendChild(arrowPath);
    g.appendChild(arrow);

    const arrowText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    arrowText.setAttribute('x', '500');
    arrowText.setAttribute('y', '285');
    arrowText.setAttribute('text-anchor', 'middle');
    arrowText.setAttribute('font-size', '16');
    arrowText.setAttribute('font-weight', 'bold');
    arrowText.setAttribute('fill', '#2563EB');
    arrowText.textContent = 'JusticeHub Transforms';
    g.appendChild(arrowText);

    // Define arrowhead marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#6B7280');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, g);

    // Impact boxes at bottom
    const impacts = [
      'Alice Springs learns from Bourke',
      'Darwin finds what works in Moree',
      'Knowledge valued and compensated',
      'Young people supported everywhere',
    ];

    impacts.forEach((impact, i) => {
      const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      box.setAttribute('x', String(200 + i * 220));
      box.setAttribute('y', '480');
      box.setAttribute('width', '200');
      box.setAttribute('height', '60');
      box.setAttribute('rx', '8');
      box.setAttribute('fill', '#DBEAFE');
      box.setAttribute('stroke', '#2563EB');
      box.setAttribute('stroke-width', '2');
      g.appendChild(box);

      const impactText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      impactText.setAttribute('x', String(300 + i * 220));
      impactText.setAttribute('y', '515');
      impactText.setAttribute('text-anchor', 'middle');
      impactText.setAttribute('font-size', '11');
      impactText.setAttribute('font-weight', '600');
      impactText.setAttribute('fill', '#1E40AF');
      impactText.textContent = impact;
      g.appendChild(impactText);
    });

  }, []);

  return (
    <div className="w-full bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
      />
    </div>
  );
}
