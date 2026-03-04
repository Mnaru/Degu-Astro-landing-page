# Plan: Replace MPA Navigation with Astro ClientRouter

## Context

Opening/closing gallery detail pages triggers a **full MPA page teardown + rebuild**. The browser destroys all DOM, GSAP timelines, ScrollTriggers, WebGL context (FluidBackground), RAF loops (5 gallery scrollers), and event listeners — then rebuilds everything from scratch. This is why the transition feels heavy.

The fix: add Astro's `<ClientRouter />` with `transition:animate="none"` for instant DOM swaps without full page reloads. Scripts, stylesheets, and fonts stay loaded. Combined with `transition:persist` for the WebGL canvas and a proper GSAP cleanup/re-init lifecycle, navigation will feel instant.

---

## Complete inventory of scripts that need `astro:page-load` wrapping

Every component `<script>` that queries DOM or inits animations must be wrapped, because module scripts only execute once with ClientRouter. On subsequent navigations, `astro:page-load` re-triggers initialization on the fresh DOM.

| Component | Script does | Cleanup needed |
|-----------|------------|----------------|
| `Hero.astro` | Calls `heroIntro()`, sets `history.scrollRestoration` | Yes (GSAP context) |
| `ScrollHint.astro` | Builds cylinder DOM, creates GSAP timeline | No (DOM removed on swap) |
| `DeguLogo.astro` | Calls `initFlameAnimation(svg)` | Yes (GSAP timeline) |
| `ManillaGallery.astro` | `initGalleryScroll` + `initGalleryName` | Yes (RAF, 8 listeners) |
| `CrocsGallery.astro` | `initGalleryName` only | Yes (2 listeners) |
| `AlitaGallery.astro` | `initGalleryScroll` + `initGalleryName` | Yes (RAF, 8 listeners) |
| `MixGallery.astro` | `initGalleryName` only | Yes (2 listeners) |
| `MaximaGallery.astro` | `initGalleryScroll` + `initGalleryName` | Yes (RAF, 8 listeners) |
| `PhotoStack.astro` | Entrance anim + `initPhotoStack`/`Pulse`/`Proximity` | Yes (Draggable, timelines, mousemove) |
| `EmailUsButton.astro` | Click handler (clipboard copy) | No (listener on element, removed on swap) |
| `FollowUsButton.astro` | Click handler (window.open) | No (listener on element, removed on swap) |
| `FluidBackground.astro` | Creates WebGL FluidSimulation | Special: `transition:persist` — never re-inits |

**NOT needing changes** (no scripts): Header, LanguageSwitcher, HeaderContainer, HeaderContainerStudio, BodyTextContainer, Outro, OutroHeaderContainer, OutroStudioContainer, OutroBodyTextContainer.

---

## Phase 1: Shared Layout + ClientRouter

### 1.1 Create `src/layouts/BaseLayout.astro` (new file)

Props: `title`, `description`, `locale`, `bodyClass?`, `bodyStyle?`.

Contains: `<ClientRouter />` in head, `<FluidBackground transition:persist="fluid-bg" />` before slot, `<script>import transitionSetup</script>` for GSAP lifecycle.

### 1.2 Refactor `src/pages/[locale]/index.astro`

- Remove `<html>`, `<head>`, `<body>` — wrap content in `<BaseLayout>`
- Remove `<FluidBackground />` (now in layout)
- **Remove** the `pageIn` CSS keyframes + `body { animation }` rule
- **Remove** the `is:inline` head script that adds `skip-hero` class (L47-52)
- **Remove** the `is:inline` script that saves `scrollY` on gallery link click (L97-103)
- **Remove** `skip-hero` CSS rules — all 3 `:global(html.skip-hero ...)` rules (L121-129)
- **Keep** `data-astro-prefetch="hover"` on gallery links (works with ClientRouter)

### 1.3 Refactor `src/pages/[locale]/gallery/[slug].astro`

