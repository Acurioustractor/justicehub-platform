'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface TopicData {
  topic: string;
  count: number;
  avgSentiment: number;
}

interface TopicBurstProps {
  data: TopicData[];
  width?: number;
  height?: number;
}

export default function TopicBurst({
  data,
  width = 800,
  height = 600,
}: TopicBurstProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredTopic, setHoveredTopic] = useState<TopicData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create nodes with size based on count
    const maxCount = d3.max(data, d => d.count) || 1;
    const minRadius = 20;
    const maxRadius = 80;

    const sizeScale = d3
      .scaleSqrt()
      .domain([0, maxCount])
      .range([minRadius, maxRadius]);

    // Color scale based on sentiment
    const colorScale = d3
      .scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(['#e74c3c', '#95a5a6', '#27ae60']);

    const nodes = data.map(d => ({
      ...d,
      radius: sizeScale(d.count),
      x: Math.random() * width,
      y: Math.random() * height,
    }));

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => d.radius + 4)
      )
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    // Create groups for each bubble
    const bubbleGroups = svg
      .selectAll('g.bubble')
      .data(nodes)
      .join('g')
      .attr('class', 'bubble')
      .style('cursor', 'pointer');

    // Add glow circles (behind main circles)
    bubbleGroups
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => colorScale(d.avgSentiment))
      .attr('opacity', 0.2)
      .attr('filter', 'blur(8px)');

    // Add main circles
    const circles = bubbleGroups
      .append('circle')
      .attr('r', 0)
      .attr('fill', d => colorScale(d.avgSentiment))
      .attr('stroke', '#0a0f16')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Animate bubble entrance
    circles
      .transition()
      .delay((d, i) => i * 50)
      .duration(800)
      .ease(d3.easeElasticOut)
      .attr('r', d => d.radius);

    // Add text labels
    const labels = bubbleGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', 'white')
      .attr('font-weight', '600')
      .attr('font-size', d => Math.min(d.radius / 3, 16))
      .attr('opacity', 0)
      .text(d => {
        // Truncate long topic names
        const maxLen = Math.floor(d.radius / 5);
        return d.topic.length > maxLen ? d.topic.substring(0, maxLen) + '...' : d.topic;
      });

    // Add count labels
    const countLabels = bubbleGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('fill', 'white')
      .attr('opacity', 0)
      .attr('font-size', d => Math.min(d.radius / 4, 14))
      .text(d => `${d.count} mentions`);

    // Fade in labels after bubbles appear
    labels
      .transition()
      .delay((d, i) => i * 50 + 800)
      .duration(400)
      .attr('opacity', 1);

    countLabels
      .transition()
      .delay((d, i) => i * 50 + 800)
      .duration(400)
      .attr('opacity', 0.8);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      bubbleGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add hover interactions
    bubbleGroups
      .on('mouseenter', function(event, d) {
        const bubble = d3.select(this);

        // Grow bubble
        bubble
          .select('circle:not([filter])')
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.2)
          .attr('opacity', 1);

        // Pulse glow
        bubble
          .select('circle[filter]')
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.3)
          .attr('opacity', 0.4);

        setHoveredTopic(d);
        setMousePos({ x: event.pageX, y: event.pageY });
      })
      .on('mouseleave', function(event, d) {
        const bubble = d3.select(this);

        // Shrink bubble back
        bubble
          .select('circle:not([filter])')
          .transition()
          .duration(200)
          .attr('r', d.radius)
          .attr('opacity', 0.9);

        bubble
          .select('circle[filter]')
          .transition()
          .duration(200)
          .attr('r', d.radius)
          .attr('opacity', 0.2);

        setHoveredTopic(null);
      });

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '18px')
      .attr('font-weight', '700')
      .text('Trending Topics');

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(20, ${height - 80})`);

    legend
      .append('text')
      .attr('fill', 'rgba(255, 255, 255, 0.8)')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Sentiment:');

    const legendScale = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([0, 200]);

    const legendGradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'sentiment-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    legendGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#e74c3c');

    legendGradient
      .append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#95a5a6');

    legendGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#27ae60');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 10)
      .attr('width', 200)
      .attr('height', 10)
      .attr('fill', 'url(#sentiment-gradient)')
      .attr('rx', 2);

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', 35)
      .attr('fill', 'rgba(255, 255, 255, 0.6)')
      .attr('font-size', '10px')
      .text('Negative');

    legend
      .append('text')
      .attr('x', 200)
      .attr('y', 35)
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255, 255, 255, 0.6)')
      .attr('font-size', '10px')
      .text('Positive');

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" />

      {/* Tooltip */}
      {hoveredTopic && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 10,
          }}
        >
          <div className="bg-[rgba(10,16,24,0.95)] backdrop-blur-xl rounded-lg p-4 border border-white/20 shadow-[0_24px_55px_rgba(7,11,18,0.6)] max-w-xs">
            <div className="font-semibold text-lg text-white mb-2">
              {hoveredTopic.topic}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Mentions:</span>
                <span className="font-bold text-white">{hoveredTopic.count}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70">Avg Sentiment:</span>
                <span
                  className={`font-bold ${
                    hoveredTopic.avgSentiment > 0
                      ? 'text-[#27ae60]'
                      : hoveredTopic.avgSentiment < 0
                      ? 'text-red-400'
                      : 'text-white/60'
                  }`}
                >
                  {hoveredTopic.avgSentiment.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs text-white/60">
                {hoveredTopic.avgSentiment > 0.3
                  ? '✅ Strongly positive coverage'
                  : hoveredTopic.avgSentiment > 0
                  ? '➕ Positive coverage'
                  : hoveredTopic.avgSentiment < -0.3
                  ? '❌ Strongly negative coverage'
                  : hoveredTopic.avgSentiment < 0
                  ? '➖ Negative coverage'
                  : '➖ Neutral coverage'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
