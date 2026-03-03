import { gsap } from 'gsap';

interface PulseOptions {
  cards: HTMLElement[];
  intensity?: number;
  duration?: number;
}

export function initPhotoPulse({ cards, intensity = 0.025, duration = 2 }: PulseOptions): () => void {
  const timelines: gsap.core.Timeline[] = [];

  cards.forEach((card, index) => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(card, {
      '--pulse-scale': 1 + intensity,
      duration,
      ease: 'sine.inOut',
      delay: index * 0.3,
    });
    timelines.push(tl);
  });

  return () => {
    timelines.forEach(tl => tl.kill());
  };
}
