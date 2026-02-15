'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';
import Image from 'next/image';

interface FeaturedVideoProps {
  videoUrl: string; // YouTube/Vimeo URL or direct video file
  title: string;
  description?: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
}

export default function FeaturedVideo({
  videoUrl,
  title,
  description,
  thumbnailUrl,
  autoplay = false
}: FeaturedVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube/Vimeo ID if applicable
  const getEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // Direct video file
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = !embedUrl.includes('youtube.com') && !embedUrl.includes('vimeo.com');

  return (
    <div className="border-2 border-black bg-black overflow-hidden">
      {/* Video Player / Thumbnail */}
      <div className="relative aspect-video bg-black">
        {!isPlaying ? (
          <>
            {/* Thumbnail */}
            <div className="relative w-full h-full">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <Play className="w-24 h-24 text-white/30" />
                </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Play Button */}
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center group"
                aria-label={`Play ${title}`}
              >
                <div className="bg-white text-black hover:bg-red-600 hover:text-white rounded-full p-6 transition-all duration-200 group-hover:scale-110 shadow-2xl">
                  <Play className="w-12 h-12 fill-current" />
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Video Player */}
            {isDirectVideo ? (
              <video
                src={embedUrl}
                controls
                autoPlay={autoplay}
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}

            {/* Close Button (for direct videos) */}
            {isDirectVideo && (
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded-full hover:bg-black transition-colors"
                aria-label="Close video"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Title & Description */}
      <div className="text-2xl md:text-3xl font-bold text-white bg-black p-6 border-t-2 border-white">
        <h2>{title}</h2>
      </div>
      {description && (
        <div className="text-white/90 px-6 pb-6">
          <p className="leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
