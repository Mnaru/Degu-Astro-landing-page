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

    // ── TEMPORARY DIAGNOSTIC ──
    const deguText = degu.querySelector('.header-text') as HTMLElement;
    const studioText = studio.querySelector('.header-text') as HTMLElement;
    const deguTextNatural = deguText?.getBoundingClientRect();
    const studioTextNatural = studioText?.getBoundingClientRect();

    console.group('ELEMENT INSPECTION');

    const deguStyle = getComputedStyle(deguText);
    const studioStyle = getComputedStyle(studioText);
    const deguContainerStyle = getComputedStyle(degu);
    const studioContainerStyle = getComputedStyle(studio);

    console.log('DEGU .header-text computed:', {
      fontFamily: deguStyle.fontFamily, fontSize: deguStyle.fontSize,
      fontWeight: deguStyle.fontWeight, lineHeight: deguStyle.lineHeight,
      letterSpacing: deguStyle.letterSpacing, textTransform: deguStyle.textTransform,
      display: deguStyle.display, margin: deguStyle.margin, padding: deguStyle.padding,
      border: deguStyle.border,
      textBoxTrim: (deguStyle as any).textBoxTrim || 'not supported',
      textBoxEdge: (deguStyle as any).textBoxEdge || 'not supported',
      boxSizing: deguStyle.boxSizing,
    });

    console.log('STUDIO .header-text computed:', {
      fontFamily: studioStyle.fontFamily, fontSize: studioStyle.fontSize,
      fontWeight: studioStyle.fontWeight, lineHeight: studioStyle.lineHeight,
      letterSpacing: studioStyle.letterSpacing, textTransform: studioStyle.textTransform,
      display: studioStyle.display, margin: studioStyle.margin, padding: studioStyle.padding,
      border: studioStyle.border,
      textBoxTrim: (studioStyle as any).textBoxTrim || 'not supported',
      textBoxEdge: (studioStyle as any).textBoxEdge || 'not supported',
      boxSizing: studioStyle.boxSizing,
    });

    console.log('DEGU .header-container computed:', {
      display: deguContainerStyle.display, width: deguContainerStyle.width,
      height: deguContainerStyle.height, padding: deguContainerStyle.padding,
      margin: deguContainerStyle.margin, border: deguContainerStyle.border,
      lineHeight: deguContainerStyle.lineHeight, overflow: deguContainerStyle.overflow,
      boxSizing: deguContainerStyle.boxSizing,
    });

    console.log('STUDIO .header-container-studio computed:', {
      display: studioContainerStyle.display, width: studioContainerStyle.width,
      height: studioContainerStyle.height, padding: studioContainerStyle.padding,
      margin: studioContainerStyle.margin, border: studioContainerStyle.border,
      lineHeight: studioContainerStyle.lineHeight, overflow: studioContainerStyle.overflow,
      boxSizing: studioContainerStyle.boxSizing,
    });

    console.log('DEGU bounds comparison:', {
      container: { top: deguNaturalRect.top, bottom: deguNaturalRect.top + deguNaturalRect.height, height: deguNaturalRect.height, left: deguNaturalRect.left, width: deguNaturalRect.width },
      text: deguTextNatural ? { top: deguTextNatural.top, bottom: deguTextNatural.top + deguTextNatural.height, height: deguTextNatural.height, left: deguTextNatural.left, width: deguTextNatural.width } : 'N/A',
      delta: deguTextNatural ? {
        topGap: deguTextNatural.top - deguNaturalRect.top,
        bottomGap: (deguNaturalRect.top + deguNaturalRect.height) - (deguTextNatural.top + deguTextNatural.height),
        leftGap: deguTextNatural.left - deguNaturalRect.left,
        rightGap: (deguNaturalRect.left + deguNaturalRect.width) - (deguTextNatural.left + deguTextNatural.width),
        heightDiff: deguNaturalRect.height - deguTextNatural.height,
      } : 'N/A',
    });

    console.log('STUDIO bounds comparison:', {
      container: { top: studioNaturalRect.top, bottom: studioNaturalRect.top + studioNaturalRect.height, height: studioNaturalRect.height, left: studioNaturalRect.left, width: studioNaturalRect.width },
      text: studioTextNatural ? { top: studioTextNatural.top, bottom: studioTextNatural.top + studioTextNatural.height, height: studioTextNatural.height, left: studioTextNatural.left, width: studioTextNatural.width } : 'N/A',
      delta: studioTextNatural ? {
        topGap: studioTextNatural.top - studioNaturalRect.top,
        bottomGap: (studioNaturalRect.top + studioNaturalRect.height) - (studioTextNatural.top + studioTextNatural.height),
        leftGap: studioTextNatural.left - studioNaturalRect.left,
        rightGap: (studioNaturalRect.left + studioNaturalRect.width) - (studioTextNatural.left + studioTextNatural.width),
        heightDiff: studioNaturalRect.height - studioTextNatural.height,
      } : 'N/A',
    });

    const deguFontSize = parseFloat(deguStyle.fontSize);
    const deguLineHeight = deguStyle.lineHeight === 'normal' ? deguFontSize * 1.2 : parseFloat(deguStyle.lineHeight);
    const studioFontSize = parseFloat(studioStyle.fontSize);
    const studioLineHeight = studioStyle.lineHeight === 'normal' ? studioFontSize * 1.2 : parseFloat(studioStyle.lineHeight);

    console.log('Line-height analysis:', {
      degu: { fontSize: deguFontSize, lineHeight: deguLineHeight, ratio: deguLineHeight / deguFontSize, extraSpace: deguLineHeight - deguFontSize },
      studio: { fontSize: studioFontSize, lineHeight: studioLineHeight, ratio: studioLineHeight / studioFontSize, extraSpace: studioLineHeight - studioFontSize },
    });

    const heroBounds = heroEl.getBoundingClientRect();
    console.log('Hero element:', {
      top: heroBounds.top, bottom: heroBounds.bottom, height: heroBounds.height,
      minHeight: getComputedStyle(heroEl).minHeight, maxHeight: getComputedStyle(heroEl).maxHeight,
      padding: getComputedStyle(heroEl).padding,
    });

    console.log('DEGU children:', Array.from(degu.children).map(c => ({
      tag: c.tagName, class: c.className, rect: c.getBoundingClientRect(),
    })));

    console.log('STUDIO children:', Array.from(studio.children).map(c => ({
      tag: c.tagName, class: c.className, rect: c.getBoundingClientRect(),
    })));

    const _vh = heroBounds.height;
    const _padY = _vh * 0.05;
    const _gap = 40;
    const _dTH = deguTextNatural?.height ?? deguNaturalH;
    const _sTH = studioTextNatural?.height ?? studioNaturalH;
    const _tgtScale = (_vh - _padY * 2 - _gap) / (_dTH + _sTH);

    console.log('Scale projection:', {
      vh: _vh, outroPadY: _padY, outroGap: _gap,
      deguTextH: _dTH, studioTextH: _sTH, targetScale: _tgtScale,
      scaledDeguH: _dTH * _tgtScale, scaledStudioH: _sTH * _tgtScale,
      totalContent: _dTH * _tgtScale + _gap + _sTH * _tgtScale,
      totalWithPadding: _dTH * _tgtScale + _gap + _sTH * _tgtScale + _padY * 2,
      fitsInVh: (_dTH * _tgtScale + _gap + _sTH * _tgtScale + _padY * 2) <= _vh,
    });

    console.groupEnd();
    return; // freeze here — don't run animation
    // ── END DIAGNOSTIC ──

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

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const outroPadY = vh * 0.05;   // 5% vertical padding
    const outroPadX = vw * 0.02;   // 2% horizontal padding
    const outroGap = 40;           // 40px visible gap between words
    const targetScale = (vh - outroPadY * 2 - outroGap) / (deguNaturalH + studioNaturalH);
    console.log('HERO OUTRO VALUES:', { vh, vw, outroPadY, outroPadX, outroGap, targetScale, deguNaturalH, studioNaturalH });

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
