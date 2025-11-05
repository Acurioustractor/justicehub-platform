'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

interface ImageGalleryProps {
  images: GalleryImage[]
  layout?: 'grid' | 'carousel'
  columns?: 2 | 3 | 4
}

export function ImageGallery({ images, layout = 'grid', columns = 3 }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const nextImage = () => setLightboxIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev))
  const prevImage = () => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  if (layout === 'carousel') {
    return (
      <div className="my-8">
        <div className="relative overflow-hidden rounded-lg border-2 border-gray-200">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-video w-full cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
              />
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                  <p className="text-sm">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {renderLightbox()}
      </div>
    )
  }

  function renderLightbox() {
    if (lightboxIndex === null) return null

    const currentImage = images[lightboxIndex]

    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={closeLightbox}
      >
        {/* Close button */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Previous button */}
        {lightboxIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>
        )}

        {/* Next button */}
        {lightboxIndex < images.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="w-12 h-12" />
          </button>
        )}

        {/* Image */}
        <div className="relative max-w-7xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
          <div className="relative aspect-video w-full">
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              className="object-contain"
            />
          </div>

          {/* Caption and download */}
          <div className="mt-4 flex items-center justify-between text-white">
            <div className="flex-1">
              {currentImage.caption && (
                <p className="text-sm">{currentImage.caption}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {lightboxIndex + 1} / {images.length}
              </p>
            </div>
            <a
              href={currentImage.src}
              download
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Download</span>
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Grid layout
  return (
    <div className="my-8">
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {images.map((image, index) => (
          <figure
            key={index}
            className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
            onClick={() => openLightbox(index)}
          >
            <div className="relative aspect-video w-full bg-gray-100">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                  Click to enlarge
                </span>
              </div>
            </div>
            {image.caption && (
              <figcaption className="p-3 text-sm text-gray-700 bg-gray-50">
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {renderLightbox()}
    </div>
  )
}
