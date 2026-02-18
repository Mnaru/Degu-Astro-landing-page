// ===== TWEAK ZONE =====
// Single source of truth for all animation timing, easing, and duration values.
// Every animation module imports from here. Change one value to affect all animations.

// --- Intro ---

/** Duration of Phase A time-based intro animation (seconds) */
export const INTRO_TIMED_DURATION = 2;

/** Scroll distance for Phase B as viewport-height multiplier (2 = 200vh) */
export const INTRO_SCROLL_DISTANCE = 2;

/** Peak scale factor for headers before they exit viewport */
export const INTRO_SCALE_FACTOR = 3.5;

/** Snap duration when user scrolls during gallery scale-up (seconds) */
export const INTRO_SNAP_DURATION = 0.3;

/** Snap threshold within gallery scale-up (0–1): snap to completion when past this fraction */
export const INTRO_SNAP_THRESHOLD = 0.5;

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

// --- Menu Expanded ---

/** Stagger delay between each menu item appearing from the bottom (seconds) */
export const MENU_ITEM_STAGGER = 0.06;

/** Duration for each menu item entrance animation (seconds) */
export const MENU_ITEM_DURATION = 0.4;

/** Vertical offset (px) menu items travel from during entrance */
export const MENU_ITEM_OFFSET = 40;

/** Easing for menu item entrance */
export const MENU_ITEM_EASE = 'power3.out';

/** Duration for the menu overlay fade-in (seconds) */
export const MENU_FADE_IN_DURATION = 0.3;

/** Duration for the menu overlay fade-out (seconds) */
export const MENU_FADE_OUT_DURATION = 0.25;

/** Duration for GSAP scrollTo when navigating via menu (seconds) */
export const MENU_SCROLL_DURATION = 1;

/** Easing for GSAP scrollTo navigation */
export const MENU_SCROLL_EASE = 'power2.inOut';

// --- Outro ---

/** Delay between each outro element appearing (seconds) */
export const OUTRO_STEP_DELAY = 0.2;

/** Duration for outro headers sliding in (seconds) */
export const OUTRO_SLIDE_DURATION = 0.8;

/** Easing for all outro movements */
export const OUTRO_EASING = 'power2.out';
