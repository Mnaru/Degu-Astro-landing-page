import { gsap } from 'gsap';

import {
  OUTRO_STEP_DELAY,
  OUTRO_SLIDE_DURATION,
  OUTRO_EASING,
} from '@lib/animations/config';

/**
 * Outro animation — time-based sequence triggered programmatically by
 * the intro ScrollTrigger's onLeave callback.
 *
 * Sequence:
 *   1. "DROP US" header slides in from the right
 *   2. Team image appears (fade + scale)
 *   3. "A LINE" header slides in from the right
 *   4. Body text fades in
 *   5. Contact button appears from the left
 *
 * The outro section is made position: fixed when playing so it covers
 * the viewport as an overlay. This also removes it from document flow,
 * so the only scrollable area is the pin spacer — scrolling up
 * immediately re-enters the gallery (onEnterBack fires).
 */

let outroTimeline: gsap.core.Timeline | null = null;
let outroSection: HTMLElement | null = null;
let isReducedMotion = false;

// Child element references, stored for the exit animation
let elHeader1: HTMLElement | null = null;
let elTeamImage: HTMLElement | null = null;
let elHeader2: HTMLElement | null = null;
let elBody: HTMLElement | null = null;
let elContactButton: HTMLElement | null = null;

/**
 * Initialise: query elements, set initial (offscreen) states, build
 * a paused timeline. Does NOT create a ScrollTrigger — playback is
 * controlled by intro.ts via playOutro() / resetOutro().
 */
export function initOutroAnimation(): void {
  const section = document.querySelector<HTMLElement>('[data-section="outro"]');
  if (!section) return;

  outroSection = section;

  const header1 = section.querySelector<HTMLElement>('[data-outro="header1"]');
  const teamImage = section.querySelector<HTMLElement>('[data-outro="team-image"]');
  const header2 = section.querySelector<HTMLElement>('[data-outro="header2"]');
  const body = section.querySelector<HTMLElement>('[data-outro="body"]');
  const contactButton = section.querySelector<HTMLElement>('[data-outro="contact-button"]');

  if (!header1 || !teamImage || !header2 || !body || !contactButton) return;

  // Store refs for the exit animation
  elHeader1 = header1;
  elTeamImage = teamImage;
  elHeader2 = header2;
  elBody = body;
  elContactButton = contactButton;

  // ---- Reduced motion: nothing to animate ----
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    isReducedMotion = true;
    return;
  }

  // ---- Set initial (pre-animation) states ----
  gsap.set([header1, header2], { x: '110%', opacity: 0 });
  gsap.set(teamImage, { opacity: 0, scale: 0.85 });
  gsap.set(body, { opacity: 0, y: 20 });
  gsap.set(contactButton, { x: '-20vw', opacity: 0 });

  // ---- Build paused timeline ----
  const tl = gsap.timeline({ paused: true });

  // 1. "DROP US" slides in from right
  tl.to(header1, {
    x: 0,
    opacity: 1,
    duration: OUTRO_SLIDE_DURATION,
    ease: OUTRO_EASING,
  });

  // 2. Team image appears (fade + scale)
  tl.to(teamImage, {
    opacity: 1,
    scale: 1,
    duration: OUTRO_SLIDE_DURATION * 0.75,
    ease: OUTRO_EASING,
  }, `>+=${OUTRO_STEP_DELAY}`);

  // 3. "A LINE" slides in from right
  tl.to(header2, {
    x: 0,
    opacity: 1,
    duration: OUTRO_SLIDE_DURATION,
    ease: OUTRO_EASING,
  }, `>+=${OUTRO_STEP_DELAY}`);

  // 4. Body text fades in
  tl.to(body, {
    opacity: 1,
    y: 0,
    duration: OUTRO_SLIDE_DURATION * 0.75,
    ease: OUTRO_EASING,
  }, `>+=${OUTRO_STEP_DELAY}`);

  // 5. Contact button appears from left
  tl.to(contactButton, {
    x: 0,
    opacity: 1,
    duration: OUTRO_SLIDE_DURATION * 0.75,
    ease: OUTRO_EASING,
  }, `>+=${OUTRO_STEP_DELAY}`);

  outroTimeline = tl;
}

/** Timeline used for the quick exit when leaving the outro. */
let exitTimeline: gsap.core.Timeline | null = null;

const EXIT_DURATION = 0.35;

/**
 * Show the outro as a fixed viewport overlay and play the entrance
 * animation. Called from intro.ts onLeave.
 */
export function playOutro(): void {
  if (!outroSection) return;

  // Cancel any in-progress exit from a previous reverseOutro()
  if (exitTimeline) {
    exitTimeline.kill();
    exitTimeline = null;
  }

  // Cover viewport as a fixed overlay
  gsap.set(outroSection, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100vh',
    zIndex: 10,
    visibility: 'visible',
    opacity: 1,
  });

  if (isReducedMotion || !outroTimeline) return;

  outroTimeline.play(0);
}

/**
 * Quick exit of the outro overlay. Called from intro.ts
 * onEnterBack when the user scrolls back up.
 *
 * All child elements animate out simultaneously (headers slide
 * right, image/body fade, button slides left) while the section
 * fades to transparent — all in ~0.35s. Once invisible, the
 * entrance timeline is reset and fixed positioning is cleared.
 */
export function reverseOutro(): void {
  if (!outroSection) return;

  if (isReducedMotion || !outroTimeline) {
    hideOutroSection();
    return;
  }

  // Kill any previous exit that may still be running
  if (exitTimeline) {
    exitTimeline.kill();
  }

  const tl = gsap.timeline({
    onComplete: () => {
      exitTimeline = null;
      hideOutroSection();
    },
  });

  // All element exits run in parallel at time 0
  if (elHeader1) {
    tl.to(elHeader1, { x: '110%', opacity: 0, duration: EXIT_DURATION, ease: 'power2.in' }, 0);
  }
  if (elHeader2) {
    tl.to(elHeader2, { x: '110%', opacity: 0, duration: EXIT_DURATION, ease: 'power2.in' }, 0);
  }
  if (elTeamImage) {
    tl.to(elTeamImage, { opacity: 0, scale: 0.85, duration: EXIT_DURATION, ease: 'power2.in' }, 0);
  }
  if (elBody) {
    tl.to(elBody, { opacity: 0, y: 20, duration: EXIT_DURATION, ease: 'power2.in' }, 0);
  }
  if (elContactButton) {
    tl.to(elContactButton, { x: '-20vw', opacity: 0, duration: EXIT_DURATION, ease: 'power2.in' }, 0);
  }

  // Section fade runs in parallel — slightly shorter so gallery peeks through
  tl.to(outroSection, { opacity: 0, duration: EXIT_DURATION, ease: 'power1.in' }, 0);

  exitTimeline = tl;
}

/** Reset timeline, remove fixed overlay, revert to CSS defaults. */
function hideOutroSection(): void {
  if (!outroSection) return;

  if (outroTimeline) {
    outroTimeline.progress(0).pause();
  }

  gsap.set(outroSection, {
    clearProps: 'position,top,left,width,height,zIndex,visibility,opacity',
  });
}
