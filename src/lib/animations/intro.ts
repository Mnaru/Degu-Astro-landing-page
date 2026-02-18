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
if (ScrollTrigger.isTouch) {
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.normalizeScroll(true);
}

/** Boundary between intro tweens and page-scroll in the Phase B timeline. */
const INTRO_TIMELINE_END = 0.85;

/** All viewport-dependent measurements needed by Phase B. */
interface IntroMeasurements {
  vw: number;
  vh: number;
  cssVh: number;
  isDesktop: boolean;
  padding: number;
  gapBetween: number;
  deguRect: DOMRect;
  studioRect: DOMRect;
  bodyRect: DOMRect;
  scrollHintRect: DOMRect;
  currentFontSize: number;
  targetHeight: number;
  scaleRatio: number;
  targetFontSize: number;
  studioTargetTop: number;
  grownDeguWidth: number;
  deguExitX: number;
  studioExitX: number;
  bodyExitX: number;
  scrollSection: HTMLElement;
  track: HTMLElement | null;
  galleryPlaceholder: HTMLElement;
  pageCount: number;
  scrollVh: number;
  introScrollDist: number;
  pageScrollDist: number;
  totalScrollDist: number;
  pageScrollDuration: number;
  introEnd: number;
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

  // Non-null aliases — TypeScript doesn't narrow across closure boundaries,
  // so nested functions (measure, initPhaseB) need these to avoid null errors.
  const _hero = hero;
  const _headerDegu = headerDegu;
  const _headerStudio = headerStudio;
  const _bodyText = bodyText;
  const _scrollHint = scrollHint;

  /**
   * Gather all viewport-dependent measurements. Must be called when animated
   * elements are in their natural CSS flow (not position:fixed).
   */
  function measure(): IntroMeasurements {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Measure what CSS 100vh resolves to in pixels. On mobile, this can be
    // taller than window.innerHeight when the address bar is visible.
    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = 'position:fixed;top:0;height:100vh;pointer-events:none;visibility:hidden;';
    document.body.appendChild(measureDiv);
    const cssVh = measureDiv.offsetHeight;
    document.body.removeChild(measureDiv);

    const isDesktop = vw > 768;
    const padding = vw * 0.025;

    // Element positions in CSS flow
    const deguRect = _headerDegu.getBoundingClientRect();
    const studioRect = _headerStudio.getBoundingClientRect();
    const bodyRect = _bodyText.getBoundingClientRect();
    const scrollHintRect = _scrollHint.getBoundingClientRect();

    // Font size from text span
    const deguText = _headerDegu.querySelector<HTMLElement>('.header-text')!;
    const currentFontSize = parseFloat(getComputedStyle(deguText).fontSize);

    // Target sizes for Phase B scaling
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

    // Scroll sections (depend on isDesktop)
    const scrollSection = _hero.querySelector<HTMLElement>(
      isDesktop ? '[data-scroll="page-scroll"]' : '[data-scroll="page-scroll-mobile"]',
    )!;
    const track = scrollSection?.querySelector<HTMLElement>('.page-scroll-track') ?? null;
    const galleryPlaceholder = scrollSection?.querySelector<HTMLElement>(
      '[data-intro="gallery-placeholder"]',
    )!;

    // Scroll distances
    // On mobile, use cssVh (actual CSS 100vh) so scroll distances match
    // the CSS-sized page elements, avoiding address-bar mismatch.
    const scrollVh = isDesktop ? vh : cssVh;
    const introScrollDist = INTRO_SCROLL_DISTANCE * scrollVh;
    const pageCount = track?.children.length ?? 0;
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

    return {
      vw, vh, cssVh, isDesktop, padding, gapBetween,
      deguRect, studioRect, bodyRect, scrollHintRect,
      currentFontSize, targetHeight, scaleRatio, targetFontSize,
      studioTargetTop, grownDeguWidth, deguExitX, studioExitX, bodyExitX,
      scrollSection, track, galleryPlaceholder, pageCount,
      scrollVh, introScrollDist, pageScrollDist, totalScrollDist,
      pageScrollDuration, introEnd,
    };
  }

  // Lock scroll during Phase A so user can't scroll past intro to the outro.
  // Phase B's ScrollTrigger will take over scroll control when it's created.
  document.documentElement.style.overflow = 'hidden';

  // Initial measurements — need scrollSection/galleryPlaceholder/vh for setup
  const m0 = measure();

