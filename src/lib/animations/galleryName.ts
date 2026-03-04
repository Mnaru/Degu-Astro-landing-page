import { gsap } from 'gsap';

interface GalleryNameOptions {
  galleryEl: HTMLElement;
  nameEl: HTMLElement;
}

export function initGalleryName({ galleryEl, nameEl }: GalleryNameOptions): () => void {
  gsap.set(nameEl, { display: 'flex', autoAlpha: 0 });

  const update = () => {
    const rect = galleryEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const visible = rect.top < vh * 0.8 && rect.bottom > vh * 0.2;
    gsap.set(nameEl, { autoAlpha: visible ? 1 : 0 });
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  return () => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  };
}