- Remove `<html>`, `<head>`, `<body>` — wrap in `<BaseLayout>`
- Pass body styles via layout prop: `bodyStyle="background-color: ${bg}; height: 100vh; overflow: hidden; touch-action: none;"`
- **Remove** the `pageIn` CSS keyframes + `body { animation }` rule
- **Remove** `<link rel="prefetch" href="/${locale}/">` (L57 — ClientRouter handles prefetch)
- **Remove** the existing close-button `<script>` block (L68-83 — replaced in Phase 5)
- **Remove** the CSS rule `html { scroll-snap-type: none !important; overflow: hidden; }` (L89-92 — body overflow handled via bodyStyle prop)

**Files:** `src/layouts/BaseLayout.astro` (new), `src/pages/[locale]/index.astro`, `src/pages/[locale]/gallery/[slug].astro`

---

## Phase 2: FluidBackground Persistence

### 2.1 Move `<FluidBackground />` into `BaseLayout.astro`

Currently only in index.astro. Move it to the layout so it exists on all pages. The wrapper div gets `transition:persist="fluid-bg"`.

### 2.2 Modify `src/components/FluidBackground.astro`

Add `transition:persist="fluid-bg"` to the outer div. Guard against re-initialization in the script:

```ts
// At the start of init():
if ((canvas as any).__fluidSim) return; // Already initialized, persisted across navigation
const sim = new FluidSimulation(canvas, isMobile);
(canvas as any).__fluidSim = sim;
```

The `visibilitychange` and `resize` listeners are on `document`/`window` — added once (module script runs once), never accumulate. No cleanup registration needed.

### 2.3 Gallery detail background covers FluidBackground naturally

FluidBackground is `position: fixed; z-index: 0`. Gallery detail's `background-color` on `<body>` sits on top. No extra CSS needed.

**Files:** `src/components/FluidBackground.astro`, `src/pages/[locale]/index.astro` (remove import)

---

## Phase 3: GSAP Lifecycle Infrastructure

### 3.1 Create `src/lib/animations/lifecycle.ts` (new file)

```ts
const cleanups: (() => void)[] = [];

export function registerCleanup(fn: () => void) {
  cleanups.push(fn);
}

export function runAllCleanups() {
  while (cleanups.length) {
    try { cleanups.pop()!(); } catch (e) { console.warn('Cleanup error:', e); }
  }
}
```

### 3.2 Create `src/lib/animations/transitionSetup.ts` (new file)

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { runAllCleanups } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('astro:before-swap', () => {
  runAllCleanups();
  ScrollTrigger.getAll().forEach(st => st.kill());
  gsap.globalTimeline.clear();
});
```

Imported from BaseLayout. Runs once on first page load. The `astro:before-swap` handler persists across navigations.

**Files:** `src/lib/animations/lifecycle.ts` (new), `src/lib/animations/transitionSetup.ts` (new)

---

## Phase 4: Home Page Script Re-initialization

### 4.1 `src/components/Hero.astro` — refactor script

**Current** (L17-26):
```ts
import { heroIntro } from '@lib/animations/heroIntro';
history.scrollRestoration = 'manual';
if (!sessionStorage.getItem('return-to-gallery')) {
  await document.fonts.ready;
}
document.querySelectorAll('.hero').forEach((el) => {
  heroIntro(el as HTMLElement);
});
```

**New:**
```ts
import { heroIntro } from '@lib/animations/heroIntro';
import { registerCleanup } from '@lib/animations/lifecycle';

