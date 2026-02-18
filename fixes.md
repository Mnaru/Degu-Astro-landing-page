# Degu Landing Page — Fixes Plan

Based on the full code audit. Organized by priority and when to address.

---

## Priority 1: Fix Now (Before Review)
These are bugs or violations that affect the user experience or will cause silent breakage during future tweaks.

### 1.1 ScrollHint shows "Scroll" on Lithuanian page 🔴
- **File:** Both page files + `ScrollHint.astro`
- **Fix:** Pass `{i18n.intro.scrollHint}` via slot to ScrollHint
- **Risk if skipped:** Lithuanian users see English word

### 1.2 MenuExpanded hardcodes INTRO_SCROLL_DISTANCE = 2 🔴
- **File:** `MenuExpanded.astro`
- **Fix:** Import from `config.ts`
- **Risk if skipped:** If you ever tweak scroll distance in config, menu navigation silently breaks

### 1.3 MenuCollapsed animation values not in config.ts 🔴
- **Files:** `MenuCollapsed.astro` → `config.ts`
- **Fix:** Move 5 timing constants to config.ts, import them
- **Risk if skipped:** Can't tweak menu animation feel from the central config file

### 1.4 DeguLogo uses raw `<img>` from public/ 🔴
- **File:** `DeguLogo.astro`
- **Fix:** Move SVG to `src/assets/images/logo/`, use `astro:assets`
- **Risk if skipped:** Inconsistent with spec, no optimization pipeline

### 1.5 Hardcoded English in aria-labels and defaults 🟡→🔴 for i18n
- **Files:** `PageDesktop.astro`, `PageMobile.astro`, `ContactUsButton.astro`, `ImageGallery.astro`
- **Fix:** Make labels required props (no English defaults), pass translated values from pages
- **Risk if skipped:** Lithuanian users encounter English strings in screen readers

---

## Priority 2: Fix Before Launch
These improve code quality and prevent refactoring breakage. Not user-facing but important.

### 2.1 MenuExpanded imports translations directly 🔴
- **File:** `MenuExpanded.astro`, both page files
- **Fix:** Receive all labels as props. Only MenuCollapsed is spec-exempted.
- **Why:** Maintains the spec's architecture. Makes MenuExpanded testable/reusable.

### 2.2 MenuExpanded duplicates scroll calculations from intro.ts 🟡
- **Files:** `MenuExpanded.astro`, `intro.ts`
- **Fix:** Extract into shared `src/lib/animations/scrollUtils.ts`
- **Why:** Single source of truth for scroll math. Both consumers stay in sync.

### 2.3 gallery.ts and intro.ts reference component class names 🟡
- **Files:** `gallery.ts`, `intro.ts`, page files, `PageScrollDesktop.astro`, `PageScrollMobile.astro`
- **Fix:** Add `data-chrome` and `data-scroll="track"` attributes, query by data attributes
- **Why:** Decouples animation code from component internals. Safe to rename classes.

### 2.4 Magic numbers in MenuCollapsed and MenuExpanded 🔴
- **Files:** `MenuCollapsed.astro`, `MenuExpanded.astro`
- **Fix:** Move widths (540, 148, 280, 335, 596 breakpoint) to config.ts or CSS custom properties
- **Why:** Currently scattered across two files with no comments. Easy to break during restyling.

### 2.5 intro.ts Phase B hardcoded tween durations 🟡
- **File:** `intro.ts`
- **Fix:** Move durations (0.1, 0.4, 0.3, 0.25) to config.ts
- **Why:** Spec says config.ts is the single source of truth for ALL timing values

### 2.6 outro.ts and gallery.ts hardcoded durations 🟡
- **Files:** `outro.ts`, `gallery.ts`
- **Fix:** Move dissolve (0.3) and image fade-in (0.4) durations to config.ts
- **Why:** Same reason

---

## Priority 3: Fix When Refactoring
These are structural improvements. Save for a dedicated refactor session.

### 3.1 Page file duplication 🔴 (highest impact refactor)
- **Files:** `index.astro` and `[locale]/index.astro` (~374 lines each, 98% identical)
- **Fix:** Create a shared `HomePage.astro` component or Astro layout that both pages use. Each page file becomes ~10 lines (get locale, get translations, render shared component).
- **Why:** Every change currently requires editing two files. High risk of drift.
- **Effort:** Medium — needs careful testing of both locales

### 3.2 Page files use :global() to override component internals 🟡
- **Files:** Both page files
- **Fix:** Connected to 3.1. When extracting shared template, consider passing size/style variants as props instead of :global() overrides.
- **Why:** Tight coupling between page styles and component class names

### 3.3 MenuCollapsed/MenuExpanded/ImageGallery don't extend HTMLAttributes 🟡
- **Fix:** Add HTMLAttributes extension and attr spreading
- **Why:** Consistency with spec. Low impact since these are complex overlay components.

### 3.4 define:vars not used anywhere 🟡
- **Fix:** Consider for HeaderContainer font-size or any future dynamic prop-to-CSS needs
- **Why:** Spec calls for it but current CSS approach works fine

---

## Priority 4: Nice to Have (Future)
Low priority improvements. Address if time permits.

### 4.1 Animations don't adapt on browser resize
- **Status:** Known limitation, documented in README
- **Fix:** Kill + re-init Phase B on resize (debounced)
- **Why:** Only affects developer testing. Mobile viewports are fixed.

### 4.2 Hash URL navigation (#contact)
- **Fix:** Add hashchange listener that maps to scroll positions
- **Why:** Not essential for a portfolio scroll experience

### 4.3 prefers-reduced-motion not reactive
- **Fix:** Add `matchMedia.addEventListener('change', ...)`
- **Why:** Industry-standard to check once. Very edge case.

### 4.4 Event listener cleanup
- **Fix:** Add cleanup if View Transitions are ever added
- **Why:** No impact on current single-page static site

### 4.5 MenuExpanded sizing on 4K / ultrawide
- **Fix:** Make menu widths responsive with clamp() or vw-based sizing
- **Why:** Portfolio site unlikely to be viewed on 4K, but worth considering

### 4.6 MenuExpanded/MenuCollapsed text overflow at 320px
- **Fix:** Add text-overflow: ellipsis or reduce padding at small viewports
- **Why:** Very small viewport edge case

### 4.7 DeguLogo alt text not translated
- **Fix:** Pass translated alt via prop. "Degu Studio" is a brand name so arguably fine as-is.

### 4.8 execCommand('copy') fallback deprecated
- **Fix:** Monitor browser support. Remove fallback when clipboard API is universal.

---

## Quick Reference: Files Most Likely to Need Changes

| File | Touches | Priority fixes |
|------|---------|----------------|
| `config.ts` | Central config | 1.2, 1.3, 2.4, 2.5, 2.6 |
| `MenuCollapsed.astro` | Menu animation | 1.3, 2.4 |
| `MenuExpanded.astro` | Menu navigation | 1.2, 2.1, 2.2, 2.4 |
| Both page files | Wiring | 1.1, 1.5, 2.1, 3.1 |
| `DeguLogo.astro` | Logo image | 1.4 |
| `PageDesktop/Mobile.astro` | Aria labels | 1.5 |
| `ContactUsButton.astro` | Default props | 1.5 |
| `ImageGallery.astro` | Default props | 1.5 |
| `gallery.ts` | Chrome hiding | 2.3, 2.6 |
| `intro.ts` | Track targeting | 2.3, 2.5 |
| `outro.ts` | Duration | 2.6 |
