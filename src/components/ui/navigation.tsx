'use client';

// This file is deprecated. Please import from '@/components/navigation/*' instead.
// To maintain backward compatibility, we re-export the new components here.

import { MainNavigation } from '@/components/navigation/MainNavigation';
import { QuickNav as QuickNavComponent } from '@/components/navigation/QuickNav';
import { Footer as FooterComponent } from '@/components/navigation/Footer';

export const Navigation = MainNavigation;
export const QuickNav = QuickNavComponent;
export const Footer = FooterComponent;
