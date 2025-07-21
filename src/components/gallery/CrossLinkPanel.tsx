/**
 * Cross-Link Panel Component
 * 
 * Displays related content and connections for gallery items
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Link as LinkIcon,
  ArrowUpRight,
  Users,
  Building2,
  FileText,
  Play,
  Camera,
  Mic,
  Calendar,
  MapPin,
  TrendingUp,
  Heart,
  Eye,
  Share2,
  Sparkles,
  Network,
  Target,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { 
  GalleryItem, 
  RelatedItem, 
  ContentConnection, 
  RelationshipType,
  ContentType,
  SourceType 
} from '@/types/gallery';

interface CrossLinkPanelProps {
  item: GalleryItem;
  maxRelatedItems?: number;
  showConnectionDetails?: boolean;
  onItemClick?: (itemId: string, sourceType: SourceType) => void;
  className?: string;
}

export function CrossLinkPanel({
  item,
  maxRelatedItems = 6,
  showConnectionDetails = true,
  onItemClick,
  className = ''
}: CrossLinkPanelProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>(item.related_items || []);
  const [connections, setConnections] = useState<ContentConnection[]>(item.connections || []);
  const [loading, setLoading] = useState(false);
  const [expandedConnections, setExpandedConnections] = useState(false);

  useEffect(() => {
    if (item.related_items.length === 0) {
      fetchRelatedContent();
    }
  }, [item.id]);

  const fetchRelatedContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gallery/${item.id}/related`);
      
      if (response.ok) {
        const data = await response.json();
        setRelatedItems(data.related_items || []);
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to fetch related content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (contentType: ContentType) => {
    switch (contentType) {
      case ContentType.VIDEO:
        return <Play className="h-4 w-4" />;
      case ContentType.IMAGE:
        return <Camera className="h-4 w-4" />;
      case ContentType.AUDIO:
        return <Mic className="h-4 w-4" />;
      case ContentType.STORY:
        return <FileText className="h-4 w-4" />;
      case ContentType.SERVICE:
        return <Building2 className="h-4 w-4" />;
      case ContentType.PERSON:
        return <Users className="h-4 w-4" />;
      case ContentType.EVENT:
        return <Calendar className="h-4 w-4" />;
      case ContentType.LOCATION:
        return <MapPin className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRelationshipIcon = (relationshipType: RelationshipType) => {
    switch (relationshipType) {
      case 'similar_content' as RelationshipType:
        return <Target className="h-3 w-3" />;
      case 'same_author' as RelationshipType:
        return <Users className="h-3 w-3" />;
      case 'same_organization' as RelationshipType:
        return <Building2 className="h-3 w-3" />;
      case 'location_based' as RelationshipType:
        return <MapPin className="h-3 w-3" />;
      case 'service_related' as RelationshipType:
        return <Network className="h-3 w-3" />;
      case 'inspirational' as RelationshipType:
        return <Sparkles className="h-3 w-3" />;
      case 'educational' as RelationshipType:
        return <FileText className="h-3 w-3" />;
      default:
        return <LinkIcon className="h-3 w-3" />;
    }
  };

  const getRelationshipColor = (relationshipType: RelationshipType) => {
    switch (relationshipType) {
      case 'similar_content' as RelationshipType:
        return 'text-blue-600';
      case 'same_author' as RelationshipType:
        return 'text-green-600';
      case 'same_organization' as RelationshipType:
        return 'text-purple-600';
      case 'location_based' as RelationshipType:
        return 'text-orange-600';
      case 'service_related' as RelationshipType:
        return 'text-red-600';
      case 'inspirational' as RelationshipType:
        return 'text-yellow-600';
      case 'educational' as RelationshipType:
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRelationshipLabel = (relationshipType: RelationshipType) => {
    return String(relationshipType).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'bg-green-500';
    if (strength >= 0.6) return 'bg-yellow-500';
    if (strength >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleItemClick = (relatedItem: RelatedItem) => {
    onItemClick?.(relatedItem.id, relatedItem.source_type);
    
    // Track cross-link click
    trackCrossLinkClick(item.id, relatedItem.id);
  };

  const trackCrossLinkClick = async (fromId: string, toId: string) => {
    try {
      await fetch('/api/gallery/crosslink-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: fromId, to_id: toId })
      });
    } catch (error) {
      console.error('Failed to track cross-link click:', error);
    }
  };

  const sortedRelatedItems = relatedItems
    .sort((a, b) => b.relationship_strength - a.relationship_strength)
    .slice(0, maxRelatedItems);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Related Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded p-3 h-16"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sortedRelatedItems.length === 0 && connections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Related Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No related content found</p>
            <p className="text-xs">Check back as our AI discovers more connections</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Related Content
          </div>
          <Badge variant="outline" className="text-xs">
            {sortedRelatedItems.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* High-Strength Relationships */}
        {sortedRelatedItems.filter(item => item.relationship_strength >= 0.8).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Zap className="h-4 w-4" />
              Strongly Related
            </div>
            {sortedRelatedItems
              .filter(item => item.relationship_strength >= 0.8)
              .map((relatedItem) => (
                <div
                  key={relatedItem.id}
                  onClick={() => handleItemClick(relatedItem)}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer group"
                >
                  <div className="flex-shrink-0">
                    {relatedItem.thumbnail_url ? (
                      <div className="w-12 h-12 relative rounded overflow-hidden">
                        <Image
                          src={relatedItem.thumbnail_url}
                          alt={relatedItem.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        {getContentTypeIcon(relatedItem.content_type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {relatedItem.title}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`flex items-center gap-1 ${getRelationshipColor(relatedItem.relationship_type)}`}>
                        {getRelationshipIcon(relatedItem.relationship_type)}
                        <span>{getRelationshipLabel(relatedItem.relationship_type)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStrengthColor(relatedItem.relationship_strength)}`}></div>
                        <span>{Math.round(relatedItem.relationship_strength * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Medium-Strength Relationships */}
        {sortedRelatedItems.filter(item => item.relationship_strength >= 0.6 && item.relationship_strength < 0.8).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-700">
              <Target className="h-4 w-4" />
              Related
            </div>
            {sortedRelatedItems
              .filter(item => item.relationship_strength >= 0.6 && item.relationship_strength < 0.8)
              .map((relatedItem) => (
                <div
                  key={relatedItem.id}
                  onClick={() => handleItemClick(relatedItem)}
                  className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer group"
                >
                  <div className="flex-shrink-0">
                    {relatedItem.thumbnail_url ? (
                      <div className="w-10 h-10 relative rounded overflow-hidden">
                        <Image
                          src={relatedItem.thumbnail_url}
                          alt={relatedItem.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        {getContentTypeIcon(relatedItem.content_type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {relatedItem.title}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`flex items-center gap-1 ${getRelationshipColor(relatedItem.relationship_type)}`}>
                        {getRelationshipIcon(relatedItem.relationship_type)}
                        <span>{getRelationshipLabel(relatedItem.relationship_type)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStrengthColor(relatedItem.relationship_strength)}`}></div>
                        <span>{Math.round(relatedItem.relationship_strength * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Weaker Relationships */}
        {sortedRelatedItems.filter(item => item.relationship_strength < 0.6).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <LinkIcon className="h-4 w-4" />
              Also Related
            </div>
            {sortedRelatedItems
              .filter(item => item.relationship_strength < 0.6)
              .slice(0, 3)
              .map((relatedItem) => (
                <div
                  key={relatedItem.id}
                  onClick={() => handleItemClick(relatedItem)}
                  className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex-shrink-0">
                    {getContentTypeIcon(relatedItem.content_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 truncate">
                        {relatedItem.title}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${getStrengthColor(relatedItem.relationship_strength)}`}></div>
                    <span>{Math.round(relatedItem.relationship_strength * 100)}%</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Connection Details */}
        {showConnectionDetails && connections.length > 0 && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedConnections(!expandedConnections)}
              className="text-xs text-gray-600 p-0 h-auto"
            >
              <Network className="h-3 w-3 mr-1" />
              {expandedConnections ? 'Hide' : 'Show'} Connection Details
            </Button>
            
            {expandedConnections && (
              <div className="mt-3 space-y-2">
                {connections.slice(0, 5).map((connection, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{connection.connection_type.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">{Math.round(connection.connection_strength * 100)}%</span>
                    </div>
                    {connection.connection_reason.length > 0 && (
                      <div className="text-gray-500">
                        {connection.connection_reason.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Discovery Notice */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="h-3 w-3" />
            <span>Connections discovered by AI • Updated daily</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}