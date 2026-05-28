import Link from 'next/link';
import { ContributeForm } from './ContributeForm';
import { ArrowLeft } from 'lucide-react';

const DISPLAY = "'Cormorant Garamond', Georgia, serif";

export const metadata = {
  title: 'Contribute · Justice Matrix',
};

export default function ContributePage() {
  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
      {/* HERO */}
        <section
          style={{ background: 'radial-gradient(circle at 30% 0%, #5a2d74, #38184d 60%, #2c1240)' }}
          className="relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
            <Link
              href="/justice-matrix"
              className="inline-flex items-center gap-2 text-[#eadff2] hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to the matrix
            </Link>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d3b583] mb-4">
              Justice Matrix · Contribute
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white max-w-3xl mb-4"
            >
              Add a case or campaign.
            </h1>
            <p className="text-[#eadff2] text-base md:text-lg max-w-2xl">
              Practitioners, NGOs, clinics, and academics keep this matrix current. Send what you have and a curator will review it. Nothing publishes without that review.
            </p>
          </div>
        </section>

        {/* BODY */}
        <section className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <div className="mb-8 text-sm leading-7" style={{ color: '#584b40' }}>
            <p>
              Submit one case or campaign per form. If you have a batch, email the curator directly rather than filling this in repeatedly. The fields below mirror what we publish on the public profile, so the more grounded what you write here, the less back-and-forth before it lands in the matrix.
            </p>
          </div>
          <ContributeForm />
          <p className="mt-6 text-xs text-center" style={{ color: '#7d5f3d' }}>
            Submissions are stored as pending review in the same queue an admin uses to triage scanner-discovered items. No item appears in the live matrix without admin approval.
          </p>
      </section>
    </main>
  );
}
