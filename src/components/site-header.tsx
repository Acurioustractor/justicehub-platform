"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CTAButton } from "./cta-button";

const navItems = [
  { label: "Journey", href: "/contained#journey" },
  { label: "Stories", href: "/contained#stories" },
  { label: "Evidence", href: "/contained#evidence" },
  { label: "About", href: "/contained/about" },
  { label: "Nominate", href: "/contained#nominate" },
  { label: "Book", href: "/contained#book" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isOnContainedSite = pathname?.startsWith('/contained');

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-color-container-black/90 px-6 py-4 backdrop-blur sm:px-12">
      {/* Back to JusticeHub Navigation Bar */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center border-b border-white/10 pb-3 mb-4">
        <Link
          href="/"
          className="group flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white/90 transition-colors"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to JusticeHub
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
        <Link
          href="/contained"
          className="font-display text-2xl uppercase tracking-[0.35em] text-white"
          onClick={() => setOpen(false)}
        >
          CONTAINED
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 text-sm uppercase tracking-[0.25em] text-white/70 md:flex"
        >
          {navItems.filter(item => item.label !== "About").map((item) => (
            <Link
              key={item.href}
              className="hover:text-white"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {/* About Button - Separated to the right */}
          <Link
            href="/contained/about"
            className="px-4 py-2 border border-white/40 rounded-lg bg-white/15 text-white font-bold hover:bg-white/25 hover:border-white/60 transition-all uppercase tracking-[0.2em] text-sm"
          >
            About ?
          </Link>

          <CTAButton href="/contained#book" className="uppercase tracking-[0.3em]">
            Book Experience
          </CTAButton>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">Toggle navigation</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path d="M4 7h16" strokeLinecap="round" />
            <path d="M4 12h16" strokeLinecap="round" />
            <path d="M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="md:hidden"
      >
        <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/10 p-6 text-sm uppercase tracking-[0.25em] text-white/80">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.label === "About"
                  ? "block px-3 py-2 border border-white/30 rounded bg-white/20 text-white"
                  : "block"
              }
              onClick={() => setOpen(false)}
            >
              {item.label}
              {item.label === "About" && <span className="ml-1 text-xs opacity-60">?</span>}
            </Link>
          ))}
          <CTAButton
            href="/contained#book"
            fullWidth
            className="uppercase tracking-[0.3em]"
            onClick={() => setOpen(false)}
          >
            Book Experience
          </CTAButton>
        </div>
      </div>
    </header>
  );
}
