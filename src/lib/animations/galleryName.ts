import { gsap } from 'gsap';

interface GalleryNameOptions {
  galleryEl: HTMLElement;
  nameEl: HTMLElement;
}

export function initGalleryName({ galleryEl, nameEl }: GalleryNameOptions): () => void {
  gsap.set(nameEl, { display: 'flex', autoAlpha: 0 });

  let isVisible = false;

  const update = () => {
    const rect = galleryEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const centerY = rect.top + rect.height / 2;
    const nowVisible = rect.height > 0 && centerY > vh * 0.1 && centerY < vh * 0.9;

    if (nowVisible !== isVisible) {
      isVisible = nowVisible;
      gsap.set(nameEl, { autoAlpha: isVisible ? 1 : 0 });
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  return () => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  };
}
