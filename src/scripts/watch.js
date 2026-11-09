const trigger = document.querySelector('.watch-aisle');
const dialog = document.querySelector('#aisle-film');
if (trigger && dialog) {
  const video = dialog.querySelector('video');
  trigger.addEventListener('click', () => {
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    dialog.showModal();
    video.play().catch(() => { /* Native controls remain available. */ });
  });
  dialog.querySelector('.aisle-film-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    trigger.focus({ preventScroll: true });
  });
  document.addEventListener('aisle:viewchange', () => { if (dialog.open) dialog.close(); });
}
