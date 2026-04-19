# Context / Loading Optimization Plan

Stage-by-stage plan to make navigation feel instant in both directions
(home ↔ gallery detail) without breaking any existing design or animation.

## Hard requirements

1. **No visible image or video paint-in** on return navigation.
2. **Every page-to-page flip feels instant.**
3. **No design regression** — visual output must be identical to current.
4. **No animation regression** — every existing animation must keep working.

## Why this is a problem today

- `.galleries-wrapper` rebuilds on every navigation (no `transition:persist`).
- All 60 home gallery `<Image>` components are `loading="lazy"`.
- `heroToGallery.ts` has a `startAtEnd` branch that hides the wrapper
  (`autoAlpha: 0`) until every `<img>` finishes loading. Recent perf work
  added Mux CDN poster overlays that bloated this wait. Even after
  excluding posters from the gate, real photos still need to decode on
  every return.
- `transitionSetup.ts` kills every cleanup, every ScrollTrigger, and the
  GSAP global timeline on `astro:before-swap`. Persisted DOM would
  survive the swap but its animations would be killed.

## Stages

Each stage is one commit. Each commit is independently revertable.

### Stage 1 — Return-instant via `transition:persist` on galleries

**Goal:** closing a gallery returns to home with zero rebuild.

**Files:**
- `src/lib/animations/lifecycle.ts`
- `src/lib/animations/transitionSetup.ts`
- `src/pages/[locale]/index.astro`
- `src/lib/animations/heroToGallery.ts`
- `src/lib/animations/galleryScroll.ts`
- `src/lib/animations/gallerySkew.ts`
- `src/lib/animations/galleryName.ts`
- `src/lib/animations/galleryCursor.ts`
- `src/components/galleries/EckesGraniniGallery.astro` (mux-video init)

**Steps:**
1. Extend `registerCleanup(fn, options?: { persistent?: boolean })`.
   `runAllCleanups()` runs only non-persistent cleanups; persistent ones
   stay registered across the swap.
2. `transitionSetup.ts` — kill only ScrollTriggers attached to
   non-persisted elements. Use `ScrollTrigger.getAll()` filtered by
   `st.trigger?.closest('[transition\\:persist]')`.
3. `index.astro:47` — add `transition:persist="galleries"` to
   `.galleries-wrapper`.
4. Each gallery init script: tag the DOM node on first init
   (`el.__init = true`), skip on subsequent `astro:page-load` if tagged.
   Register cleanups as `{ persistent: true }`.
5. `heroToGallery.ts` — detect persisted galleries-wrapper (check
   `galleriesWrapper.__heroToGalleryInit`); if set, skip the
   initial-hide setup, build a fresh ScrollTrigger from the current
   end-state. Drop the `startAtEnd` image wait entirely (DOM is
   already in end-state, no need to gate).
6. Mux-video script — skip re-import if already loaded; skip listener
   re-attach if `mux-video.__listenerAttached`.

**Validation against requirements:**
- Design: identical. Persisted DOM surfaces in same end-state.
- Animations: continuous gallery scroll, gallery name hover, skew,
  cursor, mux-video play state — all preserved.

**Test plan:**
- Bottlery scroll keeps moving across navigation.
- Eckes mux-video stays playing on return.
- Snap to gallery sections still works.
- Hero intro on first visit unchanged.

**Rollback:** revert one commit.

---

### Stage 2 — Outbound prefetch + eager hero on detail page

**Goal:** when clicking a gallery, the detail HTML and first 1–2 photos
are already in cache.

**Files:**
- `src/components/galleries/*.astro` (6 files — change prefetch attribute)
- `src/components/gallery-detail/PhotoStack.astro`

**Steps:**
7. Each gallery `<a>` link: change `data-astro-prefetch="hover"` →
   `data-astro-prefetch="viewport"`.
8. `PhotoStack.astro:76` — first card already `loading="eager"`. Add
   `fetchpriority="high"` on the very first card.

