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

gsap.registerPlugin(ScrollTrigger);

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
 *   Part 2 — Horizontal page scroll (desktop only):
 *     Track translates left, scrolling through gallery pages.
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
  const galleryPlaceholder = document.querySelector<HTMLElement>('[data-intro="gallery-placeholder"]');

  if (
    !hero || !introBlock || !headerDegu || !headerStudio ||
    !bodyText || !scrollHint || !galleryPlaceholder
  ) {
    return;
  }

  const studioRow = headerStudio.parentElement as HTMLElement;
  const finalGap = getComputedStyle(studioRow).getPropertyValue('gap') || '0px';

  // Page scroll track (inside hero via CSS position: absolute)
  const track = hero.querySelector<HTMLElement>('.page-scroll-track');
  const isDesktop = window.innerWidth > 768;

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
    height: '100vh',
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
    // Horizontal scroll (desktop only) is appended after.
    const INTRO_TIMELINE_END = 0.85;
    const introScrollDist = INTRO_SCROLL_DISTANCE * vh;
    const pageCount = track?.children.length ?? 0;
    const hScrollDist = isDesktop && track && pageCount > 1
      ? (pageCount - 1) * vw
      : 0;
    const totalScrollDist = introScrollDist + hScrollDist;

    // Horizontal scroll timeline duration, scaled so the ratio of
    // timeline-time to scroll-pixels stays consistent with the intro.
    const hScrollDuration = hScrollDist > 0
      ? INTRO_TIMELINE_END * (hScrollDist / introScrollDist)
      : 0;

    // Progress boundary between intro and horizontal scroll
    const introEnd = introScrollDist / totalScrollDist;

    // Track gallery-placeholder state for forward/reverse transitions
    let galleryInFlow = false;

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
            if (hScrollDist > 0) {
              if (progress > introEnd * INTRO_SNAP_THRESHOLD && progress <= introEnd) {
                return introEnd;
              }
              return progress;
            }
            // No horizontal scroll: snap to end (= gallery completion)
            return progress > INTRO_SNAP_THRESHOLD ? 1 : progress;
          },
          duration: INTRO_SNAP_DURATION,
        },
        onUpdate: (self) => {
          // Switch gallery-placeholder between position:fixed (intro)
          // and normal track flow (horizontal scroll).
          if (!track || !isDesktop || hScrollDist === 0) return;

          const shouldBeInFlow = self.progress >= introEnd;

          if (shouldBeInFlow && !galleryInFlow) {
            // Gallery enters track flow for horizontal scrolling.
            // Only clear position-related props; scale/opacity are
            // managed by the Phase B timeline tweens.
            gsap.set(galleryPlaceholder, {
              clearProps: 'position,top,left,width,height,zIndex,transformOrigin,visibility',
            });
            // Show section so all pages are visible during horizontal scroll
            const sec = hero!.querySelector<HTMLElement>('[data-scroll="page-scroll"]');
            if (sec) gsap.set(sec, { visibility: 'visible' });
            galleryInFlow = true;
          } else if (!shouldBeInFlow && galleryInFlow) {
            // Re-fix gallery for intro reverse scroll.
            // Scale/opacity are managed by timeline — don't override.
            gsap.set(galleryPlaceholder, {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1,
              transformOrigin: 'center center',
              visibility: 'visible',
            });
            // Hide section again so pages 2, 3 aren't visible behind intro
            const sec = hero!.querySelector<HTMLElement>('[data-scroll="page-scroll"]');
            if (sec) gsap.set(sec, { visibility: 'hidden' });
            galleryInFlow = false;
          }
        },
        onLeave: () => {
          gsap.set(hero, { visibility: 'hidden' });
          gsap.set([deguText, studioText], { willChange: 'auto' });
        },
        onEnterBack: () => {
          gsap.set(hero, { visibility: 'visible' });
          gsap.set([deguText, studioText], { willChange: 'font-size' });
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

    // ---- Part 2: Horizontal page scroll (time 0.85 onward) ----
    if (isDesktop && track && hScrollDist > 0) {
      phaseB.to(track, {
        x: -hScrollDist,
        ease: 'none',
        duration: hScrollDuration,
      }, INTRO_TIMELINE_END);
    }
  }
}
