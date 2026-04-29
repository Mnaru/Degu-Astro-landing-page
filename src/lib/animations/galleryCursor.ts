import { gsap } from 'gsap';

interface GalleryCursorOptions {
  cursor: HTMLElement;
  selector?: string;
}

export function initGalleryCursor({
  cursor,
  selector = '.gallery__link',
}: GalleryCursorOptions): () => void {
  const canHover = window.matchMedia('(hover: hover)').matches;
  if (!canHover) return () => {};

  gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });

  const quickX = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
  const quickY = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });

  let shown = false;

  const setShown = (next: boolean) => {
    if (next === shown) return;
    shown = next;
    gsap.to(cursor, {
      autoAlpha: shown ? 1 : 0,
      scale: shown ? 1 : 0.6,
      duration: shown ? 0.25 : 0.2,
      ease: 'power3.out',
    });
  };

  const onMove = (e: MouseEvent) => {
    quickX(e.clientX);
    quickY(e.clientY);
  };

  const onOver = (e: MouseEvent) => {
    const target = e.target as Element | null;
    setShown(!!target?.closest?.(selector));
  };

  const onLeaveWindow = () => setShown(false);

  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseleave', onLeaveWindow);

  return () => {
    window.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseover', onOver);
    document.removeEventListener('mouseleave', onLeaveWindow);
    gsap.set(cursor, { autoAlpha: 0 });
  };
}
