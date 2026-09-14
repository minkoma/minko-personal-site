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

async function loadOnePageSections() {
  const sections = [...document.querySelectorAll('[data-page]')];
  await Promise.all(sections.map(async section => {
    try {
      const response = await fetch(section.dataset.page);
      if (!response.ok) throw new Error(`Could not load ${section.dataset.page}`);
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const sourceMain = page.querySelector('main');
      if (!sourceMain) throw new Error(`No main content in ${section.dataset.page}`);
      const fragment = section.dataset.fragment ? sourceMain.querySelector(`#${section.dataset.fragment}`) : null;
      section.innerHTML = fragment ? fragment.innerHTML : sourceMain.innerHTML;
      section.querySelector(':scope > h1')?.remove();
      section.querySelector(':scope > .portfolio-jump')?.remove();
      section.querySelector(':scope > h2')?.remove();
      if (section.id === 'contact') {
        const contactPanel = section.querySelector('.contact-panel');
        contactPanel?.querySelector('h1')?.remove();
        contactPanel?.classList.remove('panel', 'contact-panel');
        contactPanel?.classList.add('contact-content');
        contactPanel?.insertAdjacentHTML('beforeend', '<div class="contact-social" aria-label="Social links"><a href="https://www.linkedin.com/in/minko-m-281519255/" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">in</span> LinkedIn</a><a href="https://www.instagram.com/miankuo/" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">◎</span> Instagram</a><a href="mailto:minkoma2002@gmail.com"><span aria-hidden="true">@</span> Email</a></div>');
      }
      section.insertAdjacentHTML('afterbegin', `<header class="section-heading"><p>${section.id === 'portfolio' ? 'Selected work' : section.id === 'experience' ? 'Professional path' : section.id === 'contact' ? 'Let’s connect' : 'A little more'}</p><h1>${section.dataset.sectionLabel}</h1></header>`);
      section.removeAttribute('aria-busy');
      initialiseInteractiveContent(section);
    } catch (error) {
      section.innerHTML = '<p class="section-loading">This section could not load. Please refresh the page.</p>';
      console.error(error);
    }
  }));
}

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

document.addEventListener('DOMContentLoaded', async () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  initialiseInteractiveContent();
  initialiseSectionNavigation();
  initialiseFloatingDock();
  await loadOnePageSections();
});
