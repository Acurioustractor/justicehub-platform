"use client";

import Image from "next/image";
import { useState } from "react";

export type MediaType = "video" | "photo";
export type VideoSource = "supabase" | "youtube" | "vimeo" | "local";

interface MediaPlayerProps {
  mediaType: MediaType;
  videoSource?: VideoSource;
  src?: string; // URL for video or image
  poster?: string; // Poster image for videos
  alt?: string; // Alt text for images
  title?: string; // Title for accessibility
  className?: string;
  aspectRatio?: "video" | "square" | "portrait"; // Default: video (16:9)
}

export function MediaPlayer({
  mediaType,
  videoSource = "local",
  src,
  poster,
  alt = "",
  title = "",
  className = "",
  aspectRatio = "video",
}: MediaPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    video: "aspect-video", // 16:9
    square: "aspect-square", // 1:1
    portrait: "aspect-[3/4]", // 3:4
  };

  const containerClass = `relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black ${aspectRatioClasses[aspectRatio]} ${className}`;

  if (hasError || !src) {
    return (
      <div className={`${containerClass} flex items-center justify-center bg-white/5`}>
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-white/40">
            {hasError ? "Media unavailable" : "Media coming soon"}
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === "photo") {
    return (
      <div className={containerClass}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, 100vw"
          priority={false}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-white/10" />
        )}
      </div>
    );
  }

  // Handle different video sources
  if (mediaType === "video") {
    // YouTube embed
    if (videoSource === "youtube" && src.includes("youtube.com")) {
      const videoId = src.split("v=")[1]?.split("&")[0] || src.split("/").pop();
      return (
        <div className={containerClass}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-white/10" />
          )}
        </div>
      );
    }

    // Vimeo embed
    if (videoSource === "vimeo" && src.includes("vimeo.com")) {
      const videoId = src.split("/").pop();
      return (
        <div className={containerClass}>
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-white/10" />
          )}
        </div>
      );
    }

    // Supabase or local video (HTML5 video player)
    return (
      <div className={containerClass}>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          controls
          poster={poster}
          preload="metadata"
          title={title}
          onLoadedData={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        {isLoading && poster && (
          <Image
            src={poster}
            alt={`Loading ${title}`}
            fill
            className="object-cover"
            priority={false}
          />
        )}
      </div>
    );
  }

  return null;
}