**Validation:**
- Design: invisible.
- Animations: invisible.

**Test plan:** Network tab shows 6 detail HTMLs prefetched as galleries
scroll into view.

**Rollback:** revert one commit.

---

### Stage 3 — `transition:name` morph for gallery name → detail title

**Goal:** the navigation reads as a continuous motion (gallery name
morphs into the detail page title), masking any remaining load.

**Files:**
- `src/components/galleries/*.astro` (6 files)
- `src/pages/[locale]/gallery/[slug].astro`

**Steps:**
9. Each home gallery `.gallery__name`: add
   `transition:name={`gallery-name-${slug}`}`.
10. Detail page title element: matching
    `transition:name={`gallery-name-${slug}`}`.

**Validation:**
- Design: morph between two existing elements at their natural sizes.
  No new visual elements introduced.
- Animations: graceful fallback to default fade on touch devices
  (gallery name is `display: none` until hover) and on older browsers.

**Test plan:**
- Chrome desktop: smooth morph.
- Mobile Safari: default fade fallback (no breakage).

**Rollback:** revert one commit.

---

### Stage 4 — `transition:persist` on detail PhotoStack

**Goal:** repeat visits to the same gallery are also instant.

**Files:**
- `src/pages/[locale]/gallery/[slug].astro`
- `src/components/gallery-detail/PhotoStack.astro`

**Steps:**
11. PhotoStack wrapper: `transition:persist={`detail-${slug}`}`
    (slug-keyed so different galleries don't collide).
12. PhotoStack init script: same init-guard pattern as Stage 1.

**Validation:** mirrors Stage 1 risk profile, smaller scope.

**Test plan:** open Eckes detail, close, reopen — second visit instant.

**Rollback:** revert one commit.

---

### Stage 5 — Responsive widths/sizes (cold-load polish)

**Goal:** mobile fetches a 400px webp instead of 1200px on first
load. Independent of return/outbound work.

**Files:**
- `src/components/galleries/*.astro` (6 files)
- `src/components/gallery-detail/PhotoStack.astro`

**Steps:**
13. Replace `width={1200} height={800}` →
    `widths={[400, 800, 1200]} sizes="(max-width: 1200px) 95vw, 50vw"`
    on home gallery `<Image>` components.
14. Detail page `<Image>` likewise with appropriate `sizes`.

**Validation:**
- Design: identical at any DPR — browser picks ≥ display resolution.
- Animations: invisible (build-time only).

**Rollback:** revert one commit.

---

## Order of execution

1. **Stage 1 first.** Biggest win, hardest to roll back if wrong.
   Test thoroughly before continuing.
2. **Stage 2 next.** Trivial, sets up Stage 3.
3. **Stage 3.** Polish; test in Chrome with View Transitions enabled.
4. **Stage 4.** Mirrors Stage 1.
5. **Stage 5.** Independent; can be done any time.

## Risk summary

| Stage | Risk | Mitigation |
|---|---|---|
| 1 | Cleanup scoping mistakes leave dead listeners or break gallery scroll | Add init guards, test each gallery individually after change |
| 2 | Slight bandwidth bump on home (6 small HTML prefetches) | Acceptable; HTMLs are tiny |
| 3 | Morph looks weird if source/destination styling differs dramatically | Browser falls back to fade on display:none source — no breakage |
| 4 | Same as Stage 1 | Same mitigation |
| 5 | Wrong `sizes` attribute could pick wrong variant | Match `sizes` to actual layout (95vw mobile, 50vw desktop) |

## Definition of done

- Closing any gallery returns home with no visible reflow, no image
  paint-in, no video restart.
- Hovering or scrolling to a gallery prefetches its detail HTML.
- Clicking a gallery on desktop morphs the gallery name into the
  detail title; on mobile, default fade (still feels snappy because
  detail HTML is prefetched).
- Visiting the same gallery a second time is instant.
- Cold first load on mobile is faster (smaller image variants).
- All existing animations work as before in all scenarios.
