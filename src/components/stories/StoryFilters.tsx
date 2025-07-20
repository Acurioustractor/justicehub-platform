'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Filter,
  X,
  Database,
  Cloud,
  FileText,
  Tag,
  Calendar,
  Users,
  Globe,
  Lock,
  Eye,
  RotateCcw
} from 'lucide-react';

export interface FilterState {
  source: 'all' | 'local' | 'airtable';
  storyTypes: string[];
  visibility: string[];
  tags: string[];
  dateRange: {
    enabled: boolean;
    start?: Date;
    end?: Date;
    preset?: 'today' | 'week' | 'month' | 'year';
  };
  published?: boolean;
  hasMedia?: boolean;
  minWords?: number;
}

interface StoryFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableTags?: string[];
  showAdvanced?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const storyTypes = [
  { value: 'reflection', label: 'Reflection', icon: '💭' },
  { value: 'milestone', label: 'Milestone', icon: '🏆' },
  { value: 'challenge', label: 'Challenge', icon: '🎯' },
  { value: 'achievement', label: 'Achievement', icon: '⭐' },
  { value: 'goal', label: 'Goal', icon: '🎯' },
  { value: 'update', label: 'Update', icon: '📝' }
];

const visibilityOptions = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'organization', label: 'Organization', icon: Users },
  { value: 'mentors', label: 'Mentors Only', icon: Users },
  { value: 'private', label: 'Private', icon: Lock },
  { value: 'anonymous', label: 'Anonymous', icon: Eye }
];

export function StoryFilters({
  filters,
  onChange,
  availableTags = [],
  showAdvanced = true,
  orientation = 'vertical',
  className = ''
}: StoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTagInput, setSelectedTagInput] = useState('');

  // Count active filters
  const activeFilterCount = [
    filters.source !== 'all' ? 1 : 0,
    filters.storyTypes.length,
    filters.visibility.length,
    filters.tags.length,
    filters.dateRange.enabled ? 1 : 0,
    filters.published !== undefined ? 1 : 0,
    filters.hasMedia !== undefined ? 1 : 0,
    filters.minWords ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (
    key: 'storyTypes' | 'visibility' | 'tags',
    value: string
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const clearFilters = () => {
    onChange({
      source: 'all',
      storyTypes: [],
      visibility: [],
      tags: [],
      dateRange: { enabled: false },
      published: undefined,
      hasMedia: undefined,
      minWords: undefined
    });
  };

  const applyDatePreset = (preset: string) => {
    const now = new Date();
    let start = new Date();
    
    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    updateFilter('dateRange', {
      enabled: true,
      start,
      end: now,
      preset: preset as any
    });
  };

  if (orientation === 'horizontal') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Source Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Source:</Label>
              <RadioGroup
                value={filters.source}
                onValueChange={(value) => updateFilter('source', value as any)}
                className="flex gap-2"
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="all" id="source-all" />
                  <Label htmlFor="source-all" className="text-sm cursor-pointer">
                    All
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="local" id="source-local" />
                  <Label htmlFor="source-local" className="text-sm cursor-pointer">
                    <Database className="h-3 w-3 inline mr-1" />
                    Local
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="airtable" id="source-airtable" />
                  <Label htmlFor="source-airtable" className="text-sm cursor-pointer">
                    <Cloud className="h-3 w-3 inline mr-1" />
                    Airtable
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Story Types */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Type:</Label>
              <div className="flex gap-1">
                {storyTypes.map(type => (
                  <Badge
                    key={type.value}
                    variant={filters.storyTypes.includes(type.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('storyTypes', type.value)}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear ({activeFilterCount})
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vertical layout
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Source Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Source</Label>
          <RadioGroup
            value={filters.source}
            onValueChange={(value) => updateFilter('source', value as any)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="source-all" />
                <Label htmlFor="source-all" className="text-sm cursor-pointer">
                  All Sources
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="source-local" />
                <Label htmlFor="source-local" className="text-sm cursor-pointer">
                  <Database className="h-3 w-3 inline mr-2" />
                  Local Stories
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="airtable" id="source-airtable" />
                <Label htmlFor="source-airtable" className="text-sm cursor-pointer">
                  <Cloud className="h-3 w-3 inline mr-2" />
                  Airtable Stories
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Story Types */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Story Type</Label>
          <div className="space-y-2">
            {storyTypes.map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.storyTypes.includes(type.value)}
                  onCheckedChange={() => toggleArrayFilter('storyTypes', type.value)}
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className="text-sm cursor-pointer flex items-center"
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Visibility */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Visibility</Label>
          <div className="space-y-2">
            {visibilityOptions.map(option => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`visibility-${option.value}`}
                    checked={filters.visibility.includes(option.value)}
                    onCheckedChange={() => toggleArrayFilter('visibility', option.value)}
                  />
                  <Label
                    htmlFor={`visibility-${option.value}`}
                    className="text-sm cursor-pointer flex items-center"
                  >
                    <Icon className="h-3 w-3 mr-2" />
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium mb-3 block">Tags</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableTags.slice(0, 10).map(tag => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags.includes(tag)}
                      onCheckedChange={() => toggleArrayFilter('tags', tag)}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Separator />
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full justify-between"
              >
                Advanced Filters
                <span className="text-xs">{isExpanded ? '−' : '+'}</span>
              </Button>
              
              {isExpanded && (
                <div className="space-y-4 mt-4">
                  {/* Date Range */}
                  <div>
                    <Label className="text-sm mb-2 block">Date Range</Label>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => applyDatePreset('today')}
                      >
                        <Calendar className="h-3 w-3 mr-2" />
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => applyDatePreset('week')}
                      >
                        <Calendar className="h-3 w-3 mr-2" />
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => applyDatePreset('month')}
                      >
                        <Calendar className="h-3 w-3 mr-2" />
                        Last month
                      </Button>
                    </div>
                  </div>

                  {/* Published Status */}
                  <div>
                    <Label className="text-sm mb-2 block">Status</Label>
                    <RadioGroup
                      value={filters.published === true ? 'published' : filters.published === false ? 'draft' : 'all'}
                      onValueChange={(value) => {
                        updateFilter('published', value === 'all' ? undefined : value === 'published');
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="status-all" />
                          <Label htmlFor="status-all" className="text-sm cursor-pointer">
                            All
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="published" id="status-published" />
                          <Label htmlFor="status-published" className="text-sm cursor-pointer">
                            Published only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="draft" id="status-draft" />
                          <Label htmlFor="status-draft" className="text-sm cursor-pointer">
                            Drafts only
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Media Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-media"
                      checked={filters.hasMedia === true}
                      onCheckedChange={(checked) => {
                        updateFilter('hasMedia', checked ? true : undefined);
                      }}
                    />
                    <Label htmlFor="has-media" className="text-sm cursor-pointer">
                      Has images or videos
                    </Label>
                  </div>

                  {/* Minimum Words */}
                  <div>
                    <Label className="text-sm mb-2 block">
                      Minimum words: {filters.minWords || 0}
                    </Label>
                    <Slider
                      value={[filters.minWords || 0]}
                      onValueChange={([value]) => updateFilter('minWords', value || undefined)}
                      max={1000}
                      step={50}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}