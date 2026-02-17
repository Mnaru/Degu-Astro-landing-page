// ===== TWEAK ZONE =====
// Single source of truth for all animation timing, easing, and duration values.
// Every animation module imports from here. Change one value to affect all animations.

// --- Intro ---

/** Duration of Phase A time-based intro animation (seconds) */
export const INTRO_TIMED_DURATION = 2;

/** Scroll distance (px) for Phase B header scaling */
export const INTRO_SCALE_SCROLL_DISTANCE = 1500;

/** Snap duration when user scrolls during gallery scale-up (seconds) */
export const INTRO_SNAP_DURATION = 0.3;

/** Easing function for all intro movements */
export const INTRO_EASING = 'power2.out';

/** Pause before Phase A animation starts (seconds) */
export const INTRO_INITIAL_PAUSE = 0.6;

/** Duration for STUDIO sliding to its final position (seconds) */
export const INTRO_SLIDE_DURATION = 0.8;

/** Duration for BodyTextContainer fading in (seconds) */
export const INTRO_FADE_DURATION = 0.5;

/** Duration for ScrollHint fading in (seconds) */
export const INTRO_SCROLL_HINT_DURATION = 0.4;

/** Delay after BodyTextContainer settles before ScrollHint appears (seconds) */
export const INTRO_SCROLL_HINT_DELAY = 0.2;

/** Vertical offset (px) for ScrollHint entrance from above */
export const INTRO_SCROLL_HINT_OFFSET = 20;

/** Horizontal offset (px) for BodyTextContainer entrance */
export const INTRO_BODY_OFFSET = 30;

/** Easing for slide movements — punchy start, gentle settle */
export const INTRO_SLIDE_EASE = 'power3.out';

/** Easing for fade/reveal movements — slightly softer */
export const INTRO_FADE_EASE = 'power2.out';

// --- Gallery ---

/** Fade-out speed when closing the gallery overlay (seconds) */
export const GALLERY_FADE_DURATION = 0.3;

/** Delay between each gallery image appearing (seconds) */
export const GALLERY_IMAGE_STAGGER = 0.1;

// --- Outro ---

/** Delay between each outro element appearing (seconds) */
export const OUTRO_STEP_DELAY = 0.2;

/** Duration for outro headers sliding in (seconds) */
export const OUTRO_SLIDE_DURATION = 0.8;

/** Easing for all outro movements */
export const OUTRO_EASING = 'power2.out';
