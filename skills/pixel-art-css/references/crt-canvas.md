# Canvas CRT Effects Reference

Use these techniques when CSS-only CRT effects aren't convincing enough. Canvas gives you per-pixel control for barrel distortion, phosphor simulation, and RGB shadow mask patterns.

## Table of Contents
1. [Barrel Distortion](#barrel-distortion)
2. [Phosphor Grid Simulation](#phosphor-grid-simulation)
3. [RGB Shadow Mask](#rgb-shadow-mask)
4. [Bloom / Glow Pass](#bloom--glow-pass)
5. [Compositing Everything](#compositing-everything)

---

## Barrel Distortion

CRT screens are curved glass. The image bows outward at the edges. This is the single most impactful CRT effect — it immediately signals "old monitor."

The idea: render your content to an offscreen canvas, then redraw it to the visible canvas with a distortion function applied per-pixel.

```javascript
function applyBarrelDistortion(sourceCanvas, targetCanvas, strength = 0.15) {
  const src = sourceCanvas.getContext('2d');
  const dst = targetCanvas.getContext('2d');
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const srcData = src.getImageData(0, 0, w, h);
  const dstData = dst.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Normalize to [-1, 1]
      const nx = (2 * x / w) - 1;
      const ny = (2 * y / h) - 1;
      const r2 = nx * nx + ny * ny;

      // Barrel distortion formula
      const distort = 1 + strength * r2;
      const sx = Math.round(((nx * distort + 1) / 2) * w);
      const sy = Math.round(((ny * distort + 1) / 2) * h);

      const dstIdx = (y * w + x) * 4;
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        const srcIdx = (sy * w + sx) * 4;
        dstData.data[dstIdx] = srcData.data[srcIdx];
        dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
        dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
        dstData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
      } else {
        // Outside the distorted area — render black
        dstData.data[dstIdx + 3] = 255;
      }
    }
  }
  dst.putImageData(dstData, 0, 0);
}
```

**Performance note**: This is O(width × height) per frame. For static content, run it once. For animated content, consider reducing canvas resolution or using `requestAnimationFrame` at a throttled rate (15-30fps is fine — CRTs weren't 60fps for most content anyway).

`strength` values:
- 0.05-0.10: Subtle curvature, modern flat-ish CRT
- 0.15-0.25: Classic TV set
- 0.30+: Fish-eye / arcade cabinet close-up

## Phosphor Grid Simulation

Real CRTs displayed images through a grid of phosphor dots. At close range, you could see the individual RGB dots with dark gaps between them.

```javascript
function drawPhosphorGrid(ctx, width, height, pixelSize = 3) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const subPixel = x % pixelSize; // 0=R, 1=G, 2=B
      const isGap = (y % pixelSize) === pixelSize - 1;

      if (isGap) {
        // Dark gap between scanlines
        data[idx] *= 0.3;
        data[idx + 1] *= 0.3;
        data[idx + 2] *= 0.3;
      } else {
        // Emphasize the sub-pixel channel, dim the others
        if (subPixel === 0) {
          data[idx + 1] *= 0.5; // dim green
          data[idx + 2] *= 0.5; // dim blue
        } else if (subPixel === 1) {
          data[idx] *= 0.5;     // dim red
          data[idx + 2] *= 0.5; // dim blue
        } else {
          data[idx] *= 0.5;     // dim red
          data[idx + 1] *= 0.5; // dim green
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
```

## RGB Shadow Mask

An alternative to the phosphor grid — the shadow mask pattern used in many TV-style CRTs:

```javascript
function drawShadowMask(ctx, width, height) {
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.15;

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const offset = (Math.floor(y / 3) % 2) * 1; // Stagger every other row
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + offset, y, 1, 2);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x + offset + 1, y, 1, 2);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(x + offset + 2, y, 1, 2);
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
```

## Bloom / Glow Pass

Bright areas on a CRT bleed light into surrounding phosphors. Simulate this with a blur pass:

```javascript
function applyBloom(sourceCanvas, intensity = 0.3) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  // Create a blurred copy
  const bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = w;
  bloomCanvas.height = h;
  const bloomCtx = bloomCanvas.getContext('2d');

  // Draw source, apply blur
  bloomCtx.filter = `blur(4px) brightness(1.5)`;
  bloomCtx.drawImage(sourceCanvas, 0, 0);
  bloomCtx.filter = 'none';

  // Composite bloom back onto source
  const ctx = sourceCanvas.getContext('2d');
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = intensity;
  ctx.drawImage(bloomCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
```

## Compositing Everything

Typical pipeline for a full CRT effect stack:

```javascript
function renderCRT(contentCanvas, displayCanvas, options = {}) {
  const {
    barrelStrength = 0.15,
    scanlineIntensity = true,
    phosphorGrid = false,
    bloom = true,
    bloomIntensity = 0.25
  } = options;

  const w = displayCanvas.width;
  const h = displayCanvas.height;

  // 1. Start with the content
  const workCanvas = document.createElement('canvas');
  workCanvas.width = w;
  workCanvas.height = h;
  const workCtx = workCanvas.getContext('2d');
  workCtx.imageSmoothingEnabled = false;
  workCtx.drawImage(contentCanvas, 0, 0, w, h);

  // 2. Apply bloom (before distortion, so it's natural)
  if (bloom) applyBloom(workCanvas, bloomIntensity);

  // 3. Apply phosphor grid or shadow mask
  if (phosphorGrid) drawPhosphorGrid(workCtx, w, h);

  // 4. Apply barrel distortion
  applyBarrelDistortion(workCanvas, displayCanvas, barrelStrength);

  // 5. Scanlines go on top via CSS (more performant than canvas)
  // Add the .crt-scanlines class to the display canvas container
}
```

Order matters:
1. **Bloom** first — light bleed happens at the phosphor level
2. **Phosphor/shadow mask** — this is the physical structure of the screen
3. **Barrel distortion** last — the glass curves everything
4. **Scanlines** via CSS overlay — simplest and most performant approach

For animated content, call `renderCRT` on each frame. For static content, render once and cache.
