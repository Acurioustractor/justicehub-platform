'use client';

import React, { useEffect, useRef } from 'react';

interface ConnectionWebProps {
  width?: number;
  height?: number;
}

export function ConnectionWeb({ width = 1200, height = 700 }: ConnectionWebProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '600');
    title.setAttribute('y', '40');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '28');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#1F2937');
    title.textContent = 'How JusticeHub Connects Everyone';
    g.appendChild(title);

    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', '600');
    subtitle.setAttribute('y', '70');
    subtitle.setAttribute('text-anchor', 'middle');
    subtitle.setAttribute('font-size', '14');
    subtitle.setAttribute('fill', '#6B7280');
    subtitle.textContent = 'Breaking down silos, building understanding';
    g.appendChild(subtitle);

    // Central hub
    const hub = { x: 600, y: 350, r: 80 };

    // Stakeholder nodes arranged in circle around hub
    const stakeholders = [
      {
        id: 'youth',
        label: 'Young\nPeople',
        angle: 0,
        color: '#DC2626',
        distance: 220,
        connection: 'Find hope,\nsee possibilities'
      },
      {
        id: 'families',
        label: 'Families',
        angle: 60,
        color: '#EA580C',
        distance: 220,
        connection: 'Stay connected,\nunderstand options'
      },
      {
        id: 'communities',
        label: 'Communities',
        angle: 120,
        color: '#D97706',
        distance: 220,
        connection: 'Share knowledge,\nget compensated'
      },
      {
        id: 'practitioners',
        label: 'Practitioners',
        angle: 180,
        color: '#059669',
        distance: 220,
        connection: 'Learn best practice,\nimprove outcomes'
      },
      {
        id: 'researchers',
        label: 'Researchers',
        angle: 240,
        color: '#2563EB',
        distance: 220,
        connection: 'Access evidence,\nvalidate programs'
      },
      {
        id: 'policy',
        label: 'Policy\nMakers',
        angle: 300,
        color: '#7C3AED',
        distance: 220,
        connection: 'Use data,\nmake informed decisions'
      },
    ];

    // Calculate positions
    stakeholders.forEach(s => {
      const radians = (s.angle - 90) * Math.PI / 180;
      s.x = hub.x + s.distance * Math.cos(radians);
      s.y = hub.y + s.distance * Math.sin(radians);
    });

    // Draw connections between hub and stakeholders
    stakeholders.forEach(s => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(hub.x));
      line.setAttribute('y1', String(hub.y));
      line.setAttribute('x2', String(s.x));
      line.setAttribute('y2', String(s.y));
      line.setAttribute('stroke', s.color);
      line.setAttribute('stroke-width', '3');
      line.setAttribute('opacity', '0.4');
      g.appendChild(line);
    });

    // Draw connections between stakeholders (showing they also connect to each other)
    const crossConnections = [
      ['youth', 'families'],
      ['families', 'communities'],
      ['communities', 'practitioners'],
      ['practitioners', 'researchers'],
      ['researchers', 'policy'],
      ['youth', 'practitioners'],
      ['communities', 'researchers'],
    ];

    crossConnections.forEach(([id1, id2]) => {
      const s1 = stakeholders.find(s => s.id === id1);
      const s2 = stakeholders.find(s => s.id === id2);
      if (s1 && s2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(s1.x));
        line.setAttribute('y1', String(s1.y));
        line.setAttribute('x2', String(s2.x));
        line.setAttribute('y2', String(s2.y));
        line.setAttribute('stroke', '#9CA3AF');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('opacity', '0.2');
        line.setAttribute('stroke-dasharray', '5,5');
        g.appendChild(line);
      }
    });

    // Draw central hub
    const hubCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hubCircle.setAttribute('cx', String(hub.x));
    hubCircle.setAttribute('cy', String(hub.y));
    hubCircle.setAttribute('r', String(hub.r));
    hubCircle.setAttribute('fill', '#2563EB');
    hubCircle.setAttribute('stroke', '#1E40AF');
    hubCircle.setAttribute('stroke-width', '4');
    g.appendChild(hubCircle);

    const hubText1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hubText1.setAttribute('x', String(hub.x));
    hubText1.setAttribute('y', String(hub.y - 5));
    hubText1.setAttribute('text-anchor', 'middle');
    hubText1.setAttribute('font-size', '20');
    hubText1.setAttribute('font-weight', 'bold');
    hubText1.setAttribute('fill', 'white');
    hubText1.textContent = 'JusticeHub';
    g.appendChild(hubText1);

    const hubText2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hubText2.setAttribute('x', String(hub.x));
    hubText2.setAttribute('y', String(hub.y + 20));
    hubText2.setAttribute('text-anchor', 'middle');
    hubText2.setAttribute('font-size', '13');
    hubText2.setAttribute('fill', 'white');
    hubText2.textContent = 'Platform';
    g.appendChild(hubText2);

    // Draw stakeholder nodes
    stakeholders.forEach(s => {
      // Outer circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(s.x));
      circle.setAttribute('cy', String(s.y));
      circle.setAttribute('r', '60');
      circle.setAttribute('fill', s.color);
      circle.setAttribute('opacity', '0.2');
      circle.setAttribute('stroke', s.color);
      circle.setAttribute('stroke-width', '3');
      g.appendChild(circle);

      // Inner circle
      const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerCircle.setAttribute('cx', String(s.x));
      innerCircle.setAttribute('cy', String(s.y));
      innerCircle.setAttribute('r', '45');
      innerCircle.setAttribute('fill', s.color);
      innerCircle.setAttribute('opacity', '0.8');
      g.appendChild(innerCircle);

      // Label (multi-line support)
      const lines = s.label.split('\n');
      lines.forEach((line, i) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(s.x));
        text.setAttribute('y', String(s.y - 5 + (i * 18)));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', 'white');
        text.textContent = line;
        g.appendChild(text);
      });

      // Connection description below node
      const connectionLines = s.connection.split('\n');
      connectionLines.forEach((line, i) => {
        const connectionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        connectionText.setAttribute('x', String(s.x));
        connectionText.setAttribute('y', String(s.y + 80 + (i * 16)));
        connectionText.setAttribute('text-anchor', 'middle');
        connectionText.setAttribute('font-size', '11');
        connectionText.setAttribute('font-style', 'italic');
        connectionText.setAttribute('fill', s.color);
        connectionText.textContent = line;
        g.appendChild(connectionText);
      });
    });

    // Bottom impact boxes
    const impacts = [
      {
        text: 'Breaking Down Silos',
        desc: 'Everyone sees the same knowledge',
        x: 150
      },
      {
        text: 'Building Trust',
        desc: 'Transparency creates understanding',
        x: 450
      },
      {
        text: 'Scaling Support',
        desc: 'Young people benefit everywhere',
        x: 750
      },
      {
        text: 'Systemic Change',
        desc: 'Whole system improves together',
        x: 1050
      },
    ];

    impacts.forEach(impact => {
      const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      box.setAttribute('x', String(impact.x - 75));
      box.setAttribute('y', '620');
      box.setAttribute('width', '150');
      box.setAttribute('height', '60');
      box.setAttribute('rx', '8');
      box.setAttribute('fill', '#F3F4F6');
      box.setAttribute('stroke', '#6B7280');
      box.setAttribute('stroke-width', '2');
      g.appendChild(box);

      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', String(impact.x));
      titleText.setAttribute('y', '645');
      titleText.setAttribute('text-anchor', 'middle');
      titleText.setAttribute('font-size', '12');
      titleText.setAttribute('font-weight', 'bold');
      titleText.setAttribute('fill', '#1F2937');
      titleText.textContent = impact.text;
      g.appendChild(titleText);

      const descText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      descText.setAttribute('x', String(impact.x));
      descText.setAttribute('y', '665');
      descText.setAttribute('text-anchor', 'middle');
      descText.setAttribute('font-size', '10');
      descText.setAttribute('fill', '#4B5563');
      descText.textContent = impact.desc;
      g.appendChild(descText);
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
