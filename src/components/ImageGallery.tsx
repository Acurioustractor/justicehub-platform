'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
  }>;
  columns?: 2 | 3 | 4;
}

export default function ImageGallery({
  images,
  columns = 3
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Grid layout based on column count
  const gridClass = `grid gap-0 ${
    columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
    columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
    'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }`;

  return (
    <>
      {/* Gallery Grid */}
      <div className={gridClass}>
        {images.map((image, index) => (
          <div
            key={index}
            className="border-2 border-black aspect-square bg-white hover:bg-black group cursor-pointer transition-all duration-200"
            onClick={() => openLightbox(index)}
          >
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/90 text-white p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-sm font-bold">{image.caption}</p>
                  {image.credit && (
                    <p className="text-xs opacity-70 mt-1">Photo: {image.credit}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full">
              <Image
                src={images[currentImageIndex].src}
                alt={images[currentImageIndex].alt}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            {/* Caption */}
            {images[currentImageIndex].caption && (
              <div className="mt-4 text-white text-center">
                <p className="text-lg font-bold">{images[currentImageIndex].caption}</p>
                {images[currentImageIndex].credit && (
                  <p className="text-sm opacity-70 mt-2">Photo: {images[currentImageIndex].credit}</p>
                )}
              </div>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 text-sm font-mono">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
