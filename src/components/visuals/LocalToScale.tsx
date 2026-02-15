'use client';

import React, { useEffect, useRef } from 'react';

interface LocalToScaleProps {
  width?: number;
  height?: number;
}

export function LocalToScale({ width = 1200, height = 600 }: LocalToScaleProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // Define arrowhead markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker1.setAttribute('id', 'arrowhead-flow-1');
    marker1.setAttribute('markerWidth', '10');
    marker1.setAttribute('markerHeight', '10');
    marker1.setAttribute('refX', '9');
    marker1.setAttribute('refY', '3');
    marker1.setAttribute('orient', 'auto');
    const polygon1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon1.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon1.setAttribute('fill', '#2563EB');
    marker1.appendChild(polygon1);
    defs.appendChild(marker1);

    const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker2.setAttribute('id', 'arrowhead-flow-2');
    marker2.setAttribute('markerWidth', '10');
    marker2.setAttribute('markerHeight', '10');
    marker2.setAttribute('refX', '9');
    marker2.setAttribute('refY', '3');
    marker2.setAttribute('orient', 'auto');
    const polygon2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon2.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon2.setAttribute('fill', '#059669');
    marker2.appendChild(polygon2);
    defs.appendChild(marker2);

    svg.insertBefore(defs, g);

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '600');
    title.setAttribute('y', '40');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '28');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#1F2937');
    title.textContent = 'How Community Intelligence Scales';
    g.appendChild(title);

    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', '600');
    subtitle.setAttribute('y', '70');
    subtitle.setAttribute('text-anchor', 'middle');
    subtitle.setAttribute('font-size', '14');
    subtitle.setAttribute('fill', '#6B7280');
    subtitle.textContent = 'From local practice to national impact';
    g.appendChild(subtitle);

    // STEP 1: LOCAL (Left)
    const step1G = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(step1G);

    // Step 1 Box
    const step1Box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    step1Box.setAttribute('x', '50');
    step1Box.setAttribute('y', '120');
    step1Box.setAttribute('width', '280');
    step1Box.setAttribute('height', '320');
    step1Box.setAttribute('rx', '12');
    step1Box.setAttribute('fill', '#FEF3C7');
    step1Box.setAttribute('stroke', '#F59E0B');
    step1Box.setAttribute('stroke-width', '3');
    step1G.appendChild(step1Box);

    // Step 1 Label
    const step1Label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    step1Label.setAttribute('x', '190');
    step1Label.setAttribute('y', '150');
    step1Label.setAttribute('text-anchor', 'middle');
    step1Label.setAttribute('font-size', '18');
    step1Label.setAttribute('font-weight', 'bold');
    step1Label.setAttribute('fill', '#D97706');
    step1Label.textContent = 'STEP 1: LOCAL';
    step1G.appendChild(step1Label);

    // Step 1 Content
    const step1Content = [
      { text: 'Elder in Alice Springs', y: 190, size: 15, bold: true },
      { text: 'shares healing practice', y: 210, size: 13, bold: false },
      { text: '', y: 230, size: 12, bold: false },
      { text: 'What works:', y: 260, size: 14, bold: true },
      { text: '• Cultural connection', y: 285, size: 12, bold: false },
      { text: '• Talking circles', y: 305, size: 12, bold: false },
      { text: '• Family involvement', y: 325, size: 12, bold: false },
      { text: '', y: 345, size: 12, bold: false },
      { text: 'Results:', y: 370, size: 14, bold: true },
      { text: '12 young people supported', y: 395, size: 12, bold: false },
      { text: '0 returned to detention', y: 415, size: 12, bold: false },
    ];

    step1Content.forEach(item => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', item.text.startsWith('•') ? '100' : '190');
      text.setAttribute('y', String(item.y));
      text.setAttribute('text-anchor', item.text.startsWith('•') ? 'start' : 'middle');
      text.setAttribute('font-size', String(item.size));
      if (item.bold) text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#92400E');
      text.textContent = item.text;
      step1G.appendChild(text);
    });

    // Arrow 1
    const arrow1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrow1.setAttribute('x1', '330');
    arrow1.setAttribute('y1', '280');
    arrow1.setAttribute('x2', '440');
    arrow1.setAttribute('y2', '280');
    arrow1.setAttribute('stroke', '#2563EB');
    arrow1.setAttribute('stroke-width', '4');
    arrow1.setAttribute('marker-end', 'url(#arrowhead-flow-1)');
    g.appendChild(arrow1);

    const arrow1Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    arrow1Text.setAttribute('x', '385');
    arrow1Text.setAttribute('y', '265');
    arrow1Text.setAttribute('text-anchor', 'middle');
    arrow1Text.setAttribute('font-size', '12');
    arrow1Text.setAttribute('font-weight', 'bold');
    arrow1Text.setAttribute('fill', '#2563EB');
    arrow1Text.textContent = 'Shared on';
    g.appendChild(arrow1Text);

    // STEP 2: PLATFORM (Center)
    const step2G = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(step2G);

    // Step 2 Box
    const step2Box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    step2Box.setAttribute('x', '440');
    step2Box.setAttribute('y', '120');
    step2Box.setAttribute('width', '320');
    step2Box.setAttribute('height', '320');
    step2Box.setAttribute('rx', '12');
    step2Box.setAttribute('fill', '#DBEAFE');
    step2Box.setAttribute('stroke', '#2563EB');
    step2Box.setAttribute('stroke-width', '3');
    step2G.appendChild(step2Box);

    // Step 2 Label
    const step2Label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    step2Label.setAttribute('x', '600');
    step2Label.setAttribute('y', '150');
    step2Label.setAttribute('text-anchor', 'middle');
    step2Label.setAttribute('font-size', '18');
    step2Label.setAttribute('font-weight', 'bold');
    step2Label.setAttribute('fill', '#1E40AF');
    step2Label.textContent = 'STEP 2: PLATFORM';
    step2G.appendChild(step2Label);

    // JusticeHub logo/icon
    const hubCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hubCircle.setAttribute('cx', '600');
    hubCircle.setAttribute('cy', '200');
    hubCircle.setAttribute('r', '30');
    hubCircle.setAttribute('fill', '#2563EB');
    hubCircle.setAttribute('stroke', '#1E40AF');
    hubCircle.setAttribute('stroke-width', '2');
    step2G.appendChild(hubCircle);

    const hubText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    hubText.setAttribute('x', '600');
    hubText.setAttribute('y', '207');
    hubText.setAttribute('text-anchor', 'middle');
    hubText.setAttribute('font-size', '12');
    hubText.setAttribute('font-weight', 'bold');
    hubText.setAttribute('fill', 'white');
    hubText.textContent = 'JH';
    step2G.appendChild(hubText);

    // Step 2 Content
    const step2Content = [
      { text: 'Knowledge Captured:', y: 250, size: 14, bold: true },
      { text: '✓ Story documented', y: 275, size: 12, bold: false },
      { text: '✓ Program tagged', y: 295, size: 12, bold: false },
      { text: '✓ Evidence recorded', y: 315, size: 12, bold: false },
      { text: '', y: 335, size: 12, bold: false },
      { text: 'Connections Made:', y: 360, size: 14, bold: true },
      { text: '→ Similar communities', y: 385, size: 12, bold: false },
      { text: '→ Interested practitioners', y: 405, size: 12, bold: false },
      { text: '→ Researchers & funders', y: 425, size: 12, bold: false },
    ];

    step2Content.forEach(item => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '600');
      text.setAttribute('y', String(item.y));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', String(item.size));
      if (item.bold) text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#1E40AF');
      text.textContent = item.text;
      step2G.appendChild(text);
    });

    // Arrow 2
    const arrow2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrow2.setAttribute('x1', '760');
    arrow2.setAttribute('y1', '280');
    arrow2.setAttribute('x2', '870');
    arrow2.setAttribute('y2', '280');
    arrow2.setAttribute('stroke', '#059669');
    arrow2.setAttribute('stroke-width', '4');
    arrow2.setAttribute('marker-end', 'url(#arrowhead-flow-2)');
    g.appendChild(arrow2);

    const arrow2Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    arrow2Text.setAttribute('x', '815');
    arrow2Text.setAttribute('y', '265');
    arrow2Text.setAttribute('text-anchor', 'middle');
    arrow2Text.setAttribute('font-size', '12');
    arrow2Text.setAttribute('font-weight', 'bold');
    arrow2Text.setAttribute('fill', '#059669');
    arrow2Text.textContent = 'Implemented by';
    g.appendChild(arrow2Text);

    // STEP 3: SCALE (Right)
    const step3G = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(step3G);

    // Step 3 Box
    const step3Box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    step3Box.setAttribute('x', '870');
    step3Box.setAttribute('y', '120');
    step3Box.setAttribute('width', '280');
    step3Box.setAttribute('height', '320');
    step3Box.setAttribute('rx', '12');
    step3Box.setAttribute('fill', '#D1FAE5');
    step3Box.setAttribute('stroke', '#059669');
    step3Box.setAttribute('stroke-width', '3');
    step3G.appendChild(step3Box);

    // Step 3 Label
    const step3Label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    step3Label.setAttribute('x', '1010');
    step3Label.setAttribute('y', '150');
    step3Label.setAttribute('text-anchor', 'middle');
    step3Label.setAttribute('font-size', '18');
    step3Label.setAttribute('font-weight', 'bold');
    step3Label.setAttribute('fill', '#047857');
    step3Label.textContent = 'STEP 3: SCALE';
    step3G.appendChild(step3Label);

    // Step 3 Content
    const step3Content = [
      { text: 'Practitioner in Sydney', y: 190, size: 15, bold: true },
      { text: 'implements same practice', y: 210, size: 13, bold: false },
      { text: '', y: 230, size: 12, bold: false },
      { text: 'Adaptation:', y: 260, size: 14, bold: true },
      { text: '• Same cultural core', y: 285, size: 12, bold: false },
      { text: '• Local community input', y: 305, size: 12, bold: false },
      { text: '• Evidence-based approach', y: 325, size: 12, bold: false },
      { text: '', y: 345, size: 12, bold: false },
      { text: 'National Impact:', y: 370, size: 14, bold: true },
      { text: 'Healing spreads', y: 395, size: 12, bold: false },
      { text: 'Young people benefit', y: 415, size: 12, bold: false },
    ];

    step3Content.forEach(item => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', item.text.startsWith('•') ? '920' : '1010');
      text.setAttribute('y', String(item.y));
      text.setAttribute('text-anchor', item.text.startsWith('•') ? 'start' : 'middle');
      text.setAttribute('font-size', String(item.size));
      if (item.bold) text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#065F46');
      text.textContent = item.text;
      step3G.appendChild(text);
    });

    // Bottom impact statement
    const impactBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    impactBox.setAttribute('x', '100');
    impactBox.setAttribute('y', '480');
    impactBox.setAttribute('width', '1000');
    impactBox.setAttribute('height', '80');
    impactBox.setAttribute('rx', '12');
    impactBox.setAttribute('fill', '#F3F4F6');
    impactBox.setAttribute('stroke', '#6B7280');
    impactBox.setAttribute('stroke-width', '2');
    g.appendChild(impactBox);

    const impactTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    impactTitle.setAttribute('x', '600');
    impactTitle.setAttribute('y', '505');
    impactTitle.setAttribute('text-anchor', 'middle');
    impactTitle.setAttribute('font-size', '16');
    impactTitle.setAttribute('font-weight', 'bold');
    impactTitle.setAttribute('fill', '#1F2937');
    impactTitle.textContent = 'The Multiplier Effect';
    g.appendChild(impactTitle);

    const impactText1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    impactText1.setAttribute('x', '600');
    impactText1.setAttribute('y', '530');
    impactText1.setAttribute('text-anchor', 'middle');
    impactText1.setAttribute('font-size', '13');
    impactText1.setAttribute('fill', '#4B5563');
    impactText1.textContent = 'One Elder in Alice Springs → Platform connection → Practitioners nationwide';
    g.appendChild(impactText1);

    const impactText2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    impactText2.setAttribute('x', '600');
    impactText2.setAttribute('y', '550');
    impactText2.setAttribute('text-anchor', 'middle');
    impactText2.setAttribute('font-size', '13');
    impactText2.setAttribute('fill', '#4B5563');
    impactText2.textContent = 'Local knowledge valued, communities compensated, young people everywhere benefit';
    g.appendChild(impactText2);

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
