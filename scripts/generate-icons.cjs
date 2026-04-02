/**
 * ForgeMail v1.2.1 Icon Generator (CJS - run as: node scripts/generate-icons.cjs)
 * Creates all required Tauri icon sizes from an SVG definition.
 */
"use strict";

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install sharp if not present
try {
  require.resolve('sharp');
  console.log('sharp already installed');
} catch {
  console.log('Installing sharp...');
  execSync('npm install --save-dev sharp', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
}

const sharp = require('sharp');

const ICONS_DIR = path.resolve(__dirname, '../src-tauri/icons');

// ForgeMail SVG Icon: envelope body + lightning bolt
// Monochrome: white glyph on slate-950 (#020617)
function generateSvg(size) {
  const padding = size * 0.18;
  const w = size - padding * 2;
  const h = size - padding * 2;
  const x = padding;
  const y = padding;

  // Envelope coordinates
  const envTop = y + h * 0.08;
  const envBot = y + h * 0.92;
  const envLeft = x + w * 0.02;
  const envRight = x + w * 0.98;
  const envMid = y + h * 0.5;

  // Envelope flap V shape (pointing down to mid)
  const flapY = y + h * 0.44;

  // Lightning bolt coords (center of envelope)
  const boltCX = x + w * 0.5;
  const boltTop = y + h * 0.12;
  const boltBot = y + h * 0.88;
  const boltW = w * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#020617" rx="${size * 0.18}"/>
  
  <!-- Envelope body -->
  <rect 
    x="${envLeft}" y="${envTop}" 
    width="${envRight - envLeft}" height="${envBot - envTop}" 
    rx="${size * 0.04}" 
    fill="none" stroke="white" stroke-width="${size * 0.05}" stroke-linejoin="round"
  />
  
  <!-- Envelope top flap V -->
  <polyline 
    points="${envLeft},${envTop} ${boltCX},${flapY} ${envRight},${envTop}" 
    fill="none" stroke="white" stroke-width="${size * 0.05}" stroke-linejoin="round" stroke-linecap="round"
  />
  
  <!-- Lightning bolt overlaid (punching through flap area) -->
  <polygon 
    points="
      ${boltCX + boltW * 0.3},${boltTop}
      ${boltCX - boltW * 0.6},${envMid}
      ${boltCX + boltW * 0.1},${envMid}
      ${boltCX - boltW * 0.3},${boltBot}
      ${boltCX + boltW * 0.6},${envMid * 1.05}
      ${boltCX - boltW * 0.1},${envMid * 1.05}
    " 
    fill="#020617" stroke="white" stroke-width="${size * 0.035}" stroke-linejoin="round"
  />
  <polygon 
    points="
      ${boltCX + boltW * 0.3},${boltTop}
      ${boltCX - boltW * 0.6},${envMid}
      ${boltCX + boltW * 0.1},${envMid}
      ${boltCX - boltW * 0.3},${boltBot}
      ${boltCX + boltW * 0.6},${envMid * 1.05}
      ${boltCX - boltW * 0.1},${envMid * 1.05}
    " 
    fill="white"
  />
</svg>`;
}

async function generateIcon(size, filename) {
  const svg = Buffer.from(generateSvg(size));
  const outPath = path.join(ICONS_DIR, filename);
  await sharp(svg).png().resize(size, size).toFile(outPath);
  console.log(`  ✓ ${filename} (${size}x${size})`);
}

async function run() {
  console.log('\n🔧 ForgeMail Icon Generator — v1.2.1\n');

  // Main PNG sizes
  await generateIcon(32, '32x32.png');
  await generateIcon(64, '64x64.png');
  await generateIcon(128, '128x128.png');
  await generateIcon(256, '128x128@2x.png');

  // Windows Square logos
  await generateIcon(30, 'Square30x30Logo.png');
  await generateIcon(44, 'Square44x44Logo.png');
  await generateIcon(71, 'Square71x71Logo.png');
  await generateIcon(89, 'Square89x89Logo.png');
  await generateIcon(107, 'Square107x107Logo.png');
  await generateIcon(142, 'Square142x142Logo.png');
  await generateIcon(150, 'Square150x150Logo.png');
  await generateIcon(284, 'Square284x284Logo.png');
  await generateIcon(310, 'Square310x310Logo.png');
  await generateIcon(16, 'StoreLogo.png');

  // Main icon.png (used as source for .ico/.icns)
  await generateIcon(1024, 'icon.png');

  console.log('\n✅ All icons generated successfully.');
  console.log('   Run: npx tauri icon src-tauri/icons/icon.png\n');
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
