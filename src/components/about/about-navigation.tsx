"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

const navigationItems = [
  { id: "hero", label: "Genesis", icon: "⚡" },
  { id: "architects", label: "The Builders", icon: "🏗️" },
  { id: "truth-speakers", label: "Truth Speakers", icon: "📢" },
  { id: "build-process", label: "The Build", icon: "🎬" },
  { id: "community", label: "Community", icon: "🌍" },
  { id: "economics", label: "Economics", icon: "💰" },
  { id: "vision", label: "Vision", icon: "🔮" },
  { id: "get-involved", label: "Get Involved", icon: "🚀" },
];

export function AboutNavigation() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 100);

      // Find active section
      const sections = navigationItems.map(item => document.getElementById(item.id));
      const currentSection = sections.find(section => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom > 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav
      className={clsx(
        "transition-all duration-300 z-50",
        isSticky
          ? "fixed top-0 left-0 right-0 bg-color-container-black/95 backdrop-blur-lg border-b border-white/10"
          : "relative bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-lg uppercase tracking-tight text-white">
              About CONTAINED
            </h2>
            {isSticky && (
              <div className="text-xs text-white/60">
                The Genesis of Transformation
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  activeSection === item.id
                    ? "bg-color-hope-green/20 text-color-hope-green border border-color-hope-green/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="text-xs">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 text-white/70 hover:text-white">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-color-hope-green transition-all duration-300"
           style={{ width: `${((navigationItems.findIndex(item => item.id === activeSection) + 1) / navigationItems.length) * 100}%` }} />
    </nav>
  );
}