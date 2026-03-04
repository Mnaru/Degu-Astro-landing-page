import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFooterReveal(footer: HTMLElement): () => void {
  gsap.set(footer, { backgroundColor: '#000000' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: 'top 80%',
      end: 'top 20%',
      scrub: true,
    },
  });

  tl.to(footer, { backgroundColor: '#E4E4E4', ease: 'none' });

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set(footer, { clearProps: 'backgroundColor' });
  };
}
