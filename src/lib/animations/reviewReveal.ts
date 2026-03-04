import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initReviewReveal(section: HTMLElement): () => void {
  const stars = section.querySelectorAll('.review__star');
  const quote = section.querySelector('.review__quote');
  const source = section.querySelector('.review__source');

  if (!stars.length || !quote || !source) {
    console.warn('reviewReveal: missing elements, skipping');
    return () => {};
  }

  // Center-out order: 3rd star first, then 2nd & 4th, then 1st & 5th
  const orderedStars = [stars[2], stars[1], stars[3], stars[0], stars[4]];

  // Initial hidden states
  gsap.set(orderedStars, { autoAlpha: 0, scale: 0.6 });
  gsap.set(quote, { autoAlpha: 0, y: 15 });
  gsap.set(source, { autoAlpha: 0 });

  // Build a paused timeline (decoupled from ScrollTrigger)
  const tl = gsap.timeline({ paused: true });

  // Stars: center-out staggered scale + fade
  orderedStars.forEach((star, i) => {
    tl.to(star, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
    }, i * 0.15);
  });

  // Quote: fade + drift up (starts after 3rd star begins)
  tl.to(quote, {
    autoAlpha: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
  }, 0.45);

  // Source: fade in last
  tl.to(source, {
    autoAlpha: 1,
    duration: 0.4,
    ease: 'power2.out',
  }, 0.9);

  // Standalone ScrollTrigger — more reliable with complex pin layouts
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top 80%',
    once: true,
    onEnter: () => tl.play(),
  });

  return () => {
    st.kill();
    tl.kill();
    gsap.set([...orderedStars, quote, source], { clearProps: 'all' });
  };
}
