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
- Repeats indefinitely; TODO: add ScrollTrigger or custom event trigger
- Translation keys: `intro.scrollHint` ("Scroll" / "Slinkite")

### Hero Row Layout (global.css)
- `.hero-row`: flex row for STUDIO + BodyTextContainer
- `align-items: start`, `justify-content: center`
- Adaptive horizontal gap: 16px (360px) → 27px (1440px), scales up
- Adaptive vertical pull-up (margin-top): -8px (360px) → -23.6px (1440px), scales up
- `.hero-row > .body-text-container`: top margin matches horizontal gap

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
