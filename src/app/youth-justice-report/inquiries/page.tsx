import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { Scale, ExternalLink, FileText, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getInquiries() {
  const supabase = createServiceClient();

  const { data: inquiries, error } = await supabase
    .from('historical_inquiries')
    .select('*')
    .order('year_published', { ascending: false });

  return inquiries || [];
}

// Seed some sample inquiries if the table is empty
const sampleInquiries = [
  {
    title: 'Royal Commission into the Protection and Detention of Children in the Northern Territory',
    inquiry_type: 'royal_commission',
    jurisdiction: 'NT',
    year_published: 2017,
    year_started: 2016,
    summary: 'Examined the treatment of children in youth detention and child protection systems in the Northern Territory. Found systemic failures and made 227 recommendations.',
    recommendations_count: 227,
    implementation_status: 'partial',
    source_url: 'https://www.royalcommission.gov.au/child-detention'
  },
  {
    title: 'Youth Justice Reform - Queensland Review',
    inquiry_type: 'government_review',
    jurisdiction: 'QLD',
    year_published: 2021,
    summary: 'Review of Queensland youth justice system focusing on diversion, early intervention, and community-based responses.',
    recommendations_count: 84,
    implementation_status: 'partial'
  },
  {
    title: 'Our Youth, Our Way - Aboriginal Children and Young People in Victoria',
    inquiry_type: 'parliamentary',
    jurisdiction: 'VIC',
    year_published: 2021,
    summary: 'Inquiry into over-representation of Aboriginal children and young people in the Victorian youth justice system.',
    recommendations_count: 42,
    implementation_status: 'partial'
  },
  {
    title: 'NSW Parliament - Youth Justice in NSW',
    inquiry_type: 'parliamentary',
    jurisdiction: 'NSW',
    year_published: 2020,
    summary: 'Parliamentary inquiry into youth justice in NSW, examining detention, diversionary programs, and rehabilitation.',
    recommendations_count: 34,
    implementation_status: 'pending'
  }
];

export default async function InquiriesPage() {
  const inquiries = await getInquiries();

  // Use sample data if database is empty
  const displayInquiries = inquiries.length > 0 ? inquiries : sampleInquiries;

  const inquiryTypeLabels: Record<string, string> = {
    royal_commission: 'Royal Commission',
    parliamentary: 'Parliamentary Inquiry',
    government_review: 'Government Review',
    judicial: 'Judicial Inquiry',
    coronial: 'Coronial Inquest',
    ombudsman: 'Ombudsman Report'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-ochre-100 text-ochre-800',
    implemented: 'bg-eucalyptus-100 text-eucalyptus-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-sand-50 via-ochre-50 to-white py-12 border-b-2 border-black">
        <div className="container-justice max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-earth-600 mb-4">
            <Link href="/youth-justice-report" className="hover:text-ochre-600">Report</Link>
            <span>/</span>
            <span>Historical Inquiries</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-ochre-100 border-2 border-black">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Historical Inquiries</h1>
              <p className="text-earth-600">Royal commissions, parliamentary inquiries, and government reviews</p>
            </div>
          </div>

          <p className="text-lg text-earth-700 max-w-2xl">
            A comprehensive record of inquiries into youth justice across Australian jurisdictions,
            tracking recommendations and their implementation status.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6 border-b-2 border-black bg-white">
        <div className="container-justice max-w-5xl">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-ochre-600">{displayInquiries.length}</div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Inquiries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-eucalyptus-600">
                {displayInquiries.reduce((sum, i) => sum + (i.recommendations_count || 0), 0)}
              </div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-ochre-600">
                {displayInquiries.filter(i => i.implementation_status === 'partial').length}
              </div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Partially Implemented</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {displayInquiries.filter(i => i.implementation_status === 'pending').length}
              </div>
              <div className="text-xs uppercase tracking-wider text-earth-600">Pending</div>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiries List */}
      <section className="py-8">
        <div className="container-justice max-w-5xl">
          <div className="space-y-6">
            {displayInquiries.map((inquiry, index) => (
              <div
                key={inquiry.id || index}
                className="border-2 border-black p-6 bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="hidden md:block p-3 bg-sand-100 border border-black">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-ochre-100 border border-black">
                        {inquiryTypeLabels[inquiry.inquiry_type] || inquiry.inquiry_type}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-sand-100 border border-black">
                        {inquiry.jurisdiction}
                      </span>
                      <span className="text-xs font-medium text-earth-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {inquiry.year_published}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{inquiry.title}</h3>

                    <p className="text-earth-700 mb-4">{inquiry.summary}</p>

                    <div className="flex flex-wrap items-center gap-4">
                      {inquiry.recommendations_count && (
                        <div className="text-sm">
                          <span className="font-bold text-ochre-600">{inquiry.recommendations_count}</span>
                          <span className="text-earth-600"> recommendations</span>
                        </div>
                      )}

                      {inquiry.implementation_status && (
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${statusColors[inquiry.implementation_status]}`}>
                          {inquiry.implementation_status.replace('_', ' ')}
                        </span>
                      )}

                      {inquiry.source_url && (
                        <a
                          href={inquiry.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ochre-600 hover:text-ochre-800 flex items-center gap-1"
                        >
                          View Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 border-t-2 border-black bg-sand-50">
        <div className="container-justice max-w-5xl text-center">
          <h2 className="text-2xl font-bold mb-4">Help us track implementation</h2>
          <p className="text-earth-600 mb-6 max-w-2xl mx-auto">
            Know of an inquiry we&apos;re missing? Have information on implementation status?
            Help us build the most comprehensive record of youth justice reform in Australia.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
          >
            Contribute Information
          </Link>
        </div>
      </section>
    </div>
  );
}
