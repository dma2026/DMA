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

// One component owns framing. Its measured Grid cells, rather than a list of
// screen resolutions, define the space available to the hand and the copy.
class AdaptiveHero {
  constructor(root, navigation) {
    this.root = root;
    this.navigation = navigation;
    this.layout = root.querySelector('.hero-layout');
    this.action = root.querySelector('.hero-action-space');
    this.copy = root.querySelector('.hero-copy');
    this.video = root.querySelector('video');
    this.frame = 0;
    // A conservative envelope of the reviewed montage's hand/tool interaction.
    // This is fixed composition guidance, not per-frame object tracking.
    this.subject = { x: .08, y: .14, width: .36, height: .69 };
    this.observer = new ResizeObserver(() => this.schedule());
    [root, navigation, this.layout, this.action, this.copy].filter(Boolean)
      .forEach(element => this.observer.observe(element));
    this.video.addEventListener('loadedmetadata', () => this.schedule());
    this.schedule();
  }
  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  }
  set(name, value) {
    const pixels = `${Math.round(value * 100) / 100}px`;
    if (this.root.style.getPropertyValue(name) !== pixels) this.root.style.setProperty(name, pixels);
  }
  update() {
    this.set('--hero-header', this.navigation?.getBoundingClientRect().height ?? 88);
    const bounds = this.root.getBoundingClientRect();
    const reserved = this.action.getBoundingClientRect();
    const copy = this.copy.getBoundingClientRect();
    const stacked = getComputedStyle(this.layout).getPropertyValue('--hero-flow').trim() === 'stacked';
    const sourceWidth = this.video.videoWidth || 1920;
    const sourceHeight = this.video.videoHeight || 1080;
    const safeWidth = Math.max(1, reserved.width - 32);
    const safeHeight = Math.max(1, reserved.height - (stacked ? 86 : 32));
    const scale = Math.min(safeWidth / (this.subject.width * sourceWidth), safeHeight / (this.subject.height * sourceHeight));
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const x = Math.min(0, reserved.left - bounds.left + 16 + (safeWidth - this.subject.width * width) / 2 - this.subject.x * width);
    const y = reserved.top - bounds.top + 16 - this.subject.y * height;
    const subjectRight = x + (this.subject.x + this.subject.width) * width;
    const subjectBottom = y + (this.subject.y + this.subject.height) * height;
    this.set('--scene-width', width);
    this.set('--scene-height', height);
    this.set('--scene-x', x);
    this.set('--scene-y', y);
    const shadeStart = subjectRight + 12;
    const shadeEnd = Math.max(shadeStart + 32, Math.min(bounds.width, x + width));
    this.set('--shade-start', shadeStart);
    this.set('--shade-solid', Math.min(shadeEnd - 1, Math.max(shadeStart + 24, copy.left - bounds.left - 8)));
    this.set('--shade-end', shadeEnd);
    this.set('--shade-bottom-start', Math.min(bounds.height - 1, subjectBottom + 12));
    this.set('--shade-bottom-end', bounds.height);
    const fadeEnd = Math.min(y + height, copy.top - bounds.top - 12);
    this.set('--stack-fade-start', Math.min(fadeEnd - 24, Math.max(subjectBottom + 8, fadeEnd - 110)));
    this.set('--stack-fade-end', fadeEnd);
    this.root.dataset.heroLayout = stacked ? 'stacked' : 'overlay';
  }
}
if ('ResizeObserver' in window) {
  document.querySelectorAll('.masthead').forEach(root => new AdaptiveHero(root, header));
}

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
  // The distributed files have no audio track; keep every player silent as well.
  const keepSilent = () => {
    if (!video.muted) video.muted = true;
    if (video.volume !== 0) video.volume = 0;
  };
  video.defaultMuted = true;
  keepSilent();
  video.addEventListener('volumechange', keepSilent);
  video.addEventListener('play', () => {
    keepSilent();
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
