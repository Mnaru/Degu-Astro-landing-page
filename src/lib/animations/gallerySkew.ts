import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GallerySkewOptions {
  elements: HTMLElement[];
  maxSkew?: number;
  skewDuration?: number;
}

export function initGallerySkew({
  elements,
  maxSkew = 2,
  skewDuration = 0.2,
}: GallerySkewOptions): () => void {
  let currentSkew = 0;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const trigger = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      const targetSkew = clamp(velocity / 300, -maxSkew, maxSkew);

      if (Math.abs(targetSkew - currentSkew) > 0.01) {
        currentSkew = targetSkew;
        gsap.to(elements, {
          skewY: targetSkew,
          duration: skewDuration,
          ease: 'power2.out',
          overwrite: true,
        });
      }
    },
  });

  return () => {
    trigger.kill();
    gsap.set(elements, { skewY: 0 });
  };
}
