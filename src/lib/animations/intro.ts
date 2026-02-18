import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  INTRO_INITIAL_PAUSE,
  INTRO_SLIDE_DURATION,
  INTRO_FADE_DURATION,
  INTRO_SCROLL_HINT_DELAY,
  INTRO_SCROLL_HINT_DURATION,
  INTRO_SCROLL_HINT_OFFSET,
  INTRO_BODY_OFFSET,
  INTRO_SLIDE_EASE,
  INTRO_FADE_EASE,
  INTRO_SCROLL_DISTANCE,
  INTRO_SNAP_DURATION,
  INTRO_SNAP_THRESHOLD,
} from '@lib/animations/config';
import { playOutro, reverseOutro } from '@lib/animations/outro';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if (ScrollTrigger.isTouch) {
  ScrollTrigger.normalizeScroll(true);
}

/**
 * Intro animation — two phases, one ScrollTrigger.
 *
 * Phase A (time-based, on page load):
 *   DEGU + STUDIO centred -> STUDIO slides left -> body text fades in -> scroll hint.
 *
 * Phase B (scroll-driven, after Phase A):
 *   Part 1 — Intro-to-gallery transition:
 *     Headers scale up, gallery fades in at 60% and scales to 100%,
 *     headers exit left/right.
 *   Part 2 — Page scroll:
 *     Desktop: track translates left (horizontal scroll through pages).
 *     Mobile:  track translates up (vertical scroll through pages).
 *
 * Single ScrollTrigger pins .hero for the entire sequence, eliminating
 * the gap that two separate ScrollTriggers would create.
 */
