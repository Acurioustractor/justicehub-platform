/**
 * Sync Mounty Yarns community voices from Empathy Ledger into JusticeHub alma_stories
 *
 * Source: EL Supabase (yvnuayzslukamizrlhwb), org ID: e08b256c-0adf-41ce-b641-e373024c3927
 * Target: JH Supabase (tednluwflfhxyucgwigh), org ID: 11111111-1111-1111-1111-111111111003
 */

const JH_URL = 'https://tednluwflfhxyucgwigh.supabase.co';
const JH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo';

const MOUNTY_YARNS_ORG_ID = '11111111-1111-1111-1111-111111111003';

// All 14 transcripts already fetched from EL + the published story
const stories = [
  {
    title: 'Mounty Yarns: In Their Own Words',
    full_story: `<article class="mounty-yarns-story">

<p class="lead">In the streets of Mount Druitt, a group of young people are rewriting the story that's been written about them. Not with policy papers or government reports — but with their own voices, their own words, and their own vision for what their community can become.</p>

<h2>Home</h2>

<p>Ask anyone from Mount Druitt what the place means to them, and the answer comes without hesitation.</p>

<blockquote>"You could take me far away, but I end up back in Mount Druitt anyway."</blockquote>

<p>For the young people of Mounty Yarns, this isn't just a postcode. It's family. It's a modern-day corroboree — a gathering place where kinship runs deeper than blood.</p>

<blockquote>"Mountain was just like a place of a modern day corroboree. We all, for black fathers anyway, we made it for what it is. Even though we didn't come from a good background or anything."</blockquote>

<p>Most of them grew up without father figures. They learned from each other. They survived together. And no matter how many months or years apart — through stints in custody, through removals, through everything the system threw at them — they always came back to each other.</p>

<blockquote>"Our way was right. Survive. Our way was the right way. All the way all the time."</blockquote>

<h2>The System</h2>

<p>The stories these young people carry are not abstract policy discussions. They are lived. One young man was shot by police at 14 — died twice, once at the scene and once on the operating table. Another was strip-searched at 13 by eight officers. Children as young as six were removed from families. One young person went through 15 caseworkers in two years.</p>

<blockquote>"I've been through 15 caseworkers in two years. How does that help a kid? No support there. Just could do what you do, I guess."</blockquote>

<blockquote>"Within seconds I've been shot in the arm, shot in the chest. And then the last word I said was like, boy, they were shot with blood in my mouth. I died twice. One at the scene and on the operating table."</blockquote>

<p>Shayle McKellar, a proud Wangkamarra man who completed his HSC in custody, now works as a lived experience consultant with Just Reinvest. He speaks plainly about what the justice system does to young people:</p>

<blockquote>"They enter the system as victims, and then they come out as even more victimised people."</blockquote>

<p>At 13, walking into a cell for the first time, not knowing how to turn on the radio or the TV. Nobody explained anything. The lady at the door asked, "Haven't you been here before?" He hadn't.</p>

<p>The supports that do exist vanish at 18. Services that were there disappear overnight. The cliff edge is real.</p>

<blockquote>"Once you turn 18, all the supports, it feels like you just get dumped on the ground again."</blockquote>

<h2>What Was Missing</h2>

<p>Before Mounty Yarns, there was nothing. The boys say it plainly: no programs, no services, nothing except a police-run PCYC where cops would question them about their brothers instead of letting them play.</p>

<blockquote>"The only thing that was set up around here was PCYC. They were ran by cops. And they already didn't like us."</blockquote>

<blockquote>"If no one wants to go to a police-run PCYC, why put all the money in there? If it was community-run, I guarantee young kids will rock up, feel more safer."</blockquote>

<p>It costs $1,700 a day to keep a young person locked up. The young people of Mounty Yarns know this figure by heart — they've been asked about it a hundred times. But they also know what that money could buy instead: cultural trips, elder-led programs, community spaces where young people feel safe enough to actually talk.</p>

<blockquote>"If we had programs like this as kids, I'm not saying all of us would've been angels, but some of us would've had better life opportunities."</blockquote>

<h2>What They're Building</h2>

<p>Mounty Yarns is what happens when young people stop waiting for the system to fix itself and start building something of their own.</p>

<p>Archie Darcy, a proud Wangkamarra and Camilla man, works as a caseworker breaking cycles for young people — not by looking at what a piece of paper says about them, but by seeing them as they are:</p>

<blockquote>"We don't look at a piece of paper and go, oh, what it says about a young person. All young people are good. Sometimes some kids are just in bad situations that are out of their control."</blockquote>

<blockquote>"Basically it's just trying to break cycles for young kids. We're there to just remove the barriers that are stopping them from being a better version of themselves."</blockquote>

<p>Leah, a Hiri D and Camilla woman from Mount Druitt who grew up in foster care, co-runs Youth Peak with Adam — a peer support service driven by the voice she never had:</p>

<blockquote>"It's like having a voice for other young people that I didn't have in foster care."</blockquote>

<p>Amelia Wyman, a proud Mangpa Guara woman from Wilcannia, teaches dance with her father's group and advocates for young cultural leaders:</p>

<blockquote>"Young people can do things if they are encouraged and they get nurtured towards that way and they get believed in. Then they can also help make a difference."</blockquote>

<p>Taleigha Glover, a young Biripi woman, challenges the decisions being made without young people at the table:</p>

<blockquote>"Because young people are going through all of this stuff, why are the older fellas making choices for the younger fellas when they're the ones going through it?"</blockquote>

<p>Isabella, 14, from Seven Hills, found in Mounty Yarns what she couldn't find anywhere else:</p>

<blockquote>"I like the fact that the mentors and the youth workers, they're easy to talk to. There's no pressure. It's more fun and you don't feel judged."</blockquote>

<p>And Polly, 13, from Blacktown, says it simply:</p>

<blockquote>"I like this area a lot because I can express myself, I can be myself around these people. I don't have to hide my personality."</blockquote>

<h2>Being Heard</h2>

<p>For many of these young people, Mounty Yarns gave them the first experience of actually being listened to. Not assessed. Not case-managed. Listened to.</p>

<blockquote>"It feels good. I don't know how to explain it 'cause it's the first time that this has ever happened, like, with all of us. Get shit off your chest though."</blockquote>

<blockquote>"We can all be ourselves around each other. Actually express our feelings. We never really do that, but here we can do whatever we want."</blockquote>

<blockquote>"They just need more of the elders to speak to us. Not just to do dances and stuff, but actually talk to the boys. Get in their head. Have proper talk."</blockquote>

<p>The documentary ends with the young men's own music — bars about pain, about brothers locked away, about police who don't want them to eat. But also about staying in their lane, paving the way, and hoping they can put something there for the boys that maybe they never had.</p>

<blockquote>"I'm just happy to be a part of something bigger. Just maybe put something there for the boys that maybe we never had. Giving back to the community."</blockquote>

<p>Mounty Yarns isn't a program. It's a movement. Built by the young people who needed it most, for the ones coming up behind them.</p>

<blockquote>"So it's very important that you listen to these young people because they are the ones going through it, not the adults."</blockquote>

</article>`,
    summary: 'In Mount Druitt, young people who have survived police violence, child removal, and a justice system that costs $1,700 a day to lock them up are building something of their own. Mounty Yarns is a youth-led movement where First Nations young people break cycles, find belonging, and speak for themselves — many for the first time.',
  },
  {
    title: 'Isaiah - Backyard Activation',
    full_story: `Isaiah Benjamin Sines, a youth worker at Mount Druitt Aboriginal Community Service, describes the Backyard Activation project — a three-year effort to build a safe outdoor space for young people, including a basketball court, gym, Aboriginal flag mural, and yarning circle.

"This space has been in the works for about three years now. A group of kids wanted a basketball court, a gym, and some other things. But today, finally kicking it off."

Isaiah explains why youth involvement is central: "This is for the kids. Without the input, we didn't know what they want. We can build anything here, but they're gonna use it and for them for the future."

The space is designed as a safe place where young people can come with an open mind and "just be kids again." Isaiah's favourite element is the Aboriginal flag painted on the ground.`,
    summary: 'Isaiah Benjamin Sines, a youth worker in Mount Druitt, describes the Backyard Activation project — a three-year community effort to build a youth-led outdoor space with a basketball court, Aboriginal flag mural, and yarning circle.',
  },
  {
    title: 'Shayle McKellar - Youth Justice Interview',
    full_story: `Shayle McKellar, a proud Wangkamarra man from Bourke, is a lived experience consultant and youth worker with Just Reinvest. He completed his HSC in custody and went on to earn his Cert III and IV in Youth Work.

On why young people must be heard: "There's some stuff that I went through in the system that was horrendous. And they wonder why these young people come out and not only have the trauma from — you know, they enter the system as victims, and then they come out as even more victimised people."

On young people's power: "They think they haven't got any. But there's some pretty strong kids out there that are doing amazing things. And they just don't know it because they just think they're going about their daily business and they don't know how powerful they are."

On adult assumptions: "I think a lot of these adults think these young people are just the problems. But I feel like if you sat down and heard their stories, you would have a completely different outlook."

Shayle helped organise Mounty Yarns to give young people the opportunity to have their voice heard: "It's not just about me, it's about a whole community of young people that are going to be able to have their voices heard and make real change."`,
    summary: 'Shayle McKellar, a Wangkamarra man who completed his HSC in custody, speaks about why First Nations young people must be centred in youth justice reform — having experienced the system himself, he now works as a lived experience consultant with Just Reinvest.',
  },
  {
    title: 'Taj - Backyard Activation',
    full_story: `Taj Aga Campbell, 13, from Liverpool/Windsor, shares his experience at the Backyard Activation at Mount Druitt Aboriginal Community Service.

"We're just doing the backyard up. To make it look better for the youth to come here, so they have a better spot."

Taj attends programs at Mounty including cooking and gym programs. His goal is to join the Army — as an engineer or infantry. He's looking forward to playing on the new basketball court and values being around other youth as his favourite part of the space.`,
    summary: 'Taj Campbell, 13, from Liverpool/Windsor, talks about helping build the Backyard Activation at Mount Druitt Aboriginal Community Service and why having a better space for young people matters to him.',
  },
  {
    title: 'Isabella - Backyard Activation',
    full_story: `Isabella, 14, from Seven Hills and a student at Mitchell High School, reflects on the Mounty Yarns community and the Backyard Activation.

On her area: "I don't like how there's a lot of gang violence. Every week there's at least something new. Everyone's got these postcode wars going on. I think they think they're cool but they're not. They're not maturing."

On what's different at Mounty: "The mentors and the youth workers, they're easy to talk to. There's no pressure on talking to them. It's more fun and you don't feel judged. The kids here, we've all got something that connects us. Everyone here are really loving, really happy people. Very open people."

On what sets her apart from kids getting into trouble: "Self-respect. This has helped a lot. Getting people off the street. There's no problem here. Everyone's happy. Good vibe."

Her hope for Mounty Yarns: "I really hope they have bigger growth and more people. More people expressing how they feel and being themselves. No one needs to be judged."`,
    summary: 'Isabella, 14, from Seven Hills, reflects on gang violence in her area and how Mounty Yarns offers something different — a space where young people feel safe, unjudged, and connected to each other.',
  },
  {
    title: 'Amelia - Youth Justice Interview',
    full_story: `Amelia Wyman, a proud Mangpa Guara woman from Wilcannia, shares her perspective on youth leadership and the power of young people's voices.

On why young people must speak up: "Normally young people don't get heard all the very much, like all the time dismissed. Their opinions aren't really appreciated, so it's very important that they get heard."

On leading in her community: "I'm one of the young leaders back at home. I teach dance with my dad's group. The kids, younger kids have a choir. Sometimes we have Desert P Media that comes out and does songs with the kids as well."

On young people's power: "Yes, young people definitely should have more power. They can point out the things that adults don't see. They can catch onto the small things that go unnoticed."

On what adults assume: "Adults think about young children as naive, irresponsible, and stubborn. But young people can do things if they are encouraged and they get nurtured towards that way and they get believed in, then they can also help make a difference."

On attending Mounty Yarns: "Here's a group of people that are talking about the same things that I want to talk about. So here's my chance to go and say something and try and help change it."`,
    summary: 'Amelia Wyman, a proud Mangpa Guara woman from Wilcannia, speaks about youth leadership, teaching dance in her community, and why young people must be believed in and given power to make change.',
  },
  {
    title: 'Archie Darcy - Backyard Activation',
    full_story: `Archie Darcy, a proud Wangkamarra and Camilla man from Bourke and Warren, works as a caseworker at Mounty, having started as a youth worker. He explains the philosophy behind their approach to young people.

On his role: "It's just trying to break cycles for young kids. A lot of young kids deal with a lot of challenges in life. We're basically there to just remove the barriers that are stopping them from being a better version of themselves."

On programs: "We do cooking programs, girls' gym program. We do cultural days and we do boxing programs. We try and mentor a proactive and healthy and positive lifestyle for young fellas."

On the difference from the corrections system: "We don't look at a piece of paper and go, oh, what a piece of paper says about a young person. All young people are good. Sometimes some kids are just in bad situations that are outta their control. We just see the young person as a young person, not as what the system makes 'em out to be."

On paying young people: "Basically reward 'em. When you're out there in the workforce, obviously you get paid for doing it."

On the vision for the space: "A safe space. Culturally it's like a meeting place. We wanna bring a culturally diverse background of any young person and any kind of person here and build a meeting place. Aboriginal people have been doing it for years. It's a togetherness kind of thing."`,
    summary: 'Archie Darcy, a Wangkamarra and Camilla caseworker from Bourke, describes how Mounty Yarns sees young people as individuals rather than case files — breaking cycles by removing barriers and building a culturally grounded meeting place.',
  },
  {
    title: 'Leah - Youth Justice Interview',
    full_story: `Leah, a Hiri D and Camilla woman from Mount Druitt, speaks about youth advocacy and her personal journey from foster care to youth worker.

On why young people should speak up: "If someone else makes a decision for them, it'll be the wrong one or they won't get it right. So I reckon young people should speak up. So they can tell their story, where they come from, what their problems are, how we can help them."

On leading in her community: "We have the Youth Peak that me and Adam are running. It's just helping people — young people who need help, who are in a bad position or just want someone to talk to in general."

On power: "Compared to the government, not a lot. But the more young people that do speak up, I reckon we will get more power."

On adult assumptions: "Probably that we're immature, we're stupid. We do silly things — which is sometimes right. But everyone makes mistakes."

On her motivation: "It's like having a voice for other young people that I didn't have in foster care."

What excites her: "Giving other young people a voice and deciding what they wanna do and making change."`,
    summary: 'Leah, a Hiri D and Camilla woman from Mount Druitt who grew up in foster care, now co-runs Youth Peak with Adam — giving young people the voice she never had, and advocating for young people to make their own decisions.',
  },
  {
    title: 'Polly - Backyard Activation',
    full_story: `Polly, 13, from Blacktown and a Year 8 student at Mitchell High School, describes what she loves about Mounty and her involvement in the Backyard Activation.

On the area: "There are a lot of kids on the street that don't like school. A lot of them just hang around the street. But this is also a good way to get them off the street and start going back to school."

On why she keeps coming back: "I can express myself, I can be myself around these people. I don't have to hide my personality from people."

On the Backyard Activation: "We're building this whole back area into a more open space for outside activities. We have been painting. We're painting the aboriginal flag on the back of one of these containers."

On why the space matters: "It's a nice place to hang out with a lot of people. You can connect, express your ways of how you feel in what you're building and painting. You can connect with each other. You're socializing."

Her goals: "Get a job. Start footy again. Start sport again."`,
    summary: 'Polly, 13, from Blacktown, talks about painting the Aboriginal flag on containers during the Backyard Activation and why Mounty Yarns gives her a rare space to be herself without hiding her personality.',
  },
  {
    title: 'Adam - Youth Justice Interview',
    full_story: `Adam McKellar, a Para Camilla and Wangkamarra man from Bourke, speaks about youth leadership and why young people's voices must drive change in justice policy.

On why young people should speak up: "Because young people are going through all of this stuff and why are the older fellas making choices for the younger fellas when they're the ones going through it?"

On how young people are leading in their communities: Adam is leading policy change work, supporting grief and funerals processes, and building business projects alongside other young people from Mount Druitt.`,
    summary: 'Adam McKellar, a Para Camilla and Wangkamarra man from Bourke, speaks about why young people must lead justice policy — they are the ones living it — and shares the community leadership work he is already doing.',
  },
  {
    title: 'Taleigha - Youth Justice Interview',
    full_story: `Taleigha Glover, a young Biripi woman from Glebe (mob from Kempsey), shares her perspective on youth justice and the importance of young people's agency.

On why young people must speak up: "Because the decisions that are being made aren't working."

On young people leading: She's involved in the Mounty Yarns work and Just Reinvest activities.

On power: "At the moment I think we are making moves to have more control in our lives."

On adult assumptions: "From experience, we're labeled. Troubled."

On her motivation: "I wanted to be a part of just reinvest again and be a part of change."

What excites her: "Being a part of change, motivating the next generation. Sharing our wisdom with the younger ones."`,
    summary: 'Taleigha Glover, a young Biripi woman from Glebe, challenges the decisions being made about young people without them — noting that the current approaches aren\'t working — and speaks about her role in motivating the next generation.',
  },
  {
    title: 'Jaylee - Backyard Activation',
    full_story: `Jaylee Watson, a young person from Mount Druitt, shares their hopes for Mounty Yarns and the community after nearly a year in the program.

On the vision: "Personally Mounty is a pretty beautiful place. Hope to make it a better place. And also just a place for all the youth, younger kids. Just give 'em a place to come to and be interested in and help them out."

On the program: "I'm hoping to influence other kids to join and do some stuff."

On their journey: Starting by coming once every few weeks, Jaylee now attends three or four times a week.

On goals: "To better yourself and achieve more life skills."

On the future: "Kind of wanna help influence kids in that life to do stuff like this. Like a youth worker. But also want to do a bit of singing, making music."

On the Aboriginal community: "Pretty good. Pretty easy, pretty helpful."`,
    summary: 'Jaylee Watson describes growing from occasional visitor to attending Mounty Yarns three or four times a week — and their aspiration to one day become a youth worker and influence other young people.',
  },
  {
    title: 'Tyrese - Youth Justice Interview',
    full_story: `Tyrese, originally from Bourke and recently based in Dubbo, shares his perspective on why young people's voices matter in the youth justice space.

On why young people should speak up: "Sometimes they might have something about them, but it'd be like other people making decisions for 'em instead of them making decisions for themselves. So I think it is very good for the young boys to speak up for themselves."

On leading in communities: "We're given a chance to the younger generation, like a voice that speaks — maybe something like us and another generation never had."

On power: "For the situation that the boys locked up in, they probably wouldn't have a lot of power. Probably maybe none. 'Cause everyone's making decisions for 'em, like telling them what to do."

On adult assumptions: "Probably based on what they see. Like that young fella doing bad — they probably got nothing good to say about him. They see him doing good, they'd be like, skying him."

On why he came: "I'm just happy to be a part of something bigger, help them. Just maybe put something there for the boys that maybe we never had. Giving back to the community."`,
    summary: 'Tyrese, from Bourke and Dubbo, speaks about the lack of power young people have in the justice system — where everyone makes decisions for them — and his desire to give back by building what previous generations never had.',
  },
  {
    title: 'Tyrese - 10/31/2025',
    full_story: 'Transcript recorded 31 October 2025. Content not yet available.',
    summary: 'A recorded interview with Tyrese from 31 October 2025 as part of the Mounty Yarns Empathy Ledger documentation.',
  },
];

