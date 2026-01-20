'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Globe,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';

// Research item type
interface ResearchItem {
  id: string;
  title: string;
  authors: string[];
  organization: string;
  year: number;
  category: 'trauma-informed' | 'indigenous-diversion' | 'family-engagement' | 'restorative-justice' | 'youth-rights' | 'recidivism' | 'mental-health';
  jurisdiction: 'Australia' | 'Queensland' | 'New Zealand' | 'Scotland' | 'International' | 'Nordic';
  type: 'research-paper' | 'systematic-review' | 'meta-analysis' | 'policy-brief' | 'case-study' | 'video' | 'report';
  summary: string;
  keyFindings: string[];
  pdfUrl?: string;
  externalUrl?: string;
  videoUrl?: string;
  tags: string[];
  featured?: boolean;
}

interface ResearchLibraryProps {
  initialItems: ResearchItem[];
}

const CATEGORIES = [
  { id: 'all', label: 'All Research' },
  { id: 'trauma-informed', label: 'Trauma-Informed Practice' },
  { id: 'indigenous-diversion', label: 'Indigenous-Led Diversion' },
  { id: 'family-engagement', label: 'Family Engagement' },
  { id: 'restorative-justice', label: 'Restorative Justice' },
  { id: 'youth-rights', label: 'Youth Rights & Lived Experience' },
  { id: 'recidivism', label: 'Recidivism' },
  { id: 'mental-health', label: 'Mental Health' }
];

const JURISDICTIONS = [
  { id: 'all', label: 'All Jurisdictions' },
  { id: 'Australia', label: 'Australia' },
  { id: 'Queensland', label: 'Queensland' },
  { id: 'New Zealand', label: 'New Zealand' },
  { id: 'Scotland', label: 'Scotland' },
  { id: 'International', label: 'International' }
];

const TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'research-paper', label: 'Research Papers' },
  { id: 'systematic-review', label: 'Systematic Reviews' },
  { id: 'meta-analysis', label: 'Meta-Analyses' },
  { id: 'case-study', label: 'Case Studies' },
  { id: 'policy-brief', label: 'Policy Briefs' },
  { id: 'report', label: 'Reports' }
];

export default function ResearchLibrary({ initialItems }: ResearchLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year');

  // Calculate counts for categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialItems.length };
    initialItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [initialItems]);

  // Filter and search logic
  const filteredResearch = useMemo(() => {
    let results = initialItems;

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter(r => r.category === selectedCategory);
    }

    // Jurisdiction filter
    if (selectedJurisdiction !== 'all') {
      results = results.filter(r => r.jurisdiction === selectedJurisdiction);
    }

    // Type filter
    if (selectedType !== 'all') {
      results = results.filter(r => r.type === selectedType);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.summary.toLowerCase().includes(query) ||
        r.organization.toLowerCase().includes(query) ||
        r.authors.some(a => a.toLowerCase().includes(query)) ||
        r.tags.some(t => t.toLowerCase().includes(query)) ||
        r.keyFindings.some(f => f.toLowerCase().includes(query))
      );
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'year') return b.year - a.year;
      return a.title.localeCompare(b.title);
    });

    return results;
  }, [initialItems, searchQuery, selectedCategory, selectedJurisdiction, selectedType, sortBy]);

  const featuredResearch = initialItems.filter(r => r.featured);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'research-paper': return <FileText className="h-5 w-5" />;
      case 'systematic-review': return <BookOpen className="h-5 w-5" />;
      case 'meta-analysis': return <TrendingUp className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'case-study': return <Users className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedJurisdiction('all');
    setSelectedType('all');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedJurisdiction !== 'all' || selectedType !== 'all' || searchQuery;

  return (
    <>
      {/* Featured Research */}
      {!hasActiveFilters && (
        <section className="section-padding border-b-2 border-black bg-yellow-50">
          <div className="container-justice">
            <div className="flex items-center gap-3 mb-8">
              <Award className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Featured Research</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredResearch.slice(0, 4).map((item) => (
                <div key={item.id} className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      {getTypeIcon(item.type)}
                      <span className="font-bold">{getTypeLabel(item.type)}</span>
                    </div>
                    <span className="px-3 py-1 bg-yellow-400 text-xs font-bold">{item.year}</span>
                  </div>

                  <h3 className="text-xl font-bold mb-3 leading-tight">{item.title}</h3>

                  <div className="text-sm text-gray-600 mb-3">
                    <div className="font-medium">{item.authors.join(', ')}</div>
                    <div>{item.organization}</div>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">{item.summary}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">{item.jurisdiction}</span>
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {item.externalUrl && (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold hover:underline inline-flex items-center gap-1"
                      >
                        View Research <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {item.pdfUrl && (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold hover:underline inline-flex items-center gap-1"
                      >
                        Download PDF <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="section-padding border-b-2 border-black bg-gray-50">
        <div className="container-justice">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Filter Research</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-bold mb-2">Research Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({categoryCounts[cat.id] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Jurisdiction Filter */}
            <div>
              <label className="block text-sm font-bold mb-2">Jurisdiction</label>
              <select
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {JURISDICTIONS.map(jur => (
                  <option key={jur.id} value={jur.id}>{jur.label}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-bold mb-2">Research Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-bold mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'year' | 'title')}
                className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="year">Year (Newest First)</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-6 p-4 bg-white border-2 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Active filters:</span>
                  {searchQuery && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium">
                      Search: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium">
                      {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                    </span>
                  )}
                  {selectedJurisdiction !== 'all' && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium">
                      {selectedJurisdiction}
                    </span>
                  )}
                  {selectedType !== 'all' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium">
                      {TYPES.find(t => t.id === selectedType)?.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="section-padding">
        <div className="container-justice">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {filteredResearch.length} {filteredResearch.length === 1 ? 'Result' : 'Results'}
            </h2>
          </div>

          {filteredResearch.length === 0 ? (
            <div className="text-center py-16 border-2 border-black p-12 bg-gray-50">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-2xl font-bold mb-2">No research found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResearch.map((item) => (
                <div key={item.id} className="border-2 border-black p-6 bg-white hover:shadow-brutal transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          {getTypeIcon(item.type)}
                          <span className="font-bold">{getTypeLabel(item.type)}</span>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-xs font-bold">{item.year}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold">{item.jurisdiction}</span>
                      </div>

                      <h3 className="text-2xl font-bold mb-2 leading-tight">{item.title}</h3>

                      <div className="text-sm text-gray-600 mb-4">
                        <div className="font-medium">{item.authors.join(', ')}</div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {item.organization}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">{item.summary}</p>

                  <div className="mb-4">
                    <h4 className="font-bold mb-2">Key Findings:</h4>
                    <ul className="space-y-1">
                      {item.keyFindings.map((finding, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium border border-gray-300">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                    {item.externalUrl && (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Full Research
                      </a>
                    )}
                    {item.pdfUrl && (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    )}
                    {item.videoUrl && (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all inline-flex items-center gap-2"
                      >
                        <Video className="h-4 w-4" />
                        Watch Video
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
