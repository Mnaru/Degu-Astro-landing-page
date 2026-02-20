# Updates

## Completed

### Header
- Flex layout: LanguageSwitcher (left), DeguLogo (right), space-between
- Adaptive padding: 15px (360px) → 30px (1440px), scales up, min 15px
- No bottom padding, no background
- Full width, height fits content

### DeguLogo
- Uses Astro Image component with Logo.png
- Adaptive height: 40px (360px) → 56px (1440px), scales up proportionally
- Width auto preserves aspect ratio
- Removed fixed positioning (now lives inside Header)

### LanguageSwitcher
- Vertical layout: LT on top, EN below
- 38px circles with -10deg rotation, 8px gap (fixed sizes)
- Text: Public Sans, 11px, 700 weight, 1.32px letter-spacing, offwhite
- Active state: offwhite fill, black text, 800 weight
- Hover: offwhite fill, black text (0.2s transition)
- Inactive: offwhite border and text, no fill

### HeaderContainer (DEGU)
- Anton SC, offwhite color, uppercase, center-aligned
- Adaptive font-size: 100px (360px) → 250px (1440px), scales up
- `line-height: 1` (fallback for `text-box-trim`)
- Container width: fit-content, `margin-inline: auto` for centering
- Adaptive margin-top: 267px (360px) → 150px (1440px), clamped
- `text-box-trim: both` + `text-box-edge: cap` for leading control
- `white-space: nowrap`
- Optical alignment: `margin-left: var(--optical-adjust-display)`

### HeaderContainerStudio (STUDIO)
- Anton SC, offwhite color, uppercase, center-aligned
- Adaptive font-size: 74px (360px) → 182px (1440px), scales up
- `line-height: 1` (fallback for `text-box-trim`)
- Container width: fit-content (no centering, positioned by hero-row)
- `text-box-trim: both` + `text-box-edge: cap` for leading control
- `white-space: nowrap`
- Optical alignment: `margin-left: var(--optical-adjust-display)`

### BodyTextContainer
- Instrument Serif italic, offwhite color, left-aligned
- Fluid font-size: 16px (360px) → 37px (1440px), scales up
- Fluid line-height: 16px (360px) → 38px (1440px), scales up
- Container width: fit-content, height: auto
- Line breaks controlled via `<br>` in translations
- Renders HTML with `set:html`
- Optical alignment: `margin-left: var(--optical-adjust-serif)`

### Hero
- Full viewport section: `width: 100%`, `min-height: 100vh`
- Flex layout with `hero-inner` stretching to fill
- Adaptive padding: 15px (360px) → 30px (1440px) top/left/right, scales up
- Bottom padding: 62px (360px) → 30px (1440px), then scales up
- Contains HeaderContainer + hero-row via `<slot />`

### ScrollHint
- Text-only element, no border/pill styling
- Public Sans, 11px, 700 weight, 1.32px letter-spacing, uppercase, offwhite
- Fixed size on all viewports (no adaptive scaling)
- Positioned absolute bottom-center of `hero-inner`, 6px up from edge
- GSAP 3D cylinder rolling text animation (top-to-bottom rotation)
- 4 stacked lines, each split into individual character spans
- `perspective: 200`, `transformStyle: 'preserve-3d'`, `backfaceVisibility: hidden`
- `transformOrigin: '50% 50% -7px'` (cylinder radius scaled for 11px font)
- `rotationX: 90 → -90` per line, stagger 0.1 per character, `ease: 'none'`
- Lines staggered at `index * (animTime * 0.5)`, `animTime: 0.9`
- Repeats indefinitely; triggered by heroIntro `onComplete`
- Translation keys: `intro.scrollHint` ("Scroll" / "Slinkite")

### Hero Row Layout (global.css)
- `.hero-row`: flex row for STUDIO + BodyTextContainer
- `align-items: start`, `justify-content: center`
- Adaptive horizontal gap: 16px (360px) → 27px (1440px), scales up
- Adaptive vertical pull-up (margin-top): -8px (360px) → -23.6px (1440px), scales up
- `.hero-row > .body-text-container`: top margin matches horizontal gap

