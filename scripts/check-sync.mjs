import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const el = createClient(process.env.EMPATHY_LEDGER_URL, process.env.EMPATHY_LEDGER_API_KEY);
const JH_CHANNEL = "ee99f4c9-68b2-474c-9563-f5a513993aba";

const [ch, st] = await Promise.all([
  el.from("storyteller_channels").select("storyteller_id").eq("channel_id", JH_CHANNEL),
  el.from("storytellers").select("id, display_name, is_justicehub_featured, tags")
]);

const channelIds = new Set((ch.data||[]).map(c => c.storyteller_id));
const all = st.data || [];
const featured = new Set(all.filter(s => s.is_justicehub_featured).map(s => s.id));
const tagged = new Set(all.filter(s => (s.tags||[]).includes("justicehub")).map(s => s.id));
const containedTagged = all.filter(s => (s.tags||[]).includes("contained"));

console.log("=== THREE TAGGING MECHANISMS ===");
console.log("1. storyteller_channels (JH):", channelIds.size);
console.log("2. is_justicehub_featured:", featured.size);
console.log("3. tags[] justicehub:", tagged.size);
console.log("4. tags[] contained:", containedTagged.length);

const inChannelNotTags = [...channelIds].filter(id => !tagged.has(id));
const inTagsNotChannel = [...tagged].filter(id => !channelIds.has(id));
const inBoth = [...channelIds].filter(id => tagged.has(id));

console.log("\nChannel + tags overlap:", inBoth.length);
console.log("In channel, missing tags[]:", inChannelNotTags.length);
console.log("In tags[], missing channel:", inTagsNotChannel.length);

if (inChannelNotTags.length > 0) {
  console.log("\n--- In channel but NOT tags[] ---");
  inChannelNotTags.forEach(id => {
    const s = all.find(x => x.id === id);
    console.log("  " + (s ? s.display_name : id));
  });
}
if (inTagsNotChannel.length > 0) {
  console.log("\n--- In tags[] but NOT channel ---");
  inTagsNotChannel.forEach(id => {
    const s = all.find(x => x.id === id);
    console.log("  " + (s ? s.display_name : id));
  });
}

console.log("\n--- Contained tagged ---");
containedTagged.forEach(s => console.log("  " + s.display_name));
