---
name: pixel-art-css
description: Build pixel art interfaces, retro 8-bit UIs, and CRT-styled pages using pure CSS techniques (box-shadow sprites, image-rendering pixelated, steps() animations) with optional canvas for advanced effects. Use this skill whenever the user asks for pixel art, retro gaming aesthetics, 8-bit style, CRT effects, scanline overlays, chiptune/retro UI, Game Boy or NES-style interfaces, pixel borders, sprite animations in CSS, or anything that should look like it belongs on a classic console or old monitor. Also trigger when the user wants to pixelate images, create retro loading screens, build nostalgic landing pages, or style any web content with a retro computing or arcade vibe — even if they don't explicitly say "pixel art."
---

# Pixel Art CSS & Retro Art Direction

This skill covers building authentic pixel art and retro-styled web interfaces. The techniques here create visuals that feel like they came from real hardware — not a "retro filter" slapped on modern design.

The user provides a component, page, or interface to build with a pixel art or retro aesthetic. They may specify a particular era (8-bit, 16-bit, early PC) or leave it open.

## Art Direction: Think Like a Hardware Constraint

Real pixel art looks the way it does because of hardware limitations. Authentic retro design means understanding and *choosing* to work within constraints, not just making things blocky.

Before writing code, commit to a **hardware persona** — a reference system that guides every decision:

- **Resolution**: Pick a logical pixel grid. Classic systems used grids like 160×144 (Game Boy), 256×240 (NES), 320×200 (DOS/CGA), 128×128 (PICO-8). Your design should feel like it lives on one of these grids, even when rendered on a modern display. This doesn't mean your page literally needs to be 256×240 — it means your *design grid* has that feel, with elements sized and spaced in multiples of your base pixel unit.
- **Palette size**: Real hardware had strict limits — 4 colors (Game Boy), 25 on screen (NES), 16 (CGA/EGA), 16 (PICO-8). Choose a small palette and stick to it. When you use fewer colors, every color matters more.
- **Font style**: Pixel fonts are non-negotiable for body text. Google Fonts carries several: **Press Start 2P**, **Silkscreen**, **VT323**, **DotGothic16**, **Pixelify Sans**. For headings where you want more personality, you can use box-shadow-constructed custom lettering.
- **Sound thinking**: Even though this skill is visual, design with the assumption that there could be chiptune audio. This means: discrete states (not smooth transitions), clear feedback moments, rhythmic timing in animations.

### The Pixel Unit

Everything in your design should snap to a base pixel unit. Define it as a CSS custom property and build everything from it:

```css
:root {
  --px: 4px;  /* Each "retro pixel" is 4×4 CSS pixels */
}
```

Then use `calc()` everywhere: `width: calc(16 * var(--px))` for a 16-pixel-wide sprite. This keeps the entire design on-grid and makes it trivial to scale the whole thing up or down by changing one variable.

Avoid fractional pixel values. Round everything. Sub-pixel rendering is the enemy of crisp pixel art.

## Core CSS Techniques

### Box-Shadow Pixel Art

The `box-shadow` property can render individual pixels by stacking multiple shadows with no blur and no spread, each offset to a grid position. This is the workhorse technique for creating sprites, icons, borders, and decorative elements in pure CSS.

```css
.pixel-heart {
  width: var(--px);
  height: var(--px);
  background: transparent;
  box-shadow:
    /* Row 1 */
    calc(2 * var(--px)) 0 0 0 var(--red),
    calc(3 * var(--px)) 0 0 0 var(--red),
    calc(6 * var(--px)) 0 0 0 var(--red),
    calc(7 * var(--px)) 0 0 0 var(--red),
    /* Row 2 — fill out the shape */
    calc(1 * var(--px)) var(--px) 0 0 var(--red),
    calc(2 * var(--px)) var(--px) 0 0 var(--light-red),
    calc(3 * var(--px)) var(--px) 0 0 var(--red),
    /* ... continue per-pixel */;
}
```

