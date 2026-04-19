import { gsap } from 'gsap';

interface GalleryCursorOptions {
  cursor: HTMLElement;
  links: HTMLElement[];
}

export function initGalleryCursor({ cursor, links }: GalleryCursorOptions): () => void {
  const canHover = window.matchMedia('(hover: hover)').matches;
  if (!canHover) return () => {};

  gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });

  const quickX = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
  const quickY = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });

  let active = 0;

  const onMove = (e: MouseEvent) => {
    quickX(e.clientX);
    quickY(e.clientY);
  };

  const onEnter = (e: MouseEvent) => {
    active += 1;
    gsap.set(cursor, { x: e.clientX, y: e.clientY });
    gsap.to(cursor, { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'power3.out' });
  };

  const onLeave = () => {
    active = Math.max(0, active - 1);
    if (active === 0) {
      gsap.to(cursor, { scale: 0.6, autoAlpha: 0, duration: 0.2, ease: 'power3.out' });
    }
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  links.forEach((link) => {
    link.addEventListener('mouseenter', onEnter);
    link.addEventListener('mouseleave', onLeave);
  });

  return () => {
    window.removeEventListener('mousemove', onMove);
    links.forEach((link) => {
      link.removeEventListener('mouseenter', onEnter);
      link.removeEventListener('mouseleave', onLeave);
    });
    gsap.set(cursor, { autoAlpha: 0 });
  };
}
