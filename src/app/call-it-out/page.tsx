'use client';

import { Navigation, Footer } from '@/components/ui/navigation';
import { CallItOutForm } from '@/components/forms/call-it-out-form';
import { AlertTriangle, MapPin, Shield } from 'lucide-react';
import { PreviewGate } from '@/components/PreviewGate';

export default function CallItOutPage() {
  return (
    <PreviewGate title="Call It Out" subtitle="Report discrimination — preview access">
      <div className="min-h-screen bg-white">
        <Navigation />

        <main className="page-content">
          {/* Hero */}
          <section className="border-b-2 border-black bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="container-justice py-16">
              <p className="font-mono uppercase tracking-[0.4em] text-xs text-gray-600 mb-4">
                Community Data Sovereignty &bull; Systemic Accountability
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div>
                  <h1 className="headline-truth mb-6">
                    CALL IT OUT
                    <span className="block text-3xl md:text-4xl text-black mt-2">
                      Make invisible discrimination visible.
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
                    Every report adds to a collective picture of systemic racism in Australia.
                    Your data is aggregated and anonymous — it never identifies you, but it builds
                    the evidence communities need to demand change.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-2 border-black bg-white p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-black" />
                        <div className="font-bold uppercase tracking-wide text-sm">Privacy first</div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Individual reports are never published. Only aggregated counts appear on the
                        heatmap. No IP logging.
                      </p>
                    </div>
                    <div className="border-2 border-black bg-white p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-black" />
                        <div className="font-bold uppercase tracking-wide text-sm">Mapped by region</div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Reports are aggregated by SA3 statistical area and overlaid on the Community
                        Map as a racism heatmap.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-2 border-black bg-gray-50 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    <div>
                      <div className="font-bold uppercase tracking-wide text-sm text-black">
                        If you are in immediate danger
                      </div>
                      <p className="text-sm text-gray-600">Call 000 for emergency services.</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      <strong>13YARN</strong> (13 92 76) — Aboriginal &amp; Torres Strait Islander
                      crisis support, 24/7
                    </p>
                    <p>
                      <strong>Anti-Discrimination NSW</strong> — 1800 670 812
                    </p>
                    <p>
                      <strong>Australian Human Rights Commission</strong> — 1300 369 711
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Form */}
          <section className="border-b-2 border-black bg-white">
            <div className="container-justice py-16">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-black mb-2">Report an incident</h2>
                <p className="text-sm text-gray-600 mb-8">
                  Only the system type and consent are required. Share as much or as little as you
                  feel comfortable with.
                </p>
                <CallItOutForm />
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="bg-gray-50">
            <div className="container-justice py-16">
              <h2 className="text-2xl font-bold text-black mb-8">How your report is used</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-black bg-white p-6">
                  <div className="text-3xl font-bold text-black mb-2">1</div>
                  <h3 className="font-bold uppercase tracking-wide text-sm mb-2">You submit</h3>
                  <p className="text-sm text-gray-700">
                    Your report is saved with &ldquo;pending&rdquo; status. Individual details are
                    only visible to JusticeHub moderators.
                  </p>
                </div>
                <div className="border-2 border-black bg-white p-6">
                  <div className="text-3xl font-bold text-black mb-2">2</div>
                  <h3 className="font-bold uppercase tracking-wide text-sm mb-2">We review</h3>
                  <p className="text-sm text-gray-700">
                    Our team checks for spam and validates the report. Approved reports are included
                    in aggregated statistics.
                  </p>
                </div>
                <div className="border-2 border-black bg-white p-6">
                  <div className="text-3xl font-bold text-black mb-2">3</div>
                  <h3 className="font-bold uppercase tracking-wide text-sm mb-2">Map updates</h3>
                  <p className="text-sm text-gray-700">
                    The Racism Heatmap on the Community Map shows anonymous counts by region and
                    system type. Your report joins the collective evidence.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PreviewGate>
  );
}
