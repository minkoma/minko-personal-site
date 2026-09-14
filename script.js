const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
const copyButton = document.getElementById('copy-email');
if (copyButton) copyButton.addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText('minkoma2002@gmail.com');
    status.textContent = 'Email copied.';
  } catch {
    status.textContent = 'Please copy the email address above.';
  }
});

// Vendored PhotoSwipe also works when this site is opened as a local file.
if (window.PhotoSwipeLightbox && document.querySelector('.photo-gallery')) {
  const gallery = new PhotoSwipeLightbox({
    gallery: '.photo-gallery', children: 'a', pswpModule: PhotoSwipe,
    showHideAnimationType: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'zoom'
  });
  gallery.init();
}

document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('click', () => card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true')));
});

// Keep local-file navigation usable even when no preview server is running.
if (location.protocol === 'file:' && document.querySelector('iframe[src*="youtube"]')) {
  const notice = document.createElement('p');
  notice.className = 'playback-note';
  notice.textContent = 'For embedded video playback, start Preview.command in the website folder. Original video links also work below.';
  document.querySelector('#videos').prepend(notice);
}
if (/^https?:$/.test(location.protocol)) {
  document.querySelectorAll('iframe[src*="youtube"]').forEach(frame => {
    const url = new URL(frame.src);
    url.searchParams.set('origin', location.origin);
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = url.href;
  });
}
