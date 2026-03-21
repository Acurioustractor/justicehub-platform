'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollChapterProps {
  children: ReactNode;
  variant?: string;
  className?: string;
  id?: string;
  fullHeight?: boolean;
}

/**
 * Section wrapper that is ALWAYS visible.
 * Adds a subtle slide-up when scrolled into view as progressive enhancement,
 * but never gates content visibility behind IntersectionObserver.
 */
export default function ScrollChapter({
  children,
  className = '',
  id,
  fullHeight = false,
}: ScrollChapterProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.02 });
  // Safety: force visible after 1.5s regardless of scroll state
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const visible = isInView || forceVisible;

  return (
    <section
      ref={ref}
      id={id}
      className={`border-b border-gray-800 ${fullHeight ? 'min-h-screen flex flex-col justify-center' : 'py-20 md:py-28'} ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(30px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </section>
  );
}

export function ScrollChild({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.05 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const visible = isInView || forceVisible;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(15px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {children}
    </div>
  );
}
