export const FLUID_CONFIG = {
  // Simulation
  VELOCITY_SCALE_FACTOR: 8,
  NUM_JACOBI_ITERATIONS: 3,
  MAX_VELOCITY: 30,
  TOUCH_FORCE_SCALE: 2,
  TOUCH_FORCE_SCALE_MOBILE: 4,
  TOUCH_THICKNESS: 30,
  TOUCH_THICKNESS_MOBILE: 50,

  // Rendering
  VECTOR_SPACING_DESKTOP: 10,
  VECTOR_SPACING_MOBILE: 12,
  VECTOR_SCALE: 2.5,
  VECTOR_SCALE_MOBILE: 3.5,
  MARKER_COLOR: [0.25, 0.25, 0.25] as [number, number, number],
  MARKER_COLOR_MOBILE: [0.5, 0.5, 0.5] as [number, number, number],
  // Brand orange (#E82D02) used for hover-state colouring of dashes.
  MARKER_COLOR_HOVER: [0.91, 0.176, 0.008] as [number, number, number],
  // Soft halo around the cursor: dashes inside the inner radius are full
  // orange, fading to gray at the outer radius. CSS pixels.
  HOVER_HALO_INNER_PX: 25,
  HOVER_HALO_OUTER_PX: 70,
  // Per-frame decay of the trailing halo. 0.93 ≈ ~165ms half-life at 60fps.
  HOVER_TRAIL_DECAY: 0.93,

  // Performance
  MOBILE_BREAKPOINT: 768,
};