document.addEventListener('astro:page-load', async () => {
  const heroEl = document.querySelector('.hero') as HTMLElement;
  if (!heroEl) return;

  if (!(window as any).__heroIntroPlayed) {
    await document.fonts.ready;
    const cleanup = heroIntro(heroEl);
    if (cleanup) registerCleanup(cleanup);
  } else {
    const cleanup = heroIntro(heroEl, { skipIntro: true });
    if (cleanup) registerCleanup(cleanup);
  }
});
```

**Removed:** `history.scrollRestoration = 'manual'`, `sessionStorage` check.

### 4.2 `src/lib/animations/heroIntro.ts` — refactor

**Signature change:** `heroIntro(heroEl, options?: { skipIntro?: boolean })` → returns `(() => void) | undefined`

**For `skipIntro: true` path** (replaces current sessionStorage return path):
- Set hero elements to post-intro state (same logic as current L22-25)
- Call `initHeroToGallery({ startAtEnd: true })`
- Return the cleanup function from `initHeroToGallery`
- **Do NOT** restore scroll, toggle classes, or re-enable snap — ClientRouter handles all of it

**For first-visit path:**
- Same intro animation as current (L64-161)
- Set `(window as any).__heroIntroPlayed = true` in timeline `onComplete`
- Capture `initHeroToGallery()` cleanup and include it in the returned cleanup function
- Return a cleanup function that kills the GSAP context + heroToGallery cleanup

**Remove entirely:**
- All `sessionStorage` reads/writes (L8, L35-36)
- `requestAnimationFrame` scroll restoration block (L32-59)
- `skip-hero` class toggling (L46, L54)
- scroll-snap re-enable listeners (L52-58)

### 4.3 `src/lib/animations/heroToGallery.ts` — critical fix

**Remove `window.scrollTo(0, st.end)` from the `startAtEnd` block** (L168):

```ts
// BEFORE (L166-169):
if (options?.startAtEnd) {
  tl.progress(1);
  window.scrollTo(0, st.end);  // ← REMOVE
}

// AFTER:
if (options?.startAtEnd) {
  tl.progress(1);
}
```

Without this fix, `startAtEnd` overwrites the scroll position that ClientRouter restores. The `tl.progress(1)` is still needed to set hero=hidden, galleries=visible.

### 4.4 Gallery component scripts (5 files)

Each gallery script gets wrapped in `astro:page-load` with cleanup registration.

**ManillaGallery.astro, AlitaGallery.astro, MaximaGallery.astro** (both scroll + name):
```ts
import { initGalleryScroll } from '@lib/animations/galleryScroll';
import { initGalleryName } from '@lib/animations/galleryName';
import { registerCleanup } from '@lib/animations/lifecycle';

document.addEventListener('astro:page-load', () => {
  const gallery = document.querySelector('[data-gallery="manilla"]') as HTMLElement;
  const track = gallery?.querySelector('.gallery__scroll-track') as HTMLElement;
  const name = gallery?.querySelector('.gallery__name') as HTMLElement;
  if (track) registerCleanup(initGalleryScroll({ container: track, speed: 60, direction: 'left' }));
  if (gallery && name) registerCleanup(initGalleryName({ galleryEl: gallery, nameEl: name }));
});
```

**CrocsGallery.astro, MixGallery.astro** (name only):
```ts
import { initGalleryName } from '@lib/animations/galleryName';
import { registerCleanup } from '@lib/animations/lifecycle';

document.addEventListener('astro:page-load', () => {
  const gallery = document.querySelector('[data-gallery="crocs"]') as HTMLElement;
  const name = gallery?.querySelector('.gallery__name') as HTMLElement;
  if (gallery && name) registerCleanup(initGalleryName({ galleryEl: gallery, nameEl: name }));
});
```

### 4.5 `src/pages/[locale]/index.astro` — gallerySkew script

```ts
import { initGallerySkew } from '@lib/animations/gallerySkew';
import { registerCleanup } from '@lib/animations/lifecycle';

document.addEventListener('astro:page-load', () => {
  const galleries = Array.from(document.querySelectorAll('[data-gallery]')) as HTMLElement[];
  if (galleries.length > 0) registerCleanup(initGallerySkew({ elements: galleries }));
});
```

### 4.6 `src/components/ScrollHint.astro` — wrap in `astro:page-load`

The script destructively modifies DOM (removes `.roll-text` span, builds cylinder with multiple lines). With ClientRouter, fresh DOM arrives on each navigation, so the cylinder must be rebuilt each time. **No double-init guard needed** — the DOM is always fresh after a swap.

```ts
import { gsap } from 'gsap';

