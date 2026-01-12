import Link from 'next/link';
import {
  BookOpen,
  Download,
  FileCode,
  FilePlus,
  FileJson,
  FileText,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wrench
} from 'lucide-react';

const steps = [
  {
    title: 'Get an API key (1 minute)',
    body: 'We issue pilot keys per partner. Keep it secret; send it in the x-api-key header.',
    icon: ShieldCheck,
  },
  {
    title: 'Post your org + service',
    body: 'Send one JSON payload with organization + service + source metadata. We dedup by slug/website/source URL.',
    icon: PlugZap,
  },
  {
    title: 'Verify and export',
    body: 'Pull your records with GET /api/clearinghouse and export CSV for funders or internal QA.',
    icon: Wrench,
  },
  {
    title: 'Tell the story',
    body: 'We attribute to your system, keep community ownership, and publish impact summaries.',
    icon: Sparkles,
  },
];

const codeExample = `
curl -X POST https://justicehub.vercel.app/api/clearinghouse \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_KEY' \\
  -d @clearinghouse-sample-payload.json

# Submit a document (PDF/Markdown metadata)
curl -X POST https://justicehub.vercel.app/api/clearinghouse/documents \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_KEY' \\
  -d @clearinghouse-doc-sample.json

# List your records (JSON)
curl -H 'x-api-key: YOUR_KEY' "https://justicehub.vercel.app/api/clearinghouse?source=alternativefirstresponders.com.au&status=pending&page=1&limit=100"

# Export CSV for funders
curl -H 'x-api-key: YOUR_KEY' -o export.csv "https://justicehub.vercel.app/api/clearinghouse?source=alternativefirstresponders.com.au&format=csv"
`.trim();

const tips = [
  'Stay small: start with 5–10 records to check dedup + mapping.',
  'Use your system URL or record_id for traceability in metadata.',
  'Include at least one contact field (email or phone) and a website if available.',
  'If you are novice, use the CSV template; if you are advanced, wire into your cron job.',
  'We recommend staging against localhost:3000 before prod.',
];

export default function ClearinghouseHowToPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="header-offset">
        {/* Hero */}
        <section className="border-b-2 border-black bg-gradient-to-br from-yellow-50 to-blue-50 py-16">
          <div className="container-justice">
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white font-bold w-fit">
                <FileText className="h-4 w-4" /> Clearinghouse How-To
              </span>
              <h1 className="headline-truth">Share services without duplication</h1>
              <p className="text-xl text-gray-700 max-w-3xl leading-relaxed">
                A simple, attribution-first API to publish organizations and services into JusticeHub, with CSV/JSON exports and built-in dedup. Designed for both non-technical partners and experienced engineers. All endpoints require your <code>x-api-key</code>.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/clearinghouse-postman-collection.json"
                  className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-all"
                  download
                >
                  <Download className="h-4 w-4" />
                  Download Postman Collection
                </a>
                <a
                  href="/clearinghouse-sample-payload.json"
                  className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                  download
                >
                  <FileJson className="h-4 w-4" />
                  Sample JSON Payload
                </a>
                <a
                  href="/clearinghouse-sample.csv"
                  className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                  download
                >
                  <FileCode className="h-4 w-4" />
                  CSV Template
                </a>
                <a
                  href="/clearinghouse-doc-sample.json"
                  className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-all"
                  download
                >
                  <FilePlus className="h-4 w-4" />
                  Document Payload
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.title} className="border-2 border-black bg-white p-6 hover:shadow-brutal transition-all">
                  <step.icon className="h-8 w-8 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Quick Start */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border-2 border-black bg-white p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 font-bold mb-3">
                  <BookOpen className="h-4 w-4" />
                  For beginners
                </div>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Download the CSV template and fill in your rows.</li>
                  <li>Email it to your JusticeHub contact, or import via Postman using the sample payload.</li>
                  <li>Use the CSV export endpoint to review what landed in the clearinghouse.</li>
                </ol>
                <p className="mt-4 text-sm text-gray-600">
                  Tip: start with 5 rows to confirm mapping, then bulk send. We attribute every record to your source system.
                </p>
              </div>

              <div className="border-2 border-black bg-white p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-900 font-bold mb-3">
                  <FileCode className="h-4 w-4" />
                  For engineers
                </div>
                <p className="text-gray-700 mb-3">
                  Wire your backend job to POST once per org/service. Keep your canonical IDs in `source.record_id` and URLs in `source.url`. We respond with our canonical IDs for future reference.
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto border-2 border-black">
{codeExample}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4">Quality + attribution checklist</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="border-2 border-black bg-white p-6">
                <h3 className="font-bold mb-2">Minimal fields</h3>
                <p className="text-gray-700 mb-2">Required: source.system, organization.name, service.name.</p>
                <p className="text-gray-700">Strongly recommended: website, contact email/phone, city/state.</p>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <h3 className="font-bold mb-2">Attribution & trust</h3>
                <p className="text-gray-700 mb-2">We keep your `source.system`, `record_id`, and URLs so users can see where data came from.</p>
                <p className="text-gray-700">For First Nations data, we respect community ownership; include `submitted_by` for contact.</p>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <h3 className="font-bold mb-2">Common pitfalls</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap / documents */}
        <section className="section-padding border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border-2 border-black bg-white p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 font-bold mb-3">
                  <Upload className="h-4 w-4" />
                  Document endpoint (live)
                </div>
                <p className="text-gray-700 mb-3">
                  POST docs to <code>/api/clearinghouse/documents</code> with either a PDF URL or raw markdown content. Required: <code>source.system</code>, <code>document.title</code>, and one of <code>document.url</code> or <code>document.content</code>.
                </p>
                <p className="text-gray-700 mb-3">
                  Dedup rules: first by <code>document.url</code>, then <code>source.record_id</code>, then <code>source.url</code>. CSV export: <code>/api/clearinghouse/documents?source=your-system&format=csv</code>.
                </p>
                <p className="text-gray-700">
                  Use it for HearMeOut templates, Call It Out protocols, or Alternative First Responders playbooks. Attribution is preserved via <code>source_system</code> and <code>source_url</code>.
                </p>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-900 font-bold mb-3">
                  <Users className="h-4 w-4" />
                  Who to contact
                </div>
                <p className="text-gray-700 mb-3">
                  Onboarding lead: George Newhouse (National Justice Project). For keys, email <a className="underline font-semibold" href="mailto:hello@justicehub.org.au">hello@justicehub.org.au</a>.
                </p>
                <p className="text-gray-700">
                  We can co-pilot your first 10 records live on a call, then you automate the rest.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Research nods */}
        <section className="section-padding border-b-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-3">Patterns we copied from the best</h2>
            <p className="text-gray-700 max-w-4xl">
              Inspired by open data playbooks (NYC OpenRefine flows, UK G-Cloud CSV intakes) and charity clearinghouses (Infoxchange bulk uploads). Simple templates, small pilots, visible attribution, and fast feedback keep data trustworthy.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
