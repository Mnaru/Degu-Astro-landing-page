# Recent Fixes

Performance batch — everything here is committed. Kept as an inline changelog for the current branch; delete once merged / pushed / no longer needed.

---

## Font-loading fix for hero intro delay

**Problem:** On first load, the hero "DEGU STUDIO" area stayed blank for a few seconds because the intro script awaited `document.fonts.ready`, which can wait up to ~3 s for all fonts used on the page.
**Fix:** Preload the display font at parse time and wait only for that one font with a 500 ms cap.

- [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) — `<link rel="preload" as="font" type="font/woff2" crossorigin>` for ObviouslyDemo.
- [src/components/Hero.astro](src/components/Hero.astro) — replaced `document.fonts.ready` with `Promise.race([document.fonts.load('1em "ObviouslyDemo"'), setTimeout(500)])`.

**Rollback:** revert both hunks.

---

## Layered `<img>` poster under `<mux-video>`

**Problem:** Returning home from a detail page left empty boxes where videos should be for several hundred ms — `<mux-video>`'s `poster` only renders after the custom element upgrades and the poster fetch completes.
**Fix:** Added a plain `<img>` with the Mux thumbnail URL inside each video wrapper, behind the `<mux-video>`. Native image pipeline renders instantly; opaque video covers it once playing.

- [src/components/galleries/EckesGraniniGallery.astro](src/components/galleries/EckesGraniniGallery.astro) — `.gallery__poster` class.
- [src/components/gallery-detail/PhotoStack.astro](src/components/gallery-detail/PhotoStack.astro) — `.photo-stack__poster` class with specificity-matching selector.

**Rollback:** remove the `<img>` sibling and the matching CSS in each file. `<mux-video poster="...">` remains as fallback.

---

## Performance cleanup

**Problem:** Home-page JS bundle shipped `@mux/mux-video` even though Eckes is below-the-fold; a handful of unused imports and a dead `work` translation block were also shipping.
**Fix:**

- [src/components/galleries/EckesGraniniGallery.astro](src/components/galleries/EckesGraniniGallery.astro) — top-level `import '@mux/mux-video'` replaced with `IntersectionObserver` + `import('@mux/mux-video')` fired with `rootMargin: '200px 0px'` before Eckes scrolls into view.
- [src/pages/[locale]/index.astro](src/pages/[locale]/index.astro) — removed `Outro`, `OutroHeaderContainer`, `OutroStudioContainer`, `OutroBodyTextContainer`, `EmailUsButton`, `FollowUsButton` imports and the commented-out `<Outro>` block they referenced.
- [src/lib/animations/heroToGallery.ts](src/lib/animations/heroToGallery.ts) — removed diagnostic `console.log`.
- [src/i18n/translations.ts](src/i18n/translations.ts) — deleted the `work` section in both `en` and `lt` (never referenced).

---

## WOFF2 fonts

**Problem:** OTF/TTF fonts were ~361 KB combined; WOFF2 variants ~101 KB (-72 %).
**Fix:** Swapped `@font-face` sources to WOFF2 + WOFF (fallback) in [src/styles/global.css](src/styles/global.css). Updated preload in [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) to point at `Obviously-CondSupr.woff2`. Kept existing font-family names (`ObviouslyDemo`, `PP Editorial New`, `JetBrains Mono`) so no other code changes. Deleted old OTF/TTF files and the vendor demo HTML / stylesheet artifacts.

**Size change:** 361 KB → 101 KB across 3 fonts, applied on every page load.

---

## Stable video sizing + seamless poster→video handoff

**Date:** 2026-04-20
**Status:** Uncommitted
**Problem(s):**
1. On home Eckes mobile, when the mux-video upgraded it reported 4:5 intrinsic dimensions, stretching the wrapper tall even after the 3:2 poster had rendered — container resized visibly.
2. On the detail page, a black frame flashed between the poster and the first video frame — mux-video's internal `<video>` renders opaque black while video data loads, covering whatever was behind it.

**Root cause (single):** size and layering were both content-driven (img intrinsic, mux-video intrinsic, internal video state). Browser had room to race.

**Fix:** make CSS the single source of truth for sizing, and let the poster be the permanent visual base.