## Animation Architecture

### Principles
- **CSS = final keyframe** — all component styles define the end state
- **GSAP animates FROM initial states TO CSS** — layout is the source of truth
- **`[data-gsap]`** hides elements until GSAP reveals them (prevents flash)
- **`autoAlpha`** for appear/disappear (opacity + visibility, works with `data-gsap`)
- **`prefers-reduced-motion`** respected via `gsap.matchMedia()`

### Structure
- **Intrinsic animations** (self-contained, e.g. ScrollHint cylinder) → live in the component's `<script>`
- **Orchestrated animations** (entrances, exits, position changes between siblings) → section-level files in `src/lib/animations/`
- One file per section: `heroIntro.ts`, `aboutIntro.ts`, etc.
- Each exports a function that takes the section element
- Each uses `gsap.context(fn, sectionEl)` for scoping and cleanup

### Section animation pattern
```
// src/lib/animations/sectionName.ts
export function sectionName(el: HTMLElement) {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ scrollTrigger: { ... } });
    tl.from('.child', { autoAlpha: 0, ... });
  }, el);
  return ctx;
}
```

### Initialization
- Each section component has a `<script>` that imports and calls its animation function
- No central coordinator — ScrollTrigger sequences sections via scroll position
- Cross-section transitions handled by overlapping ScrollTrigger ranges

### Hero Intro Animation (`src/lib/animations/heroIntro.ts`)
- **Trigger:** page load (timed, not scroll-driven)
- **Scroll override:** if user scrolls during animation, `tl.tweenTo()` accelerates to end state (0.4s, `power2.inOut`)
- **Flash prevention:** `hero-inner` has `data-gsap`, revealed after initial states are set
- **Initial state:** DEGU centered (CSS), STUDIO shifted to page center (`studioOffsetX` calculated dynamically), BodyText and ScrollHint hidden via `autoAlpha: 0`
- **Sequence:**
  1. `t=0.4` — Hold centered state for 400ms
  2. `t=0.4` — **Slide apart** (elastic stretch feel): DEGU right 18%, STUDIO left 22% of container width. Asymmetric timing for organic feel: DEGU 0.5s / STUDIO 0.55s (20ms offset), `power3.out` (decelerates as elastic stretches). Subtle rotation ±0.3deg adds weight.
  3. `t≈0.97` — **Snap back** immediately (elastic release): STUDIO returns first (0.21s), DEGU follows 20ms later (0.24s), `power3.in` (accelerates into position). Rotation overshoots ±0.15deg then settles to 0 over 0.3s.
  4. `t≈1.23` — **Scale down**: DEGU and STUDIO scale to 0.98 over 3s (`power2.out`). `transformOrigin: 'center bottom'` (DEGU) / `'left top'` (STUDIO) preserves gap between them.
  5. `t≈1.23` — **BodyText appears**: instant fade-in, then drifts from `x: -10, y: -8` to final position while scaling to 1.03 over 2s (`power2.out`).
  6. `t≈1.53` — **ScrollHint fades in** (0.5s, `power2.out`), then fires cylinder rotation via `_scrollHintTl.play()`
- **ScrollHint integration:** cylinder timeline created paused in component `<script>`, stored on element as `_scrollHintTl`, played by heroIntro `onComplete`

## Removed
- All layouts (`src/layouts/`)
- All animations (`src/lib/animations/`)
- Page layout markup and animation scripts (pages stripped to imports only)

## Global changes
- Background changed to `#000` (pure black)
- Added `--color-offwhite: #E4E4E4` design token
- Added `--optical-adjust-display: -0.04em` (Anton SC left side bearing)
- Added `--optical-adjust-serif: 0.02em` (Instrument Serif left side bearing)
- Added adaptive foundations (fluid media defaults)
- Added `[data-gsap]` visibility convention for GSAP
- Added `prefers-reduced-motion` support
