import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function heroOutro(heroEl: HTMLElement) {
  const ctx = gsap.context(() => {
    const degu = heroEl.querySelector('.header-container') as HTMLElement;
    const studio = heroEl.querySelector('.header-container-studio') as HTMLElement;
    const bodyText = heroEl.querySelector('.body-text-container') as HTMLElement;
    const scrollHint = heroEl.querySelector('.scroll-hint') as HTMLElement;

    if (!degu || !studio || !bodyText || !scrollHint) return;

    // --- Step A: Snapshot + transform origin swap (no visual jump) ---

    // 1. Snapshot current visual positions (end state of heroIntro: scale 0.98, various transformOrigins)
    const deguSnapRect = degu.getBoundingClientRect();
    const studioSnapRect = studio.getBoundingClientRect();

    // 2. Clear intro transforms so we can read natural CSS positions
    gsap.set([degu, studio], { clearProps: 'scale,transformOrigin,x,y,rotation' });

    // 3. Read natural CSS rects (no transforms applied)
    const deguNaturalRect = degu.getBoundingClientRect();
    const studioNaturalRect = studio.getBoundingClientRect();
    const deguNaturalH = deguNaturalRect.height;
    const studioNaturalH = studioNaturalRect.height;

    // 4. Set transformOrigin to top-left, restore scale 0.98, compensate with x/y
    const deguCompX = deguSnapRect.left - deguNaturalRect.left;
    const deguCompY = deguSnapRect.top - deguNaturalRect.top;
    const studioCompX = studioSnapRect.left - studioNaturalRect.left;
    const studioCompY = studioSnapRect.top - studioNaturalRect.top;

    gsap.set(degu, {
      transformOrigin: 'top left',
      scale: 0.98,
      x: deguCompX,
      y: deguCompY,
    });
    gsap.set(studio, {
      transformOrigin: 'top left',
      scale: 0.98,
      x: studioCompX,
      y: studioCompY,
    });

    // --- Step B: Calculate target scale and positions ---

    const outroGap = -40;
    const outroPadX = 5;
    const outroPadY = -8;
    const vh = window.innerHeight;
    const targetScale = (vh - outroPadY * 2 - outroGap) / (deguNaturalH + studioNaturalH);

    const deguTargetX = outroPadX - deguNaturalRect.left;
    const deguTargetY = outroPadY - deguNaturalRect.top;

    const studioTargetX = outroPadX - studioNaturalRect.left;
    const studioTargetY = (outroPadY + deguNaturalH * targetScale + outroGap) - studioNaturalRect.top;

    // --- Unlock body scroll so ScrollTrigger can work ---
    document.body.style.overflow = '';
    window.scrollTo(0, 0);

    // --- Step C: ScrollTrigger-driven timeline ---

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: `+=${vh}`,
        pin: true,
        scrub: 0.5,
        markers: true,
      }
    });

    // DEGU + STUDIO scale up and reposition
    tl.to(degu, {
      scale: targetScale,
      x: deguTargetX,
      y: deguTargetY,
      duration: 1.2,
      ease: 'power2.inOut',
    }, 0);

    tl.to(studio, {
      scale: targetScale,
      x: studioTargetX,
      y: studioTargetY,
      duration: 1.2,
      ease: 'power2.inOut',
    }, 0);

    // BodyText slides off-screen right/bottom
    tl.to(bodyText, {
      x: window.innerWidth,
      y: 50,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power2.in',
    }, 0.1);

    // ScrollHint fades out, pause cylinder (resume on reverse)
    tl.to(scrollHint, {
      autoAlpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        const cylTl = (scrollHint as any)._scrollHintTl;
        if (cylTl) cylTl.pause();
      },
      onReverseComplete: () => {
        const cylTl = (scrollHint as any)._scrollHintTl;
        if (cylTl) cylTl.play();
      },
    }, 0);

    // --- Step E: Exit — DEGU left, STUDIO right ---

    const exitStart = 1.2;
    const vw = window.innerWidth;
    const deguScaledW = deguNaturalRect.width * targetScale;

    tl.to(degu, {
      x: -(deguNaturalRect.left + deguScaledW),
      duration: 0.5,
      ease: 'power3.in',
    }, exitStart);

    tl.to(studio, {
      x: vw - studioNaturalRect.left,
      duration: 0.55,
      ease: 'power3.in',
    }, exitStart + 0.02);

  }, heroEl);

  return ctx;
}