document.addEventListener('astro:page-load', () => {
  document.querySelectorAll('.scroll-hint').forEach((hint) => {
    // ... existing cylinder-building + GSAP timeline logic unchanged ...
    (hint as any)._scrollHintTl = tl; // Still exposed for heroIntro to trigger
  });
});
```

No cleanup registration needed — the timeline is attached to the DOM element which is removed on swap. The `_scrollHintTl` reference is still needed by heroIntro's `onComplete` callback.

### 4.7 `src/components/DeguLogo.astro` — wrap in `astro:page-load`

```ts
import { initFlameAnimation } from '@lib/animations/flameLogo';
import { registerCleanup } from '@lib/animations/lifecycle';

document.addEventListener('astro:page-load', () => {
  const svg = document.querySelector<SVGSVGElement>('.degu-logo .flame-svg');
  if (svg) registerCleanup(initFlameAnimation(svg));
});
```

Note: `initFlameAnimation` takes a bare `SVGSVGElement`, not an options object.

### 4.8 `src/components/EmailUsButton.astro` — wrap in `astro:page-load`

```ts
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLButtonElement>('.email-us-button').forEach((btn) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    btn.addEventListener('click', async () => {
      // ... existing clipboard logic unchanged ...
    });
  });
});
```

No cleanup needed — click listener is on the button element, removed when DOM swaps.

### 4.9 `src/components/FollowUsButton.astro` — wrap in `astro:page-load`

```ts
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLButtonElement>('.follow-us-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      // ... existing window.open logic unchanged ...
    });
  });
});
```

No cleanup needed — same reason as EmailUsButton.

**Files:** `Hero.astro`, `heroIntro.ts`, `heroToGallery.ts`, `ManillaGallery.astro`, `CrocsGallery.astro`, `AlitaGallery.astro`, `MixGallery.astro`, `MaximaGallery.astro`, `index.astro`, `ScrollHint.astro`, `DeguLogo.astro`, `EmailUsButton.astro`, `FollowUsButton.astro`

---

## Phase 5: Gallery Detail Page

### 5.1 `src/components/gallery-detail/PhotoStack.astro` — wrap in `astro:page-load`

```ts
import { gsap } from 'gsap';
import { initPhotoStack } from '@lib/animations/photoStack';
import { initPhotoPulse } from '@lib/animations/photoPulse';
import { initPhotoProximity } from '@lib/animations/photoProximity';
import { registerCleanup } from '@lib/animations/lifecycle';

document.addEventListener('astro:page-load', () => {
  const container = document.querySelector('[data-photo-stack]') as HTMLElement;
  const cards = Array.from(container?.querySelectorAll('.photo-stack__card') ?? []) as HTMLElement[];
  const cardInners = Array.from(container?.querySelectorAll('.photo-stack__card-inner') ?? []) as HTMLElement[];

  if (container && cards.length > 0) {
    gsap.fromTo(cards, { opacity: 0, scale: 0.97 }, {
      opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.05,
      onComplete: () => cards.forEach(card => gsap.set(card, { clearProps: 'scale' })),
    });
    registerCleanup(initPhotoStack({ container, cards }));
    registerCleanup(initPhotoPulse({ cards: cardInners }));
    registerCleanup(initPhotoProximity({ cards: cardInners }));
  }
});
```

### 5.2 `src/pages/[locale]/gallery/[slug].astro` — close button

Replace the existing close-button `<script>` (L68-83) with:

```html
<script>
  import { navigate } from 'astro:transitions/client';

  document.addEventListener('astro:page-load', () => {
    const closeBtn = document.querySelector('[data-close-gallery]') as HTMLElement;
    if (!closeBtn) return;
    const locale = closeBtn.dataset.locale;

    closeBtn.addEventListener('click', () => {
      if (document.referrer && new URL(document.referrer).origin === location.origin) {
        history.back(); // ClientRouter restores scroll position
      } else {
        navigate(`/${locale}/`);
      }
    });
  });