**Key principles:**
- The element itself is 1 pixel unit. All the art comes from shadows.
- Each shadow is `x-offset y-offset 0 0 color` — zero blur, zero spread.
- Offsets are in multiples of `var(--px)`.
- For large sprites, consider generating the box-shadow values programmatically with a build script or CSS preprocessor. Hand-writing 200+ shadows is error-prone.
- **Scaling**: You can either use `calc()` with `var(--px)` (as shown above) for flexible sizing, or define the art at 1px base and use `transform: scale(N)` with an integer N. The `transform` approach is hardware-accelerated and often more performant.
- **Performance**: Box-shadow pixel art is fine for small-to-medium sprites (up to ~32×32 pixels). For larger images, use an actual `<img>` with `image-rendering: pixelated` instead — hundreds of box-shadows do have a rendering cost. Wrap pixel art elements in a layer-promoted container (`will-change: transform`) to isolate paint costs.

### Image Rendering: Pixelated

When you have an actual image (a sprite sheet, a background, a character portrait), this property tells the browser to use nearest-neighbor scaling instead of bilinear interpolation:

```css
.sprite {
  image-rendering: pixelated;
  image-rendering: crisp-edges;  /* Firefox prefers this */
}
```

Use this on `<img>` tags, `background-image`, `<canvas>`, and anything else that gets scaled. Without it, your carefully crafted 16×16 sprite turns into a blurry mess when scaled up.

**`pixelated` vs `crisp-edges`**: Both use nearest-neighbor, but `pixelated` scales to the nearest integer multiple first (then smooth-scales to the final size), while `crisp-edges` does strict nearest-neighbor to the exact final size. In practice: use `pixelated` for pixel art (it avoids shimmering at odd zoom levels), `crisp-edges` for QR codes and technical diagrams. Both are widely supported since 2020 — vendor prefixes are only needed for very old browsers.

Works on `<canvas>` elements too — set it in CSS and also set `context.imageSmoothingEnabled = false` in JavaScript for consistent results.

### Sprite Animation with steps()

The `steps()` timing function makes CSS animations jump between keyframes instead of smoothly interpolating — exactly how sprite animation works on real hardware.

```css
.character {
  width: calc(16 * var(--px));
  height: calc(16 * var(--px));
  background: url('spritesheet.png') left center;
  background-size: calc(16 * var(--px) * 4) calc(16 * var(--px)); /* 4 frames */
  image-rendering: pixelated;
  animation: walk 0.5s steps(4) infinite;
}

@keyframes walk {
  to { background-position: calc(-16 * var(--px) * 4) center; }
}
```

**How steps() works:**
- `steps(4)` divides the animation into 4 discrete jumps — no tweening.
- The sprite sheet has 4 frames side by side. The animation shifts `background-position` to reveal each frame.
- `steps(n, jump-end)` (the default) holds the first frame then jumps. `steps(n, jump-start)` jumps immediately. For sprite animation, the default is usually what you want.

For state-based animations (idle → walk → attack), use separate classes with different sprite sheets and animation durations. Toggle classes with JavaScript.

### Pixel Borders and Outlines

Retro UIs don't use `border-radius`. They use stepped, pixelated borders:

```css
.pixel-border {
  /* Outer border using box-shadow steps */
  box-shadow:
    /* Top-left corner notch */
    calc(-1 * var(--px)) 0 0 0 var(--border-color),
    calc(1 * var(--px)) 0 0 0 var(--border-color) /* ... etc */;
  /* Or use outline + clip-path for simpler cases */
  border: calc(2 * var(--px)) solid var(--border-color);
  /* Kill the rounding */
  border-radius: 0;
}
```

For dialog boxes, menus, and panels, build a 9-slice border using box-shadows or `border-image` with a pixelated source image. The classic RPG dialog box pattern:

```css
.dialog-box {
  background: var(--bg-dark);
  border: calc(var(--px) * 2) solid var(--border-light);
  outline: calc(var(--px) * 2) solid var(--border-dark);
  padding: calc(var(--px) * 4);
  image-rendering: pixelated;
}
```

## CRT & Scanline Effects

These effects simulate the look of old CRT monitors and arcade screens. Use them to add atmosphere and authenticity. Layer them from subtle to intense based on the desired effect.

### CSS Scanlines

The simplest CRT effect — a repeating transparent stripe overlay:

```css
.crt-scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 1px,
    rgba(0, 0, 0, 0.15) 1px,
    rgba(0, 0, 0, 0.15) 2px
  );
  pointer-events: none;
  z-index: 100;
}
```

Adjust the opacity (0.15) to taste — too strong looks like a screen door, too subtle and you lose the effect. The 1px/2px pattern works at standard resolution; increase for high-DPI displays.

### Phosphor Glow

CRT phosphors emitted light, giving text and bright elements a soft glow:

```css
.crt-glow {
  text-shadow:
    0 0 calc(var(--px) * 2) currentColor,
    0 0 calc(var(--px) * 4) currentColor;
  /* For entire screen glow */
  filter: brightness(1.1) contrast(1.1);
}

/* Pulsing phosphor effect */
@keyframes phosphor-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.97; }
}
.crt-container {
  animation: phosphor-pulse 0.1s steps(2) infinite;
}
```

### RGB Sub-Pixel Fringing

Old CRTs showed visible red, green, and blue sub-pixels, especially at edges:

```css
.crt-rgb-fringe {
  text-shadow:
    -0.5px 0 rgba(255, 0, 0, 0.3),
    0.5px 0 rgba(0, 0, 255, 0.3),
    0 0.5px rgba(0, 255, 0, 0.15);
}
```

### Flicker

Subtle full-screen flicker simulates an unstable signal:

```css
@keyframes crt-flicker {
  0% { opacity: 0.98; }
  5% { opacity: 0.95; }
  10% { opacity: 0.99; }
  15% { opacity: 0.96; }
  20% { opacity: 1; }
  100% { opacity: 1; }
}
.crt-screen {
  animation: crt-flicker 3s infinite;
}
```

Keep flicker subtle — it's an ambient effect, not a strobe light. The goal is to make the viewer's brain register "old monitor" without making them nauseous.

### Screen Curvature (CSS)

For a mild barrel distortion effect using pure CSS:

```css
.crt-curved {
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow:
    inset 0 0 60px rgba(0, 0, 0, 0.4),
    inset 0 0 15px rgba(0, 0, 0, 0.2);
}
```

The `inset box-shadow` darkens the edges, simulating the way CRT screens were dimmer at the periphery. Combined with a slight `border-radius`, this reads as a curved screen. For stronger curvature, see the Canvas CRT reference (`references/crt-canvas.md`).

### Composing CRT Effects

Layer these effects together. A typical CRT composite:

```css
.crt-monitor {
  position: relative;
  background: #0a0a0a;
  border-radius: 1.5rem;
  padding: calc(var(--px) * 4);
  box-shadow:
    inset 0 0 80px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 255, 0, 0.05);
  overflow: hidden;
}
.crt-monitor::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 1px,
    rgba(0, 0, 0, 0.12) 1px,
    rgba(0, 0, 0, 0.12) 2px
  );
  pointer-events: none;
  z-index: 10;
}
.crt-monitor::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
  z-index: 11;
}
```

## Color Palette Design

Retro palettes feel authentic because of their constraints. Here's how to build palettes that ring true.

### Principles

1. **Limit your count**: Pick a total number and stick to it. 4, 8, 16 — these are the sweet spots that feel right for different eras. If you find yourself reaching for a 17th color, rethink — one of your existing colors probably works.

2. **Include a true dark and a near-white**: Every retro palette needs strong anchoring at both ends. Your darkest color doesn't have to be #000 — many classic palettes used dark blue or dark green as their "black."

3. **Warm or cool bias**: Classic hardware palettes were rarely neutral. They leaned warm (NES's slightly warm base) or cool (Game Boy's green cast). Pick a temperature and let it unify everything.

4. **Skin and nature tones**: If your design includes characters or natural scenes, budget 2-3 colors for skin/earth/foliage. Classic designers always did.

5. **Accent with restraint**: One or two bright accent colors (a saturated red, a vivid cyan) should pop against the rest. If everything is vivid, nothing is.

### Building a Palette

Start with your background color and your text/foreground color. Then add:
- One highlight color (for interactive elements, focus states)
- One secondary color (for supporting UI, less important info)
- One or two midtones (for depth, borders, shadows)
- One accent (for alerts, emphasis, critical actions)

Define everything as CSS custom properties so palette swapping is trivial:

