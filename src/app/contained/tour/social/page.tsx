import type { Metadata } from 'next';
import { SocialKitContent } from './social-kit-content';

export const metadata: Metadata = {
  title: 'Social Media Kit — THE CONTAINED Tour 2026 | JusticeHub',
  description:
    'Ready-to-post social media content for THE CONTAINED Australian Tour 2026. Copy, customise, share.',
};

export default function SocialKitPage() {
  return <SocialKitContent />;
}
