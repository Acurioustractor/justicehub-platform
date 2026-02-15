"use client";

import { useEffect, useMemo, useState } from "react";
import { campaignMetadata } from "@/content/campaign";
import { calculateDaysUntil, calculateProgress, formatNumber } from "@/lib/campaign";
import { CTAButton } from "./cta-button";

const { counters, progress, primaryCta, secondaryCta, launchDate } = campaignMetadata;

export function Hero() {
  const [animatedCount, setAnimatedCount] = useState(counters.baseNominations);
  const progressPercent = calculateProgress(progress.current, progress.goal);
  const daysRemaining = useMemo(() => calculateDaysUntil(launchDate), []);

  useEffect(() => {
    const target = counters.baseNominations;
    let current = Math.max(0, target - 180);
    const step = Math.max(1, Math.floor((target - current) / 45));

    const interval = window.setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        window.clearInterval(interval);
      }
      setAnimatedCount(current);
    }, 60);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-color-container-black via-color-container-steel/75 to-[#050608] px-6 py-24 text-white sm:px-12">
      <div className="absolute inset-0 -z-20 bg-[url('/images/backgrounds/container-grid.png')] bg-cover bg-center opacity-15" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-black/45" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
        <span className="font-display text-sm uppercase tracking-[0.25em] text-color-warning-orange/90">
          {campaignMetadata.tagline}
        </span>
        <h1 className="font-display text-5xl leading-[0.95] uppercase tracking-tight sm:text-6xl md:text-7xl">
          30 Minutes That Could Transform Youth Justice Forever
        </h1>
        <p className="max-w-3xl text-lg text-white/85 sm:text-xl">
          Experience the reality of youth detention. Witness proven alternatives. Commit to the future Queensland youth deserve.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-color-hope-green/60 bg-color-hope-green/20 px-8 py-6 text-left shadow-lg shadow-color-hope-green/35">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-color-hope-green">
              Citizens demanding change
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-color-hope-green">
                {formatNumber(animatedCount)}
              </span>
              <span className="text-sm text-white/75">and counting</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-left shadow-lg backdrop-blur">
            <div className="text-xs uppercase tracking-[0.22em] text-white/80">
              <div className="font-semibold text-white">{progress.label}</div>
              <div className="mt-1 text-white/65">{progress.goal} nominations needed</div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/18">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-color-warning-orange via-color-hope-green to-color-hope-green transition-[width]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-white/85">
                <span className="font-semibold">{progressPercent}% to goal</span>
                <span className="text-white/70">{progress.current} confirmed</span>
              </div>
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.22em] text-white/60">
              {100 - progressPercent}% still to secure
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <CTAButton href={primaryCta.href} variant="accent">
            {primaryCta.label}
          </CTAButton>
          <CTAButton href={secondaryCta.href} variant="light">
            {secondaryCta.label}
          </CTAButton>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-white/60">
          <span>Launches {new Date(campaignMetadata.launchDate).toLocaleDateString("en-AU", { month: "long", day: "numeric" })}</span>
          <span className="text-white/40">•</span>
          <span>{daysRemaining} days to mobilise Brisbane</span>
          <span className="text-white/40">•</span>
          <span>{counters.slotsPerDay} slots available daily</span>
        </div>
      </div>
    </section>
  );
}
