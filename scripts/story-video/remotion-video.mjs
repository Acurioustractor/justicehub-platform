#!/usr/bin/env node
/**
 * Remotion approach — React components rendered to MP4.
 * Since Remotion needs a full project setup, this creates a minimal
 * self-contained Remotion composition and renders it.
 *
 * Usage: node scripts/story-video/remotion-video.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const REMOTION_DIR = path.join(__dirname, 'remotion-project');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
if (!existsSync(REMOTION_DIR)) mkdirSync(REMOTION_DIR, { recursive: true });

const story = {
  title: 'Building Revolution in Shipping Containers',
  subtitle: 'The Story of CONTAINED',
  excerpt: 'How shipping containers became spaces for justice, healing, and transformation',
  image_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/story-images/stories/featured/pdlvi4yay5k-1762323853830.png',
  brand: 'JUSTICEHUB',
  cta: 'justicehub.com.au/contained',
  countdown: '5 DAYS TILL LAUNCH',
  countdown2: '30 DAYS TILL FIRST STOP',
};

// Create the Remotion composition file
const compositionCode = `
import { Composition, AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const STORY = ${JSON.stringify(story, null, 2)};

const StoryVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.15], { extrapolateRight: 'clamp' });
  const overlayOpacity = 0.65;

  const titleOpacity = interpolate(frame, [fps * 1, fps * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [fps * 1, fps * 2], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const subtitleOpacity = interpolate(frame, [fps * 2, fps * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleY = interpolate(frame, [fps * 2, fps * 3], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const excerptOpacity = interpolate(frame, [fps * 3, fps * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const countdownOpacity = interpolate(frame, [fps * 5, fps * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const ctaOpacity = interpolate(frame, [fps * 7, fps * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const brandOpacity = interpolate(frame, [fps * 0.5, fps * 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ transform: \`scale(\${zoom})\` }}>
        <Img src={STORY.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.85) 100%)',
        opacity: overlayOpacity,
      }} />

      <AbsoluteFill style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 80px',
        textAlign: 'center',
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
      }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: 'white',
          lineHeight: 1.1,
          marginBottom: 16,
          opacity: titleOpacity,
          transform: \`translateY(\${titleY}px)\`,
        }}>
          {STORY.title}
        </div>

        <div style={{
          width: 60,
          height: 3,
          background: '#E8652E',
          marginBottom: 20,
          opacity: subtitleOpacity,
        }} />

        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#E8652E',
          marginBottom: 24,
          opacity: subtitleOpacity,
          transform: \`translateY(\${subtitleY}px)\`,
        }}>
          {STORY.subtitle}
        </div>

        <div style={{
          fontSize: 20,
          color: '#ccc',
          maxWidth: 700,
          lineHeight: 1.5,
          opacity: excerptOpacity,
        }}>
          {STORY.excerpt}
        </div>

        <div style={{
          marginTop: 40,
          display: 'flex',
          gap: 24,
          opacity: countdownOpacity,
        }}>
          <div style={{
            padding: '12px 24px',
            border: '2px solid #E8652E',
            color: '#E8652E',
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 2,
          }}>
            {STORY.countdown}
          </div>
        </div>
      </AbsoluteFill>

      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 40,
        fontSize: 16,
        fontWeight: 900,
        color: '#E8652E',
        letterSpacing: 3,
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
        opacity: brandOpacity,
      }}>
        {STORY.brand}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 32,
        right: 40,
        fontSize: 15,
        color: '#999',
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
        opacity: ctaOpacity,
      }}>
        {STORY.cta}
      </div>
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="StoryVideo"
      component={StoryVideo}
      durationInFrames={360}
      fps={30}
      width={1200}
      height={628}
    />
  );
};
`;

async function main() {
  console.log('=== Remotion Story Video Generator ===\n');
  console.log('  Note: Remotion requires a full project build setup.');
  console.log('  For a quick test, falling back to generating the composition code');
  console.log('  and rendering via the Remotion CLI.\n');

  const startTime = Date.now();

  // Write composition
  const compPath = path.join(REMOTION_DIR, 'Root.tsx');
  writeFileSync(compPath, compositionCode);
  console.log(`  Composition written to ${compPath}`);

  // Create index file
  writeFileSync(path.join(REMOTION_DIR, 'index.ts'), `
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
`);

  const outputPath = path.join(OUTPUT_DIR, 'story-remotion.mp4');

  try {
    console.log('  Rendering via Remotion CLI...');
    execSync(`npx remotion render ${REMOTION_DIR}/index.ts StoryVideo ${outputPath} --codec h264`, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120000,
      stdio: 'pipe',
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const { statSync } = await import('fs');
    const stats = statSync(outputPath);

    console.log(`\n  Done in ${elapsed}s`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n  Remotion render failed after ${elapsed}s`);
    console.log('  This often needs a full project config (tsconfig, webpack, etc.)');
    console.log('  The composition code is saved — can render in a proper Remotion project.');
    console.log(`  Error: ${err.message?.substring(0, 200)}`);
  }
}

main().catch(console.error);
