/**
 * Generates app icons from fAVICON.svg for:
 *   - Web   (hrms-react/public/favicon.svg)
 *   - Tauri (hrms-react/src-tauri/icons/)
 *   - iOS   (AppIcon.appiconset)
 *   - Android (mipmap-*)
 */
const sharp = require('./hrms-react/node_modules/sharp');
const fs    = require('fs');
const path  = require('path');

const SVG_SRC = path.resolve('C:/Users/Administrator.ARTECH.000/Downloads/fAVICON.svg');
const svgBuf  = fs.readFileSync(SVG_SRC);

async function gen(dest, size, opts = {}) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // density: render SVG at ≥ target size (SVG viewBox ~895px wide at 96dpi)
  const density = Math.max(72, Math.ceil(size * 96 / 895));
  let s = sharp(svgBuf, { density });

  if (opts.round) {
    const r = size / 2;
    const circle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
    );
    s = s.resize(size, size).composite([{ input: circle, blend: 'dest-in' }]);
  } else {
    s = s.resize(size, size);
  }

  await s.png().toFile(dest);
  process.stdout.write(`  ✓ ${path.basename(dest)} (${size}px)\n`);
  return dest;
}

async function main() {
  /* ── Web favicon ── */
  console.log('\n── Web ──');
  fs.copyFileSync(SVG_SRC, 'hrms-react/public/favicon.svg');
  console.log('  ✓ favicon.svg (copied)');

  /* ── Tauri desktop icons ── */
  console.log('\n── Tauri Desktop ──');
  const TAURI = 'hrms-react/src-tauri/icons';
  await gen(`${TAURI}/32x32.png`,        32);
  await gen(`${TAURI}/128x128.png`,     128);
  await gen(`${TAURI}/128x128@2x.png`,  256);
  await gen(`${TAURI}/icon-512.png`,    512);

  // .ico: embed 16, 32, 48 px raw pixel data (ICO format, no external deps)
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoFrames = await Promise.all(
    icoSizes.map(sz => {
      const density = Math.max(72, Math.ceil(sz * 96 / 895));
      return sharp(svgBuf, { density })
        .resize(sz, sz)
        .png()
        .toBuffer();
    })
  );

  // Build ICO file manually
  function makeIco(pngBuffers) {
    const count = pngBuffers.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    const dirSize = headerSize + count * dirEntrySize;
    const totalSize = dirSize + pngBuffers.reduce((s, b) => s + b.length, 0);
    const buf = Buffer.alloc(totalSize);

    // ICONDIR header
    buf.writeUInt16LE(0, 0);     // reserved
    buf.writeUInt16LE(1, 2);     // type: 1 = ICO
    buf.writeUInt16LE(count, 4);

    let offset = dirSize;
    pngBuffers.forEach((png, i) => {
      const sz = icoSizes[i];
      const entry = headerSize + i * dirEntrySize;
      buf.writeUInt8(sz >= 256 ? 0 : sz, entry);      // width  (0 = 256)
      buf.writeUInt8(sz >= 256 ? 0 : sz, entry + 1);  // height (0 = 256)
      buf.writeUInt8(0, entry + 2);    // color count
      buf.writeUInt8(0, entry + 3);    // reserved
      buf.writeUInt16LE(1, entry + 4); // planes
      buf.writeUInt16LE(32, entry + 6); // bit count
      buf.writeUInt32LE(png.length, entry + 8);  // size
      buf.writeUInt32LE(offset, entry + 12);     // offset
      png.copy(buf, offset);
      offset += png.length;
    });
    return buf;
  }

  fs.writeFileSync(`${TAURI}/icon.ico`, makeIco(icoFrames));
  console.log(`  ✓ icon.ico (16,32,48,64,128,256px)`);

  // .icns: Apple Icon Image format (ICNS) — build manually with PNG payloads
  // Supported types: ic07(128) ic08(256) ic09(512) ic10(1024) ic11(32) ic12(64)
  const icnsMap = [
    { type: 'icp4', size: 16  },
    { type: 'icp5', size: 32  },
    { type: 'icp6', size: 64  },
    { type: 'ic07', size: 128 },
    { type: 'ic08', size: 256 },
    { type: 'ic09', size: 512 },
    { type: 'ic10', size: 1024 },
    { type: 'ic11', size: 32  },  // @2x of 16
    { type: 'ic12', size: 64  },  // @2x of 32
    { type: 'ic13', size: 256 },  // @2x of 128
    { type: 'ic14', size: 512 },  // @2x of 256
  ];
  // density: enough to render SVG at least at target size; SVG viewBox ~895px wide
  const icnsFrames = await Promise.all(
    icnsMap.map(({ size }) => {
      const density = Math.max(72, Math.ceil(size * 96 / 895));
      return sharp(svgBuf, { density })
        .resize(size, size)
        .png()
        .toBuffer();
    })
  );

  function makeIcns(frames) {
    const chunks = frames.map((png, i) => {
      const typeCode = icnsMap[i].type;
      const header = Buffer.alloc(8);
      header.write(typeCode, 0, 'ascii');
      header.writeUInt32BE(8 + png.length, 4);
      return Buffer.concat([header, png]);
    });
    const body = Buffer.concat(chunks);
    const header = Buffer.alloc(8);
    header.write('icns', 0, 'ascii');
    header.writeUInt32BE(8 + body.length, 4);
    return Buffer.concat([header, body]);
  }

  fs.writeFileSync(`${TAURI}/icon.icns`, makeIcns(icnsFrames));
  console.log(`  ✓ icon.icns`);

  /* ── iOS AppIcon ── */
  console.log('\n── iOS AppIcon ──');
  const APPICONSET = 'hrms-react/ios/App/App/Assets.xcassets/AppIcon.appiconset';
  const iosIcons = [
    ['icon-20@1x.png',    20],
    ['icon-20@2x.png',    40],
    ['icon-20@3x.png',    60],
    ['icon-29@1x.png',    29],
    ['icon-29@2x.png',    58],
    ['icon-29@3x.png',    87],
    ['icon-40@1x.png',    40],
    ['icon-40@2x.png',    80],
    ['icon-40@3x.png',   120],
    ['icon-60@2x.png',   120],
    ['icon-60@3x.png',   180],
    ['icon-76@1x.png',    76],
    ['icon-76@2x.png',   152],
    ['icon-83.5@2x.png', 167],
    ['icon-1024@1x.png', 1024],
    ['AppIcon-512@2x.png',1024],
  ];
  for (const [name, size] of iosIcons) {
    await gen(`${APPICONSET}/${name}`, size);
  }

  /* ── Android mipmap ── */
  console.log('\n── Android mipmap ──');
  const ANDROID_RES = 'hrms-react/android/app/src/main/res';
  const densities = [
    ['mipmap-mdpi',    48],
    ['mipmap-hdpi',    72],
    ['mipmap-xhdpi',   96],
    ['mipmap-xxhdpi',  144],
    ['mipmap-xxxhdpi', 192],
  ];
  for (const [dir, size] of densities) {
    await gen(`${ANDROID_RES}/${dir}/ic_launcher.png`, size);
    await gen(`${ANDROID_RES}/${dir}/ic_launcher_round.png`, size, { round: true });
    await gen(`${ANDROID_RES}/${dir}/ic_launcher_foreground.png`, size);
  }

  console.log('\n✅ All icons generated!\n');
}

main().catch(e => { console.error(e); process.exit(1); });
