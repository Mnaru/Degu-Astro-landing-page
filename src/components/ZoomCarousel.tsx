import { useRef, useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { flushSync } from 'react-dom';

const CARDS = [
  { label: 'Card 1', bg: '#f1c40f' },
  { label: 'Card 2', bg: '#bbb' },
  { label: 'Card 3', bg: '#87CEEB' },
];

const ZOOM_AMOUNT = 0.3;
const GAP = 2; // vh
const CARD_WIDTH = 145; // vw
const ORIGIN_X_CSS = 'clamp(80px, 20vw, 20vw)';

/** Tent: 0 at edges, 1 at |p|=0.5 */
const tent = (p: number) => 1 - Math.abs(0.5 - Math.abs(p)) / 0.5;

const SPRING_CONFIG = { tension: 84, friction: 28, mass: 2, clamp: true };

const slots = [-1, 0, 1];

export default function ZoomCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const indexRef = useRef(0);
  const lockedRef = useRef(false);

  const [spring, api] = useSpring(() => ({
    progress: 0,
    config: SPRING_CONFIG,
  }));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (lockedRef.current) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = indexRef.current + 1;
        if (nextIdx >= CARDS.length) return;
        lockedRef.current = true;
        api.start({
          progress: 1,
          onRest: () => {
            indexRef.current = nextIdx;
            flushSync(() => setCurrentIndex(nextIdx));
            api.set({ progress: 0 });
            lockedRef.current = false;
          },
        });
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextIdx = indexRef.current - 1;
        if (nextIdx < 0) return;
        lockedRef.current = true;
        api.start({
          progress: -1,
          onRest: () => {
            indexRef.current = nextIdx;
            flushSync(() => setCurrentIndex(nextIdx));
            api.set({ progress: 0 });
            lockedRef.current = false;
          },
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [api]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
        touchAction: 'none',
      }}
    >
      {slots.map((slot) => {
        const cardIndex = currentIndex + slot;
        if (cardIndex < 0 || cardIndex >= CARDS.length) return null;
        const card = CARDS[cardIndex];

        const originY = cardIndex === 0 ? '0%'
          : cardIndex === CARDS.length - 1 ? '100%'
          : '50%';

        return (
          <animated.div
            key={`card-${cardIndex}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${CARD_WIDTH}vw`,
              height: '100vh',
              background: card.bg,
              overflow: 'hidden',
              transformOrigin: `${ORIGIN_X_CSS} ${originY}`,
              transform: spring.progress.to((p) => {
                const zoom = tent(p);
                const s = 1 - zoom * ZOOM_AMOUNT;
                const slideAmt =
                  Math.sign(p) * Math.max(0, (Math.abs(p) - 0.5) * 2);
                const step = s * 100 + GAP;
                const y = (slot - slideAmt) * step;
                return `translateY(${y}vh) scale(${s})`;
              }),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              fontFamily: 'sans-serif',
              color: '#333',
            }}
          >
            {card.label}
          </animated.div>
        );
      })}
    </div>
  );
}
