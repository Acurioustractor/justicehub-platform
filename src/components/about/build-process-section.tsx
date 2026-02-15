import { MediaPlayer } from "@/components/media-player";
import { SectionHeading } from "@/components/section-heading";

const buildVideos = [
  {
    id: "timelapse-full",
    title: "Complete Build Timelapse",
    description: "Watch three shipping containers transform into chambers of possibility - every weld, every wire, every moment of revolution being built by hand.",
    mediaType: "video" as const,
    videoSource: "supabase" as const,
    src: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/videos/build/full-timelapse.mp4",
    poster: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/full-timelapse-poster.jpg",
    duration: "8:42",
    featured: true
  },
  {
    id: "container-one",
    title: "Container 1: The Cage",
    description: "Building despair into tangible form - fluorescent lights, concrete walls, the specific frequency of institutional failure.",
    mediaType: "video" as const,
    videoSource: "supabase" as const,
    src: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/videos/build/container-1-build.mp4",
    poster: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/container-1-poster.jpg",
    duration: "4:23"
  },
  {
    id: "container-two",
    title: "Container 2: The Bridge",
    description: "The pivot point - where trauma meets understanding, where stories become data, where individual pain transforms into collective action.",
    mediaType: "video" as const,
    videoSource: "supabase" as const,
    src: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/videos/build/container-2-build.mp4",
    poster: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/container-2-poster.jpg",
    duration: "5:17"
  },
  {
    id: "container-three",
    title: "Container 3: The Alternative",
    description: "Hope made manifest - the sunset-colored rooms where futures are actively constructed, where AutoCAD replaces compliance.",
    mediaType: "video" as const,
    videoSource: "supabase" as const,
    src: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/videos/build/container-3-build.mp4",
    poster: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/container-3-poster.jpg",
    duration: "6:05"
  }
];

const processHighlights = [
  {
    title: "Electronics & Wiring",
    description: "Nicholas Marchesi personally wired every light, every sensor, every piece of technology that makes the experience visceral.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/electronics-work.jpg",
    stats: "47 hours of precision wiring"
  },
  {
    title: "Spatial Design",
    description: "Every detail matters when you're building someone's future - from wall texture to ceiling height, authenticity in every millimeter.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/spatial-design.jpg",
    stats: "3 distinct environments"
  },
  {
    title: "Technology Integration",
    description: "Embedding sensors and systems that bridge physical experience to digital action, making the abstract tangible.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/tech-integration.jpg",
    stats: "Real-time data capture"
  },
  {
    title: "Testing & Iteration",
    description: "Young people with lived experience guided every adjustment, ensuring authenticity in every detail.",
    image: "https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/images/build/testing-process.jpg",
    stats: "12 iterations to perfection"
  }
];

export function BuildProcessSection() {
  return (
    <section id="build-process" className="bg-color-container-steel py-24">
      <div className="mx-auto max-w-6xl px-6 space-y-20">
        <SectionHeading
          eyebrow="From Vision to Reality"
          title="The Build Process"
          description="Revolution is built with hands, not just hearts. Watch shipping containers transform into chambers of transformation through months of precise, passionate construction."
          align="center"
        />

        {/* Featured timelapse video */}
        <div className="space-y-6">
          <MediaPlayer
            mediaType={buildVideos[0].mediaType}
            videoSource={buildVideos[0].videoSource}
            src={buildVideos[0].src}
            poster={buildVideos[0].poster}
            title={buildVideos[0].title}
            className="shadow-2xl"
          />
          <div className="text-center space-y-2">
            <h3 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
              {buildVideos[0].title}
            </h3>
            <p className="text-white/80 max-w-2xl mx-auto">
              {buildVideos[0].description}
            </p>
            <div className="flex justify-center gap-4 text-sm text-white/60">
              <span>Duration: {buildVideos[0].duration}</span>
              <span>•</span>
              <span>4K Resolution</span>
            </div>
          </div>
        </div>

        {/* Individual container builds */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Individual Container Builds
          </h3>

          <div className="grid gap-8 md:grid-cols-3">
            {buildVideos.slice(1).map((video) => (
              <div key={video.id} className="group space-y-4">
                <MediaPlayer
                  mediaType={video.mediaType}
                  videoSource={video.videoSource}
                  src={video.src}
                  poster={video.poster}
                  title={video.title}
                  className="shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="space-y-2">
                  <h4 className="font-semibold text-color-hope-green">
                    {video.title}
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {video.description}
                  </p>
                  <div className="text-xs text-white/60">
                    Duration: {video.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process highlights */}
        <div className="space-y-8">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white text-center">
            Behind the Build
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processHighlights.map((highlight) => (
              <div key={highlight.title} className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-color-hope-green/30 transition-all">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={highlight.image}
                    alt={highlight.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs font-semibold text-color-warning-orange bg-color-warning-orange/20 px-2 py-1 rounded-full inline-block border border-color-warning-orange/30">
                      {highlight.stats}
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-white">
                    {highlight.title}
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical specifications */}
        <div className="rounded-3xl bg-gradient-to-r from-color-container-black/60 to-color-container-black/80 border border-white/10 p-8">
          <div className="text-center space-y-6">
            <h3 className="font-display text-xl uppercase tracking-tight text-color-hope-green">
              Technical Specifications
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-color-warning-orange">40ft</div>
                <div className="text-sm text-white/70 uppercase tracking-wide">Container Length</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-color-warning-orange">47hrs</div>
                <div className="text-sm text-white/70 uppercase tracking-wide">Electronics Work</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-color-warning-orange">12</div>
                <div className="text-sm text-white/70 uppercase tracking-wide">Design Iterations</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-color-warning-orange">100%</div>
                <div className="text-sm text-white/70 uppercase tracking-wide">Hand-Built</div>
              </div>
            </div>

            <p className="text-white/80 max-w-2xl mx-auto">
              Every wire, every wall, every detail was constructed by hand with profound intention.
              This isn't just about building containers - it's about building alternative futures.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center space-y-6">
          <h3 className="font-display text-2xl uppercase tracking-tight text-white">
            Experience the Build
          </h3>
          <p className="text-white/80 max-w-2xl mx-auto">
            These videos show the physical construction, but the real build is happening in communities,
            in conversations, in the moment someone realizes change is actually possible.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#get-involved"
              className="px-6 py-3 rounded-lg bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30 hover:bg-color-hope-green/30 transition-colors"
            >
              Join the Build
            </a>
            <a
              href="/book-experience"
              className="px-6 py-3 rounded-lg bg-color-warning-orange/20 text-color-warning-orange border border-color-warning-orange/30 hover:bg-color-warning-orange/30 transition-colors"
            >
              Book an Experience
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}