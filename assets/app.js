// Theme preferences stay in this browser; no visitor data is transmitted.
const themeToggle = document.querySelector('.theme-toggle');
const themes = ['system', 'light', 'dark'];
let activeTheme = 'system';
try {
  const saved = localStorage.getItem('dma-theme');
  if (themes.includes(saved)) activeTheme = saved;
} catch {}
function applyTheme(theme, persist = false) {
  activeTheme = theme;
  document.documentElement.dataset.theme = theme;
  const next = themes[(themes.indexOf(theme) + 1) % themes.length];
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', `Theme: ${theme}. Switch to ${next} theme.`);
    themeToggle.title = `Theme: ${theme}`;
    themeToggle.querySelector('.theme-icon').textContent = { system: '◐', light: '☀', dark: '☾' }[theme];
    themeToggle.querySelector('.theme-label').textContent = { system: 'Auto', light: 'Light', dark: 'Dark' }[theme];
  }
  if (persist) {
    try { localStorage.setItem('dma-theme', theme); } catch {}
  }
}
applyTheme(activeTheme);
themeToggle?.addEventListener('click', () => applyTheme(themes[(themes.indexOf(activeTheme) + 1) % themes.length], true));

// Only the overview autoplays. All demonstration clips remain visitor controlled.
const videos = [...document.querySelectorAll('video')];
const hero = document.querySelector('#hero-video');
const filmToggle = document.querySelector('.hero-toggle');
const header = document.querySelector('.header');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateFilmControl() {
  if (!hero || !filmToggle) return;
  const playing = !hero.paused && !hero.ended;
  filmToggle.setAttribute('aria-label', playing ? 'Pause overview film' : 'Play overview film');
  filmToggle.querySelector('.toggle-label').textContent = playing ? 'Pause film' : 'Play film';
  filmToggle.querySelector('.toggle-symbol').textContent = playing ? 'Ⅱ' : '▶';
}
if (reducedMotion.matches && hero) {
  hero.autoplay = false;
  hero.removeAttribute('autoplay');
  hero.pause();
}
reducedMotion.addEventListener('change', event => {
  if (event.matches && hero) hero.pause();
});
filmToggle?.addEventListener('click', () => {
  if (hero.paused) hero.play().catch(updateFilmControl);
  else hero.pause();
});
for (const video of videos) {
  video.addEventListener('play', () => {
    for (const other of videos) if (other !== video) other.pause();
    updateFilmControl();
  });
  video.addEventListener('pause', updateFilmControl);
  video.addEventListener('error', () => {
    video.dataset.error = 'true';
    const message = document.createElement('p');
    message.className = 'media-error';
    message.textContent = 'This video could not be loaded. Please reload the page.';
    video.parentElement.append(message);
  }, { once: true });
}
updateFilmControl();
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) if (!isIntersecting) target.pause();
  }, { threshold: 0.05 });
  videos.forEach(video => videoObserver.observe(video));
  if (!reducedMotion.matches) {
    document.querySelectorAll('.demo').forEach(node => node.classList.add('reveal'));
    const revealObserver = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) {
          target.classList.add('is-visible');
          revealObserver.unobserve(target);
        }
      }
    }, { threshold: 0.06 });
    document.documentElement.classList.add('motion-ready');
    document.querySelectorAll('.reveal').forEach(node => revealObserver.observe(node));
  }
}
const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) videos.forEach(video => video.pause());
});
