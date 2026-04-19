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

## Follow-ups not in this batch

- `<Picture>` + AVIF/WebP for gallery sources (optional, ~20–30 % smaller per image).
- `layout="constrained"` on `<Image>` for responsive srcset (optional, mobile wins).
- Extract repeated gallery CSS into a shared stylesheet (DRY; ~1–2 KB gzipped).
