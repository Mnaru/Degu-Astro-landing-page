import { gsap } from 'gsap';
// @ts-ignore — gsap ships Draggable.js (uppercase) but draggable.d.ts (lowercase); casing mismatch triggers ts(1149)
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

interface PhotoStackOptions {
  container: HTMLElement;
  cards: HTMLElement[];
}

export function initPhotoStack({ cards }: PhotoStackOptions): () => void {
  if (cards.length === 0) return () => {};

  let topCardIndex = 0;
  let activeDraggable: Draggable | null = null;

  function flingCard(card: HTMLElement, dragX: number, dragY: number) {
    if (activeDraggable) {
      activeDraggable.kill();
      activeDraggable = null;
    }

    card.style.pointerEvents = 'none';

    topCardIndex++;
    if (topCardIndex < cards.length) {
      makeTopCardDraggable(cards[topCardIndex]);
    }

    const angle = Math.atan2(dragY, dragX);
    const exitDistance = Math.max(window.innerWidth, window.innerHeight) * 1.5;
    const exitX = Math.cos(angle) * exitDistance;
    const exitY = Math.sin(angle) * exitDistance;

    gsap.to(card, {
      x: exitX,
      y: exitY,

      duration: 0.5,
      ease: 'power1.in',
      onComplete: () => {
        card.style.visibility = 'hidden';
      },
    });
  }

  function makeTopCardDraggable(card: HTMLElement) {
    if (activeDraggable) {
      activeDraggable.kill();
      activeDraggable = null;
    }

    const [instance] = Draggable.create(card, {
      type: 'x,y',
      cursor: 'grab',
      activeCursor: 'grabbing',
      onDrag: function () {},
      onDragEnd: function () {
        const distance = Math.sqrt(this.x ** 2 + this.y ** 2);
        const threshold = 50;

        if (distance > threshold) {
          flingCard(card, this.x, this.y);
        } else {
          gsap.to(card, { x: 0, y: 0, duration: 0.3, ease: 'power1.in' });
        }
      },
      onClick: function () {
        const angle = Math.random() * Math.PI * 2;
        flingCard(card, Math.cos(angle), Math.sin(angle));
      },
    });

    activeDraggable = instance;
  }

  makeTopCardDraggable(cards[0]);

  return () => {
    if (activeDraggable) activeDraggable.kill();
  };
}
