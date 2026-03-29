#!/usr/bin/env node
/**
 * FFmpeg approach — generates a LinkedIn-ready video (1200x628, 15s)
 * from a story hero image + title + excerpt with Ken Burns zoom + text fade-in.
 *
 * Usage: node scripts/story-video/ffmpeg-video.mjs [article-slug]
 * Default: uses the CONTAINED feature article
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// Story data — could be fetched from API
const story = {
  title: 'Building Revolution\nin Shipping Containers',
  subtitle: 'The Story of CONTAINED',
  excerpt: 'How shipping containers became spaces\nfor justice, healing, and transformation',
  image_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/story-images/stories/featured/pdlvi4yay5k-1762323853830.png',
  brand: 'JUSTICEHUB',
  cta: 'justicehub.com.au/contained',
  countdown: '5 DAYS TILL LAUNCH',
  countdown2: '30 DAYS TILL FIRST STOP',
};

const DURATION = 12; // seconds
const FPS = 30;
const WIDTH = 1200;
const HEIGHT = 628;

async function main() {
  console.log('=== FFmpeg Story Video Generator ===\n');

  // 1. Download hero image
  const imgPath = path.join(OUTPUT_DIR, 'hero-input.png');
  console.log('Downloading hero image...');
  execSync(`curl -sL "${story.image_url}" -o "${imgPath}"`);
  console.log('  Downloaded.\n');

  // 2. Create text overlay image using ffmpeg drawtext
  // We'll use ffmpeg's complex filter for everything
  const outputPath = path.join(OUTPUT_DIR, 'story-ffmpeg.mp4');

  // Escape text for ffmpeg drawtext
  const esc = (t) => t.replace(/'/g, "'\\''").replace(/:/g, '\\:');

  // Build the ffmpeg command with:
  // - Ken Burns slow zoom on hero image
  // - Dark gradient overlay
  // - Title text fade in at 1s
  // - Subtitle fade in at 2.5s
  // - Excerpt fade in at 4s
  // - Brand + CTA at bottom
  const fontFile = '/System/Library/Fonts/Helvetica.ttc';

  const cmd = `ffmpeg -y \
    -loop 1 -i "${imgPath}" \
    -f lavfi -i "color=c=black:s=${WIDTH}x${HEIGHT}:d=${DURATION},format=rgba" \
    -filter_complex "
      [0:v]scale=${WIDTH * 1.15}:${HEIGHT * 1.15},
        zoompan=z='1+0.01*in/${FPS}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${DURATION * FPS}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[bg];
      [1:v]format=rgba,colorchannelmixer=aa=0.55[overlay];
      [bg][overlay]overlay=0:0[dark];
      [dark]drawtext=fontfile='${fontFile}':
        text='${esc(story.title)}':
        fontcolor=white:fontsize=52:
        x=(w-text_w)/2:y=(h/2-text_h-40):
        alpha='if(lt(t,1),0,if(lt(t,2),(t-1),1))'
      ,drawtext=fontfile='${fontFile}':
        text='${esc(story.subtitle)}':
        fontcolor=0xE8652E:fontsize=32:
        x=(w-text_w)/2:y=(h/2+10):
        alpha='if(lt(t,2.5),0,if(lt(t,3.5),(t-2.5),1))'
      ,drawtext=fontfile='${fontFile}':
        text='${esc(story.excerpt)}':
        fontcolor=0xCCCCCC:fontsize=22:
        x=(w-text_w)/2:y=(h/2+60):
        alpha='if(lt(t,4),0,if(lt(t,5),(t-4),1))'
      ,drawtext=fontfile='${fontFile}':
        text='${esc(story.brand)}':
        fontcolor=0xE8652E:fontsize=18:
        x=40:y=h-50:
        alpha='if(lt(t,0.5),0,1)'
      ,drawtext=fontfile='${fontFile}':
        text='${esc(story.countdown)}':
        fontcolor=0xE8652E:fontsize=26:
        x=(w-text_w)/2:y=(h/2+120):
        borderw=2:bordercolor=0xE8652E:
        alpha='if(lt(t,5),0,if(lt(t,6),(t-5),1))'
      ,drawtext=fontfile='${fontFile}':
        text='${esc(story.cta)}':
        fontcolor=0xAAAAAA:fontsize=16:
        x=w-text_w-40:y=h-48:
        alpha='if(lt(t,7),0,if(lt(t,8),(t-7),1))'
      [out]
    " \
    -map "[out]" \
    -c:v libx264 -preset medium -crf 23 \
    -pix_fmt yuv420p \
    -t ${DURATION} \
    "${outputPath}" 2>&1`;

  console.log('Generating video with FFmpeg...');
  const startTime = Date.now();

  try {
    execSync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Done in ${elapsed}s`);
    console.log(`  Output: ${outputPath}`);

    // Get file size
    const { statSync } = await import('fs');
    const stats = statSync(outputPath);
    console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  Resolution: ${WIDTH}x${HEIGHT} @ ${FPS}fps, ${DURATION}s`);
    console.log('\n  LinkedIn-ready! (recommended: 1200x628 landscape)');
  } catch (err) {
    console.error('FFmpeg failed:', err.message);
    // Try to show the actual ffmpeg error
    if (err.stderr) console.error(err.stderr.toString().slice(-500));
  }
}

main().catch(console.error);