- **Wrapper `aspect-ratio` is the size authority.** On Eckes home: 4:5 desktop (preserves design) and 3:2 on `max-width: 1200px` (matches photo wrappers on mobile). On PhotoStack: card widths unchanged (preserves design).
- **Both `<img class="poster">` and `<mux-video>` are `position: absolute; inset: 0`** inside the wrapper. Identical layout formulas = identical boxes. No flicker, no CLS.
- **`<mux-video>` starts `opacity: 0`.** A `playing` event listener (`{ once: true }`) adds an `.is-playing` class, fading the video in over 150 ms. Poster is never hidden — if video fails or stalls, the poster stays as a robust fallback.

### Files changed

- [src/components/galleries/EckesGraniniGallery.astro](src/components/galleries/EckesGraniniGallery.astro)
  - Reverted the earlier `<picture>` markup back to a single `<img class="gallery__poster">` (smartcrop lost, acceptable).
  - Removed `width` / `height` attributes from `<mux-video>` (wrapper aspect is now the authority).
  - CSS: added `aspect-ratio: 4/5` to `.gallery__image-wrapper--video`, `aspect-ratio: 3/2` inside the `max-width: 1200px` media query. `.gallery__image-wrapper--video .gallery__poster` is `position: absolute; inset: 0; object-fit: cover`. `.gallery__image-wrapper--video mux-video` is also `position: absolute; inset: 0` with `opacity: 0; transition: opacity 0.15s linear`, and `.is-playing` sets `opacity: 1`.
  - Script: after the existing IntersectionObserver for `@mux/mux-video`, attach `playing` listeners to every `mux-video` in the gallery, with `registerCleanup`.

- [src/components/gallery-detail/PhotoStack.astro](src/components/gallery-detail/PhotoStack.astro)
  - CSS: `.photo-stack__card-inner mux-video` switched from `position: relative` to `position: absolute; inset: 0`. Added `opacity: 0; transition: opacity 0.15s linear` and `.is-playing { opacity: 1 }`. Card widths unchanged.
  - Script: after existing PhotoStack init, attach `playing` listeners to every `mux-video`, with `registerCleanup`.

### Rollback

Revert both files. No migrations, no state, no shared helpers affected. The previously-shipped behavior (4:5 mobile videos, poster-to-video flicker) returns.

### What to watch for

- On mobile home Eckes, video wrappers should be identical size to photo wrappers (95vw × ~63vw). Mux-video content center-cropped from 4:5 into 3:2 via `--media-object-fit: cover`.
- On desktop home Eckes, video wrappers are 4:5 at 100% track height (unchanged visually).
- On detail page, card sizes unchanged; the transition from poster to video is a 150 ms opacity fade with no black frame.
- If `playing` event never fires (video blocked, network error), mux-video stays invisible and poster remains. This is the intended fallback.

---

## Fix: home page hangs on return navigation

**Date:** 2026-04-20
**Problem:** After the layered `<img>` poster change above, returning home from a gallery felt slow — the entire `.galleries-wrapper` stayed hidden for a noticeable beat and you could see images paint in.
**Root cause:** [src/lib/animations/heroToGallery.ts](src/lib/animations/heroToGallery.ts) gates the wrapper reveal on `Promise.all` of every `<img loading>` event. The new `.gallery__poster` (12 in Eckes home) and `.photo-stack__poster` overlays were eligible — so the wrapper waited on Mux CDN for decorative frames before showing real content.
**Fix:** narrowed the selector to `img:not(.gallery__poster):not(.photo-stack__poster)`. Posters still load eagerly and paint behind `<mux-video>`; they just don't gate the reveal.

**Rollback:** restore the original `'img'` selector.

---

## Navigation persistence batch (Stages 1–6)

**Date:** 2026-04-20
**Goal:** make `home → /gallery/[slug] → home` feel instant — no
visible images/videos painting in on return, and the click into a
gallery masked behind a continuous motion. Full plan, validation
notes, and rollback per stage in
[contextoptimization.md](contextoptimization.md).

