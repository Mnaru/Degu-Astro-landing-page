import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GalleryNameOptions {
  galleryEl: HTMLElement;
  nameEl: HTMLElement;
}

const MOBILE_BREAKPOINT = 1200;

export function initGalleryName({ galleryEl, nameEl }: GalleryNameOptions): () => void {
  gsap.set(nameEl, { display: 'flex', autoAlpha: 0 });

  const show = () => gsap.set(nameEl, { autoAlpha: 1 });
  const hide = () => gsap.set(nameEl, { autoAlpha: 0 });

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  // Desktop: ScrollTrigger with centered thresholds
  let trigger: ScrollTrigger | null = null;
  if (!isMobile()) {
    trigger = ScrollTrigger.create({
      trigger: galleryEl,
      start: 'top 20%',
      end: 'bottom 80%',
      onEnter: show,
      onLeave: hide,
      onEnterBack: show,
      onLeaveBack: hide,
    });
  }

  // Mobile: IntersectionObserver — reliable with scroll-snap
  let observer: IntersectionObserver | null = null;
  if (isMobile()) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
        } else {
          hide();
        }
      },
      { threshold: 0 },
    );
    observer.observe(galleryEl);
  }

  return () => {
    trigger?.kill();
    observer?.disconnect();
  };
}
