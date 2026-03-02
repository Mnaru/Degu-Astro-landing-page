# Gallery Section — Component Specification

## Overview

The page contains 5 gallery sections stacked vertically: **ManillaGallery**, **CrocsGallery**, **AlitaGallery**, **MixGallery**, **MaximaGallery**. There are two gallery formats: **2-Image Static** and **Infinite Scroll**. All galleries share common image treatment, naming animation, and touch-snap behavior.

---

## Architecture

### Data Layer — Content Collection

Define galleries in a content collection using `src/data/galleries.json` (or individual JSON per gallery). Each entry contains:

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const galleries = defineCollection({
  loader: file('src/data/galleries.json'),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['static', 'infinite']),
      images: z.array(
        z.object({
          src: image(),
          alt: z.string(),
        })
      ),
    }),
});

export const collections = { galleries };
```

Images must live in `src/assets/` (not `public/`) so `astro:assets` can optimize them. Reference them via relative paths in the JSON.

### Component Structure — Individual Files

Each gallery is its own `.astro` component:

```
src/components/galleries/
├── ManillaGallery.astro   (infinite)
├── CrocsGallery.astro     (static)
├── AlitaGallery.astro     (infinite)
├── MixGallery.astro       (static)
├── MaximaGallery.astro    (infinite)
```

Each component fetches its own entry from the content collection and renders using shared markup patterns. No generic base component — each file is self-contained for easy per-gallery tweaking.

### Client-Side JS — Shared Utilities in `src/lib/`

Complex JS logic lives in shared utilities. Each component's `<script>` tag imports what it needs. Astro bundles and dedupes automatically.

```
src/lib/
├── gallery-scroll.ts       // Infinite scroll: auto-scroll, pause-on-hover, speed control
├── gallery-observer.ts     // IntersectionObserver: name animation trigger, touch-snap
├── gallery-overlay.ts      // Hover overlay removal logic
```

Each component's `<script>` initializes by querying its own DOM and calling into these shared utils.

---

## Format A: 2-Image Static Gallery

**Used by:** CrocsGallery, MixGallery

### Layout — Desktop (>1200px)

- Two images side by side, horizontal layout.
- **Gap between images:** 12px.
- **Padding:** 6px top, 6px bottom. No left/right padding.
- **Background:** transparent.
- **Height at 1440px:** 960px.
- **Scaling:** Height scales proportionally with viewport width. Use `clamp()` or a `calc()` based on `100vw`. At 1440px → 960px. Larger screens scale up, smaller screens (down to 1201px) scale down proportionally. Formula: `height = (960 / 1440) * 100vw` → approximately `66.67vw`.
- Both images share the available width equally (minus the 12px gap): `calc((100% - 12px) / 2)`.

### Layout — Mobile (≤1200px)

- Only the **first image** is displayed. The second image is hidden (`display: none`).
- The single image fills the full viewport: **100vw × 100vh**.
- **No padding, no gaps** — edge to edge.
- Image uses `object-fit: cover` and `object-position: center`.

---

## Format B: Infinite Scroll Gallery

**Used by:** ManillaGallery, AlitaGallery, MaximaGallery

### Layout — Desktop (>1200px)

- Horizontal auto-scrolling strip of images.
- **Padding:** 12px top, 12px bottom.
- **Height:** 100vh (full viewport height).
- **First image offset:** 12px from the left edge of the viewport on initial load. The scroll track begins at left: 12px.
- **Gap between images:** 12px.
- **Background:** transparent.
- **Scroll direction:** right to left.
- **Scroll speed:** 60px/second (configurable via CSS custom property or JS constant).
- **Infinite loop:** Images repeat seamlessly. Duplicate the image set in the DOM to create the illusion of infinite scroll.
- **Pause on hover:** Auto-scroll pauses when the cursor is anywhere over the gallery container. Resumes on mouse leave.

### Layout — Mobile (≤1200px)

- Images scale down to **95% of viewport width**. Height scales proportionally (preserve aspect ratio).
- Scaled images are **vertically centered** within the gallery container (the gallery is still 100vh).
- One image is fully visible at a time with a **~5% peek** of the next image on the trailing edge (starting point — will be fine-tuned on device).
- Auto-scroll continues at the same speed.
- Pause-on-hover does not apply (no cursor on touch devices).

---

## All Images — Shared Behavior

### Aspect Ratio & Cropping

- All images **preserve their original aspect ratio**.
- Use `object-fit: cover` so the image fills its container.
- Use `object-position: center` — the focal point is always the center of the image. The container may crop left/right/top/bottom edges, but the center is always visible.

### Dark Overlay

- Every image has a **20% black overlay** by default.
- Implementation: a `::after` pseudo-element on the image wrapper with `background: rgba(0, 0, 0, 0.2)` and `pointer-events: none`, covering the full image.
- **On hover:** the overlay transitions to `rgba(0, 0, 0, 0)` (fully transparent). Use a CSS transition for smooth fade, e.g. `transition: background 0.3s ease`.
- The hover target is the individual image wrapper, not the entire gallery.

---

## All Galleries — Shared Behavior

### Gallery Name Animation

**Trigger in:**
- When the user scrolls and **80% of the gallery** is visible in the viewport (IntersectionObserver with `threshold: 0.8`), the gallery name appears.

**Trigger out:**
- When only **20% of the gallery** remains visible (IntersectionObserver with `threshold: 0.2`), the gallery name disappears.

**Position:**
- Centered both vertically and horizontally within the gallery container.
- Use `position: absolute` within the gallery (which is `position: relative`), with `top: 50%; left: 50%; transform: translate(-50%, -50%)`.
- The name sits on top of images (high `z-index`), does **not** block hover interactions on images (`pointer-events: none` on the name element).

**Animation — appear:**
- The gallery name animates in **letter by letter, from the bottom**.
- Each letter starts offset below its final position (e.g. `translateY(100%)` and `opacity: 0`) and transitions to `translateY(0)` and `opacity: 1`.
- **Stagger:** 80ms delay per letter.
- Implementation: wrap each character in a `<span>` with inline `transition-delay` calculated as `index * 80ms`. Toggle a class to trigger the transition.

**Animation — disappear:**
- Reverse the animation or simply fade out all letters simultaneously (simpler). Decide during implementation.

**Typography:**
- To be defined later. Placeholder: large, bold, uppercase, white, centered.

### Touch Snap (≤1200px / touch viewports)

- Applies to **all 5 galleries** (both static and infinite scroll).
- When the user scrolls vertically on a touch device, the page should **snap** so that each gallery is centered in the viewport.
- Implementation: use CSS `scroll-snap-type: y mandatory` on the parent scroll container, and `scroll-snap-align: center` on each gallery section.
- This is a **vertical page-level snap**, not horizontal snap within the gallery.

---

## Responsive Breakpoint Summary

| Viewport Width | 2-Image Static | Infinite Scroll |
|---|---|---|
| >1440px | Height scales up from 960px proportionally | 100vh, horizontal auto-scroll, 12px offset |
| 1440px | 960px height, 2 images side by side, 12px gap | 100vh, horizontal auto-scroll, 12px offset |
| 1201–1439px | Height scales down proportionally | Same as above |
| ≤1200px | 1 image, 100vw × 100vh, no padding | 95vw images, vertically centered, ~5% peek |

---

## File Tree Summary

```
src/
├── assets/
│   └── galleries/          # All gallery images (optimized by astro:assets)
│       ├── manilla/
│       ├── crocs/
│       ├── alita/
│       ├── mix/
│       └── maxima/
├── content.config.ts        # Gallery collection schema
├── data/
│   └── galleries.json       # Gallery entries (name, type, image refs)
├── components/
│   └── galleries/
│       ├── ManillaGallery.astro
│       ├── CrocsGallery.astro
│       ├── AlitaGallery.astro
│       ├── MixGallery.astro
│       └── MaximaGallery.astro
├── lib/
│   ├── gallery-scroll.ts    # Auto-scroll logic, pause-on-hover, speed
│   ├── gallery-observer.ts  # IntersectionObserver for name animation
│   └── gallery-overlay.ts   # Hover overlay removal
└── pages/
    └── index.astro          # Mounts all 5 galleries with scroll-snap container
```

---

## CSS Custom Properties (suggested)

Define on the gallery container or `:root` for easy tuning:

```css
--gallery-scroll-speed: 60;          /* px per second */
--gallery-overlay-opacity: 0.2;      /* default overlay */
--gallery-name-stagger: 80ms;        /* letter animation delay */
--gallery-static-height: 66.67vw;    /* 960/1440 ratio */
--gallery-gap: 12px;
--gallery-static-padding: 6px;
--gallery-infinite-padding: 12px;
--gallery-mobile-image-scale: 0.95;  /* 95vw */
--gallery-mobile-peek: 0.05;         /* ~5% next image visible */
```

---

## Open Items

- [ ] Gallery name typography (font, size, weight, color) — to be defined later.
- [ ] Gallery name disappear animation — reverse letter-by-letter or simultaneous fade.
- [ ] Fine-tune mobile peek percentage on device.
- [ ] Fine-tune auto-scroll speed on device.
- [ ] Determine gallery order on the page (currently assumed: Manilla → Crocs → Alita → Mix → Maxima based on screenshots).
- [ ] Confirm image assets and alt text per gallery.
