import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  GALLERY_FADE_DURATION,
  GALLERY_IMAGE_STAGGER,
} from '@lib/animations/config';

/**
 * Initializes gallery open/close behavior.
 *
 * - Listens for `gallery:open` custom events with `detail.galleryId`
 * - Clicking work pages dispatches `gallery:open`
 * - Close button and overlay click close the gallery
 * - Page scroll is frozen while the gallery is open
 * - Images stagger fade-in on open
 */
export function initGallery(): void {
  const galleries = document.querySelectorAll<HTMLElement>('[data-gallery]');
  if (!galleries.length) return;

  let activeGallery: HTMLElement | null = null;

  // UI elements that must hide while gallery is open
  const chromeEls = document.querySelectorAll<HTMLElement>(
    '.menu-wrapper, [data-menu="expanded"], .degu-logo, .lang-switcher',
  );

  function hideChrome(): void {
    chromeEls.forEach((el) => { el.style.display = 'none'; });
  }

  function showChrome(): void {
    chromeEls.forEach((el) => { el.style.display = ''; });
  }

  function openGallery(galleryId: string): void {
    const gallery = document.querySelector<HTMLElement>(
      `[data-gallery="${galleryId}"]`,
    );
    if (!gallery || activeGallery) return;

    activeGallery = gallery;

    // Hide menu, logo, language switcher
    hideChrome();

    // Freeze page scroll
    document.documentElement.style.overflow = 'hidden';
    // Pause ScrollTrigger so pinned sections don't interfere
    ScrollTrigger.getAll().forEach((st) => st.disable(false));

    // Show gallery
    gallery.style.display = 'block';

    // Reset scroll position
    const content = gallery.querySelector<HTMLElement>('.gallery-content');
    if (content) content.scrollTop = 0;

    // Reset image states
    const imageWrappers = gallery.querySelectorAll<HTMLElement>(
      '[data-gallery-image]',
    );
    gsap.set(imageWrappers, { opacity: 0, y: 20 });
    imageWrappers.forEach((w) => w.classList.remove('is-visible'));

    // Fade in overlay
    gsap.to(gallery, {
      opacity: 1,
      duration: GALLERY_FADE_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        // Stagger fade-in images
        imageWrappers.forEach((wrapper, index) => {
          gsap.to(wrapper, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: index * GALLERY_IMAGE_STAGGER,
            ease: 'power2.out',
            onStart: () => wrapper.classList.add('is-visible'),
          });
        });
      },
    });
  }

  function closeGallery(): void {
    if (!activeGallery) return;

    const gallery = activeGallery;
    activeGallery = null;

    gsap.to(gallery, {
      opacity: 0,
      duration: GALLERY_FADE_DURATION,
      ease: 'power2.in',
      onComplete: () => {
        gallery.style.display = 'none';

        // Restore page scroll
        document.documentElement.style.overflow = '';
        // Re-enable ScrollTrigger instances
        ScrollTrigger.getAll().forEach((st) => st.enable(true));
        ScrollTrigger.refresh();
        // Restore menu, logo, language switcher
        showChrome();
      },
    });
  }

  // Build a set of valid gallery IDs so we only open known galleries
  const validGalleryIds = new Set<string>();
  galleries.forEach((g) => {
    const id = g.dataset.gallery;
    if (id) validGalleryIds.add(id);
  });

  // Listen for gallery:open custom events (dispatched by page click handlers)
  window.addEventListener('gallery:open', ((e: CustomEvent) => {
    const { galleryId } = e.detail;
    if (typeof galleryId === 'string' && validGalleryIds.has(galleryId)) {
      openGallery(galleryId);
    }
  }) as EventListener);

  // Wire close buttons
  galleries.forEach((gallery) => {
    const closeBtn = gallery.querySelector<HTMLElement>('[data-gallery-close]');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeGallery();
    });

    // Click on overlay (outside gallery-content scroll area) closes gallery
    const overlay = gallery.querySelector<HTMLElement>('.gallery-overlay');
    overlay?.addEventListener('click', closeGallery);
  });
}
