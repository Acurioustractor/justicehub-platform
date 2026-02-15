interface VideoEmbedProps {
  url?: string
  provider?: 'youtube' | 'vimeo'
  videoId?: string
  title?: string
  caption?: string
  aspectRatio?: '16:9' | '4:3' | '1:1'
}

export function VideoEmbed({
  url,
  provider = 'youtube',
  videoId,
  title,
  caption,
  aspectRatio = '16:9',
}: VideoEmbedProps) {
  // Auto-detect provider and ID from URL if provided
  let finalProvider = provider
  let finalVideoId = videoId

  if (url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      finalProvider = 'youtube'
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
      finalVideoId = match?.[1]
    } else if (url.includes('vimeo.com')) {
      finalProvider = 'vimeo'
      const match = url.match(/vimeo\.com\/(\d+)/)
      finalVideoId = match?.[1]
    }
  }

  if (!finalVideoId) {
    return (
      <div className="my-8 p-6 border-2 border-red-200 bg-red-50 rounded-lg text-red-700">
        <strong>Error:</strong> Video ID could not be extracted. Please provide either a valid URL or a videoId prop.
      </div>
    )
  }

  const embedUrl =
    finalProvider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${finalVideoId}`
      : `https://player.vimeo.com/video/${finalVideoId}`

  const aspectRatioClass =
    aspectRatio === '16:9'
      ? 'aspect-video'
      : aspectRatio === '4:3'
      ? 'aspect-[4/3]'
      : 'aspect-square'

  return (
    <figure className="my-8">
      <div className={`${aspectRatioClass} w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg`}>
        <iframe
          src={embedUrl}
          title={title || 'Video embed'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {(title || caption) && (
        <figcaption className="mt-3 text-center">
          {title && <div className="font-semibold text-gray-900 mb-1">{title}</div>}
          {caption && <div className="text-sm text-gray-600">{caption}</div>}
        </figcaption>
      )}
    </figure>
  )
}