</script>
```

**Remove:** `pagehide` listener, `sessionStorage.setItem('return-to-gallery')`, `window.location.replace()`.

**Files:** `src/components/gallery-detail/PhotoStack.astro`, `src/pages/[locale]/gallery/[slug].astro`

---

## Phase 6: TypeScript + Dead Code Removal

### 6.1 Add type declaration in `heroIntro.ts`:
```ts
declare global { interface Window { __heroIntroPlayed?: boolean; } }
```

### 6.2 Dead code removed across all phases

| Removed | Was in |
|---------|--------|
| `sessionStorage` for `return-to-gallery` / `return-scroll-y` | heroIntro.ts, Hero.astro, [slug].astro, index.astro |
| `skip-hero` class + all 3 CSS rules | index.astro |
| `is:inline` head script (adds `skip-hero`) | index.astro L47-52 |
| `is:inline` scroll-save script | index.astro L97-103 |
| `history.scrollRestoration = 'manual'` | Hero.astro L19 |
| `window.location.replace()` | [slug].astro L77 |
| `pagehide` listener | [slug].astro L80-82 |
| `pageIn` keyframes + body animation | index.astro L107-119, [slug].astro L94-105 |
| `<link rel="prefetch">` | [slug].astro L57 |
| `window.scrollTo(0, st.end)` in startAtEnd | heroToGallery.ts L168 |
| `requestAnimationFrame` scroll restoration block | heroIntro.ts L32-59 |
| scroll-snap re-enable listeners (`enableSnap`) | heroIntro.ts L52-58 |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| GSAP ScrollTrigger active during DOM swap → layout jump | `astro:before-swap` kills all ScrollTriggers before swap |
| WebGL context lost during `transition:persist` | FluidSimulation already handles `webglcontextlost`; guard prevents re-init; test across browsers |
| `astro:page-load` fires after browser paints → brief flash of un-initialized state | On first visit: `[data-gsap]` hides hero-inner. On return: hero is scrolled off-screen. Galleries show at CSS defaults (acceptable — no `opacity: 0` until GSAP sets it) |
| Mobile scroll-snap fights scroll restoration on return | Scroll-snap only on `[data-gallery]` elements (hero has no snap-align). Restored position at a gallery should snap correctly |
| First entry via gallery detail → navigate to home → home scripts not loaded yet? | Astro loads new page's module scripts BEFORE firing `astro:page-load` (per lifecycle docs) |
| `startAtEnd` calling `window.scrollTo` overwrites ClientRouter scroll | Fixed in Phase 4.3 — removing `window.scrollTo(0, st.end)` |
| `heroIntro` currently returns different types (context vs undefined) | Refactored in Phase 4.2 to always return cleanup or undefined |

---

## Verification checklist

1. **Fresh visit to home** → hero intro plays → scroll to galleries → click gallery → **instant** transition (no white flash, no fade) → gallery detail loads with entrance animation
2. **Close gallery** → returns to home at correct scroll position → hero does NOT replay → gallery scroll animations running → FluidBackground still animating (no WebGL re-init)
3. **Direct URL visit to gallery detail** → close → navigates to home → hero intro plays normally
4. **Browser back/forward** between home and gallery detail works with correct scroll positions
5. **Mobile**: scroll-snap works correctly on return to home, no erratic snapping
6. **Memory**: DevTools Performance monitor — event listener count stays stable across repeated home↔gallery navigations (no leaks)
7. **EmailUsButton**: clipboard copy works on home page after navigating away and back
8. **FollowUsButton**: opens Instagram after navigating away and back
9. **Language switcher**: works on both pages
10. **Gallery infinite scroll**: all 3 infinite-scroll galleries (manilla, alita, maxima) resume correctly on return to home
11. **Gallery name visibility**: all 5 gallery names show/hide correctly based on scroll position after return
12. **DeguLogo flame**: animation restarts on return to home
