// Shared timing for CSS state changes and input feedback.
const siteGsap = window.gsap;
const siteMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const siteMotionEnabled = () => Boolean(siteGsap && !siteMotionPreference.matches);
const segmentedButtons = '.seg > button,.rx-studies > button,.rx-options > button';
const segmentedIndicators = new Map();
const segmentedResize = siteGsap && new ResizeObserver(entries => {
  for (const { target } of entries) syncSegmentedIndicator(target);
});

function syncSegmentedIndicator(group, animate = false) {
  if (!siteGsap || !group) return;
  const selection = group.querySelector(':scope > button:is([aria-selected=true],[aria-pressed=true])');
  if (!selection) return;

  let state = segmentedIndicators.get(group);
  if (!state) {
    const indicator = document.createElement('span');
    indicator.className = 'segment-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    group.append(indicator);
    state = { indicator, position: null, tween: null };
    segmentedIndicators.set(group, state);
    segmentedResize.observe(group);
  }
  const bounds = selection.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const frame = group.getBoundingClientRect();
  const position = {
    x: bounds.left - frame.left - group.clientLeft,
    y: bounds.top - frame.top - group.clientTop,
    width: bounds.width,
    height: bounds.height,
  };
  if (state.position && Object.keys(position).every(key => Math.abs(state.position[key] - position[key]) < .1)) return;
  const moving = state.position && animate && siteMotionEnabled();
  state.position = position;
  state.tween?.kill();
  if (moving) {
    state.tween = siteGsap.to(state.indicator, { ...position, duration: .32, ease: 'power3.out' });
  } else {
    siteGsap.set(state.indicator, position);
  }
  group.classList.add('has-segment-indicator');
}

function removeSegmentedIndicator(group) {
  const state = segmentedIndicators.get(group);
  if (!state) return;
  state.tween?.kill();
  segmentedResize.unobserve(group);
  segmentedIndicators.delete(group);
}

siteMotionPreference.addEventListener('change', () => {
  if (siteMotionPreference.matches) {
    for (const { tween } of segmentedIndicators.values()) tween?.progress(1);
  }
});

