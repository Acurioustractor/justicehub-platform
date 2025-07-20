'use client';

import { FilteredStoryFeed } from '@/components/stories/FilteredStoryFeed';
import { QuickSearch } from '@/components/search/QuickSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Filter,
  Search,
  Compass,
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function BrowseStoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Compass className="h-7 w-7" />
                Browse Stories
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Explore stories with advanced filtering and search
              </p>
            </div>
            <div className="flex items-center gap-4">
              <QuickSearch placeholder="Quick search..." />
              <Link href="/stories/new">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Share Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Advanced Filters</h3>
                  <p className="text-sm text-gray-600">
                    Filter by source, type, visibility, tags, and more
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Search className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Smart Search</h3>
                  <p className="text-sm text-gray-600">
                    Find stories with intelligent search across all content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Unified Feed</h3>
                  <p className="text-sm text-gray-600">
                    Local and Airtable stories in one seamless experience
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Filter Presets */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Quick filters:
              </span>
              <div className="flex gap-2">
                <Link href="/stories/browse?preset=trending">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Button>
                </Link>
                <Link href="/stories/browse?preset=recent">
                  <Button variant="outline" size="sm">
                    Recent
                  </Button>
                </Link>
                <Link href="/stories/browse?preset=milestones">
                  <Button variant="outline" size="sm">
                    Milestones
                  </Button>
                </Link>
                <Link href="/stories/browse?preset=challenges">
                  <Button variant="outline" size="sm">
                    Challenges
                  </Button>
                </Link>
                <Link href="/stories/browse?preset=achievements">
                  <Button variant="outline" size="sm">
                    Achievements
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtered Story Feed */}
        <FilteredStoryFeed
          initialFilters={{
            source: 'all',
            published: true
          }}
        />
      </div>
    </div>
  );
}