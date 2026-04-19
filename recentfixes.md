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

## Follow-ups not in this batch

- `<Picture>` + AVIF/WebP for gallery sources (optional, ~20–30 % smaller per image).
- `layout="constrained"` on `<Image>` for responsive srcset (optional, mobile wins).
- Extract repeated gallery CSS into a shared stylesheet (DRY; ~1–2 KB gzipped).