### Stage 1 — Persist galleries-wrapper across navigation
Commit `652002d`. `transition:persist="galleries-${locale}"` on
`.galleries-wrapper` and `.gallery-cursor`. Required cleanup-system
rework: `registerCleanup(fn, { persistent: true })` so animations on
persisted DOM survive `astro:before-swap`; `transitionSetup` only
kills ScrollTriggers attached to non-persisted DOM (selector
`[data-astro-transition-persist]`). Each gallery script tags its
node with `__galleryInit` and skips re-init on subsequent page-loads.
`heroToGallery` detects `__heroToGalleryInit` on the persisted
wrapper and skips the initial-hide + image-load wait.

### Stage 2 — Prefetch detail HTML on viewport entry
Commit `e0dbb32`. All 6 gallery `<a>` links flipped from
`data-astro-prefetch="hover"` to `viewport`. PhotoStack already had
`fetchpriority="high"` on the first card.

### Stage 3 — Morph gallery name into detail title
Commit `9e4c6b6`. Each home `.gallery__name` and the matching detail
`.gallery-detail__title` share `transition:name="gallery-name-${slug}"`.
Default morph timing made the giant→tiny shrink too prominent;
softened with custom keyframes in `global.css` that cross-fade
captures with no overlap (old fades out by 40 %, new fades in from
60 %) so the eye reads it as a quick handoff. Falls back to default
fade on touch and on browsers without View Transitions support.

### Stage 4 — Persist detail PhotoStack
Commit `c49c3bf`. PhotoStack root now uses
`transition:persist={`photostack-${slug}`}`. Init-guard pattern via
`__photoStackInit` skips the entrance animation and listener
re-attach on a return visit. `[slug].astro` reads
`.photo-stack--complete` on init to restore the endLogo visibility
state for galleries the user already swiped through.

### Stage 5 — Responsive image variants
Commit `3650835`. Replaced fixed `width={1200} height={800}` with
`widths={[400, 800, 1200, 1600]}` + `sizes` hints across all home
galleries (`(max-width: 1200px) 95vw, 50vw`) and PhotoStack
(`(max-width: 1200px) 90vw, 50vw`). Mobile cold-load payload drops
~50–70 %; desktop unchanged.

### Stage 6 — Bidirectional persist anchor (mobile fix)
Commit `b91b6f3`. After Stages 1–5 mobile still showed images
painting in on return. Astro docs confirm `transition:persist`
requires the directive on **both** source and destination — Stage 1
only added it to home, so `home → detail` actually discarded the
persisted wrapper. Detail page now contains a `display:none` anchor
with empty `.galleries-wrapper` and `.gallery-cursor` placeholders
carrying matching persist keys; Astro moves the populated home
wrapper into this anchor (zero pixels rendered) and back to home's
slot on return.

### Stage 6.1 — Mobile address-bar correction on return
Commit `34a7f3b`. After Stage 6 fixed the persistence, mobile still
showed a black gap above the gallery on return — hero stayed at
`opacity: 0` (its post-scroll end state) and scroll-up didn't drive
the ScrollTrigger to reverse it. Three causes:

1. The detail page's `overflow:hidden; height:100vh` collapses the
   mobile address bar; on return it can re-expand, so the persisted
   `marginTop: -100vh` resolves to a different pixel value than the
   one in force when it was set. `gsap.set(galleriesWrapper, { marginTop: '-100vh' })`
   on the persisted-return path forces a fresh resolve against the
   current viewport.
2. `requestAnimationFrame` fires before ClientRouter's scroll
   restoration settles on a real device, so the pin range was
   computed against `scroll = 0`. Switched to a 150 ms `setTimeout`.
3. Snap was re-enabled before the hard refresh saw the right range,
   sometimes catching the user at progress 1 and preventing
   scroll-up. Use `ScrollTrigger.refresh(true)` and re-enable snap
   after the same delay.

**Rollback:** `git revert b91b6f3 34a7f3b 3650835 c49c3bf 9e4c6b6 e0dbb32 652002d` undoes the whole batch in dependency order.

---

## Follow-ups not in this batch

- `<Picture>` + AVIF/WebP for gallery sources (optional, ~20–30 % smaller per image).
- `layout="constrained"` on `<Image>` for responsive srcset (optional, mobile wins).
- Extract repeated gallery CSS into a shared stylesheet (DRY; ~1–2 KB gzipped).
- Idle-time preload of all gallery images on first home visit (Layer 2 from contextoptimization.md follow-up plan) if iOS evicts the persisted wrapper under memory pressure in the wild.
