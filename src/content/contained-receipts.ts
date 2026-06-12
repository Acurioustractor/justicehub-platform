/**
 * CONTAINED receipt emails — the ONLY automated sends in the capture funnel.
 * Used by /api/ghl/register and /api/contained/nominations, and rendered
 * verbatim on /admin/contained/flow so what you read there is what people get.
 */

export interface ReceiptEmail {
  subject: string;
  preheader: string;
  body: string;
}

const SITE = 'https://justicehub.com.au';

export function eoiReceipt(firstName: string): ReceiptEmail {
  return {
    subject: 'Your expression of interest is in',
    preheader: 'The slots are few and the triage is human.',
    body: `${firstName},

Your expression of interest for CONTAINED Adelaide is in.

Here is the honest version: the container holds one person at a time, thirty minutes each, four days. Most people who ask will not get inside. That is the point. Detention is easy to get into. The alternative should not be.

Every EOI is read by a person, not a filter. If a place opens for you, the invitation comes personally, with a time and everything you need.

While you wait, two things you can do that matter as much as walking through:

NOMINATE the person whose decisions touch children's lives. A magistrate, an MP, a CEO. We make the personal invitation: ${SITE}/contained/eoi

STAND WITH IT if you want CONTAINED in your city next.

You can't unknow what you're about to know.

The CONTAINED team at JusticeHub`,
  };
}

export function supporterReceipt(firstName: string): ReceiptEmail {
  return {
    subject: "You're standing with it",
    preheader: 'Here is how your support becomes the next city.',
    body: `${firstName},

You're standing with CONTAINED. That matters more than it might feel like from where you sit.

The machine exists: one container, three rooms, thirty minutes that change how people vote, fund, sentence and report. A tour stop costs $30K. A new container costs $50-70K. Backing extends it; invitations multiply it.

What happens next: a real person reads what you sent and follows up about the way you offered to stand with it: funding, your city, partnership, media or spreading the word.

Two doors you can open today:

NOMINATE the decision-maker who needs the thirty minutes: ${SITE}/contained/eoi

FORWARD this to one person who would never normally come to this.

You can't unknow what you know now.

The CONTAINED team at JusticeHub`,
  };
}

export function nominatorReceipt(opts: {
  nominatorName: string;
  nomineeName: string;
  nomineeTitle?: string | null;
  nomineeOrg?: string | null;
  reason?: string | null;
  nominationCount: number;
}): ReceiptEmail {
  const { nominatorName, nomineeName, nomineeTitle, nomineeOrg, reason, nominationCount } = opts;
  const tileParams = new URLSearchParams({ name: nomineeName });
  if (nomineeTitle) tileParams.set('title', nomineeTitle);
  if (reason) tileParams.set('reason', reason);
  const tileUrl = `${SITE}/api/contained/nomination-tile?${tileParams.toString()}`;
  return {
    subject: 'Your nomination has been received',
    preheader: `You nominated ${nomineeName} for CONTAINED experience.`,
    body: `Thank you, ${nominatorName}.

Your nomination has been received.

You nominated ${nomineeName}${nomineeOrg ? ` (${nomineeOrg})` : ''} to experience CONTAINED.

${reason ? `Your reason: "${reason}"` : ''}

${nominationCount > 1 ? `${nominationCount} people have now nominated ${nomineeName}. The pressure is building.` : ''}

WHAT HAPPENS NEXT
Our team reviews every nomination. When CONTAINED arrives in their city, we'll reach out with a personal invitation backed by your endorsement.

The more people who nominate the same leader, the harder it is to ignore.

MAKE IT PUBLIC
We made you a share tile with ${nomineeName}'s name on it. Download it, post it, tag them:
${tileUrl}

Share the nomination link: ${SITE}/contained#nominate

The JusticeHub Team`,
  };
}
