// Single source of truth for all tweakable animation values.
// Every animation module imports from here.

// ===== AboutVideo =====
export const ABOUT_VIDEO_SCALE_START = 1;
// Scale ratio derived from initial (60vw / 75vw mobile) → peak (100vw / 100vw mobile).
export const ABOUT_VIDEO_SCALE_END_DESKTOP = 100 / 60;
export const ABOUT_VIDEO_SCALE_END_MOBILE = 100 / 75;
// Total pinned scroll distance — divided proportionally across the 3 phases
// per the timeline durations (scale up : text traverse : scale down = 1 : 4.8 : 1).
// Long runway = lots of scroll required to advance text = "heavy" reading pace.
export const ABOUT_VIDEO_SCROLL_RUNWAY = '612vh';
export const ABOUT_VIDEO_SCROLL_RUNWAY_MOBILE = '476vh';
// Single breakpoint per project spec.
export const ABOUT_VIDEO_MOBILE_BREAKPOINT = 768;
