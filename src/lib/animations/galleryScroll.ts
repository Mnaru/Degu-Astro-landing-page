interface GalleryScrollOptions {
  container: HTMLElement;
  speed?: number;
  direction?: 'left' | 'right';
  resumeDelay?: number;
  startOffsetRatio?: number;
}

export function initGalleryScroll(options: GalleryScrollOptions): () => void {
  const { container, speed = 60, direction = 'left', resumeDelay = 3000, startOffsetRatio = 0 } = options;
  const gallerySection = container.closest('[data-gallery]') as HTMLElement;

  let animationId: number;
  let lastTime = performance.now();
  let offset = 0;
  let paused = false;
  let singleSetWidth = 0;
  let resumeTimer: ReturnType<typeof setTimeout> | null = null;
  let touchStartX = 0;

  function wrapOffset() {
    if (singleSetWidth <= 0) return;
    offset = ((offset % singleSetWidth) + singleSetWidth) % singleSetWidth;
  }

  function measureSetWidth() {
    const wrappers = container.querySelectorAll<HTMLElement>('.gallery__image-wrapper');
    const total = wrappers.length;
    const half = total / 2;
    if (half < 1) return 0;
    const first = wrappers[0];
    const firstDup = wrappers[half];
    return firstDup.offsetLeft - first.offsetLeft;
  }

  function start() {
    singleSetWidth = measureSetWidth();
    if (singleSetWidth <= 0) return;
    if (startOffsetRatio !== 0) {
      const firstItem = container.querySelector<HTMLElement>('.gallery__image-wrapper');
      if (firstItem) {
        offset = firstItem.offsetWidth * startOffsetRatio;
        wrapOffset();
        const translateValue = direction === 'left' ? -offset : offset;
        container.style.transform = `translateX(${translateValue}px)`;
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  function resume() {
    paused = false;
    lastTime = performance.now();
  }

  function animate(currentTime: number) {
    if (!paused) {
      const delta = (currentTime - lastTime) / 1000;
      offset += speed * delta;

      if (offset >= singleSetWidth) {
        offset -= singleSetWidth;
      }

      const translateValue = direction === 'left' ? -offset : offset;
      container.style.transform = `translateX(${translateValue}px)`;
    }
    lastTime = currentTime;
    animationId = requestAnimationFrame(animate);
  }

  // Desktop: pause on hover
  function onMouseEnter() { paused = true; }
  function onMouseLeave() { resume(); }

  // Mobile: touch to drag, auto-resume after inactivity
  function onTouchStart(e: TouchEvent) {
    paused = true;
    touchStartX = e.touches[0].clientX;
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function onTouchMove(e: TouchEvent) {
    const currentX = e.touches[0].clientX;
    const delta = touchStartX - currentX;
    touchStartX = currentX;

    // Dragging left (finger moves left) → increase offset (scroll forward)
    // Dragging right (finger moves right) → decrease offset (scroll backward)
    offset += delta;
    wrapOffset();

    const translateValue = direction === 'left' ? -offset : offset;
    container.style.transform = `translateX(${translateValue}px)`;
  }

  function onTouchEnd() {
    resumeTimer = setTimeout(resume, resumeDelay);
  }

  // Desktop: trackpad horizontal swipe to drag gallery
  function onWheel(e: WheelEvent) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    e.preventDefault();
    paused = true;

    offset += e.deltaX;
    wrapOffset();

    const translateValue = direction === 'left' ? -offset : offset;
    container.style.transform = `translateX(${translateValue}px)`;

    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(resume, resumeDelay);
  }

  gallerySection.addEventListener('mouseenter', onMouseEnter);
  gallerySection.addEventListener('mouseleave', onMouseLeave);
  gallerySection.addEventListener('touchstart', onTouchStart, { passive: true });
  gallerySection.addEventListener('touchmove', onTouchMove, { passive: true });
  gallerySection.addEventListener('touchend', onTouchEnd);
  gallerySection.addEventListener('wheel', onWheel, { passive: false });

  // Force all images to load eagerly (lazy loading prevents off-screen
  // duplicates from loading, which blocks measurement and auto-scroll).
  const images = container.querySelectorAll<HTMLImageElement>('img');
  const loadPromises = Array.from(images).map(img => {
    if (img.loading === 'lazy') img.loading = 'eager';
    return img.complete ? Promise.resolve() : new Promise<void>(resolve => {
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  });
  Promise.all(loadPromises).then(start);

  return () => {
    cancelAnimationFrame(animationId);
    if (resumeTimer) clearTimeout(resumeTimer);
    gallerySection.removeEventListener('mouseenter', onMouseEnter);
    gallerySection.removeEventListener('mouseleave', onMouseLeave);
    gallerySection.removeEventListener('touchstart', onTouchStart);
    gallerySection.removeEventListener('touchmove', onTouchMove);
    gallerySection.removeEventListener('touchend', onTouchEnd);
    gallerySection.removeEventListener('wheel', onWheel);
  };
}
