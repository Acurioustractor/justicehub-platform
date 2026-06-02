import type { CSSProperties } from 'react';

export type ManagedHeroBackground = {
  label: string;
  routes: string[];
  image: string;
  alt: string;
  position?: CSSProperties['backgroundPosition'];
  overlay?: string;
  notes?: string;
};

export const managedHeroBackgrounds = {
  adelaide: {
    label: 'Adelaide CONTAINED launch',
    routes: ['/adelaide', '/contained/adelaide'],
    image: '/images/contained/justicehub-hero-landscape.png',
    alt: 'JusticeHub CONTAINED launch graphic used behind the Adelaide public pathway hero.',
    position: 'center',
    overlay: 'linear-gradient(90deg, rgba(10,10,10,0.90), rgba(10,10,10,0.58), rgba(10,10,10,0.86))',
    notes: 'Primary public-share hero for the June 23 Adelaide pathway.',
  },
} as const satisfies Record<string, ManagedHeroBackground>;

export type ManagedHeroBackgroundKey = keyof typeof managedHeroBackgrounds;

export function getHeroBackground(key: ManagedHeroBackgroundKey): ManagedHeroBackground {
  return managedHeroBackgrounds[key];
}

function cssUrl(url: string) {
  return `"${url.replace(/"/g, '\\"')}"`;
}

export function heroBackgroundStyle(background: ManagedHeroBackground): CSSProperties {
  const overlay = background.overlay ? `${background.overlay}, ` : '';

  return {
    backgroundImage: `${overlay}url(${cssUrl(background.image)})`,
    backgroundPosition: background.position ?? 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };
}
