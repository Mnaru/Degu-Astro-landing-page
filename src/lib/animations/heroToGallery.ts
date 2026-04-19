import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 1200;
const SCALE_PADDING = 60; // 30px left + 30px right
const OVERLAP_GAP = 30;
const RESIZE_DEBOUNCE_MS = 200;

interface Elements {
  hero: HTMLElement;
  heroInner: HTMLElement;
  degu: HTMLElement;
  studio: HTMLElement;
  bodyText: HTMLElement;
  scrollHint: HTMLElement;
  galleriesWrapper: HTMLElement;
}

function computeScales(degu: HTMLElement, studio: HTMLElement) {
  const deguRect = degu.getBoundingClientRect();
  const studioRect = studio.getBoundingClientRect();
  const targetWidth = window.innerWidth - SCALE_PADDING;

  let deguScale = targetWidth / deguRect.width;
  let studioScale = targetWidth / studioRect.width;

  // Prevent overlap: if combined scaled heights + gap exceed viewport (minus padding), reduce proportionally
  const deguScaledH = deguRect.height * deguScale;
  const studioScaledH = studioRect.height * studioScale;
  const availableH = window.innerHeight - SCALE_PADDING; // 30px top + 30px bottom
  const totalNeeded = deguScaledH + studioScaledH + OVERLAP_GAP; // 30px gap between words

  if (totalNeeded > availableH) {
    const ratio = (availableH - OVERLAP_GAP) / (deguScaledH + studioScaledH);
    deguScale *= ratio;
    studioScale *= ratio;
  }

  return { deguScale, studioScale };
}

function buildDesktopTimeline(els: Elements) {
  const { hero, heroInner, degu, studio, bodyText, scrollHint, galleriesWrapper } = els;

  // Measure positions for corner-aligned scale animation
  const heroInnerRect = heroInner.getBoundingClientRect();
  const deguRect = degu.getBoundingClientRect();
  const studioRect = studio.getBoundingClientRect();

  // Dynamic scale based on viewport width
  const { deguScale, studioScale } = computeScales(degu, studio);

  // DEGU → top-left: anchor top-left, move to hero-inner's top-left corner
  const deguTargetX = heroInnerRect.left - deguRect.left + 40;
  const deguTargetY = heroInnerRect.top - deguRect.top - deguRect.height * 0.3;

  // STUDIO → bottom-left: anchor bottom-left, move toward hero-inner's bottom-left
  const studioTargetX = heroInnerRect.left - studioRect.left + 40;
  const studioTargetY = (heroInnerRect.bottom - studioRect.bottom) * 0.75;

  // Set transform origins (no visual change at scale 1)
  gsap.set(degu, { transformOrigin: 'top left' });
  gsap.set(studio, { transformOrigin: 'bottom left' });

  const tl = gsap.timeline();

  // Phase 1: Fade out scroll hint + body text (0% → 20%)
  tl.to(scrollHint, { opacity: 0, duration: 0.2, ease: 'none' }, 0);
  tl.to(bodyText, { opacity: 0, duration: 0.2, ease: 'none' }, 0);

  // Phase 2: Scale up DEGU → top-left, STUDIO → bottom-left (0% → 40%)
  tl.to(degu, { scale: deguScale, x: deguTargetX, y: deguTargetY, duration: 0.4, ease: 'power2.inOut', force3D: false }, 0);
  tl.to(studio, { scale: studioScale, x: studioTargetX, y: studioTargetY, duration: 0.4, ease: 'power2.inOut', force3D: false }, 0);

  // Phase 3: Exit DEGU left, STUDIO right (40% → 90%)
  tl.to(degu, { xPercent: -500, duration: 0.5, ease: 'power2.in' }, 0.4);
  tl.to(studio, { xPercent: 500, duration: 0.5, ease: 'power2.in' }, 0.4);

  // Letters gone — let clicks pass through to the gallery beneath
  tl.set(hero, { pointerEvents: 'none' }, 0.9);

  // Phase 4: Hero fades out, revealing gallery (85% → 100%)
  tl.to(heroInner, { opacity: 0, duration: 0.15, ease: 'none' }, 0.85);

  // Phase 5: Gallery fades in and scales up (65% → 125%)
  tl.to(galleriesWrapper, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0.65);

  return tl;
}

