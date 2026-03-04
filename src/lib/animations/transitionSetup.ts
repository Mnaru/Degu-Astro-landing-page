import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { runAllCleanups } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('astro:before-swap', () => {
  runAllCleanups();
  ScrollTrigger.getAll().forEach(st => st.kill());
  gsap.globalTimeline.clear();
});
