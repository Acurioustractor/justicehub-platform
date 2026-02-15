'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  date: string;
  avgSentiment: number;
  articleCount: number;
  sourceName: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

interface SentimentTimelineProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

interface ParsedDataPoint extends DataPoint {
  parsedDate: Date;
}

export default function SentimentTimeline({
  data,
  width = 800,
  height = 400,
}: SentimentTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates and sort - filter out items with null/undefined sourceName
    const parsedData: ParsedDataPoint[] = data
      .filter((d): d is DataPoint => Boolean(d?.sourceName))
      .map((d) => ({
        ...d,
        parsedDate: new Date(d.date),
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Early return if no valid data after filtering
    if (parsedData.length === 0) return;

    // Group by source
    const dataBySource = d3.group(parsedData, (d) => d.sourceName) as Map<string, ParsedDataPoint[]>;

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(parsedData, d => d.parsedDate) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([innerHeight, 0]);

    // Color scale for sources
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(Array.from(dataBySource.keys()))
      .range(['#27ae60', '#e57a28', '#3498db', '#9b59b6']);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 1);

    // Zero line (emphasized)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Line generator
    const line = d3
      .line<ParsedDataPoint>()
      .x((d) => xScale(d.parsedDate))
      .y((d) => yScale(d.avgSentiment))
      .curve(d3.curveMonotoneX);

    // Draw lines for each source
    dataBySource.forEach((sourceData, sourceName) => {
      const linePath = g
        .append('path')
        .datum(sourceData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(sourceName))
        .attr('stroke-width', 3)
        .attr('d', line)
        .attr('opacity', 0.8);

      // Animate line drawing
      const totalLength = (linePath.node() as SVGPathElement).getTotalLength();
      linePath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

      // Add glow effect
      g.insert('path', ':first-child')
        .datum(sourceData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(sourceName))
        .attr('stroke-width', 8)
        .attr('d', line)
        .attr('opacity', 0.2)
        .attr('filter', 'blur(4px)');
    });

    // Add points for interactivity
    parsedData.forEach((d, i) => {
      g.append('circle')
        .attr('cx', xScale(d.parsedDate))
        .attr('cy', yScale(d.avgSentiment))
        .attr('r', 0)
        .attr('fill', colorScale(d.sourceName))
        .attr('stroke', '#0a0f16')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .transition()
        .delay(i * 50)
        .duration(300)
        .attr('r', 6)
        .on('end', function (this: SVGCircleElement) {
          // Add hover listeners after animation
          d3.select(this)
            .on('mouseenter', function (this: SVGCircleElement, event: MouseEvent) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 10);

              setHoveredPoint(d);
              setMousePos({ x: event.pageX, y: event.pageY });
            })
            .on('mouseleave', function (this: SVGCircleElement) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 6);

              setHoveredPoint(null);
            });
        });
    });

    // X Axis
    const formatDate = d3.timeFormat('%b %d');
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((value) => formatDate(value instanceof Date ? value : new Date(value.valueOf())));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', 'rgba(255, 255, 255, 0.6)')
      .selectAll('text')
      .attr('font-size', '12px');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .call(yAxis)
      .attr('color', 'rgba(255, 255, 255, 0.6)')
      .selectAll('text')
      .attr('font-size', '12px');

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.8)')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .text('Sentiment Score');

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);

    // Filter out any null/undefined sources and create legend
    const validSources = Array.from(dataBySource.keys()).filter((source) => source.length > 0);

    validSources.forEach((source: string, i) => {
      const legendItem = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendItem
        .append('circle')
        .attr('r', 5)
        .attr('fill', colorScale(source));

      legendItem
        .append('text')
        .attr('x', 12)
        .attr('y', 4)
        .attr('fill', 'rgba(255, 255, 255, 0.8)')
        .attr('font-size', '12px')
        .text(source.length > 20 ? source.substring(0, 17) + '...' : source);
    });

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '18px')
      .attr('font-weight', '700')
      .text('Media Sentiment Over Time');

  }, [data, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" />

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 10,
          }}
        >
          <div className="bg-[rgba(10,16,24,0.95)] backdrop-blur-xl rounded-lg p-4 border border-white/20 shadow-[0_24px_55px_rgba(7,11,18,0.6)] max-w-xs">
            <div className="text-xs text-white/60 mb-1">
              {new Date(hoveredPoint.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>

            <div className="font-semibold text-white mb-2">
              {hoveredPoint.sourceName}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Sentiment:</span>
                <span
                  className={`font-bold ${
                    hoveredPoint.avgSentiment > 0
                      ? 'text-[#27ae60]'
                      : hoveredPoint.avgSentiment < 0
                      ? 'text-red-400'
                      : 'text-white/60'
                  }`}
                >
                  {hoveredPoint.avgSentiment.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70">Articles:</span>
                <span className="font-semibold text-white">
                  {hoveredPoint.articleCount}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-400">Positive:</span>
                  <span className="text-white">{hoveredPoint.positiveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Negative:</span>
                  <span className="text-white">{hoveredPoint.negativeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Neutral:</span>
                  <span className="text-white">{hoveredPoint.neutralCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
