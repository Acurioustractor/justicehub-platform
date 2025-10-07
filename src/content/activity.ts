export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  timestampMinutesAgo: number;
}

export const liveActivitySeed: ActivityItem[] = [
  {
    id: "activity-001",
    actor: "Sarah M. (West End)",
    action: "nominated the Attorney-General",
    timestampMinutesAgo: 2,
  },
  {
    id: "activity-002",
    actor: "Brisbane Grammar School",
    action: "booked an experience for 15 students",
    timestampMinutesAgo: 7,
  },
  {
    id: "activity-003",
    actor: "David L.",
    action: "completed the journey—'Every Queenslander needs this'",
    timestampMinutesAgo: 14,
  },
  {
    id: "activity-004",
    actor: "Youth Justice Reform Alliance",
    action: "shared the campaign with 12,000 supporters",
    timestampMinutesAgo: 22,
  },
  {
    id: "activity-005",
    actor: "Channel 7 News",
    action: "booked a journalist walkthrough",
    timestampMinutesAgo: 31,
  },
];
