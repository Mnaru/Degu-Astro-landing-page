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

### NavArrowButton
- White circular button: 64x64px, border-radius 50%
- Centered arrow icon (20x20px) from NavArrowButtonIcon.svg
- Two variants via `direction` prop: 'up' | 'down' (default 'down')
- Up variant rotates icon 180deg
- Fixed size on all viewports

### NavTextButton
- White pill-shaped button: 64px height, border-radius 100px
- Text: #1A1A1A, Public Sans, 16px, 500 weight, 32px horizontal padding
- Width adapts to text content
- Named `icon` slot for responsive icon switching
- Responsive: >=420px shows text, <=419px collapses to 64x64px icon button (text hidden, icon shown)

### NewMenu
- Composite nav component: Home button + arrow up + arrow down + Contact button
- Default: flex row, 8px gap, align-items center
- Responsive (<=420px): full width, 15px left/right padding, justify-content space-between
  - Arrow buttons wrapped in `.new-menu__arrows` div preserving 8px gap
  - Available space distributed equally between home/arrows and arrows/contact
  - All children have flex-shrink: 0 to prevent button shrinking
- Icons: inline SVGs from NavHomeButtonIcon.svg and NavContactButtonIcon.svg
- Translations: en (Home / Contact), lt (Į pradžią / Parašyk mums)
- **Pointer hover interaction** (`hover: hover`): GSAP 3D tilt + parallax
  - `transformPerspective: 400` on each button
  - `rotationX`/`rotationY` ±20deg via `gsap.quickTo` (power3, 0.4s) tracking cursor position relative to button bounds
  - Inner content (icons, labels) shifts ±4px x/y for parallax depth
  - Resets to neutral on `pointerleave`
- **Touch interaction** (`hover: none`): compress & release
  - `pointerdown`: scale 0.92, opacity 0.85 (0.05s, power2.in) — near-instant for fast taps
  - `pointerup`/`pointerleave`: spring back to scale 1, opacity 1 (0.24s, back.out(1.7) overshoot)
  - `overwrite: true` prevents tween conflicts on rapid taps
- Both interactions wrapped in `gsap.matchMedia()`, disabled when `prefers-reduced-motion: reduce`

### EmailUsButton
- Pill-shaped CTA button: 42px height, border-radius 100px
- Text: Public Sans, 14px, 700 weight, no letter-spacing, uppercase, offwhite
- Border: 1px solid offwhite, background black
- Hover: orange (`--color-orange`) fill and border, text stays offwhite (0.2s transition)
  - Hover styles wrapped in `@media (hover: hover)` to prevent sticky hover on mobile
- Focus-visible: 2px offwhite outline, 2px offset
- Click: copies email to clipboard (Clipboard API with `execCommand` fallback)
- Feedback: shows "💚 Email copied!" for 3s, then reverts to label
  - Emoji detected via `\p{Emoji_Presentation}` regex, rendered at 1.2em with inline-flex wrapper and 8px gap
  - `.copied` class applies orange fill/border during feedback
  - `.copied` state reduces left padding to 18px
  - `clearTimeout` pattern prevents stale timeouts on rapid clicks
- Props: `email` (default: monika@nuar.app), `label`, `feedbackText`, `class`
- Translations: en "Email us" / "💚 Email copied", lt "Parašyk mums" / "💚 Emeilas nukopijuotas!"

### FollowUsButton
- Pill-shaped CTA button: identical styling to EmailUsButton
- Hover: orange (`--color-orange`) fill and border, text stays offwhite
  - Hover styles wrapped in `@media (hover: hover)` to prevent sticky hover on mobile