export function initIntroAnimation(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('[data-intro="intro-block"]', { visibility: 'visible' });
    gsap.set('[data-intro="scroll-hint"]', { visibility: 'visible' });
    document.querySelector('[data-intro="scroll-hint"]')?.classList.add('animate');
    gsap.set('[data-intro="gallery-placeholder"]', { scale: 1, opacity: 1 });
    return;
  }

  const hero = document.querySelector<HTMLElement>('.hero');
  const introBlock = document.querySelector<HTMLElement>('[data-intro="intro-block"]');
  const headerDegu = document.querySelector<HTMLElement>('[data-intro="header-degu"]');
  const headerStudio = document.querySelector<HTMLElement>('[data-intro="header-studio"]');
  const bodyText = document.querySelector<HTMLElement>('[data-intro="body-text"]');
  const scrollHint = document.querySelector<HTMLElement>('[data-intro="scroll-hint"]');

  if (
    !hero || !introBlock || !headerDegu || !headerStudio ||
    !bodyText || !scrollHint
  ) {
    return;
  }

  // Lock scroll during Phase A so user can't scroll past intro to the outro.
  // Phase B's ScrollTrigger will take over scroll control when it's created.
  document.documentElement.style.overflow = 'hidden';

  // Page scroll: desktop targets horizontal section, mobile targets vertical.
  const isDesktop = window.innerWidth > 768;
  const scrollSection = hero.querySelector<HTMLElement>(
    isDesktop ? '[data-scroll="page-scroll"]' : '[data-scroll="page-scroll-mobile"]',
  );
  const track = scrollSection?.querySelector<HTMLElement>('.page-scroll-track') ?? null;
  const galleryPlaceholder = scrollSection?.querySelector<HTMLElement>(
    '[data-intro="gallery-placeholder"]',
  ) ?? null;

  if (!scrollSection || !galleryPlaceholder) return;

  // Measure what CSS 100vh resolves to in pixels. On mobile, this can be
  // taller than window.innerHeight when the address bar is visible.
  const measureDiv = document.createElement('div');
  measureDiv.style.cssText = 'position:fixed;top:0;height:100vh;pointer-events:none;visibility:hidden;';
  document.body.appendChild(measureDiv);
  const cssVh = measureDiv.offsetHeight;
  document.body.removeChild(measureDiv);

  const studioRow = headerStudio.parentElement as HTMLElement;
  const finalGap = getComputedStyle(studioRow).getPropertyValue('gap') || '0px';

  // ---- Set initial state ----
  gsap.set(bodyText, {
    opacity: 0,
    x: INTRO_BODY_OFFSET,
    width: 0,
    height: 0,
    overflow: 'hidden',
  });
  gsap.set(studioRow, { gap: 0 });
  gsap.set(scrollHint, { opacity: 0, y: -INTRO_SCROLL_HINT_OFFSET });
  gsap.set(galleryPlaceholder, {
    scale: 0.6,
    opacity: 0,
    visibility: 'visible',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: window.innerHeight,
    zIndex: 1,
    transformOrigin: 'center center',
  });

  // Reveal elements now that initial positions are set (prevents FOUC)
  gsap.set(introBlock, { visibility: 'visible' });
  gsap.set(scrollHint, { visibility: 'visible' });

  // ==================================================================
  // Phase A — time-based
  // ==================================================================
  const phaseA = gsap.timeline({
    delay: INTRO_INITIAL_PAUSE,
    defaults: { ease: INTRO_SLIDE_EASE },
    onComplete() {
      initPhaseB();
      // Unlock scroll now that Phase B's ScrollTrigger controls it.
      document.documentElement.style.overflow = '';
    },
  });

  // 1. Expand body text width and gap — flexbox naturally slides STUDIO left.
  phaseA.to(bodyText, {
    width: 'auto',
    duration: INTRO_SLIDE_DURATION,
  });

  phaseA.to(studioRow, {
    gap: finalGap,
    duration: INTRO_SLIDE_DURATION,
  }, '<');

  phaseA.set(bodyText, { height: 'auto' });

  // 2. BodyTextContainer fades in and slides from the right
  phaseA.to(bodyText, {
    opacity: 1,
    x: 0,
    overflow: 'visible',
    duration: INTRO_FADE_DURATION,
    ease: INTRO_FADE_EASE,
  });

  // 3. ScrollHint fades in from above + trigger fill animation (after delay)
  phaseA.to(scrollHint, {
    opacity: 1,
    y: 0,
    duration: INTRO_SCROLL_HINT_DURATION,
    ease: INTRO_FADE_EASE,
    onStart: () => scrollHint.classList.add('animate'),
  }, `+=${INTRO_SCROLL_HINT_DELAY}`);

  // ==================================================================
  // Phase B — scroll-driven (created after Phase A completes)
  // ==================================================================
  function initPhaseB(): void {
    hero!.style.overflow = 'hidden';
    hero!.style.zIndex = '2';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = vw * 0.025;

    // Measure ALL positions before taking anything out of flow
    const deguRect = headerDegu!.getBoundingClientRect();
    const studioRect = headerStudio!.getBoundingClientRect();
    const bodyRect = bodyText!.getBoundingClientRect();
    const scrollHintRect = scrollHint!.getBoundingClientRect();

    // Text spans — animate fontSize on these for crisp rendering
    const deguText = headerDegu!.querySelector<HTMLElement>('.header-text')!;
    const studioText = headerStudio!.querySelector<HTMLElement>('.header-text')!;
    const currentFontSize = parseFloat(getComputedStyle(deguText).fontSize);

    // Fill viewport: padding + DEGU + gap + STUDIO + padding = vh
    const gapBetween = vh * 0.005;
    const targetHeight = (vh - 2 * padding - gapBetween) / 2;
    const scaleRatio = targetHeight / deguRect.height;
    const targetFontSize = currentFontSize * scaleRatio;

    const studioTargetTop = padding + targetHeight + gapBetween;

    // Exit offsets: clear viewport at the grown size
    const grownDeguWidth = scaleRatio * deguRect.width;
    const deguExitX = -(padding + grownDeguWidth + 100);
    const studioExitX = vw - padding + 100;
    const bodyExitX = vw * 1.5;

    // Fix ALL animated elements in place before taking headers out of flow.
    gsap.set(headerDegu, {
      position: 'fixed',
      left: deguRect.left,
      top: deguRect.top,
      margin: 0,
    });
    gsap.set(headerStudio, {
      position: 'fixed',
      left: studioRect.left,
      top: studioRect.top,
      margin: 0,
    });
    gsap.set(bodyText, {
      position: 'fixed',
      left: bodyRect.left,
      top: bodyRect.top,
      width: bodyRect.width,
      margin: 0,
    });
    gsap.set(scrollHint, {
      position: 'fixed',
      left: scrollHintRect.left,
      top: scrollHintRect.top,
      margin: 0,
    });

    gsap.set([deguText, studioText], { willChange: 'font-size' });

    // ---- Scroll distances ----
    // The intro tweens occupy timeline time 0–0.85.
    // Page scroll (desktop: horizontal, mobile: vertical) is appended after.
    const INTRO_TIMELINE_END = 0.85;
    // On mobile, use cssVh (actual CSS 100vh) so scroll distances match
    // the CSS-sized page elements, avoiding address-bar mismatch.
    const scrollVh = isDesktop ? vh : cssVh;
    const introScrollDist = INTRO_SCROLL_DISTANCE * scrollVh;
    const pageCount = track?.children.length ?? 0;

    // On mobile, pages are CSS height:100vh which is taller than the visible
    // viewport. Override to window.innerHeight so they fit what the user sees.
    if (!isDesktop && track) {
      const pages = track.querySelectorAll('.page-mobile, .page-desktop');
      gsap.set(pages, { height: vh });
    }

    // Desktop scrolls horizontally (x), mobile scrolls vertically (y).
    const pageScrollDist = track && pageCount > 1
      ? (pageCount - 1) * (isDesktop ? vw : cssVh)
      : 0;
    const totalScrollDist = introScrollDist + pageScrollDist;

    // Page scroll timeline duration, scaled so the ratio of
    // timeline-time to scroll-pixels stays consistent with the intro.
    const pageScrollDuration = pageScrollDist > 0
      ? INTRO_TIMELINE_END * (pageScrollDist / introScrollDist)
      : 0;

    // Progress boundary between intro and page scroll
    const introEnd = introScrollDist / totalScrollDist;

    // Track gallery-placeholder state for forward/reverse transitions
    let galleryInFlow = false;

    // Menu state dispatching — only fires when state changes
    let lastMenuState = '';
    function dispatchMenuState(type: string, page?: number): void {
      const key = page != null ? `${type}:${page}` : type;
      if (key === lastMenuState) return;
      lastMenuState = key;
      window.dispatchEvent(
        new CustomEvent('menu:state', { detail: { type, page } }),
      );
    }

    const phaseB = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => `+=${totalScrollDist}`,
        pin: true,
        scrub: true,
        snap: {
          snapTo: (progress: number) => {
            // Snap to gallery completion when past threshold
            if (pageScrollDist > 0) {
              if (progress > introEnd * INTRO_SNAP_THRESHOLD && progress <= introEnd) {
                return introEnd;
              }
              return progress;
            }
            // No page scroll: snap to end (= gallery completion)
            return progress > INTRO_SNAP_THRESHOLD ? 1 : progress;
          },
          duration: INTRO_SNAP_DURATION,
        },
        onUpdate: (self) => {
          // ---- Menu state ----
          if (self.progress < introEnd) {
            dispatchMenuState('intro');
          } else if (pageScrollDist > 0) {
            const pageProgress = (self.progress - introEnd) / (1 - introEnd);
            const page = Math.min(
              Math.floor(pageProgress * pageCount),
              pageCount - 1,
            );
            dispatchMenuState('work', page);
          } else {
            // No page scroll — single gallery page
            dispatchMenuState('work', 0);
          }

          // ---- Gallery flow toggle ----
          if (!track || pageScrollDist === 0) return;

          const shouldBeInFlow = self.progress >= introEnd;

          if (shouldBeInFlow && !galleryInFlow) {
            // Gallery enters track flow for page scrolling.
            // Only clear position-related props; scale/opacity are
            // managed by the Phase B timeline tweens.
            gsap.set(galleryPlaceholder, {
              clearProps: 'position,top,left,width,height,zIndex,transformOrigin,visibility',
            });
            // Show section so all pages are visible during page scroll
            gsap.set(scrollSection, { visibility: 'visible' });
            galleryInFlow = true;
          } else if (!shouldBeInFlow && galleryInFlow) {
            // Re-fix gallery for intro reverse scroll.
            // Scale/opacity are managed by timeline — don't override.
            gsap.set(galleryPlaceholder, {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: vh,
              zIndex: 1,
              transformOrigin: 'center center',
              visibility: 'visible',
            });
            // Hide section again so pages 2, 3 aren't visible behind intro
            gsap.set(scrollSection, { visibility: 'hidden' });
            galleryInFlow = false;
          }
        },
        onLeave: () => {
          gsap.set(hero, { visibility: 'hidden' });
          gsap.set([deguText, studioText], { willChange: 'auto' });
          playOutro();
          dispatchMenuState('contact');
        },
        onEnterBack: () => {
          reverseOutro();
          gsap.set(hero, { visibility: 'visible' });
          gsap.set([deguText, studioText], { willChange: 'font-size' });
          dispatchMenuState('work', pageCount - 1);
        },
      },
    });

    // ---- Part 1: Intro animations (time 0 – 0.85) ----

    // ScrollHint fades out
    phaseB.to(scrollHint, {
      opacity: 0,
      y: 20,
      duration: 0.1,
    }, 0);

    // Headers grow (fontSize) + reposition to top-left
    phaseB.to(deguText, {
      fontSize: targetFontSize,
      duration: 0.4,
    }, 0);
    phaseB.to(headerDegu, {
      left: padding,
      top: padding,
      duration: 0.4,
    }, 0);

    phaseB.to(studioText, {
      fontSize: targetFontSize,
      duration: 0.4,
    }, 0);
    phaseB.to(headerStudio, {
      left: padding,
      top: studioTargetTop,
      duration: 0.4,
    }, 0);

    // BodyText exits right
    phaseB.to(bodyText, {
      x: bodyExitX,
      opacity: 0,
      scale: 1.1,
      duration: 0.3,
    }, 0);

    // DEGU exits left
    phaseB.to(headerDegu, {
      x: deguExitX,
      duration: 0.25,
    }, 0.4);

    // STUDIO exits right
    phaseB.to(headerStudio, {
      x: studioExitX,
      duration: 0.25,
    }, 0.4);

    // Gallery placeholder fades in at 60% scale
    phaseB.to(galleryPlaceholder, {
      opacity: 1,
      duration: 0.1,
    }, 0.35);

    // Gallery scales from 60% to 100%
    phaseB.to(galleryPlaceholder, {
      scale: 1,
      duration: 0.4,
    }, 0.45);

    // ---- Part 2: Page scroll (time 0.85 onward) ----
    // Desktop: translate track on x (horizontal).
    // Mobile: translate track on y (vertical).
    if (track && pageScrollDist > 0) {
      phaseB.to(track, {
        ...(isDesktop ? { x: -pageScrollDist } : { y: -pageScrollDist }),
        ease: 'none',
        duration: pageScrollDuration,
      }, INTRO_TIMELINE_END);
    }
  }
}
