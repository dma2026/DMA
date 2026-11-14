// Only the overview autoplays. Other clips remain under visitor control.
const videos = [...document.querySelectorAll('video')];
const hero = document.querySelector('#hero-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reducedMotion.matches) {
  hero.autoplay = false;
  hero.pause();
}
for (const video of videos) {
  video.addEventListener('play', () => {
    for (const other of videos) if (other !== video) other.pause();
  });
  video.addEventListener('error', () => {
    video.dataset.error = 'true';
    const message = document.createElement('p');
    message.className = 'media-error';
    message.textContent = 'This video could not be loaded. Please reload the page.';
    video.parentElement.append(message);
  }, { once: true });
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) if (!isIntersecting) target.pause();
  }, { threshold: 0.05 });
  videos.forEach(video => observer.observe(video));
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) videos.forEach(video => video.pause());
});