function buildMobileTimeline(els: Elements) {
  const { hero, heroInner, degu, studio, bodyText, scrollHint, galleriesWrapper } = els;

  // Measure positions for mobile layout
  const heroInnerRect = heroInner.getBoundingClientRect();
  const deguRect = degu.getBoundingClientRect();
  const studioRect = studio.getBoundingClientRect();

  // DEGU → top-left, smaller scale on mobile
  const deguTargetX = heroInnerRect.left - deguRect.left + 10;
  const deguTargetY = heroInnerRect.top - deguRect.top - deguRect.height * 0.2;

  // STUDIO → bottom-left
  const studioTargetX = heroInnerRect.left - studioRect.left + 10;
  const studioTargetY = (heroInnerRect.bottom - studioRect.bottom) * 0.75;

  gsap.set(degu, { transformOrigin: 'top left' });
  gsap.set(studio, { transformOrigin: 'bottom left' });

  const tl = gsap.timeline();

  // Phase 1: Fade out scroll hint + body text (0% → 20%)
  tl.to(scrollHint, { opacity: 0, duration: 0.2, ease: 'none' }, 0);
  tl.to(bodyText, { opacity: 0, duration: 0.2, ease: 'none' }, 0);

  // Phase 2: Scale up DEGU and STUDIO — less scale on mobile (0% → 40%)
  tl.to(degu, { scale: 3.4, x: deguTargetX, y: deguTargetY, duration: 0.4, ease: 'power2.inOut', force3D: false }, 0);
  tl.to(studio, { scale: 3.4, x: studioTargetX, y: studioTargetY, duration: 0.4, ease: 'power2.inOut', force3D: false }, 0);

  // Phase 3: Exit DEGU left, STUDIO right (40% → 90%)
  tl.to(degu, { xPercent: -350, duration: 0.5, ease: 'power2.in' }, 0.4);
  tl.to(studio, { xPercent: 350, duration: 0.5, ease: 'power2.in' }, 0.4);

  // Letters gone — let clicks pass through to the gallery beneath
  tl.set(hero, { pointerEvents: 'none' }, 0.9);

  // Phase 4: Hero fades out, revealing gallery (85% → 100%)
  tl.to(heroInner, { opacity: 0, duration: 0.15, ease: 'none' }, 0.85);

  // Phase 5: Gallery fades in and scales up (65% → 125%)
  tl.to(galleriesWrapper, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0.65);

  return tl;
}

