import Image from "next/image";
import { campaignStories } from "@/content/stories";
import { CTAButton } from "./cta-button";
import { SectionHeading } from "./section-heading";

function DescriptEmbed({ id, title }: { id: string; title: string }) {
  const embedUrl = `https://share.descript.com/embed/${id}`;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe
        title={`${title} – video testimony`}
        src={embedUrl}
        allow="autoplay; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function SupabaseVideo({ url, poster, title }: { url: string; poster?: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        controls
        poster={poster}
        preload="metadata"
        title={`${title} – video testimony`}
      >
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function renderStoryMedia(story: (typeof campaignStories)[number]) {
  // Handle Supabase videos
  if (story.mediaType === "video" && story.videoSource === "supabase" && story.supabaseVideoUrl) {
    return <SupabaseVideo url={story.supabaseVideoUrl} poster={story.posterImage} title={story.name} />;
  }

  // Handle Descript embeds (legacy support)
  if (story.mediaType === "video" && story.descriptShareId) {
    return <DescriptEmbed id={story.descriptShareId} title={story.name} />;
  }

  // Handle local videos
  if (story.mediaType === "video" && story.mediaSrc) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          controls
          poster={story.posterImage}
          preload="metadata"
        >
          <source src={story.mediaSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Handle photos
  if (story.mediaSrc) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10">
        <Image
          src={story.mediaSrc}
          alt={`Portrait of ${story.name}`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, 100vw"
          priority={false}
        />
      </div>
    );
  }

  // Handle poster images only
  if (story.posterImage) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10">
        <Image
          src={story.posterImage}
          alt={`Poster frame for ${story.name}`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>
    );
  }

  // Placeholder
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
      Media coming soon
    </div>
  );
}

export function StoriesSection() {
  return (
    <section id="stories" className="bg-gradient-to-b from-color-container-steel via-color-container-black to-color-container-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
        <SectionHeading
          eyebrow="Stories"
          title="Truth through experience"
          description="Share real voices that move leaders from awareness to accountability. Drop in Descript links and image assets to keep this carousel current."
          align="left"
        />

        <div className="grid gap-10 lg:grid-cols-3">
          {campaignStories.map((story) => (
            <article
              key={story.id}
              className="panel-darker flex flex-col gap-6 rounded-3xl p-6"
            >
              {renderStoryMedia(story)}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{story.name}</h3>
                <p className="text-sm uppercase tracking-[0.25em] text-white/90">
                  {story.role}
                </p>
              </div>
              <p className="flex-1 text-base text-white">“{story.quote}”</p>
              {story.highlightStat && (
                <div className="rounded-2xl border border-color-hope-green/50 bg-color-hope-green/15 p-4 text-sm text-color-hope-green">
                  <span className="font-semibold uppercase tracking-[0.3em]">{story.highlightStat.label}</span>
                  <div className="mt-1 text-lg text-white">{story.highlightStat.value}</div>
                </div>
              )}
              {story.mediaType === "video" && story.videoSource === "supabase" ? (
                // For Supabase videos, the video plays inline above
                story.transcriptionUrl ? (
                  <CTAButton
                    href={story.transcriptionUrl}
                    variant="light"
                    className="self-start px-4 py-2 text-sm"
                  >
                    Read transcript
                  </CTAButton>
                ) : null
              ) : story.mediaType === "video" && story.descriptShareId ? (
                <CTAButton
                  href={`https://share.descript.com/view/${story.descriptShareId}`}
                  variant="accent"
                  className="self-start px-4 py-2 text-sm"
                >
                  Watch story
                </CTAButton>
              ) : story.transcriptionUrl ? (
                <CTAButton
                  href={story.transcriptionUrl}
                  variant="light"
                  className="self-start px-4 py-2 text-sm"
                >
                  Read story
                </CTAButton>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
