'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface SiteGalleryProps {
  images: Array<{ src: string; alt: string }>;
  title?: string;
  subtitle?: string;
}

export default function SiteGallery({ images, title = 'In Action', subtitle = 'On country, in the gym, and in the community' }: SiteGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black mb-3 text-center text-[#43302b] flex items-center justify-center gap-3">
          <Camera className="w-7 h-7 text-orange-600" /> {title}
        </h2>
        <p className="text-center text-[#8b7355] mb-8">{subtitle}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg cursor-pointer ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${i === 0 ? 'h-64 md:h-full' : 'h-48 md:h-56'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <p className="absolute bottom-3 left-3 text-white text-sm font-medium">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </>
          )}

          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              className="max-w-full max-h-[85vh] mx-auto object-contain"
            />
            <p className="text-white text-center mt-4 text-sm">{images[lightboxIndex].alt}</p>
            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 text-sm font-mono rounded">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
