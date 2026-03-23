import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/send';

const SITE = 'https://justicehub.com.au';

/**
 * GET /api/cron/contained/post-experience
 *
 * Timed email sequence for people who walked through THE CONTAINED.
 * Checks community_reflections timestamps and sends:
 *   - 24hr: Evidence email (while emotion is fresh)
 *   - 7 days: Social proof compilation (X people walked through this week)
 *   - 30 days: Impact update (remember what you felt?)
 *
 * The immediate follow-up (1hr) is handled by the reaction route itself.
 * Runs daily via cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient() as any;
    const now = new Date();
    const results = { day1_sent: 0, day7_sent: 0, day30_sent: 0, errors: 0, skipped: 0 };

    // Get reflections that have an email (stored in metadata or linked via GHL)
    // community_reflections stores name + reflection text
    // We need to cross-reference with newsletter_subscriptions or GHL contacts
    // For now, query reflections with metadata that includes email
    const { data: reflections } = await supabase
      .from('community_reflections')
      .select('id, name, reflection, created_at, metadata')
      .not('metadata->email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!reflections || reflections.length === 0) {
      return NextResponse.json({ success: true, message: 'No reflections with email', ...results });
    }

    for (const ref of reflections) {
      const email = ref.metadata?.email;
      if (!email) { results.skipped++; continue; }

      const createdAt = new Date(ref.created_at);
      const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const sent = ref.metadata?.post_experience_sent || [];
      const visitorName = ref.name || 'there';

      // 24-hour evidence email
      if (daysSince >= 1 && daysSince < 3 && !sent.includes('day1')) {
        const result = await sendEmail({
          to: email,
          subject: 'The evidence behind what you felt',
          preheader: '981 programs. Exposed in three rooms.',
          body: `Hey ${visitorName},

Yesterday you walked through THE CONTAINED. We wanted to follow up with something concrete.

THE EVIDENCE

What you felt in Room 1 isn't just design. Every stat on those walls comes from verified government data:

→ $4,250 per day to lock one child in detention
→ 85% reoffending rate within 12 months of release
→ First Nations children are 17x more likely to be locked up

WHAT ACTUALLY WORKS

Room 2 showed you the alternative. Here's the data behind it:

→ 981 verified community programs across Australia
→ Programs like Diagrama achieve reoffending rates below 14%
→ Cost per young person: a fraction of detention

You can explore all of this yourself:
→ ${SITE}/intelligence/interventions

THE HARD QUESTION

Room 3 asked you to consider: what if the money we spend on locking kids up went to the communities already doing this work?

That's not hypothetical. It's a policy choice. And your voice matters in making it.

→ Nominate a decision maker: ${SITE}/contained#nominate
→ Write to your MP: ${SITE}/contained/act

— The JusticeHub Team`,
        });

        if (result) {
          await supabase
            .from('community_reflections')
            .update({
              metadata: { ...ref.metadata, post_experience_sent: [...sent, 'day1'] },
            })
            .eq('id', ref.id);
          results.day1_sent++;
        } else {
          results.errors++;
        }
      }

      // 7-day social proof email
      if (daysSince >= 7 && daysSince < 14 && !sent.includes('day7')) {
        // Get weekly visitor count
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: weeklyVisitors } = await supabase
          .from('community_reflections')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo);

        // Get total nominations
        const { count: totalNominations } = await supabase
          .from('campaign_alignment_entities')
          .select('id', { count: 'exact', head: true })
          .eq('outreach_status', 'nominated');

        const result = await sendEmail({
          to: email,
          subject: "You're not the only one who felt it",
          preheader: `${weeklyVisitors || 0} people walked through THE CONTAINED this week.`,
          body: `Hey ${visitorName},

A week ago you walked through THE CONTAINED. Here's what happened since.

THIS WEEK

→ ${weeklyVisitors || 0} people walked through the container
→ ${totalNominations || 0} decision makers have been nominated
→ The evidence keeps growing

You're part of a community that believes the data should be impossible to ignore.

WHAT PEOPLE ARE SAYING

People who walked through are sharing their experience with their networks. Some wrote to their MPs. Some nominated leaders in their community. Some just told a friend.

Every action counts.

STILL WANT TO DO SOMETHING?

→ Share your experience: ${SITE}/contained/tour/social
→ Nominate someone who needs to see this: ${SITE}/contained#nominate
→ Explore the evidence yourself: ${SITE}/intelligence/interventions

— The JusticeHub Team`,
        });

        if (result) {
          await supabase
            .from('community_reflections')
            .update({
              metadata: { ...ref.metadata, post_experience_sent: [...sent, 'day7'] },
            })
            .eq('id', ref.id);
          results.day7_sent++;
        } else {
          results.errors++;
        }
      }

      // 30-day impact update
      if (daysSince >= 30 && daysSince < 45 && !sent.includes('day30')) {
        // Get total reflections count
        const { count: totalReflections } = await supabase
          .from('community_reflections')
          .select('id', { count: 'exact', head: true });

        const result = await sendEmail({
          to: email,
          subject: 'Remember what you felt?',
          preheader: 'One month later. The movement is growing.',
          body: `Hey ${visitorName},

A month ago you walked through THE CONTAINED.

We wanted you to know: it's working.

SINCE YOU WALKED THROUGH

→ ${totalReflections || 0} people have shared their reflections
→ The evidence database has grown — 981+ verified programs and counting
→ Decision makers are being nominated and invited across Australia

Your visit was part of something bigger. The data doesn't change. The evidence doesn't go away. And the more people who see it, the harder it is for anyone to pretend they didn't know.

ONE MORE THING YOU CAN DO

If you haven't already, nominate one person — a politician, a CEO, a board member, a journalist — someone whose decision affects young people.

We'll personally invite them to walk through. And when they do, they'll know you sent them.

→ ${SITE}/contained#nominate

Thank you for being part of this.

— The JusticeHub Team`,
        });

        if (result) {
          await supabase
            .from('community_reflections')
            .update({
              metadata: { ...ref.metadata, post_experience_sent: [...sent, 'day30'] },
            })
            .eq('id', ref.id);
          results.day30_sent++;
        } else {
          results.errors++;
        }
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('[Post-experience cron] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