siteGsap?.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  const root = document.documentElement;
  const actions = 'button,.site-header a,.chapter-links a,.rx-method a,.footer a,.hero-author-list a';
  const transitions = new Map();
  const hovering = new Set();
  const pressing = new Map();
  const releasing = new Set();
  const controller = new AbortController();
  let scrollTween;

  function driveTransition(event) {
    const { target, propertyName, pseudoElement } = event;
    const transition = target.getAnimations?.().find(candidate =>
      candidate.transitionProperty === propertyName &&
      (candidate.effect?.pseudoElement || '') === (pseudoElement || ''));
    if (!transition || transitions.has(transition)) return;
    const { duration, delay, endTime } = transition.effect.getComputedTiming();
    if (!Number.isFinite(endTime) || duration <= 1 || delay || propertyName === 'visibility') return;

    // CSS supplies the two visual states, including grid tracks and pseudo-elements.
    // Pause native playback so GSAP alone advances the transition.
    const position = { time: Math.max(0, Number(transition.currentTime) || 0) };
    if (position.time >= endTime) return;
    transition.pause();
    transition.currentTime = position.time;
    const cleanup = () => {
      transitions.delete(transition);
      transition.removeEventListener('cancel', cancel);
    };
    const cancel = () => {
      tween.kill();
      cleanup();
    };
    const tween = siteGsap.to(position, {
      time: endTime,
      duration: (target.matches(actions) && !target.matches('.wordmark') && propertyName !== 'flex-grow')
        ? .2 * (1 - position.time / endTime) : (endTime - position.time) / 1000,
      ease: 'power2.out',
      onUpdate: () => { if (transition.playState !== 'idle') transition.currentTime = position.time; },
      onComplete: () => {
        cleanup();
        if (transition.playState !== 'idle') transition.finish();
      },
    });
    transitions.set(transition, cancel);
    transition.addEventListener('cancel', cancel, { once: true });
  }

  function control(event) {
    const target = event.target.closest?.(actions);
    return target && !target.matches(`:disabled,[aria-disabled=true],${segmentedButtons}`) ? target : null;
  }
  function hover(event, entered) {
    if (event.pointerType !== 'mouse') return;
    const target = control(event);
    if (!target || target.matches('.sim-cells button,.mixbar button') || target.contains(event.relatedTarget)) return;
    if (!target.style.getPropertyValue('--control-y')) target.style.setProperty('--control-y', '0px');
    if (entered) {
      for (const previous of hovering) if (!previous.isConnected) hovering.delete(previous);
      hovering.add(target);
    }
    siteGsap.to(target, {
      '--control-y': entered ? '-1px' : '0px', duration: .2, ease: 'power2.out', overwrite: 'auto',
      onComplete: () => {
        if (!entered) {
          target.style.removeProperty('--control-y');
          hovering.delete(target);
        }
      },
    });
  }
  function press(target, key) {
    release(key);
    pressing.set(key, target);
    releasing.delete(target);
    if (!target.style.getPropertyValue('--control-scale')) target.style.setProperty('--control-scale', '1');
    siteGsap.to(target, { '--control-scale': .975, duration: .1, ease: 'power2.out', overwrite: 'auto' });
  }
  function release(key) {
    const target = pressing.get(key);
    if (!target) return;
    pressing.delete(key);
    releasing.add(target);
    siteGsap.to(target, {
      '--control-scale': 1, duration: .17, ease: 'power2.out', overwrite: 'auto', clearProps: '--control-scale',
      onComplete: () => releasing.delete(target),
    });
  }

  function navigate(event) {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('.site-header a[href^="#"],.chapter-links a[href^="#"],.footer a[href^="#"]');
    const target = link && document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    scrollTween?.kill();
    if (link.hash !== location.hash) history.pushState(history.state, '', link.hash);
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const top = target.getBoundingClientRect().top + scrollY - padding;
    const y = Math.min(root.scrollHeight - innerHeight, Math.max(0, top));
    const position = { y: scrollY };
    scrollTween = siteGsap.to(position, { y, duration: .58, ease: 'power2.inOut',
      onUpdate: () => scrollTo({ top: position.y, behavior: 'instant' }),
    });
  }
  const interruptScroll = () => scrollTween?.kill();

  const listen = (type, callback) => document.addEventListener(type, callback, { capture: true, signal: controller.signal });
  if (typeof CSSTransition !== 'undefined') {
    root.classList.add('gsap-transitions');
    listen('transitionrun', driveTransition);
  }
  listen('pointerover', event => hover(event, true));
  listen('pointerout', event => hover(event, false));
  listen('pointerdown', event => {
    const target = control(event);
    if (target && event.button === 0) press(target, event.pointerId);
  });
  listen('pointerup', event => release(event.pointerId));
  listen('pointercancel', event => release(event.pointerId));
  document.addEventListener('click', navigate, { signal: controller.signal });
  window.addEventListener('wheel', interruptScroll, { passive: true, signal: controller.signal });
  window.addEventListener('touchstart', interruptScroll, { passive: true, signal: controller.signal });
  window.addEventListener('popstate', interruptScroll, { signal: controller.signal });
  listen('keydown', event => {
    const target = control(event);
    if (target && !event.repeat && (event.key === 'Enter' || (event.key === ' ' && target.matches('button')))) {
      press(target, event.key);
    }
  });
  listen('keyup', event => release(event.key));
  listen('focusout', () => { release(' '); release('Enter'); });
  window.addEventListener('blur', () => {
    for (const key of pressing.keys()) release(key);
  }, { signal: controller.signal });

  return () => {
    controller.abort();
    interruptScroll();
    root.classList.remove('gsap-transitions');
    for (const [transition, cancel] of transitions) {
      cancel();
      if (transition.playState !== 'idle') transition.finish();
    }
    for (const target of new Set([...hovering, ...pressing.values(), ...releasing])) {
      siteGsap.killTweensOf(target, '--control-scale,--control-y');
      target.style.removeProperty('--control-scale');
      target.style.removeProperty('--control-y');
    }
  };
});