async function jhFetch(path, options = {}) {
  const res = await fetch(`${JH_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: JH_KEY,
      Authorization: `Bearer ${JH_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JH API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('Starting Mounty Yarns sync...\n');

  // Check what already exists
  const existing = await jhFetch(
    `alma_stories?select=id,title&linked_organization_ids=cs.%7B${MOUNTY_YARNS_ORG_ID}%7D`
  );
  const existingTitles = new Set(existing.map((s) => s.title));
  console.log(`Found ${existing.length} existing Mounty Yarns stories in JH`);
  if (existing.length > 0) {
    existing.forEach((s) => console.log(`  - ${s.title}`));
  }

  let inserted = 0;
  let skipped = 0;

  for (const story of stories) {
    if (existingTitles.has(story.title)) {
      console.log(`SKIP (exists): ${story.title}`);
      skipped++;
      continue;
    }

    const record = {
      title: story.title,
      full_story: story.full_story,
      summary: story.summary,
      story_type: 'community_voice',
      status: 'published',
      region_slug: 'mount-druitt',
      linked_organization_ids: [MOUNTY_YARNS_ORG_ID],
      impact_areas: ['youth-justice', 'community-leadership'],
      published_at: new Date().toISOString(),
    };

    try {
      const result = await jhFetch('alma_stories', {
        method: 'POST',
        body: JSON.stringify(record),
      });
      console.log(`INSERTED: ${story.title} (id: ${result[0]?.id})`);
      inserted++;
    } catch (err) {
      console.error(`ERROR inserting "${story.title}": ${err.message}`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch(console.error);
