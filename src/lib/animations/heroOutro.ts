import { gsap } from 'gsap';

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

    // 2. Measure visual gap between DEGU bottom and STUDIO top
    const gap = studioSnapRect.top - deguSnapRect.bottom;

    // 3. Clear intro transforms so we can read natural CSS positions
    gsap.set([degu, studio], { clearProps: 'scale,transformOrigin,x,y,rotation' });

    // 4. Read natural CSS rects (no transforms applied)
    const deguNaturalRect = degu.getBoundingClientRect();
    const studioNaturalRect = studio.getBoundingClientRect();
    const deguNaturalH = deguNaturalRect.height;
    const studioNaturalH = studioNaturalRect.height;

    // 5. Set transformOrigin to top-left, restore scale 0.98, compensate with x/y
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

    // --- Step C: Timeline ---

    const tl = gsap.timeline({ paused: true });

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

    const exitStart = 1.2; // after zoom-in completes
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

    // --- Step D: Scroll hijack — timed playback with scroll override ---
    let mode: 'waiting' | 'timed' | 'scroll' = 'waiting';
    let targetProgress = 0;
    let progressTween: gsap.core.Tween | null = null;
    const scrollSensitivity = 800; // total scroll-delta pixels for full animation

    // Detect end of scroll gesture — no events for 150ms
    let gestureEndTimer: ReturnType<typeof setTimeout> | null = null;
    let canOverride = false;

    const cleanup = () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      document.body.style.overflow = '';
      if (gestureEndTimer) clearTimeout(gestureEndTimer);
    };

    const handleScroll = (deltaY: number) => {
      if (deltaY === 0) return;

      // Reset gesture-end timer on every event
      if (gestureEndTimer) clearTimeout(gestureEndTimer);
      gestureEndTimer = setTimeout(() => { canOverride = true; }, 150);

      // Scroll up → snap back to intro end state (from any active mode)
      if (deltaY < 0 && mode !== 'waiting' && canOverride) {
        tl.pause();
        const snapDuration = Math.max(0.3, tl.progress() * 1.0);
        targetProgress = 0;
        mode = 'waiting';
        if (progressTween) progressTween.kill();
        progressTween = gsap.to(tl, {
          progress: 0,
          duration: snapDuration,
          ease: 'power2.inOut',
          overwrite: true,
        });
        return;
      }

      // First scroll down → start timed playback
      if (mode === 'waiting') {
        if (deltaY > 0) {
          mode = 'timed';
          canOverride = false;
          tl.play();
        }
        return;
      }

      // Timed mode — ignore events until initial gesture ends
      if (mode === 'timed') {
        if (!canOverride) return;
        // New gesture during timed playback → switch to scroll control
        mode = 'scroll';
        tl.pause();
        targetProgress = tl.progress();
        canOverride = false;
      }

      // Scroll down → drive progress forward
      targetProgress += deltaY / scrollSensitivity;
      targetProgress = Math.min(1, targetProgress);

      if (progressTween) progressTween.kill();
      progressTween = gsap.to(tl, {
        progress: targetProgress,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          if (targetProgress >= 1) cleanup();
        },
      });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(e.deltaY);
    };
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      handleScroll(deltaY);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    // Timed playback completion (no scroll override happened)
    tl.eventCallback('onComplete', cleanup);

  }, heroEl);

  return ctx;
}
