"use client";

import { useMemo } from "react";
import { campaignMetadata } from "@/content/campaign";
import { calculateDaysUntil } from "@/lib/campaign";
import { CTAButton } from "./cta-button";

export function UrgencyBanner() {
  const daysLeft = useMemo(
    () => calculateDaysUntil(campaignMetadata.launchDate),
    [],
  );

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(234,118,20,0.97)] backdrop-blur text-white shadow-[0_-20px_60px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-4 text-center sm:flex-row sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <span className="font-display text-lg uppercase tracking-[0.25em]">
            ⏰ {daysLeft} days until launch
          </span>
          <span className="text-sm uppercase tracking-[0.25em] text-white/90">
            {campaignMetadata.counters.slotsPerDay} slots released daily · Secure yours now
          </span>
        </div>
        <CTAButton href="#book" variant="light" className="hover:bg-white/90">
          Book now
        </CTAButton>
      </div>
    </aside>
  );
}
