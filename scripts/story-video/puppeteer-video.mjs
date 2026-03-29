#!/usr/bin/env node
/**
 * Puppeteer/Canvas approach — renders animated HTML frames, stitches with ffmpeg.
 * Gives full CSS animation control (gradients, transforms, custom fonts).
 *
 * Usage: node scripts/story-video/puppeteer-video.mjs
 */
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const FRAMES_DIR = path.join(OUTPUT_DIR, 'frames');

const story = {
  title: 'Building Revolution in Shipping Containers',
  subtitle: 'The Story of CONTAINED',
  excerpt: 'How shipping containers became spaces for justice, healing, and transformation',
  image_url: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/story-images/stories/featured/pdlvi4yay5k-1762323853830.png',
  brand: 'JUSTICEHUB',
  cta: 'justicehub.com.au/contained',
  countdown: '5 DAYS TILL LAUNCH  ·  30 DAYS TILL FIRST STOP',
};

const WIDTH = 1200;
const HEIGHT = 628;
const FPS = 30;
const DURATION = 12;
const TOTAL_FRAMES = FPS * DURATION;

function generateHTML(story) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
    background: #000;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    background: url('${story.image_url}') center/cover;
    animation: kenburns ${DURATION}s ease-in-out forwards;
  }

  @keyframes kenburns {
    0% { transform: scale(1.0); }
    100% { transform: scale(1.15); }
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0,0,0,0.3) 0%,
      rgba(0,0,0,0.7) 50%,
      rgba(0,0,0,0.85) 100%
    );
  }

  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 60px 80px;
    text-align: center;
  }

  .title {
    font-size: 48px;
    font-weight: 900;
    color: white;
    line-height: 1.1;
    margin-bottom: 16px;
    opacity: 0;
    transform: translateY(30px);
    animation: slideUp 0.8s ease-out 1s forwards;
  }

  .subtitle {
    font-size: 28px;
    font-weight: 700;
    color: #E8652E;
    margin-bottom: 24px;
    opacity: 0;
    transform: translateY(20px);
    animation: slideUp 0.8s ease-out 2s forwards;
  }

  .excerpt {
    font-size: 20px;
    color: #ccc;
    max-width: 700px;
    line-height: 1.5;
    opacity: 0;
    transform: translateY(20px);
    animation: slideUp 0.8s ease-out 3s forwards;
  }

  .brand {
    position: absolute;
    bottom: 30px;
    left: 40px;
    font-size: 16px;
    font-weight: 900;
    color: #E8652E;
    letter-spacing: 3px;
    opacity: 0;
    animation: fadeIn 0.6s ease-out 0.5s forwards;
  }

  .cta {
    position: absolute;
    bottom: 32px;
    right: 40px;
    font-size: 15px;
    color: #999;
    opacity: 0;
    animation: fadeIn 0.8s ease-out 5s forwards;
  }

  .accent-line {
    width: 60px;
    height: 3px;
    background: #E8652E;
    margin-bottom: 20px;
    opacity: 0;
    animation: scaleIn 0.6s ease-out 1.8s forwards;
  }

  .countdown {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
    font-weight: 900;
    color: #E8652E;
    letter-spacing: 3px;
    padding: 12px 32px;
    border: 2px solid #E8652E;
    opacity: 0;
    animation: fadeIn 0.8s ease-out 5s forwards;
  }

  @keyframes slideUp {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scaleX(0); }
    to { opacity: 1; transform: scaleX(1); }
  }
</style>
</head>
<body>
  <div class="hero-bg"></div>
  <div class="overlay"></div>
  <div class="content">
    <div class="title">${story.title}</div>
    <div class="accent-line"></div>
    <div class="subtitle">${story.subtitle}</div>
    <div class="excerpt">${story.excerpt}</div>
  </div>
  <div class="countdown">${story.countdown}</div>
  <div class="brand">${story.brand}</div>
  <div class="cta">${story.cta}</div>
</body>
</html>`;
}

async function main() {
  console.log('=== Puppeteer/Canvas Story Video Generator ===\n');
  const startTime = Date.now();

  // Clean/create frames dir
  if (existsSync(FRAMES_DIR)) rmSync(FRAMES_DIR, { recursive: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  // Write HTML
  const htmlPath = path.join(OUTPUT_DIR, 'story-template.html');
  writeFileSync(htmlPath, generateHTML(story));
  console.log('  HTML template written.');

  // Launch browser
  console.log('  Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // Wait for fonts + image to load
  await page.waitForFunction(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  // Capture frames
  console.log(`  Capturing ${TOTAL_FRAMES} frames at ${FPS}fps...`);

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const frameTime = (i / FPS) * 1000; // ms

    // Set animation time by injecting CSS
    await page.evaluate((t) => {
      document.querySelectorAll('*').forEach(el => {
        const style = el.style;
        style.animationDelay = '0s';
        style.animationDuration = '0.001s';
        style.animationPlayState = 'paused';
      });
    }, frameTime);

    // Better approach: use Web Animations API to seek
    await page.evaluate((timeSeconds) => {
      document.getAnimations().forEach(anim => {
        anim.currentTime = timeSeconds * 1000;
      });
    }, i / FPS);

    const framePath = path.join(FRAMES_DIR, `frame-${String(i).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });

    if (i % FPS === 0) {
      process.stdout.write(`    ${Math.floor(i / FPS)}/${DURATION}s\r`);
    }
  }
  console.log(`    ${DURATION}/${DURATION}s - Done!`);

  await browser.close();

  // Stitch frames into video with ffmpeg
  console.log('  Stitching frames with ffmpeg...');
  const outputPath = path.join(OUTPUT_DIR, 'story-puppeteer.mp4');

  execSync(`ffmpeg -y \
    -framerate ${FPS} \
    -i "${FRAMES_DIR}/frame-%05d.png" \
    -c:v libx264 -preset medium -crf 20 \
    -pix_fmt yuv420p \
    "${outputPath}" 2>&1`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const { statSync } = await import('fs');
  const stats = statSync(outputPath);

  console.log(`\n  Done in ${elapsed}s`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Resolution: ${WIDTH}x${HEIGHT} @ ${FPS}fps, ${DURATION}s`);

  // Cleanup frames
  rmSync(FRAMES_DIR, { recursive: true });
  console.log('  Frames cleaned up.');
}

main().catch(console.error);
