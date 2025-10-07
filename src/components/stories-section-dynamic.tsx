import Image from "next/image";
import { CTAButton } from "./cta-button";
import { SectionHeading } from "./section-heading";
import { getStories, transformStoryData } from "@/lib/supabase-stories";
import { MediaPlayer } from "./media-player";

// Server component that fetches stories from Supabase
export async function StoriesSectionDynamic() {
  // Fetch stories from Supabase
  const stories = await getStories({ limit: 6 });
  const transformedStories = stories.map(transformStoryData);

  if (transformedStories.length === 0) {
    // Fallback to show something if no stories in database yet
    return (
      <section id="stories" className="bg-gradient-to-b from-color-container-steel via-color-container-black to-color-container-black text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
          <SectionHeading
            eyebrow="Stories"
            title="Truth through experience"
            description="Stories are being loaded from your Supabase database. Add stories to see them here."
            align="left"
          />
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-white/60">
            Add stories to your Supabase database to display them here
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="stories" className="bg-gradient-to-b from-color-container-steel via-color-container-black to-color-container-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 sm:px-12">
        <SectionHeading
          eyebrow="Stories"
          title="Truth through experience"
          description="Real voices from people who've experienced the system firsthand."
          align="left"
        />

        <div className="grid gap-10 lg:grid-cols-3">
          {transformedStories.map((story) => (
            <article
              key={story.id}
              className="panel-darker flex flex-col gap-6 rounded-3xl p-6"
            >
              {/* Media Section */}
              {story.mediaType === "video" && story.supabaseVideoUrl ? (
                <MediaPlayer
                  mediaType="video"
                  videoSource={story.videoSource || "supabase"}
                  src={story.supabaseVideoUrl}
                  poster={story.posterImage}
                  title={story.name}
                />
              ) : story.mediaSrc ? (
                <MediaPlayer
                  mediaType="photo"
                  src={story.mediaSrc}
                  alt={`Portrait of ${story.name}`}
                  title={story.name}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-xs uppercase tracking-[0.3em] text-white/40">
                  Media coming soon
                </div>
              )}

              {/* Person Info */}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{story.name}</h3>
                {story.role && (
                  <p className="text-sm uppercase tracking-[0.25em] text-white/90">
                    {story.role}
                  </p>
                )}
                {story.category && (
                  <span className="self-start rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
                    {story.category}
                  </span>
                )}
              </div>

              {/* Quote or Bio */}
              {story.quote && (
                <p className="flex-1 text-base text-white">"{story.quote}"</p>
              )}

              {story.bio && !story.quote && (
                <p className="flex-1 text-sm text-white/90">{story.bio}</p>
              )}

              {/* Highlight Stat */}
              {story.highlightStat && (
                <div className="rounded-2xl border border-color-hope-green/50 bg-color-hope-green/15 p-4 text-sm text-color-hope-green">
                  <span className="font-semibold uppercase tracking-[0.3em]">
                    {story.highlightStat.label}
                  </span>
                  <div className="mt-1 text-lg text-white">
                    {story.highlightStat.value}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {story.storyText && (
                  <CTAButton
                    href={`/stories/${story.id}`}
                    variant="accent"
                    className="self-start px-4 py-2 text-sm"
                  >
                    Read full story
                  </CTAButton>
                )}
                {story.transcriptionUrl && (
                  <CTAButton
                    href={story.transcriptionUrl}
                    variant="light"
                    className="self-start px-4 py-2 text-sm"
                  >
                    Read transcript
                  </CTAButton>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* View More Button */}
        {transformedStories.length >= 6 && (
          <div className="text-center">
            <CTAButton href="/stories" variant="light">
              View all stories
            </CTAButton>
          </div>
        )}
      </div>
    </section>
  );
}