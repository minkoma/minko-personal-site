const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initialiseInteractiveContent(scope = document) {
  const copyButton = scope.querySelector('#copy-email');
  if (copyButton && !copyButton.dataset.initialised) {
    copyButton.dataset.initialised = 'true';
    copyButton.addEventListener('click', async () => {
      const status = document.getElementById('copy-status');
      try { await navigator.clipboard.writeText('minkoma2002@gmail.com'); status.textContent = 'Email copied.'; }
      catch { status.textContent = 'Please copy the email address above.'; }
    });
  }
  scope.querySelectorAll('[data-email-action]:not([data-initialised])').forEach(action => {
    action.dataset.initialised = 'true';
    const openEmail = event => {
      if (event.target.closest('button')) return;
      window.location.href = 'mailto:minkoma2002@gmail.com';
    };
    action.addEventListener('click', openEmail);
    action.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openEmail(event);
      }
    });
  });
  if (window.PhotoSwipeLightbox) {
    scope.querySelectorAll('.photo-gallery:not([data-lightbox-ready])').forEach(galleryElement => {
      galleryElement.dataset.lightboxReady = 'true';
      const gallery = new PhotoSwipeLightbox({ gallery: galleryElement, children: 'a', pswpModule: PhotoSwipe, showHideAnimationType: reduceMotion ? 'none' : 'zoom' });
      gallery.init();
    });
  }
  scope.querySelectorAll('.flip-card:not([data-flip-ready])').forEach(card => {
    card.dataset.flipReady = 'true';
    const back = card.querySelector('.flip-back');
    const collage = card.querySelector('.memory-collage');
    if (back && collage && !back.querySelector('.memory-detail-collage')) {
      const detailCollage = collage.cloneNode(true);
      detailCollage.classList.add('memory-detail-collage');
      back.prepend(detailCollage);
    }
    card.addEventListener('click', () => {
      if (card.classList.contains('memory-card')) openMemoryDialog(card);
      else card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
    });
  });
  scope.querySelectorAll('[data-album-carousel]:not([data-album-ready])').forEach(album => {
    album.dataset.albumReady = 'true';
    const viewport = album.querySelector('.album-viewport');
    const slides = [...album.querySelectorAll('.album-slide')];
    const count = album.querySelector('[data-album-count]');
    const updateCount = () => {
      const index = Math.min(slides.length - 1, Math.max(0, Math.round(viewport.scrollLeft / viewport.clientWidth)));
      if (count) count.textContent = `${index + 1} / ${slides.length}`;
    };
    album.querySelector('[data-album-prev]')?.addEventListener('click', () => viewport.scrollBy({ left: -viewport.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' }));
    album.querySelector('[data-album-next]')?.addEventListener('click', () => viewport.scrollBy({ left: viewport.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' }));
    viewport.addEventListener('scroll', updateCount, { passive: true });
    window.addEventListener('resize', updateCount);
    updateCount();
  });
  scope.querySelectorAll('[data-design-viewer]:not([data-design-ready])').forEach(viewer => {
    if (!window.Swiper) return;
    viewer.dataset.designReady = 'true';
    const thumbs = new Swiper(viewer.querySelector('.design-thumbs-swiper'), {
      slidesPerView: 'auto',
      spaceBetween: 10,
      watchSlidesProgress: true,
      freeMode: true,
      breakpoints: { 600: { slidesPerView: 4, spaceBetween: 12 } },
      a11y: { enabled: true },
    });
    const main = new Swiper(viewer.querySelector('.design-main-swiper'), {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: reduceMotion ? 0 : 420,
      keyboard: { enabled: true },
      navigation: { nextEl: viewer.querySelector('.swiper-button-next'), prevEl: viewer.querySelector('.swiper-button-prev') },
      thumbs: { swiper: thumbs },
      a11y: { enabled: true },
    });
    const title = viewer.querySelector('[data-design-title]');
    const body = viewer.querySelector('[data-design-body]');
    const count = viewer.querySelector('[data-design-count]');
    const pdf = viewer.closest('.design-album')?.querySelector('[data-design-pdf]');
    const download = viewer.closest('.design-album')?.querySelector('[data-design-download]');
    const updateCaption = swiper => {
      const slide = swiper.slides[swiper.activeIndex];
      if (!slide) return;
      if (title) title.textContent = slide.dataset.captionTitle || '';
      if (body) body.textContent = slide.dataset.captionBody || '';
      if (count) count.textContent = `${swiper.activeIndex + 1} / ${swiper.slides.length}`;
      if (pdf) pdf.href = slide.dataset.pdf || 'assets/design-portfolio.pdf';
      if (download) download.href = slide.dataset.pdf || 'assets/design-portfolio.pdf';
    };
    main.on('slideChange', updateCaption);
    updateCaption(main);
  });
  scope.querySelectorAll('.instagram-frame iframe:not([data-scroll-ready])').forEach(iframe => {
    iframe.dataset.scrollReady = 'true';
    iframe.addEventListener('wheel', event => {
      window.scrollBy(event.deltaX, event.deltaY);
      event.preventDefault();
    }, { passive: false });
  });
}

function openMemoryDialog(card) {
  let dialog = document.getElementById('memory-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'memory-dialog';
    dialog.className = 'memory-dialog';
    dialog.innerHTML = '<button class="memory-dialog-close" type="button" aria-label="Close details">×</button><div class="memory-dialog-content"></div>';
    document.body.append(dialog);
    dialog.querySelector('.memory-dialog-close').addEventListener('click', closeMemoryDialog);
    dialog.addEventListener('click', event => { if (event.target === dialog) closeMemoryDialog(); });
  }
  if (dialog.open) return;
  window.activeMemoryCard = card;
  dialog.dataset.photoCount = String(card.querySelectorAll('.memory-photo').length);
  card.setAttribute('aria-pressed', 'true');
  card.classList.add('memory-card-active');
  const content = dialog.querySelector('.memory-dialog-content');
  const back = card.querySelector('.flip-back');
  content.replaceChildren(back.cloneNode(true));
  content.querySelector('.memory-return')?.remove();
  dialog.showModal();
  requestAnimationFrame(() => dialog.classList.add('is-opening'));
}

function closeMemoryDialog() {
  const dialog = document.getElementById('memory-dialog');
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  const card = window.activeMemoryCard;
  /* Close both layers in the same frame: the card and window are one interaction. */
  dialog.classList.remove('is-opening', 'is-closing');
  dialog.close();
  card?.classList.remove('memory-card-active');
  card?.setAttribute('aria-pressed', 'false');
  card?.focus();
  window.activeMemoryCard = null;
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMemoryDialog();
});

function initialiseSectionNavigation() {
  const links = [...document.querySelectorAll('a[href^="#"]')];
  const sections = [...document.querySelectorAll('.page-section')];
  const setActive = id => links.forEach(link => {
    if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: '-24% 0px -56%', threshold: [0, 0.15, 0.4] });
  sections.forEach(section => observer.observe(section));
}

function initialiseFloatingDock() {
  const dock = document.querySelector('.floating-dock');
  if (!dock || reduceMotion) return;
  const items = [...dock.querySelectorAll('[data-dock-item]')];
  dock.addEventListener('pointermove', event => items.forEach(item => {
    const bounds = item.getBoundingClientRect();
    const distance = Math.abs(event.clientY - (bounds.top + bounds.height / 2));
    const scale = 1 + Math.max(0, 0.42 * (1 - distance / 92));
    item.style.setProperty('--dock-scale', scale.toFixed(3));
  }));
  dock.addEventListener('pointerleave', () => items.forEach(item => item.style.removeProperty('--dock-scale')));
}

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  initialiseInteractiveContent();
  initialiseSectionNavigation();
  initialiseFloatingDock();
});
