'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Users, Eye, Handshake, ArrowUpRight } from 'lucide-react';

interface Validation {
  id: string;
  validation_type: string;
  content: string;
  validator_name: string;
  validator_role: string | null;
  created_at: string;
  from_org: {
    id: string;
    name: string;
    slug: string;
    state: string;
    is_indigenous_org: boolean;
  };
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof CheckCircle }> = {
  endorsement: { label: 'Endorsement', icon: CheckCircle },
  site_visit: { label: 'Site Visit', icon: Eye },
  collaboration: { label: 'Collaboration', icon: Handshake },
  referral: { label: 'Referral Partner', icon: Users },
};

export default function PeerValidations({ orgId }: { orgId: string }) {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/network/validate?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => setValidations(d.validations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading || validations.length === 0) return null;

  return (
    <section className="bg-[#fdf8f6] border-y border-orange-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-5 h-5 text-[#059669]" />
          <h2 className="text-xl font-black text-[#43302b]">
            Community Validated
          </h2>
        </div>
        <p className="text-sm text-[#8b7355] mb-6">
          Peer organisations in the ALMA Network who have validated this work.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validations.map((v) => {
            const config = TYPE_CONFIG[v.validation_type] || TYPE_CONFIG.endorsement;
            const Icon = config.icon;
            return (
              <div
                key={v.id}
                className="bg-white rounded-lg border border-orange-100 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#059669]/10">
                    <Icon className="w-4 h-4 text-[#059669]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#43302b] leading-relaxed mb-2">
                      &ldquo;{v.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#8b7355]">
                      <span className="font-semibold">{v.validator_name}</span>
                      {v.validator_role && (
                        <span>· {v.validator_role}</span>
                      )}
                    </div>
                    <Link
                      href={`/sites/${v.from_org.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 font-medium mt-1"
                    >
                      {v.from_org.name}, {v.from_org.state}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
