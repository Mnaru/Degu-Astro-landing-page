import { gsap } from 'gsap';

interface ProximityOptions {
  cards: HTMLElement[];
  maxScale?: number;
  radius?: number;
}

export function initPhotoProximity({ cards, maxScale = 0.05, radius = 300 }: ProximityOptions): () => void {
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (isTouch) return () => {};

  function onMouseMove(e: MouseEvent) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    cards.forEach(card => {
      if (card.style.visibility === 'hidden') return;

      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const distance = Math.hypot(mouseX - cardCenterX, mouseY - cardCenterY);

      const proximityScale = distance < radius
        ? 1 + maxScale * (1 - distance / radius)
        : 1;

      gsap.to(card, {
        '--proximity-scale': proximityScale,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  }

  document.addEventListener('mousemove', onMouseMove);

  return () => {
    document.removeEventListener('mousemove', onMouseMove);
    cards.forEach(card => {
      if (card.style.visibility !== 'hidden') {
        gsap.set(card, { '--proximity-scale': 1 });
      }
    });
  };
}
