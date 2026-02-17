import { gsap } from 'gsap';

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
} from '@lib/animations/config';

/**
 * Phase A — Time-based intro animation.
 *
 * Initial state: DEGU and STUDIO are stacked vertically, both horizontally
 * centred in the viewport. BodyTextContainer and ScrollHint are invisible.
 *
 * The animation slides STUDIO left to its final position (next to
 * BodyTextContainer), fades in the body text, then fades in the scroll hint.
 *
 * The end state matches the current static CSS layout exactly — the timeline
 * clears all inline styles when it completes so the CSS takes over.
 */
export function initIntroAnimation(): void {
  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('[data-intro="intro-block"]', { visibility: 'visible' });
    gsap.set('[data-intro="scroll-hint"]', { visibility: 'visible' });
    document.querySelector('[data-intro="scroll-hint"]')?.classList.add('animate');
    return;
  }

  const introBlock = document.querySelector<HTMLElement>('[data-intro="intro-block"]');
  const headerStudio = document.querySelector<HTMLElement>('[data-intro="header-studio"]');
  const bodyText = document.querySelector<HTMLElement>('[data-intro="body-text"]');
  const scrollHint = document.querySelector<HTMLElement>('[data-intro="scroll-hint"]');

  // Bail out if any element is missing
  if (!introBlock || !headerStudio || !bodyText || !scrollHint) {
    return;
  }

  // The .studio-row is the flex parent that holds STUDIO + BodyTextContainer.
  const studioRow = headerStudio.parentElement as HTMLElement;

  // Capture the CSS-defined gap before we override it
  const finalGap = getComputedStyle(studioRow).getPropertyValue('gap') || '0px';

  // ---- Set initial state ----
  // Collapse body text completely so it takes no space in the flex row.
  // This lets flexbox naturally centre STUDIO at the viewport midpoint.
  gsap.set(bodyText, {
    opacity: 0,
    x: INTRO_BODY_OFFSET,
    width: 0,
    height: 0,
    overflow: 'hidden',
  });
  gsap.set(studioRow, { gap: 0 });
  gsap.set(scrollHint, { opacity: 0, y: -INTRO_SCROLL_HINT_OFFSET });

  // Reveal elements now that initial positions are set (prevents FOUC)
  gsap.set(introBlock, { visibility: 'visible' });
  gsap.set(scrollHint, { visibility: 'visible' });

  // ---- Build timeline ----
  const tl = gsap.timeline({
    delay: INTRO_INITIAL_PAUSE,
    defaults: { ease: INTRO_SLIDE_EASE },
    onComplete() {
      // Clear animated inline styles so CSS takes over.
      // Keep visibility: visible on introBlock and scrollHint
      // (they need it to override the CSS visibility: hidden).
      gsap.set(bodyText, { clearProps: 'opacity,transform,width,height,overflow' });
      gsap.set(studioRow, { clearProps: 'gap' });
      gsap.set(scrollHint, { clearProps: 'opacity,transform' });
    },
  });

  // 1. Expand body text width and gap — flexbox naturally slides STUDIO left.
  //    Height stays 0 during this step to prevent vertical movement.
  tl.to(bodyText, {
    width: 'auto',
    duration: INTRO_SLIDE_DURATION,
  });

  tl.to(studioRow, {
    gap: finalGap,
    duration: INTRO_SLIDE_DURATION,
  }, '<'); // same time

  // Snap height to auto now that width is at its final value.
  // At full width the body text is ~2 lines (<= STUDIO height), so no vertical shift.
  tl.set(bodyText, { height: 'auto' });

  // 2. BodyTextContainer fades in and slides from the right
  tl.to(bodyText, {
    opacity: 1,
    x: 0,
    overflow: 'visible',
    duration: INTRO_FADE_DURATION,
    ease: INTRO_FADE_EASE,
  });

  // 3. ScrollHint fades in from above + trigger fill animation (after delay)
  tl.to(scrollHint, {
    opacity: 1,
    y: 0,
    duration: INTRO_SCROLL_HINT_DURATION,
    ease: INTRO_FADE_EASE,
    onStart: () => scrollHint.classList.add('animate'),
  }, `+=${INTRO_SCROLL_HINT_DELAY}`);
}
