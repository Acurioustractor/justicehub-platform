'use client';

import React, { useEffect, useRef } from 'react';

interface SystemTransformationProps {
  width?: number;
  height?: number;
}

export function SystemTransformation({ width = 1200, height = 700 }: SystemTransformationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // Define arrowhead marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead-transform');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#2563EB');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, g);

    // BEFORE SECTION (Left)
    const beforeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(beforeG);

    // Title
    const beforeTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    beforeTitle.setAttribute('x', '250');
    beforeTitle.setAttribute('y', '50');
    beforeTitle.setAttribute('text-anchor', 'middle');
    beforeTitle.setAttribute('font-size', '28');
    beforeTitle.setAttribute('font-weight', 'bold');
    beforeTitle.setAttribute('fill', '#DC2626');
    beforeTitle.textContent = 'OLD SYSTEM';
    beforeG.appendChild(beforeTitle);

    const beforeSubtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    beforeSubtitle.setAttribute('x', '250');
    beforeSubtitle.setAttribute('y', '80');
    beforeSubtitle.setAttribute('text-anchor', 'middle');
    beforeSubtitle.setAttribute('font-size', '14');
    beforeSubtitle.setAttribute('fill', '#666');
    beforeSubtitle.textContent = 'Punitive, Disconnected, Failing';
    beforeG.appendChild(beforeSubtitle);

    // OLD SYSTEM flow boxes
    const oldSystemBoxes = [
      { label: 'Young Person\nStruggles', y: 120, color: '#DC2626' },
      { label: 'Punitive\nIntervention', y: 220, color: '#B91C1C' },
      { label: 'Detention &\nIsolation', y: 320, color: '#991B1B' },
      { label: 'Family &\nCommunity\nCut Off', y: 420, color: '#7F1D1D' },
      { label: 'Recidivism\n75% Return Rate', y: 520, color: '#DC2626' },
    ];

    oldSystemBoxes.forEach((box, i) => {
      // Box
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '100');
      rect.setAttribute('y', String(box.y));
      rect.setAttribute('width', '300');
      rect.setAttribute('height', '80');
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', box.color);
      rect.setAttribute('opacity', '0.15');
      rect.setAttribute('stroke', box.color);
      rect.setAttribute('stroke-width', '3');
      beforeG.appendChild(rect);

      // Text (multi-line support)
      const lines = box.label.split('\n');
      lines.forEach((line, lineIndex) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '250');
        text.setAttribute('y', String(box.y + 35 + (lineIndex * 20)));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', box.color);
        text.textContent = line;
        beforeG.appendChild(text);
      });

      // Arrow to next box
      if (i < oldSystemBoxes.length - 1) {
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrow.setAttribute('x1', '250');
        arrow.setAttribute('y1', String(box.y + 80));
        arrow.setAttribute('x2', '250');
        arrow.setAttribute('y2', String(oldSystemBoxes[i + 1].y));
        arrow.setAttribute('stroke', box.color);
        arrow.setAttribute('stroke-width', '3');
        arrow.setAttribute('marker-end', 'url(#arrowhead-old)');
        beforeG.appendChild(arrow);
      }
    });

    // Arrow marker for old system
    const markerOld = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerOld.setAttribute('id', 'arrowhead-old');
    markerOld.setAttribute('markerWidth', '10');
    markerOld.setAttribute('markerHeight', '10');
    markerOld.setAttribute('refX', '9');
    markerOld.setAttribute('refY', '3');
    markerOld.setAttribute('orient', 'auto');
    const polygonOld = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygonOld.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygonOld.setAttribute('fill', '#DC2626');
    markerOld.appendChild(polygonOld);
    defs.appendChild(markerOld);

    // TRANSFORMATION ARROW (Center)
    const transformG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(transformG);

    const transformArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    transformArrow.setAttribute('x1', '480');
    transformArrow.setAttribute('y1', '350');
    transformArrow.setAttribute('x2', '620');
    transformArrow.setAttribute('y2', '350');
    transformArrow.setAttribute('stroke', '#2563EB');
    transformArrow.setAttribute('stroke-width', '5');
    transformArrow.setAttribute('marker-end', 'url(#arrowhead-transform)');
    transformG.appendChild(transformArrow);

    // JusticeHub catalyst circle
    const hubCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hubCircle.setAttribute('cx', '550');
    hubCircle.setAttribute('cy', '350');
    hubCircle.setAttribute('r', '60');
    hubCircle.setAttribute('fill', '#2563EB');
    hubCircle.setAttribute('stroke', '#1E40AF');
    hubCircle.setAttribute('stroke-width', '3');
    transformG.appendChild(hubCircle);

    const hubText1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hubText1.setAttribute('x', '550');
    hubText1.setAttribute('y', '345');
    hubText1.setAttribute('text-anchor', 'middle');
    hubText1.setAttribute('font-size', '14');
    hubText1.setAttribute('font-weight', 'bold');
    hubText1.setAttribute('fill', 'white');
    hubText1.textContent = 'JusticeHub';
    transformG.appendChild(hubText1);

    const hubText2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hubText2.setAttribute('x', '550');
    hubText2.setAttribute('y', '365');
    hubText2.setAttribute('text-anchor', 'middle');
    hubText2.setAttribute('font-size', '12');
    hubText2.setAttribute('fill', 'white');
    hubText2.textContent = 'Transforms';
    transformG.appendChild(hubText2);

    // Platform stats below hub
    const stats = [
      '38+ Stories',
      '521 Programs',
      '450+ Organisations',
    ];

    stats.forEach((stat, i) => {
      const statText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      statText.setAttribute('x', '550');
      statText.setAttribute('y', String(430 + (i * 20)));
      statText.setAttribute('text-anchor', 'middle');
      statText.setAttribute('font-size', '11');
      statText.setAttribute('font-weight', '600');
      statText.setAttribute('fill', '#2563EB');
      statText.textContent = stat;
      transformG.appendChild(statText);
    });

    // AFTER SECTION (Right)
    const afterG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(afterG);

    // Title
    const afterTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    afterTitle.setAttribute('x', '900');
    afterTitle.setAttribute('y', '50');
    afterTitle.setAttribute('text-anchor', 'middle');
    afterTitle.setAttribute('font-size', '28');
    afterTitle.setAttribute('font-weight', 'bold');
    afterTitle.setAttribute('fill', '#059669');
    afterTitle.textContent = 'NEW SYSTEM';
    afterG.appendChild(afterTitle);

    const afterSubtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    afterSubtitle.setAttribute('x', '900');
    afterSubtitle.setAttribute('y', '80');
    afterSubtitle.setAttribute('text-anchor', 'middle');
    afterSubtitle.setAttribute('font-size', '14');
    afterSubtitle.setAttribute('fill', '#666');
    afterSubtitle.textContent = 'Healing, Connected, Evidence-Based';
    afterG.appendChild(afterSubtitle);

    // NEW SYSTEM flow boxes
    const newSystemBoxes = [
      { label: 'Young Person\nIdentified Early', y: 120, color: '#059669' },
      { label: 'Community\nHealing Response', y: 220, color: '#047857' },
      { label: 'Cultural\nConnection', y: 320, color: '#065F46' },
      { label: 'Family &\nCommunity\nEngaged', y: 420, color: '#064E3B' },
      { label: 'Healing\nBetter Outcomes', y: 520, color: '#059669' },
    ];

    newSystemBoxes.forEach((box, i) => {
      // Box
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '700');
      rect.setAttribute('y', String(box.y));
      rect.setAttribute('width', '400');
      rect.setAttribute('height', '80');
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', box.color);
      rect.setAttribute('opacity', '0.15');
      rect.setAttribute('stroke', box.color);
      rect.setAttribute('stroke-width', '3');
      afterG.appendChild(rect);

      // Text (multi-line support)
      const lines = box.label.split('\n');
      lines.forEach((line, lineIndex) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '900');
        text.setAttribute('y', String(box.y + 35 + (lineIndex * 20)));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', box.color);
        text.textContent = line;
        afterG.appendChild(text);
      });

      // Arrow to next box
      if (i < newSystemBoxes.length - 1) {
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrow.setAttribute('x1', '900');
        arrow.setAttribute('y1', String(box.y + 80));
        arrow.setAttribute('x2', '900');
        arrow.setAttribute('y2', String(newSystemBoxes[i + 1].y));
        arrow.setAttribute('stroke', box.color);
        arrow.setAttribute('stroke-width', '3');
        arrow.setAttribute('marker-end', 'url(#arrowhead-new)');
        afterG.appendChild(arrow);
      }
    });

    // Arrow marker for new system
    const markerNew = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerNew.setAttribute('id', 'arrowhead-new');
    markerNew.setAttribute('markerWidth', '10');
    markerNew.setAttribute('markerHeight', '10');
    markerNew.setAttribute('refX', '9');
    markerNew.setAttribute('refY', '3');
    markerNew.setAttribute('orient', 'auto');
    const polygonNew = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygonNew.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygonNew.setAttribute('fill', '#059669');
    markerNew.appendChild(polygonNew);
    defs.appendChild(markerNew);

    // Bottom impact statement
    const impactBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    impactBox.setAttribute('x', '200');
    impactBox.setAttribute('y', '630');
    impactBox.setAttribute('width', '800');
    impactBox.setAttribute('height', '50');
    impactBox.setAttribute('rx', '8');
    impactBox.setAttribute('fill', '#DBEAFE');
    impactBox.setAttribute('stroke', '#2563EB');
    impactBox.setAttribute('stroke-width', '2');
    g.appendChild(impactBox);

    const impactText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    impactText.setAttribute('x', '600');
    impactText.setAttribute('y', '660');
    impactText.setAttribute('text-anchor', 'middle');
    impactText.setAttribute('font-size', '16');
    impactText.setAttribute('font-weight', 'bold');
    impactText.setAttribute('fill', '#1E40AF');
    impactText.textContent = 'Community intelligence replaces punishment with healing, isolation with connection';
    g.appendChild(impactText);

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
