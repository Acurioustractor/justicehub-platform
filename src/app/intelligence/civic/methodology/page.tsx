import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Civic Intelligence · Methodology | JusticeHub',
  description: 'How every claim on /intelligence/civic was computed, who is in the Tier 1 universe, what we retired, and what v1 does not claim.',
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10">
          <Link href="/intelligence/civic" className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 mb-4">
            <ChevronLeft className="w-3 h-3" /> Back to Civic Intelligence
          </Link>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-mono mb-2">v1 · {new Date().toISOString().slice(0, 10)}</p>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">How we read the access gap</h1>
          <p className="mt-3 text-lg text-stone-700">
            A page that tells funders and frontline services where youth justice money meets a closed door.
          </p>
        </header>

        <article className="prose prose-stone max-w-none">
          <p className="text-stone-700">
            This methodology document exists so any reader can walk every claim on <Link href="/intelligence/civic" className="text-stone-900 underline underline-offset-2">/intelligence/civic</Link> back to a row in our database, a Hansard speech, a published diary entry, or an oversight body’s own recommendation. If a claim cannot be traced, it should not be on the page.
          </p>

          <Section id="what-we-measure" title="What we measure">
            <p>Three chapters.</p>
            <p><strong>Access.</strong> Who delivers youth justice programs on the ground, and who gets meetings and contracts from the ministers who set youth justice policy. The question is not "how many meetings" but "which kinds of organisations get the meetings, and which kinds get the work."</p>
            <p><strong>Promises.</strong> What governments have publicly committed to in charters, election platforms, and parliamentary statements, and what state of completion those commitments are in. The question is not "did they say it" but "did the words travel to action."</p>
            <p><strong>Oversight.</strong> What independent reviewers have recommended, and the disposition of those recommendations: accepted, deferred, rejected, silent. The question is not "what does the evidence say" but "what happens to the evidence after the report lands on the desk."</p>
          </Section>

          <Section id="tier-1-universe" title="The Tier 1 universe">
            <p>Australia has roughly six hundred organisations doing some kind of youth-justice-adjacent work. Some are running on-Country diversion. Some are publishing white papers. Some are charging consulting fees. Tier 1 separates one from the others.</p>
            <p><strong>Tier 1: Primary frontline youth justice service.</strong> An Aboriginal community-controlled organisation, community-based not-for-profit, or small social-enterprise hybrid whose <em>primary</em> delivered service is one of: pre-court diversion, bail support, on-Country mentoring, post-release reintegration, family-led conferencing, legal first-response for under-eighteens. The organisation must employ frontline workers, hold relationships with young people, and operate in or adjacent to a community affected by youth criminalisation.</p>
            <p><strong>Tier 2: Adjacent service.</strong> Peak bodies, statewide legal services, advocacy organisations, research centres that work alongside Tier 1 but do not themselves carry the daily case load.</p>
            <p><strong>Tier 3: System actors.</strong> Consultancies, government departments, large generalist NFPs without a primary YJ stream, funders.</p>
            <p>A v1 ship visualises Tier 1 only. Tier 2 and Tier 3 are documented and present in the underlying data but do not anchor the public ratio. The Tier 1 list is hand-confirmed; the Tier 2 and Tier 3 lists are agent-proposed only.</p>
          </Section>

          <Section id="tier-1-curation" title="How we built the Tier 1 list">
            <p>For v1, Tier 1 covers the Northern Territory and Queensland.</p>
            <ol>
              <li><strong>Universe.</strong> All organisations linked by <code>alma_interventions.operating_organization_id</code> where <code>verification_status != 'ai_generated'</code>, filtered to <code>state = 'NT'</code> or <code>state = 'QLD'</code>. Three hundred and thirty-eight candidates on 2026-05-15.</li>
              <li><strong>Agent proposal.</strong> An LLM reviewed each candidate against the Tier 1 definition above, using the organisation’s name, ABN, registry record, indigenous-org flag, ALMA intervention categories, and any free-text description on file. Output: proposed tier, proposed sector category, confidence score, evidence snippet.</li>
              <li><strong>Human sweep.</strong> Every candidate was reviewed and confirmed or overridden in a single admin session by the JusticeHub team. Confirmed Tier 1 entries are visible on the page; unconfirmed entries do not contribute to claims.</li>
            </ol>
          </Section>

          <Section id="access-ratio" title="The access ratio: what it is and what it is not">
            <p>The headline ratio compares <strong>money</strong> not <strong>meetings</strong>. Specifically:</p>
            <pre className="bg-stone-900 text-stone-100 text-sm p-4 rounded overflow-x-auto"><code>access_ratio_qld = sum(YJ-relevant consultancy spend in QLD)
                  / sum(YJ-relevant grants to Tier 1 frontline orgs in QLD)</code></pre>
            <p>A ratio of N reads as: <em>"for every dollar of QLD government youth justice funding that reached a confirmed primary frontline organisation, the government spent N dollars on consulting and advisory firms doing youth-justice-related work."</em></p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Why funding and not meetings</h3>
            <p>We originally designed this page around a meeting-frequency ratio (consultancy meetings vs frontline meetings in the ministerial diary register). The empirical work on 2026-05-15 showed this is not supportable. The QLD diary register contains 1,728 entries; only two are with consulting firms (both Ernst & Young, neither with the youth justice minister). The 160 entries that match a youth-justice keyword filter contain zero consultancy meetings.</p>
            <p>The likely explanation: consultancies engaged on youth justice work are procured through departmental procurement channels rather than through ministerial meetings. Their advice reaches the minister via the Director-General, which appears in the diary register as a departmental meeting. The diary register is therefore an honest record of who-met-the-minister but a poor proxy for who-shapes-the-policy.</p>
            <p>Procurement spend is the honest proxy. It is also harder to spin away. Every dollar lives in a published contract.</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">How we built the funding ratio</h3>
            <ol>
              <li><strong>Universe.</strong> All <code>justice_funding</code> rows where <code>state = 'QLD'</code> AND the recipient name matches one of: consulting, advisory, Deloitte, KPMG, PwC, Ernst &amp; Young, McKinsey, Boston Consulting, Accenture, or other named Big-4 / Big-3 firm. 433 rows on 2026-05-15.</li>
              <li><strong>YJ-relevance pass.</strong> An LLM reviewed each row's recipient + program name + project description and classified it as <code>direct_yj_service</code>, <code>yj_research_or_review</code>, <code>yj_advisory_consultancy</code>, <code>yj_infrastructure_or_capital</code>, <code>broader_justice_includes_yj</code>, or <code>not_yj_related</code>.</li>
              <li><strong>Human confirmation.</strong> Every classified row was reviewed in the admin sweep workflow. Only rows with <code>confirmed_at IS NOT NULL</code> count toward the ratio.</li>
              <li><strong>Numerator.</strong> Sum of <code>amount_dollars</code> for confirmed YJ-relevant consultancy rows in QLD.</li>
              <li><strong>Denominator.</strong> Sum of <code>amount_dollars</code> for all <code>justice_funding</code> rows where <code>alma_organization_id</code> is a confirmed Tier 1 frontline org in QLD.</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-2">What the meeting data still tells us</h3>
            <p>The diary data is not discarded. The Access chapter carries a secondary claim: the youth justice minister meets internal departmental staff approximately twenty times for every one meeting with a Tier 1 frontline organisation. This is supportable on the data we have. It complements but does not replace the funding ratio.</p>
          </Section>

          <Section id="promises" title="The promises tracker">
            <p>Promises come from three sources.</p>
            <ul>
              <li><code>civic_charter_commitments</code>: public charter pledges and election commitments.</li>
              <li><code>civic_hansard</code>: ministerial statements made in Parliament naming a specific deliverable, filtered for YJ relevance.</li>
              <li><code>funding_outcome_commitments</code>: funding commitments with named outcomes.</li>
            </ul>
            <p>Each promise carries a status: <code>made</code>, <code>in_progress</code>, <code>delivered</code>, <code>quietly_dropped</code>, or <code>unknown</code>. Status is set by human review against publicly available evidence: budget papers, departmental reports, freedom-of-information disclosures. Any promise with <code>unknown</code> status is flagged on the page as "no public evidence of action."</p>
          </Section>

          <Section id="oversight" title="The oversight ledger">
            <p>Oversight recommendations come from <code>oversight_recommendations</code>. The page surfaces:</p>
            <ul>
              <li>Recommendations from named bodies: Queensland Sentencing Advisory Council, NT Children’s Commissioner, the Royal Commission into the Protection and Detention of Children in the Northern Territory.</li>
              <li>The government’s published disposition: <code>accepted</code>, <code>accepted_in_principle</code>, <code>deferred</code>, <code>rejected</code>, <code>no_response</code>.</li>
              <li>Time elapsed since the recommendation was published.</li>
            </ul>
            <p>The page does not editorialise. The dispositions are the government’s own words.</p>
          </Section>

          <Section id="citations" title="Sources by record">
            <p>Every snapshot statistic on the page has a <strong>Cite</strong> button. Clicking it copies a citation in the form:</p>
            <blockquote className="border-l-4 border-stone-300 pl-4 italic text-stone-700">
              {`"{stat}. Source: JusticeHub Civic Intelligence, computed {date}. Methodology: /intelligence/civic/methodology#{claim_id}"`}
            </blockquote>
            <p>The underlying claim row carries:</p>
            <ul>
              <li>The SQL or computational process that produced the value.</li>
              <li>The list of source record IDs used in the computation.</li>
              <li>The list of source document URLs (Hansard URLs, oversight report PDFs, charter pages).</li>
              <li>The timestamp the claim was last computed.</li>
            </ul>
            <p>Anyone can request the underlying record set: <a href="mailto:civic@justicehub.com.au" className="underline">civic@justicehub.com.au</a>.</p>
          </Section>

          <Section id="retired" title="What we retired and why">
            <p>Two claims were retired between the design brief and ship day. Both retirements are documented here so the methodological evolution is visible, not hidden.</p>
            <p><strong>Retired claim 1:</strong> "678 organisations deliver programs, ministers met 192 organisations, overlap = 10." This conflated the full uncurated YJ org universe (Tier 1 plus Tier 2 plus Tier 3) with the meeting register. Many of the "192 organisations met" are government departments or consulting firms, not service deliverers. The overlap number was therefore misleading. Replaced by the tiered ratio framing.</p>
            <p><strong>Retired claim 2:</strong> meeting-frequency ratio between consultancies and frontline orgs. The original design intended a ratio of consultancy meetings to frontline meetings in the ministerial diary register. Empirical work on 2026-05-15 showed the diary register contains only two consultancy meetings across 1,728 entries (both Ernst &amp; Young, neither with the youth justice minister). The framing was not supportable on diary data. Replaced by the funding ratio (procurement spend). The dept-to-frontline meeting asymmetry survives as a secondary claim.</p>
            <p>Both retirements were the same kind of decision: the data did not match the design intent, so the design moved to match the data. The page reports what the data can defend.</p>
          </Section>

          <Section id="not-claimed" title="What v1 does not claim">
            <p>This page does not claim to be a complete map of Australian youth justice. v1 covers NT and QLD only. NSW, Victoria, WA, SA, Tasmania, and the ACT are marked as "coming v2". The data exists in our ingest pipeline but has not been through the curation and tagging process that Tier 1 demands.</p>
            <p>This page also does not claim Tier 1 status for any organisation that does not appear on the published list. An organisation can be brilliant frontline-relevant work and not be on the v1 list, either because the curation has not reached it yet, or because the available registry data was insufficient to confirm primary-frontline status.</p>
          </Section>

          <Section id="hostile-reader" title="Hostile-reader preempt">
            <p>The strongest attacks on a page like this:</p>
            <ol>
              <li><strong>"Your Tier 1 list is arbitrary."</strong> It is hand-curated against a written definition by named reviewers. The list is public; the definition is on this page. Disagreement is welcome and goes to <a href="mailto:civic@justicehub.com.au" className="underline">civic@justicehub.com.au</a> with proposed additions or removals.</li>
              <li><strong>"Consulting spend is different in kind. It's procurement, not capture."</strong> True. But the funding ratio is not a claim of capture. It is a claim about where dollars flow when the policy is being shaped. Readers are free to draw their own inferences.</li>
              <li><strong>"The overlap number you retired was the whole point. What changed?"</strong> The overlap was built on an uncurated org universe. The funding ratio is tighter and more defensible. Both retirements are documented above so the methodological shift is visible.</li>
              <li><strong>"The data is incomplete."</strong> Yes. v1 ships NT and QLD only. We name the gaps because pretending they don't exist is what gets pages like this discredited.</li>
            </ol>
          </Section>

          <Section id="versioning" title="Versioning">
            <p>This methodology is versioned. The v1 document is frozen on ship day; subsequent revisions land at <code>/intelligence/civic/methodology?v=N</code>. Every snapshot claim carries the version it was computed under.</p>
          </Section>

          <p className="mt-12 text-sm text-stone-500 font-mono">Last updated {new Date().toISOString().slice(0, 10)}. Computed claims under v1.</p>
        </article>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-3 scroll-mt-20">
        <a href={`#${id}`} className="hover:underline underline-offset-4">{title}</a>
      </h2>
      {children}
    </section>
  );
}
