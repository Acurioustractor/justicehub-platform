import { MediaPlayer } from "@/components/media-player";

export function AboutHero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-color-container-black via-color-container-steel to-color-container-black" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-color-hope-green/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-color-hope-green">
                The Genesis of Transformation
              </span>

              <h1 className="font-display text-5xl uppercase tracking-tight leading-none lg:text-6xl text-white">
                About <span className="text-color-warning-orange">CONTAINED</span>
              </h1>
            </div>

            {/* Revolutionary quote */}
            <blockquote className="border-l-4 border-color-hope-green pl-6 py-4">
              <p className="text-xl text-white/95 italic leading-relaxed">
                "Revolution doesn't announce itself with press releases. It builds in garages and community centres, in the spaces between heartbeats, in the moment a kid realizes someone actually gives a damn."
              </p>
            </blockquote>

            {/* Subheading */}
            <div className="space-y-4">
              <p className="text-lg text-white/90 leading-relaxed">
                CONTAINED is orchestrated by <strong className="text-color-hope-green">A Curious Tractor (ACT)</strong> - a collective that refuses to accept that some children are recyclable waste.
              </p>

              <p className="text-base text-white/80 leading-relaxed">
                This isn't just another social innovation project. It's what happens when builders, dreamers, and survivors converge at the intersection of moral urgency and practical possibility.
              </p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-color-hope-green">3</div>
                <div className="text-xs uppercase tracking-wider text-white/70">Containers</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-color-warning-orange">30min</div>
                <div className="text-xs uppercase tracking-wider text-white/70">Experience</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-xs uppercase tracking-wider text-white/70">Impact</div>
              </div>
            </div>

            {/* Quick navigation */}
            <div className="flex flex-wrap gap-3 pt-4">
              <a href="#architects" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30 hover:bg-color-hope-green/30 transition-colors">
                👥 Meet the Team
              </a>
              <a href="#build-process" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                🎬 See the Build
              </a>
              <a href="#get-involved" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30 hover:bg-color-warning-orange/30 transition-colors">
                🚀 Get Involved
              </a>
            </div>
          </div>

          {/* Right: Hero video */}
          <div className="space-y-6">
            <MediaPlayer
              mediaType="video"
              videoSource="supabase"
              src="https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/videos/build/hero-video.mp4"
              poster="https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/hero-poster.jpg"
              title="CONTAINED: The Genesis"
              className="shadow-2xl"
            />

            <div className="text-center">
              <p className="text-sm text-white/70">
                Watch: The moment vision became reality
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}