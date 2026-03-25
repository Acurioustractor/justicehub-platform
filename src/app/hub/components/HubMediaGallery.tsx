'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon, Video, BookOpen, Loader2, ChevronRight,
  Play, Eye, Bell, BellOff, Check,
} from 'lucide-react';

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  photo_count: number;
  cover_photo_url: string | null;
}

interface MediaItem {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  tags: string[];
}

interface Story {
  id: string;
  title: string;
  summary: string | null;
  story_type: string | null;
  storyteller_name: string | null;
  cover_image_url: string | null;
}

interface HubMediaGalleryProps {
  accentColor: string; // e.g. 'blue-500', 'amber-500', 'pink-500'
  title?: string;
}

export function HubMediaGallery({ accentColor, title = 'Media & Stories' }: HubMediaGalleryProps) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'galleries' | 'photos' | 'stories'>('galleries');
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyConfirmed, setNotifyConfirmed] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<MediaItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/empathy-ledger/galleries').then(r => r.json()),
      fetch('/api/empathy-ledger/media?limit=12').then(r => r.json()),
      fetch('/api/empathy-ledger/stories?limit=6').then(r => r.json()),
    ])
      .then(([galData, mediaData, storyData]) => {
        setGalleries(galData.galleries || []);
        setRecentMedia(mediaData.media || []);
        setStories(storyData.stories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openGallery(galleryId: string) {
    setSelectedGallery(galleryId);
    setGalleryLoading(true);
    fetch(`/api/empathy-ledger/media?galleryId=${galleryId}&limit=50`)
      .then(r => r.json())
      .then(data => setGalleryPhotos(data.media || []))
      .catch(() => {})
      .finally(() => setGalleryLoading(false));
  }

  function toggleNotify() {
    setNotifyEnabled(!notifyEnabled);
    setNotifyConfirmed(true);
    setTimeout(() => setNotifyConfirmed(false), 3000);
  }

  const accentBg = `bg-${accentColor}/10`;
  const accentText = `text-${accentColor}`;
  const accentBorder = `border-${accentColor}/20`;

  if (loading) {
    return (
      <div className={`border ${accentBorder} ${accentBg} p-6`}>
        <div className="flex items-center gap-2 text-sm text-[#F5F0E8]/30">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading media...
        </div>
      </div>
    );
  }

  const totalPhotos = galleries.reduce((sum, g) => sum + g.photo_count, 0);
  const hasContent = galleries.length > 0 || recentMedia.length > 0 || stories.length > 0;

  if (!hasContent) return null;

  // If viewing a gallery's photos
  if (selectedGallery) {
    const gallery = galleries.find(g => g.id === selectedGallery);
    return (
      <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setSelectedGallery(null); setGalleryPhotos([]); }}
            className="font-mono text-xs text-[#F5F0E8]/40 hover:text-[#F5F0E8] uppercase tracking-wider"
          >
            ← Back to galleries
          </button>
          <h2 className="font-bold text-sm">{gallery?.title || 'Gallery'}</h2>
        </div>
        {galleryLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#F5F0E8]/30">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading photos...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {galleryPhotos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square bg-[#F5F0E8]/5 overflow-hidden border border-[#F5F0E8]/5 hover:border-[#F5F0E8]/20 transition-colors"
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-[#F5F0E8]/10 bg-[#F5F0E8]/[0.02] p-6">
      {/* Header with notify toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs text-[#F5F0E8]/40 uppercase tracking-wider">{title}</h2>
        <button
          onClick={toggleNotify}
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#F5F0E8]/30 hover:text-[#F5F0E8] transition-colors"
          title={notifyEnabled ? 'Notifications on' : 'Get notified of new content'}
        >
          {notifyConfirmed ? (
            <><Check className="w-3 h-3 text-[#059669]" /> {notifyEnabled ? 'Subscribed' : 'Unsubscribed'}</>
          ) : notifyEnabled ? (
            <><Bell className="w-3 h-3 text-[#059669]" /> Notify me</>
          ) : (
            <><BellOff className="w-3 h-3" /> Notify me</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-[#F5F0E8]/10">
        {[
          { key: 'galleries' as const, label: `Galleries (${galleries.length})`, icon: ImageIcon },
          { key: 'photos' as const, label: `Photos (${totalPhotos})`, icon: Eye },
          { key: 'stories' as const, label: `Stories (${stories.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 pb-2 text-xs font-mono transition-colors ${
                activeTab === tab.key
                  ? 'text-[#F5F0E8] border-b-2 border-[#DC2626]'
                  : 'text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Galleries tab */}
      {activeTab === 'galleries' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {galleries.map((gallery) => (
            <button
              key={gallery.id}
              onClick={() => openGallery(gallery.id)}
              className="text-left border border-[#F5F0E8]/5 hover:border-[#F5F0E8]/20 transition-colors overflow-hidden"
            >
              {gallery.cover_photo_url ? (
                <div className="aspect-video bg-[#F5F0E8]/5 overflow-hidden">
                  <img
                    src={gallery.cover_photo_url}
                    alt={gallery.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-[#F5F0E8]/5 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#F5F0E8]/10" />
                </div>
              )}
              <div className="p-3">
                <p className="font-bold text-sm">{gallery.title}</p>
                <p className="text-[10px] font-mono text-[#F5F0E8]/40 mt-0.5">
                  {gallery.photo_count} photos
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Photos tab */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {recentMedia.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square bg-[#F5F0E8]/5 overflow-hidden border border-[#F5F0E8]/5 hover:border-[#F5F0E8]/20 transition-colors relative group"
            >
              <img
                src={item.thumbnail || item.url}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {item.tags && item.tags.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] font-mono text-white truncate">{item.tags.join(', ')}</p>
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Stories tab */}
      {activeTab === 'stories' && (
        <div className="space-y-3">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="block p-3 border border-[#F5F0E8]/5 hover:border-[#F5F0E8]/20 transition-colors"
            >
              <div className="flex gap-3">
                {story.cover_image_url && (
                  <div className="w-16 h-16 shrink-0 bg-[#F5F0E8]/5 overflow-hidden">
                    <img src={story.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{story.title}</p>
                  {story.storyteller_name && (
                    <p className="text-[10px] font-mono text-[#F5F0E8]/40 mt-0.5">{story.storyteller_name}</p>
                  )}
                  {story.summary && (
                    <p className="text-xs text-[#F5F0E8]/40 mt-1 line-clamp-2">{story.summary}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {stories.length === 0 && (
            <p className="text-sm text-[#F5F0E8]/30 py-2">No stories yet. Check back soon.</p>
          )}
        </div>
      )}
    </div>
  );
}
