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
} from '@lib/animations/config';

gsap.registerPlugin(ScrollTrigger);

/**
 * Intro animation — two phases.
 *
 * Phase A (time-based, on page load):
 *   DEGU + STUDIO centred → STUDIO slides left → body text fades in → scroll hint.
 *   End state matches static CSS layout; inline styles are cleared.
 *
 * Phase B (scroll-driven, after Phase A):
 *   Headers scale up → body text exits right → DEGU exits left, STUDIO exits right →
 *   gallery placeholder revealed at ~60 % and scales to fill the viewport.
 */
export function initIntroAnimation(): void {
  // Respect prefers-reduced-motion
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

  // The .studio-row is the flex parent that holds STUDIO + BodyTextContainer.
  const studioRow = headerStudio.parentElement as HTMLElement;

  // Capture the CSS-defined gap before we override it
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
  gsap.set(galleryPlaceholder, { scale: 0.6, opacity: 0 });

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
      // Clear animated inline styles so CSS takes over.
      // Keep visibility: visible on introBlock and scrollHint.
      gsap.set(bodyText, { clearProps: 'opacity,transform,width,height,overflow' });
      gsap.set(studioRow, { clearProps: 'gap' });
      gsap.set(scrollHint, { clearProps: 'opacity,transform' });

      // Initialise Phase B now that Phase A is done
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
  }, '<'); // same time

  // Snap height to auto now that width is at its final value.
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

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = vw * 0.025;

    // Measure current header positions (Phase A CSS end state)
    const deguRect = headerDegu!.getBoundingClientRect();
    const studioRect = headerStudio!.getBoundingClientRect();

    // Fill viewport: padding + DEGU + gap + STUDIO + padding = vh
    const gapBetween = vh * 0.005;
    const targetHeight = (vh - 2 * padding - gapBetween) / 2;
    const deguScale = targetHeight / deguRect.height;
    const studioScale = targetHeight / studioRect.height;

    // Translation from current centred position to top-left alignment
    const deguDx = padding - deguRect.left;
    const deguDy = padding - deguRect.top;
    const studioDx = padding - studioRect.left;
    const studioDy = (padding + targetHeight + gapBetween) - studioRect.top;

    // Exit offsets: just enough to clear the viewport at scaled size
    const deguExitX = -(deguRect.left + deguScale * deguRect.width + 100);
    const studioExitX = vw - studioRect.left + 100;
    const bodyExitX = vw * 1.5;

    // Scale from top-left corner (no visual change at scale 1)
    gsap.set([headerDegu, headerStudio], { transformOrigin: '0% 0%' });

    const phaseB = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => `+=${INTRO_SCROLL_DISTANCE * window.innerHeight}`,
        pin: true,
        scrub: true,
        snap: {
          snapTo: (progress: number) => (progress > 0.5 ? 1 : progress),
          duration: INTRO_SNAP_DURATION,
        },
      },
    });

    // --- 0.00–0.10: ScrollHint fades out ---
    phaseB.to(scrollHint, {
      opacity: 0,
      y: 20,
      duration: 0.1,
    }, 0);

    // --- 0.00–0.40: Headers scale up + reposition to top-left ---
    phaseB.to(headerDegu, {
      scale: deguScale,
      x: deguDx,
      y: deguDy,
      duration: 0.4,
    }, 0);

    phaseB.to(headerStudio, {
      scale: studioScale,
      x: studioDx,
      y: studioDy,
      duration: 0.4,
    }, 0);

    // --- 0.00–0.30: BodyText exits right ---
    phaseB.to(bodyText, {
      x: bodyExitX,
      opacity: 0,
      scale: 1.1,
      duration: 0.3,
    }, 0);

    // --- 0.40–0.65: DEGU exits left ---
    phaseB.to(headerDegu, {
      x: deguExitX,
      duration: 0.25,
    }, 0.4);

    // --- 0.40–0.65: STUDIO exits right ---
    phaseB.to(headerStudio, {
      x: studioExitX,
      duration: 0.25,
    }, 0.4);

    // --- 0.35–0.45: Gallery placeholder fades in at 60 % scale ---
    phaseB.to(galleryPlaceholder, {
      opacity: 1,
      duration: 0.1,
    }, 0.35);

    // --- 0.45–0.85: Gallery scales from 60 % to 100 % ---
    phaseB.to(galleryPlaceholder, {
      scale: 1,
      duration: 0.4,
    }, 0.45);
  }
}
