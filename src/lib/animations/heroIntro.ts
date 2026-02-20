import { gsap } from 'gsap';

export function heroIntro(heroEl: HTMLElement, onComplete?: () => void) {
  const ctx = gsap.context(() => {
    const heroInner = heroEl.querySelector('.hero-inner') as HTMLElement;
    const degu = heroEl.querySelector('.header-container') as HTMLElement;
    const studio = heroEl.querySelector('.header-container-studio') as HTMLElement;
    const bodyText = heroEl.querySelector('.body-text-container') as HTMLElement;
    const scrollHint = heroEl.querySelector('.scroll-hint') as HTMLElement;

    if (!heroInner || !degu || !studio || !bodyText || !scrollHint) return;

    // Clean slate: clear any stale GSAP transforms (e.g. from outro on HMR/reload)
    gsap.set([degu, studio, bodyText, scrollHint], { clearProps: 'all' });
    window.scrollTo(0, 0);

    // Lock page scroll completely during hero animations
    document.body.style.overflow = 'hidden';

    // Measure after clearing — now rects reflect pure CSS positions
    const heroInnerRect = heroInner.getBoundingClientRect();
    const studioRect = studio.getBoundingClientRect();
    const heroCenterX = heroInnerRect.left + heroInnerRect.width / 2;
    const studioCenterX = studioRect.left + studioRect.width / 2;
    const studioOffsetX = heroCenterX - studioCenterX;

    // Initial state: STUDIO centered, everything else hidden
    gsap.set(studio, { x: studioOffsetX });
    gsap.set(bodyText, { autoAlpha: 0 });
    gsap.set(scrollHint, { autoAlpha: 0 });

    // Reveal hero-inner (hidden by data-gsap to prevent flash)
    gsap.set(heroInner, { autoAlpha: 1 });

    const tl = gsap.timeline();

    // Step 1: Hold centered state for 400ms
    tl.to({}, { duration: 0.4 });

    // Step 2: Slide apart — asymmetric timing for organic feel
    const slideDistance = heroInnerRect.width * 0.18;
    const studioSlideDistance = heroInnerRect.width * 0.22;

    // Slide out: decelerates as elastic stretches (resistance)
    tl.to(degu, { x: slideDistance, rotation: 0.3, duration: 0.5, ease: 'power3.out' }, 0.4);
    tl.to(studio, { x: studioOffsetX - studioSlideDistance, rotation: -0.3, duration: 0.55, ease: 'power3.out' }, 0.42);

    // Elastic snaps them back immediately
    const snapStart = 0.42 + 0.55;

    // Snap back: fast start (elastic release), eases into position
    tl.to(studio, { x: 0, rotation: 0.15, duration: 0.21, ease: 'power3.in' }, snapStart);
    tl.to(degu, { x: 0, rotation: -0.15, duration: 0.24, ease: 'power3.in' }, snapStart + 0.02);

    // Settle rotation to zero
    tl.to([degu, studio], { rotation: 0, duration: 0.3, ease: 'power2.out' }, snapStart + 0.2);

    // Scale down after snap, decelerating to a stop
    const scaleStart = snapStart + 0.24 + 0.02; // after DEGU finishes
    tl.to(degu, { scale: 0.98, duration: 3, ease: 'power2.out', transformOrigin: 'center bottom' }, scaleStart);
    tl.to(studio, { scale: 0.98, duration: 3, ease: 'power2.out', transformOrigin: 'left top' }, scaleStart);

    // Body text: appears immediately after STUDIO snaps, then drifts right and scales up
    gsap.set(bodyText, { x: -10, y: -8 });
    tl.to(bodyText, { autoAlpha: 1, duration: 0.05, ease: 'none' }, scaleStart);
    tl.to(bodyText, { x: 0, y: 0, scale: 1.03, duration: 2, ease: 'power2.out' }, scaleStart);

    // ScrollHint: fade in 300ms after snap, then start cylinder rotation
    const scrollHintStart = scaleStart + 0.3;
    tl.to(scrollHint, {
      autoAlpha: 1,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        const cylTl = (scrollHint as any)._scrollHintTl;
        if (cylTl) cylTl.play();
      },
    }, scrollHintStart);

    // Scroll hijack: lock page scroll, use wheel/touch to accelerate animation
    let wheelTriggered = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!wheelTriggered && tl.progress() < 1) {
        wheelTriggered = true;
        tl.tweenTo(tl.duration(), { duration: 0.4, ease: 'power2.inOut' });
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!wheelTriggered && tl.progress() < 1) {
        wheelTriggered = true;
        tl.tweenTo(tl.duration(), { duration: 0.4, ease: 'power2.inOut' });
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    tl.eventCallback('onComplete', () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      onComplete?.();
    });

  }, heroEl);

  return ctx;
}