- Click: opens Instagram link in new window (`window.open` with `noopener,noreferrer`)
- Props: `href` (default: https://www.instagram.com/degu.studio/), `label` (default: "Follow us"), `class`
- No feedback state (simple link action)

### LanguageSwitcher
- Vertical layout: LT on top, EN below
- 38px circles with -10deg rotation, 8px gap (fixed sizes)
- Text: Public Sans, 11px, 700 weight, no letter-spacing, offwhite
- Active state: offwhite fill, black text, 800 weight, 1.5px black outline (offset -1.5px, hugs button)
- Hover: offwhite fill, black text (0.2s transition)
- Inactive: black fill, offwhite border and text

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

### Hero Outro Animation (`src/lib/animations/heroExit.ts`)
- **Trigger:** called by heroIntro's `onComplete` callback
- **Scroll-driven** via GSAP ScrollTrigger `pin` + `scrub` (replaces manual scroll hijack)
- **ScrollTrigger config:** `trigger: heroEl`, `pin: true`, `pinSpacing: true`, `scrub: 0.3`, `start: 'top top'`, `end: '+=1500'`
- **Phase A — Transform origin swap** (instant, no visual jump):
  - Both DEGU and STUDIO swap from heroIntro origins (`center bottom` / `left top`) to `top left`
  - Compensation: snapshot `getBoundingClientRect()`, clear transforms, re-measure natural position, apply `x`/`y` offset to keep visual position identical
- **Phase B — Target scale:** fills viewport height with 2% vertical padding and -40px gap (slight overlap). `targetScale = availableHeight / (deguNaturalH + studioNaturalH + outroGap)`
- **Phase C — Target positions:** left-aligned with 2% horizontal padding, STUDIO positioned below DEGU
- **Timeline sequence** (durations are proportions of 1500px scroll distance):
  1. `t=0` — ScrollHint fades out (0.15), BodyText fades out + slides right 30px (0.3, `power2.in`)
  2. `t=0` — DEGU and STUDIO scale up to `targetScale` and move to target positions (1.2, `power2.inOut`)
  3. `t=1.2` — DEGU flies left off-screen, STUDIO flies right off-screen (0.5, `power3.in`)
- **Cylinder pause/resume:** `onUpdate` callback pauses ScrollHint cylinder (`_scrollHintTl`) when progress > 1%, resumes when reversed back to ~0%
- **Reverse:** fully automatic via ScrollTrigger scrub — scrolling up reverses the entire animation
- **Body overflow:** released at start of heroExit so native scroll drives ScrollTrigger

### Outro (done — animations later)
- Full viewport section: `width: 100%`, `min-height: 100dvh`
- Flex layout with `outro-inner` stretching to fill (`flex: 1`, `justify-content: center`)
- Adaptive padding: same pattern as Hero (15px→30px sides, inverse bottom)
- Contains OutroHeaderContainer ("DROP US"/"PARAŠYK"), OutroStudioContainer ("A LINE"/"MUMS"), OutroBodyTextContainer, EmailUsButton, FollowUsButton via `<slot />`
- **OutroHeaderContainer**: `width: fit-content`, Anton SC, adaptive font-size 140px (360px) → 250px (1440px), `text-box-trim: both`
- **OutroStudioContainer**: `width: fit-content`, Anton SC, adaptive font-size 120px (360px) → 177px (1440px), margin-top `calc(8.67px + 0.926vw)` (12px→22px)
- **OutroBodyTextContainer**: Instrument Serif normal (not italic), 24px flat font-size, `letter-spacing: -0.05em`, `line-height: 1`
- **Centering**: `.outro-content` wrapper with `width: fit-content; margin-inline: auto`, collapses to left-aligned below 500px
- **Gaps**: body text gap `clamp(56px, calc(421.33px - 25.37vw), 330px)` (large on mobile, small on desktop); button gap fixed 27px
- **Team photo**: absolute positioned `<Image>` from `src/assets/images/team/TeamPhoto.png`
  - `right: calc(-235.68px + 45.181vw)` — px+vw fluid interpolation
  - `top: calc(50% - 140px + 4.167vw)` — center-anchored with fluid offset
  - `width: calc(287.56px - 2.608vw)` — fluid width, ~250px at 1440px
  - `transform: rotate(10.86deg)` — constant rotation matching Figma
  - No media queries — all properties transition smoothly between 360px and 1440px
- Translations: EN/LT body text with line breaks, header text

### GalleryLabel
- Inline text block with two parts: main title + optional subtitle
- **Main text** (`text` prop): Anton SC, uppercase, offwhite
  - Adaptive font-size: 50px (360px) → 103px (1440px), scales up
  - Adaptive line-height: 46px (360px) → 95px (1440px), scales up
- **Subtitle** (`subtext` prop, optional): Instrument Serif italic, offwhite
  - Adaptive font-size: 18px (360px) → 37px (1440px), scales up
  - `line-height: 1`
  - `display: inline-block` — baseline of last line aligns with main text baseline
  - Fixed 24px gap (`margin-left`) between main text and subtitle on all screens
- Both props support HTML via `set:html` (e.g. `<br>` for line breaks)
- Container: auto width, no background

## Removed
- All layouts (`src/layouts/`)
- All animations (`src/lib/animations/`)
- Page layout markup and animation scripts (pages stripped to imports only)

### FluidBackground
- Interactive GPU-accelerated fluid simulation background using `gpu-io` (MIT)
- Renders Navier-Stokes velocity field as directional dashes (grey `0.25` on black)
- Clean redraw every frame — no trail/ghosting effect
- Simulation runs at 1/8th canvas resolution for performance
- Mouse/touch interaction: pointer movement applies force to fluid via `stepSegment()`
- Pointer events listened on `window` (reacts anywhere on page), wrapper has `pointer-events: none` (clicks pass through)
- Fixed position, full viewport, `z-index: 0` (behind all content)
- Lazy-initialized: starts after `document.fonts.ready`
- Fallbacks: static black for no-WebGL, `prefers-reduced-motion`, or init failure
- Pauses when tab hidden (Page Visibility API)
- Mobile: wider dash spacing (16px vs 10px), frame skipping (~30fps)
- Debounced resize handler (200ms) re-creates simulation layers at new dimensions
- WebGL context loss handled (pauses simulation)
- Files: `src/components/FluidBackground.astro`, `src/lib/fluid/fluidSim.ts`, `src/lib/fluid/config.ts`
- Bundle: ~150 KB (41 KB gzipped)

## Global changes
- Background changed to `#000` (pure black)
- Added `--color-offwhite: #E4E4E4` design token
- Added `--color-orange: #E82D02` design token
- Added `--optical-adjust-display: -0.04em` (Anton SC left side bearing)
- Added `--optical-adjust-serif: 0.02em` (Instrument Serif left side bearing)
- Added adaptive foundations (fluid media defaults)
- Added `[data-gsap]` visibility convention for GSAP
- Added `prefers-reduced-motion` support
