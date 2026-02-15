export type StoryMediaType = "video" | "photo";
export type VideoSource = "supabase" | "descript" | "local";

// Stories can use Supabase video URLs, Descript embeds, or local files
export interface CampaignStory {
  id: string;
  name: string;
  role: string;
  quote: string;
  mediaType: StoryMediaType;
  videoSource?: VideoSource; // Specify video platform
  supabaseVideoUrl?: string; // Full Supabase storage URL
  descriptShareId?: string; // Descript share ID (legacy support)
  mediaSrc?: string; // Local image or video file
  posterImage?: string; // Thumbnail for videos
  transcriptionUrl?: string;
  highlightStat?: { label: string; value: string };
}

export const campaignStories: CampaignStory[] = [
  {
    id: "change-maker",
    name: "Joe Kwon",
    role: "Founder, Confit Pathways",
    quote:
      "The first container feels like every door that ever slammed on me. The third one finally shows a door opening.",
    mediaType: "video",
    videoSource: "supabase",
    supabaseVideoUrl: "https://your-project.supabase.co/storage/v1/object/public/videos/joe-kwon-story.mp4", // Replace with your actual Supabase URL
    posterImage: "/images/stories/joe-kwon.jpg",
    transcriptionUrl: "https://contained.act.place/stories/joe-kwon-transcript",
    highlightStat: {
      label: "Time since release",
      value: "18 months without reoffending",
    },
  },
  {
    id: "police-commander",
    name: "Supt. David L.",
    role: "Former Youth Detention Commander",
    quote:
      "When you feel the cold steel, you realise we built a system that hardens kids. This experience shows how to do the opposite.",
    mediaType: "photo",
    mediaSrc: "/images/stories/david.jpg",
    transcriptionUrl: "https://contained.act.place/stories/david",
    highlightStat: {
      label: "Support pledged",
      value: "$250k corporate partnership",
    },
  },
  {
    id: "psychologist",
    name: "Dr. Amara T.",
    role: "Clinical Psychologist",
    quote:
      "Container 2 is what my patients tell me they needed—people who listen, calm spaces, and real investment in healing.",
    mediaType: "video",
    descriptShareId: "REPLACE_WITH_DESCRIPT_ID",
    posterImage: "/images/stories/amara.jpg",
    highlightStat: {
      label: "Programs connected",
      value: "16 community providers",
    },
  },
];