export function initHeroToGallery(options?: { startAtEnd?: boolean }) {
  const hero = document.querySelector('.hero') as HTMLElement;
  const degu = hero?.querySelector('.header-container') as HTMLElement;
  const studio = hero?.querySelector('.header-container-studio') as HTMLElement;
  const bodyText = hero?.querySelector('.body-text-container') as HTMLElement;
  const scrollHint = hero?.querySelector('.scroll-hint') as HTMLElement;
  const heroInner = hero?.querySelector('.hero-inner') as HTMLElement;
  const galleriesWrapper = document.querySelector('.galleries-wrapper') as HTMLElement;

  if (!hero || !heroInner || !degu || !studio || !bodyText || !scrollHint || !galleriesWrapper) {
    console.warn('heroToGallery: missing elements, skipping');
    return () => {};
  }

  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  // Galleries-wrapper is persisted across navigation. On a return navigation
  // it's already in its end state (autoAlpha:1, scale:1, marginTop:-100vh).
  // Skip the initial-hide setup so we don't visually hide the persisted DOM.
  const galleriesPersisted = (galleriesWrapper as any).__heroToGalleryInit === true;

  // --- Shared initial states ---
  gsap.set(heroInner, { overflow: 'hidden' });
  if (!galleriesPersisted) {
    // First-time init: pull gallery up behind the pinned hero (pinSpacing adds 100vh gap)
    gsap.set(galleriesWrapper, { autoAlpha: 0, scale: 0.7, transformOrigin: 'center top', position: 'relative', zIndex: 1, marginTop: '-100vh' });
    (galleriesWrapper as any).__heroToGalleryInit = true;
  }

  const els: Elements = { hero, heroInner, degu, studio, bodyText, scrollHint, galleriesWrapper };
  const tl = isMobile ? buildMobileTimeline(els) : buildDesktopTimeline(els);

  const snapConfig = {
    snapTo: [0, 1],
    duration: { min: 0.2, max: 0.4 },
    ease: 'power2.out',
  };

  // --- ScrollTrigger ---
  const st = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: '+=100%',
    scrub: 0.5,
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    // Skip snap when restoring scroll position; re-enable after settle
    snap: options?.startAtEnd ? undefined : snapConfig,
    animation: tl,
    // markers: true,
    onEnter: () => {
      gsap.set(hero, { zIndex: 20 });
    },
    onLeave: () => {
      gsap.set(hero, { clearProps: 'zIndex' });
    },
    onEnterBack: () => {
      gsap.set(hero, { zIndex: 20 });
    },
    onLeaveBack: () => {
      gsap.set(hero, { clearProps: 'zIndex' });
    },
  });

  if (options?.startAtEnd) {
    if (galleriesPersisted) {
      // Galleries are persisted DOM — already in end state with images
      // decoded and videos playing. Mobile-specific care:
      //   1. Re-apply layout-critical props in case the viewport-relative
      //      values recomputed while away (mobile address bar collapses
      //      under detail page's `overflow:hidden; height:100vh`, changing
      //      what `100vh` resolves to between visits).
      //   2. Delay ScrollTrigger.refresh() long enough for ClientRouter's
      //      scroll restoration to settle, otherwise pin range is computed
      //      against scroll=0 and the hero won't reverse-fade on scroll up.
      //   3. Hard refresh + snap re-enable after the same delay so the snap
      //      doesn't catch on a stale range.
      gsap.set(galleriesWrapper, { marginTop: '-100vh', position: 'relative', zIndex: 1 });
      tl.progress(1);
      setTimeout(() => {
        ScrollTrigger.refresh(true);
        st.vars.snap = snapConfig;
      }, 150);
    } else {
      // First-time init at end state (cold load with restored scroll past hero):
      // wait for gallery photos to load before revealing. Exclude video poster
      // overlays — they sit behind <mux-video> and don't need to gate.
      const imgs = galleriesWrapper.querySelectorAll<HTMLImageElement>(
        'img:not(.gallery__poster):not(.photo-stack__poster)'
      );
      const loadPromises = Array.from(imgs).map((img) => {
        if (img.loading === 'lazy') img.loading = 'eager';
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      });
      Promise.all(loadPromises).then(() => {
        tl.progress(1);
        requestAnimationFrame(() => {
          st.vars.snap = snapConfig;
          ScrollTrigger.refresh();
        });
      });
    }
  }

  // --- Debounced resize: tear down and rebuild with fresh measurements ---
  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cleanup();
      // Re-init after teardown; preserve scroll position by starting at end if past hero
      const pastHero = st.progress >= 1;
      const rebuilt = initHeroToGallery(pastHero ? { startAtEnd: true } : options);
      // Patch the outer cleanup so it tears down the rebuilt instance
      rebuildCleanup = rebuilt;
    }, RESIZE_DEBOUNCE_MS);
  };
  window.addEventListener('resize', onResize);

  let rebuildCleanup: (() => void) | undefined;

  // --- Cleanup ---
  const cleanup = () => {
    window.removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
    st.kill();
    tl.kill();
    gsap.set(hero, { clearProps: 'zIndex,pointerEvents' });
    gsap.set(heroInner, { clearProps: 'overflow,opacity' });
    gsap.set([degu, studio], { clearProps: 'all' });
    gsap.set([bodyText, scrollHint], { clearProps: 'opacity' });
    gsap.set(galleriesWrapper, { clearProps: 'opacity,visibility,scale,transformOrigin,position,zIndex,marginTop' });
  };

  return () => {
    if (rebuildCleanup) {
      rebuildCleanup();
    } else {
      cleanup();
    }
  };
}
