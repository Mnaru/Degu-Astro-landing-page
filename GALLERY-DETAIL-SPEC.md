# Gallery Detail Page — Component Specification

## Overview

Each of the 5 galleries (Manilla, Crocs, Alita, Mix, Maxima) has a dedicated detail page showing all photos from that project in an interactive stacked card UI. The user navigates here by clicking a gallery on the landing page.

---

## Routing

**Pattern:** `src/pages/[locale]/gallery/[slug].astro`

**Generated pages:**
- `/en/gallery/manilla`, `/lt/gallery/manilla`
- `/en/gallery/crocs`, `/lt/gallery/crocs`
- `/en/gallery/alita`, `/lt/gallery/alita`
- `/en/gallery/mix`, `/lt/gallery/mix`
- `/en/gallery/maxima`, `/lt/gallery/maxima`

Uses `getStaticPaths` to generate all locale + slug combinations, matching the existing `[locale]/index.astro` pattern.

---

## Page Layout

### Header Bar

- **Job done title** (left-aligned): Describes the type of work.
  - Manilla, Crocs → "Product Photography"
  - Mix, Alita → "Social media assets"
  - Maxima → "Key visuals & OOH"
- **Gallery title** (centered): The gallery/brand name (MANILLA, CROCS, etc.)
- **Close button** (right-aligned): Closes the page and returns to the landing page.

### Spacing

- Desktop: 30px inset from top, left, and right edges.
- Mobile: 15px inset from top, left, and right edges.
- Use the project's existing adaptive spacing formula with `max()` / `calc()` / `vw` for fluid transition between breakpoints.

### Mobile Adjustments

- Job done title is **hidden** on mobile (≤1200px).
- Only gallery title and close button are visible.

### Z-index

- The header bar (job title, gallery title, close button) sits above the photo stack at all times. Cards slide **underneath** the header, never on top.

---

## Backgrounds

Each gallery detail page has a unique solid background color:

| Gallery | Background |
|---------|-----------|
| Manilla | `#6584A1` |
| Crocs   | `#A5A196` |
| Alita   | `#E2B032` |
| Mix     | `#C70022` |
| Maxima  | `#D3D5D9` |

Background covers the full viewport. Set on the `<body>` or a full-screen wrapper element.

---

## Photo Stack

### Data

All images come from `src/assets/images/galleries/{slug}/`. The detail page imports every image in the folder — this includes both the landing page preview images and additional detail-only images.

### Stacking

- Photos are stacked on top of each other, centered in the viewport (below the header bar).
- **No rotation** on any card.
- Cards have a **slight xy offset** from each other so the edges of cards underneath peek out from behind the top card. This creates a layered depth effect without rotation. The offset should be subtle — a few pixels per card in a consistent or slightly varied direction.
- The **first image** from the gallery is on top of the stack.
- Each card is the same size — large enough to be the primary visual focus. Size should be responsive, roughly 70–80% of viewport width on desktop, larger on mobile.
- Images use `object-fit: cover` and `object-position: center`.

### Card Interaction — Click/Drag to Dismiss

- **Desktop:** The user can **click and drag** the top card horizontally. If dragged far enough, the card slides to the edge of the viewport. If not dragged far enough, it snaps back to its original position.
- **Desktop alternative:** A simple **click** (without drag) also dismisses the top card — slides it to the viewport edge.
- **Mobile:** The user **swipes/drags** the top card horizontally to dismiss.
- **Direction:** The card slides to the left or right edge based on the drag direction. If clicked without drag, pick a default direction (e.g. left).

### Dismissed Card — Peeking

- When a card is dismissed, it slides to the viewport edge but **does not fully leave the screen**. Approximately 10–15% of the card remains visible (peeking).
- The peeking card sits **underneath** the header bar text and close button.
- **Click/tap on the peeking card** → it slides back to its original position on top of the stack.
- Only **one card can be dismissed at a time**. Dismissing a new card returns the previously dismissed card first (or prevents dismissal until the peeking card is returned).

### Card Order

Cards cycle through one by one. When the top card is dismissed, the next card in the stack becomes the active/top card. Returning a dismissed card places it back on top.

---

## Effects

### Pulse Animation

- All cards in the stack have a **subtle, continuous pulse** effect.
- Implementation: GSAP timeline with `repeat: -1, yoyo: true`, animating `scale` from `1.0` to approximately `1.01–1.02`.
- Stagger the pulse across cards so they don't all pulse in sync — creates an organic breathing feel.
- The pulse is very subtle — barely noticeable, just enough to make the stack feel alive.