  if (!m0.scrollSection || !m0.galleryPlaceholder) return;

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
  gsap.set(m0.galleryPlaceholder, {
    scale: 0.6,
    opacity: 0,
    visibility: 'visible',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: m0.vh,
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
      // Record clean (post-Phase-A) inline styles so matchMedia can
      // revert elements to this state when crossing the 768px breakpoint.
      ScrollTrigger.saveStyles(
        '.hero, [data-intro], [data-scroll], .page-scroll-track, .header-text, .page-mobile, .page-desktop',
      );

      // Wrap Phase B in matchMedia — crossing 768px kills all GSAP
      // instances from the old context and invokes the new one.
      // Both branches call the same initPhaseB(); measure() inside
      // picks the correct scroll section (horizontal vs vertical).
      ScrollTrigger.matchMedia({
        '(min-width: 769px)': function () {
          initPhaseB();
          return function () { /* cleanup on breakpoint cross */ };
        },
        '(max-width: 768px)': function () {
          initPhaseB();
          return function () { /* cleanup on breakpoint cross */ };
        },
      });

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
  let onRefreshInit: (() => void) | null = null;

  function initPhaseB(): void {
    // Clean up previous refreshInit listener (from prior matchMedia rebuild)
    if (onRefreshInit) {
      ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
    }

    // Use gsap.set so matchMedia can track and revert on breakpoint cross
    gsap.set(_hero, { overflow: 'hidden', zIndex: 2 });

    // Fresh measurements now that Phase A has completed and elements
    // are in their final CSS-flow positions.
    const m = measure();

    if (!m.scrollSection || !m.galleryPlaceholder) return;

    // Initialise gallery placeholder within matchMedia context so it
    // reverts on breakpoint cross. Fixed overlay at 60% scale, invisible
    // — the Phase B timeline animates it to full opacity and scale.
    gsap.set(m.galleryPlaceholder, {
      scale: 0.6,
      opacity: 0,
      visibility: 'visible',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: m.vh,
      zIndex: 1,
      transformOrigin: 'center center',
    });

    // Text spans — animate fontSize on these for crisp rendering
    const deguText = _headerDegu.querySelector<HTMLElement>('.header-text')!;
    const studioText = _headerStudio.querySelector<HTMLElement>('.header-text')!;

    /**
     * Apply position:fixed to animated elements using CSS-flow measurements.
     * Called during initial setup and on refreshInit to keep positions in
     * sync with the viewport after within-breakpoint resizes.
     */
    function applyFixedPositions(ms: IntroMeasurements): void {
      gsap.set(_headerDegu, {
        position: 'fixed',
        left: ms.deguRect.left,
        top: ms.deguRect.top,
        margin: 0,
      });
      gsap.set(_headerStudio, {
        position: 'fixed',
        left: ms.studioRect.left,
        top: ms.studioRect.top,
        margin: 0,
      });
      gsap.set(_bodyText, {
        position: 'fixed',
        left: ms.bodyRect.left,
        top: ms.bodyRect.top,
        width: ms.bodyRect.width,
        margin: 0,
      });
      gsap.set(_scrollHint, {
        position: 'fixed',
        left: ms.scrollHintRect.left,
        top: ms.scrollHintRect.top,
        margin: 0,
      });
    }

    applyFixedPositions(m);

    gsap.set([deguText, studioText], { willChange: 'font-size' });

    // On mobile, pages are CSS height:100vh which is taller than the visible
    // viewport. Override to window.innerHeight so they fit what the user sees.
    if (!m.isDesktop && m.track) {
      const pages = m.track.querySelectorAll('.page-mobile, .page-desktop');
      gsap.set(pages, { height: m.vh });
    }

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
        trigger: _hero,
        start: 'top top',
        end: () => `+=${measure().totalScrollDist}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        snap: {
          snapTo: (progress: number) => {
            const ms = measure();
            if (ms.pageScrollDist > 0) {
              if (progress > ms.introEnd * INTRO_SNAP_THRESHOLD && progress <= ms.introEnd) {
                return ms.introEnd;
              }
              return progress;
            }
            return progress > INTRO_SNAP_THRESHOLD ? 1 : progress;
          },
          duration: INTRO_SNAP_DURATION,
        },
        onUpdate: (self) => {
          // ---- Menu state ----
          if (self.progress < m.introEnd) {
            dispatchMenuState('intro');
          } else if (m.pageScrollDist > 0) {
            const pageProgress = (self.progress - m.introEnd) / (1 - m.introEnd);
            const page = Math.min(
              Math.floor(pageProgress * m.pageCount),
              m.pageCount - 1,
            );
            dispatchMenuState('work', page);
          } else {
            // No page scroll — single gallery page
            dispatchMenuState('work', 0);
          }

          // ---- Gallery flow toggle ----
          if (!m.track || m.pageScrollDist === 0) return;

          const shouldBeInFlow = self.progress >= m.introEnd;

          if (shouldBeInFlow && !galleryInFlow) {
            // Gallery enters track flow for page scrolling.
            // Only clear position-related props; scale/opacity are
            // managed by the Phase B timeline tweens.
            gsap.set(m.galleryPlaceholder, {
              clearProps: 'position,top,left,width,height,zIndex,transformOrigin,visibility',
            });
            // Show section so all pages are visible during page scroll
            gsap.set(m.scrollSection, { visibility: 'visible' });
            galleryInFlow = true;
          } else if (!shouldBeInFlow && galleryInFlow) {
            // Re-fix gallery for intro reverse scroll.
            // Scale/opacity are managed by timeline — don't override.
            gsap.set(m.galleryPlaceholder, {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: m.vh,
              zIndex: 1,
              transformOrigin: 'center center',
              visibility: 'visible',
            });
            // Hide section again so pages 2, 3 aren't visible behind intro
            gsap.set(m.scrollSection, { visibility: 'hidden' });
            galleryInFlow = false;
          }
        },
        onLeave: () => {
          gsap.set(_hero, { visibility: 'hidden' });
          gsap.set([deguText, studioText], { willChange: 'auto' });
          playOutro();
          dispatchMenuState('contact');
        },
        onEnterBack: () => {
          reverseOutro();
          gsap.set(_hero, { visibility: 'visible' });
          gsap.set([deguText, studioText], { willChange: 'font-size' });
          dispatchMenuState('work', m.pageCount - 1);
        },
      },
    });

    // ---- Part 1: Intro animations (time 0 – 0.85) ----

    // ScrollHint fades out
    phaseB.to(_scrollHint, {
      opacity: 0,
      y: 20,
      duration: 0.1,
    }, 0);

    // Headers grow (fontSize) + reposition to top-left
    phaseB.to(deguText, {
      fontSize: () => measure().targetFontSize,
      duration: 0.4,
    }, 0);
    phaseB.to(_headerDegu, {
      left: () => measure().padding,
      top: () => measure().padding,
      duration: 0.4,
    }, 0);

    phaseB.to(studioText, {
      fontSize: () => measure().targetFontSize,
      duration: 0.4,
    }, 0);
    phaseB.to(_headerStudio, {
      left: () => measure().padding,
      top: () => measure().studioTargetTop,
      duration: 0.4,
    }, 0);

    // BodyText exits right
    phaseB.to(_bodyText, {
      x: () => measure().bodyExitX,
      opacity: 0,
      scale: 1.1,
      duration: 0.3,
    }, 0);

    // DEGU exits left
    phaseB.to(_headerDegu, {
      x: () => measure().deguExitX,
      duration: 0.25,
    }, 0.4);

    // STUDIO exits right
    phaseB.to(_headerStudio, {
      x: () => measure().studioExitX,
      duration: 0.25,
    }, 0.4);

    // Gallery placeholder fades in at 60% scale
    phaseB.to(m.galleryPlaceholder, {
      opacity: 1,
      duration: 0.1,
    }, 0.35);

    // Gallery scales from 60% to 100%
    phaseB.to(m.galleryPlaceholder, {
      scale: 1,
      duration: 0.4,
    }, 0.45);

    // ---- Part 2: Page scroll (time 0.85 onward) ----
    // Desktop: translate track on x (horizontal).
    // Mobile: translate track on y (vertical).
    if (m.track && m.pageScrollDist > 0) {
      phaseB.to(m.track, {
        ...(m.isDesktop
          ? { x: () => -measure().pageScrollDist }
          : { y: () => -measure().pageScrollDist }),
        ease: 'none',
        duration: m.pageScrollDuration,
      }, INTRO_TIMELINE_END);
    }

    // ---- refreshInit: re-measure fixed positions on resize ----
    // Fires BEFORE ScrollTrigger recalculates — the pin is temporarily
    // reverted so elements can be measured in their natural CSS flow.
    onRefreshInit = () => {
      // Clear position-related and transform inline styles so elements
      // return to CSS flow for accurate getBoundingClientRect.
      gsap.set(_headerDegu, { clearProps: 'position,left,top,margin,x' });
      gsap.set(_headerStudio, { clearProps: 'position,left,top,margin,x' });
      gsap.set(_bodyText, { clearProps: 'position,left,top,width,margin,x,scale' });
      gsap.set(_scrollHint, { clearProps: 'position,left,top,margin,y' });
      gsap.set(deguText, { clearProps: 'fontSize' });
      gsap.set(studioText, { clearProps: 'fontSize' });

      const fresh = measure();
      applyFixedPositions(fresh);

      // Update mobile page heights
      if (!fresh.isDesktop && fresh.track) {
        const pages = fresh.track.querySelectorAll('.page-mobile, .page-desktop');
        gsap.set(pages, { height: fresh.vh });
      }

      // Update gallery placeholder height when in fixed overlay mode
      if (!galleryInFlow && fresh.galleryPlaceholder) {
        gsap.set(fresh.galleryPlaceholder, { height: fresh.vh });
      }
    };
    ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
  }
}