```css
:root {
  --bg:       #1a1c2c;
  --fg:       #f4f4f4;
  --primary:  #41a6f6;
  --secondary:#73eff7;
  --accent:   #ff6973;
  --mid-1:    #566c86;
  --mid-2:    #94b0c2;
  --shadow:   #333c57;
}
```

### Dithering in CSS

Classic hardware used dithering patterns to simulate colors they couldn't actually display. You can recreate this in CSS for backgrounds and fills:

```css
.dither-pattern {
  background-image:
    repeating-conic-gradient(
      var(--color-a) 0% 25%,
      var(--color-b) 25% 50%
    );
  background-size: calc(var(--px) * 2) calc(var(--px) * 2);
  image-rendering: pixelated;
}
```

For more complex dithering (ordered, Floyd-Steinberg patterns), use a tiny `<canvas>` drawn at 1:1 pixel ratio, then scaled up with `image-rendering: pixelated`.

## Typography

### Pixel Fonts

Always import a pixel font for body text. These render crisply at their native size and multiples:

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
/* or */
@import url('https://fonts.googleapis.com/css2?family=Silkscreen&display=swap');

body {
  font-family: 'Press Start 2P', monospace;
  font-size: calc(var(--px) * 2);  /* 8px at --px:4px — native rendering size */
  line-height: 1.8;  /* Pixel fonts need generous line-height */
  -webkit-font-smoothing: none;  /* Disable anti-aliasing */
  -moz-osx-font-smoothing: unset;
}
```

**Critical**: Set font sizes to exact multiples of the font's native pixel size. Press Start 2P is designed for 8px — use 8px, 16px, 24px, etc. Fractional sizes cause blurring.

### Typewriter / Terminal Text Effect

```css
.typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: calc(var(--px) * 2) solid var(--fg);
  animation:
    typing 2s steps(20) forwards,
    blink-caret 0.5s steps(2) infinite;
}
@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}
@keyframes blink-caret {
  50% { border-color: transparent; }
}
```

## Layout Patterns

### Retro UI Components

**Health/stat bars:**
```css
.health-bar {
  width: calc(var(--px) * 40);
  height: calc(var(--px) * 4);
  background: var(--shadow);
  border: calc(var(--px)) solid var(--fg);
  position: relative;
}
.health-bar-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s steps(10);
}
```

**Selection cursors:**
```css
.menu-item::before {
  content: '▸';
  opacity: 0;
  margin-right: calc(var(--px) * 2);
  animation: cursor-blink 0.6s steps(2) infinite;
}
.menu-item:hover::before,
.menu-item.selected::before {
  opacity: 1;
}
```

**Dialog boxes** with the classic RPG border pattern should use a double-border technique (border + outline, or nested elements) to create the characteristic inset/raised look.

### Responsive Pixel Scaling

The `--px` variable approach makes responsive design straightforward:

```css
:root { --px: 3px; }

@media (min-width: 768px) {
  :root { --px: 4px; }
}
@media (min-width: 1200px) {
  :root { --px: 5px; }
}
```

The entire design scales uniformly because every dimension is expressed in terms of `--px`.

## Advanced: Canvas CRT Effects

For effects beyond what CSS can achieve (barrel distortion, per-pixel phosphor simulation, advanced RGB sub-pixel rendering), see `references/crt-canvas.md`. Use canvas when:
- You need actual barrel distortion (warped screen curvature)
- You want per-pixel phosphor glow simulation
- You need RGB shadow mask patterns
- You're building a full-screen retro terminal emulator

For most projects, the CSS effects above are sufficient and much simpler to implement.

## Checklist: Is It Authentic?

Before shipping, verify:
- [ ] All dimensions snap to the pixel grid (no fractional pixels)
- [ ] `image-rendering: pixelated` is on every scaled image and canvas
- [ ] Font sizes are at native multiples of the pixel font's design size
- [ ] The color palette has a defined limit and a consistent temperature
- [ ] Animations use `steps()` — no smooth easing for anything that should feel retro
- [ ] Borders are square (no `border-radius` except for CRT screen containers)
- [ ] Anti-aliasing is disabled on text (`-webkit-font-smoothing: none`)
- [ ] The design would be plausible on the reference hardware