### Mouse Proximity — Grow Effect

- When the mouse cursor is near a card, that card **scales up slightly** based on proximity.
- Implementation: `mousemove` listener on the page. Calculate distance from cursor to each visible card's center. Map distance to a `scale` value using `gsap.to()` with a short duration for smooth interpolation.
- Closer = larger (e.g. scale up to `1.05`). Far away = normal size (`1.0`).
- This effect layers on top of the pulse animation.
- **Desktop only** — no equivalent on touch devices (no persistent cursor position).

---

## Close Button

### Behavior

- Primary: `history.back()` — returns the user to the exact scroll position on the landing page.
- Fallback: If there's no browser history (user arrived via direct link), navigate to `/${locale}/#gallery-${slug}` to scroll to the relevant gallery section on the landing page.

### Implementation

```js
function handleClose(locale, slug) {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = `/${locale}/#gallery-${slug}`;
  }
}
```

For the fallback to work, each gallery section on the landing page needs an `id` attribute (e.g. `id="gallery-manilla"`).

---

## Translations

Add to `src/i18n/translations.ts` in both locale objects:

```ts
galleries: {
  // Existing name entries...
  manilla: { name: 'MANILLA', jobDone: 'Product Photography' },
  crocs: { name: 'CROCS', jobDone: 'Product Photography' },
  alita: { name: 'ALITA', jobDone: 'Social media assets' },
  mix: { name: 'MIX', jobDone: 'Social media assets' },
  maxima: { name: 'MAXIMA', jobDone: 'Key visuals & OOH' },
  close: 'Close',
},
```

Job done titles may differ between `en` and `lt` — add Lithuanian translations for both.

---

## Technical Approach

### No New Dependencies

Everything built with GSAP (already installed):

- **GSAP Draggable** — Click/drag to dismiss cards. Handles both mouse and touch. Type `"x"` for horizontal-only drag.
- **GSAP core tweens** — Pulse animation, proximity scale, slide-to-edge animation, snap-back animation.
- **GSAP InertiaPlugin** (optional) — For momentum-based movement after drag release. Available free with GSAP. Adds natural feel but not required for v1.

### File Structure

```
src/
├── pages/
│   └── [locale]/
│       ├── index.astro              # Existing landing page
│       └── gallery/
│           └── [slug].astro         # Gallery detail page
├── components/
│   └── gallery-detail/
│       ├── GalleryDetailHeader.astro  # Job title, gallery title, close button
│       └── PhotoStack.astro           # Stacked card UI wrapper
├── lib/
│   └── animations/
│       ├── photoStack.ts              # Draggable stack logic, dismiss/return
│       ├── photoPulse.ts              # Subtle pulse animation
│       └── photoProximity.ts          # Mouse proximity grow effect
```

### Landing Page Link

Each gallery section on the landing page needs:
1. An `<a>` tag wrapping the gallery (or an overlay link) pointing to `/${locale}/gallery/${slug}`.
2. An `id` attribute on the gallery section: `id="gallery-${slug}"` (for the close-button fallback anchor).

---

## Responsive Breakpoint Summary

| Element | Desktop (>1200px) | Mobile (≤1200px) |
|---------|-------------------|-------------------|
| Header spacing | 30px from top/left/right | 15px from top/left/right |
| Job done title | Visible, left-aligned | Hidden |
| Gallery title | Visible, centered | Visible, left or centered |
| Close button | Visible, right-aligned | Visible, right-aligned |
| Card size | ~70–80% viewport width | ~90–95% viewport width |
| Drag interaction | Click + drag, or click to dismiss | Touch drag/swipe |
| Mouse proximity | Active | Disabled (no cursor) |
| Pulse | Active | Active |

---

## Open Items

- [ ] Exact card size (percentage of viewport) — tune on device.
- [ ] Exact peek amount when dismissed (10–15%) — tune on device.
- [ ] Exact offset between stacked cards (px) — tune on device.
- [ ] Drag threshold distance before card dismisses vs. snaps back.
- [ ] Pulse intensity and speed — tune on device.
- [ ] Proximity effect radius and max scale — tune on device.
- [ ] Typography for job title, gallery title, close button (font, size, weight, color).
- [ ] Lithuanian translations for job done titles.
- [ ] Whether to add View Transitions (`<ClientRouter />`) for smooth page transitions.
- [ ] Dismiss direction: always left, or based on drag direction.
