import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GalleryNameOptions {
  galleryEl: HTMLElement;
  nameEl: HTMLElement;
}

export function initGalleryName({ galleryEl, nameEl }: GalleryNameOptions): () => void {
  gsap.set(nameEl, { display: 'flex', autoAlpha: 0 });

  const trigger = ScrollTrigger.create({
    trigger: galleryEl,
    start: 'top 20%',
    end: 'bottom 80%',
    onEnter: () => gsap.set(nameEl, { autoAlpha: 1 }),
    onLeave: () => gsap.set(nameEl, { autoAlpha: 0 }),
    onEnterBack: () => gsap.set(nameEl, { autoAlpha: 1 }),
    onLeaveBack: () => gsap.set(nameEl, { autoAlpha: 0 }),
  });

  return () => {
    trigger.kill();
  };
}
