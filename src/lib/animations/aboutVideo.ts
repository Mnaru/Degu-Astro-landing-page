import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  ABOUT_VIDEO_MOBILE_BREAKPOINT,
  ABOUT_VIDEO_SCALE_END_DESKTOP,
  ABOUT_VIDEO_SCALE_END_MOBILE,
  ABOUT_VIDEO_SCALE_START,
  ABOUT_VIDEO_SCROLL_RUNWAY,
  ABOUT_VIDEO_SCROLL_RUNWAY_MOBILE,
} from './config';

gsap.registerPlugin(ScrollTrigger);

export function initAboutVideo(section: HTMLElement): () => void {
  const sticky = section.querySelector('.about-video__sticky') as HTMLElement | null;
  const videoWrap = section.querySelector('.about-video__video-wrap') as HTMLElement | null;
  const overlay = section.querySelector('.about-video__overlay') as HTMLElement | null;
  const textTrack = section.querySelector('.about-video__text-track') as HTMLElement | null;
  const textBlock = section.querySelector('.about-video__text-block') as HTMLElement | null;

  if (!sticky || !videoWrap || !overlay || !textTrack || !textBlock) {
    console.warn('aboutVideo: missing elements, skipping');
    return () => {};
  }

  // Overlay opacity tracks scale: darker when small, lighter when scaled up.
  const OVERLAY_OPACITY_DOWN = 0.6;
  const OVERLAY_OPACITY_UP = 0.4;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal the section regardless of motion preference.
  gsap.set(section, { visibility: 'visible' });

  if (reduceMotion) {
    // Static layout: peak video scale, text visible centered in track.
    const isMobileRM = window.innerWidth <= ABOUT_VIDEO_MOBILE_BREAKPOINT;
    const peakRM = isMobileRM ? ABOUT_VIDEO_SCALE_END_MOBILE : ABOUT_VIDEO_SCALE_END_DESKTOP;
    gsap.set(videoWrap, { scale: peakRM });
    gsap.set(overlay, { opacity: OVERLAY_OPACITY_UP });
    gsap.set(textBlock, { y: () => -((textTrack.offsetHeight - textBlock.offsetHeight) / 2 + textBlock.offsetHeight) });
    return () => {
      gsap.set([section, videoWrap, overlay, textBlock], { clearProps: 'all' });
    };
  }

  const isMobile = window.innerWidth <= ABOUT_VIDEO_MOBILE_BREAKPOINT;
  const scaleEnd = isMobile ? ABOUT_VIDEO_SCALE_END_MOBILE : ABOUT_VIDEO_SCALE_END_DESKTOP;
  const runway = isMobile ? ABOUT_VIDEO_SCROLL_RUNWAY_MOBILE : ABOUT_VIDEO_SCROLL_RUNWAY;

  // Text-phase duration is longer on mobile so touch flings don't streak the
  // text across the screen. Scale phases stay duration:1 on both — together with
  // the proportional bump in ABOUT_VIDEO_SCROLL_RUNWAY_MOBILE this keeps the
  // scale phases at the same scroll-pixel length on mobile while text gets ~67%
  // more runway, ~40% slower per scroll-pixel.
  const textDuration = isMobile ? 8 : 4.8;
  const scaleDownStart = 1 + textDuration;
  const timelineTotal = scaleDownStart + 1;

  // Initial state: video at start scale, text below the visible track area.
  gsap.set(videoWrap, { scale: ABOUT_VIDEO_SCALE_START, willChange: 'transform' });
  gsap.set(overlay, { opacity: OVERLAY_OPACITY_DOWN });
  gsap.set(textBlock, { y: 0, willChange: 'transform' });

  const tl = gsap.timeline({ paused: true });

  // Phase 1: scale up (0 → 1, takes 25% of timeline). Overlay lightens in parallel.
  // Curve matches heroToGallery convention for scrubbed scale entries.
  tl.to(videoWrap, { scale: scaleEnd, ease: 'power2.out', duration: 1 }, 0);
  tl.to(overlay, { opacity: OVERLAY_OPACITY_UP, ease: 'power2.out', duration: 1 }, 0);

  // Phase 2: text traverses bottom → top through the video frame.
  // Longer duration than the scale phases so reading pace feels slower than scroll.
  // y values are functions so they recompute on ScrollTrigger.refresh() (resize, etc.).
  tl.fromTo(
    textBlock,
    { y: 0 },
    {
      y: () => -(textTrack.offsetHeight + textBlock.offsetHeight),
      ease: 'none',
      duration: textDuration,
    },
    1
  );

  // Phase 3: scale down. Overlay darkens back in parallel.
  // Curve matches heroToGallery convention for scrubbed exits (ease 'in' → accelerate away).
  tl.to(videoWrap, { scale: ABOUT_VIDEO_SCALE_START, ease: 'power2.in', duration: 1 }, scaleDownStart);
  tl.to(overlay, { opacity: OVERLAY_OPACITY_DOWN, ease: 'power2.in', duration: 1 }, scaleDownStart);

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${runway}`,
    pin: sticky,
    // Numeric scrub adds smoothing: animation eases toward the scroll position
    // over N seconds instead of locking 1:1 with the scroll wheel. Higher = laggier.
    scrub: 2.5,
    invalidateOnRefresh: true,
    // Refresh after default-priority pins (e.g. hero) so this trigger's start
    // is measured against the post-pinSpacing layout. Without this, on cold
    // load + language switch the start computes ~100vh too early and the
    // pinned video appears overlapping the previous gallery.
    refreshPriority: -1,
    // Smoother pin engagement on touch — pre-pins one viewport-height ahead so
    // the section doesn't appear to "jump" into the pinned position on flings.
    anticipatePin: 1,
    animation: tl,
    // Snap only within the scale phases (timeline 0→1 and scaleDownStart→total),
    // leaving the long text-reading phase in the middle free-scrolling so users
    // can pause to read without being yanked.
    snap: {
      snapTo: (value) => {
        const SCALE_UP_END = 1 / timelineTotal;
        const SCALE_DOWN_START = scaleDownStart / timelineTotal;
        if (value < SCALE_UP_END) {
          return value < SCALE_UP_END / 2 ? 0 : SCALE_UP_END;
        }
        if (value > SCALE_DOWN_START) {
          return value > (SCALE_DOWN_START + 1) / 2 ? 1 : SCALE_DOWN_START;
        }
        return value;
      },
      duration: { min: 0.15, max: 0.4 },
      ease: 'power2.inOut',
      delay: 0.1,
      directional: true,
    },
  });

  // Pause/resume the mux video when the section enters/leaves the viewport.
  const muxVideo = videoWrap.querySelector('mux-video') as
    | (HTMLElement & { play?: () => Promise<void>; pause?: () => void })
    | null;
  let inView = false;
  const visObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inView = entry.isIntersecting;
        const video = videoWrap.querySelector('mux-video') as
          | (HTMLElement & { play?: () => Promise<void>; pause?: () => void })
          | null;
        if (!video) continue;
        if (inView) {
          video.play?.().catch(() => {});
        } else {
          video.pause?.();
        }
      }
    },
    { threshold: 0 }
  );
  visObserver.observe(section);
  // Initial state for an already-loaded video.
  if (muxVideo && !inView) muxVideo.pause?.();

  return () => {
    st.kill();
    tl.kill();
    visObserver.disconnect();
    gsap.set([section, videoWrap, overlay, textBlock], { clearProps: 'all' });
  };
}
