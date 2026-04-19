import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { runAllCleanups } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

const PERSIST_SELECTOR = '[data-astro-transition-persist]';

function isInPersistedTree(el: Element | null): boolean {
  if (!el) return false;
  if (el === document.body) return false;
  return !!el.closest(PERSIST_SELECTOR);
}

document.addEventListener('astro:before-swap', () => {
  runAllCleanups({ keepPersistent: true });

  // Kill only ScrollTriggers attached to non-persisted DOM. Persisted
  // elements survive the swap, so their ScrollTriggers (and the GSAP
  // tweens they drive) must survive too.
  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.trigger as Element | null | undefined;
    if (!trigger) { st.kill(); return; }
    if (trigger === document.body) return;
    if (isInPersistedTree(trigger)) return;
    st.kill();
  });
});
