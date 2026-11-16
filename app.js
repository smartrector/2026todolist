document.documentElement.classList.add('js');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const opened = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(opened));
  navigation.classList.toggle('is-open', opened);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});

const form = document.querySelector('#inquiry-form');
form.querySelector('button').disabled = false;
const status = document.querySelector('#form-status');
const fallback = document.querySelector('.copy-fallback');
const copyText = document.querySelector('#copy-text');
document.querySelectorAll('[data-inquiry]').forEach(link => {
  link.addEventListener('click', () => {
    const radio = form.elements.type;
    radio.value = link.dataset.inquiry;
    status.textContent = '';
  });
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  const types = { project: '프로젝트 문의', consult: '상담', career: '채용' };
  const data = new FormData(form);
  const text = `[거축 ${types[data.get('type')]}]\n이름: ${data.get('name').trim()}\n이메일: ${data.get('email').trim()}\n\n${data.get('message').trim()}`;
  if (!data.get('name').trim() || !data.get('message').trim()) {
    status.textContent = '이름과 이야기에 공백 이외의 내용을 입력해 주세요.';
    return;
  }
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  fallback.hidden = true;
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = '문의 내용을 복사했습니다. 아직 거축에 전송되지는 않았습니다.';
  } catch {
    copyText.value = text;
    fallback.hidden = false;
    copyText.focus();
    copyText.select();
    status.textContent = '자동 복사를 사용할 수 없습니다. 아래 내용을 직접 복사해 주세요.';
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});

// If Swiper's CDN is unavailable, the first image and hero content stay visible.
const heroSliderElement = document.querySelector('.architecture-swiper');
if (heroSliderElement && typeof window.Swiper === 'function') {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const heroStage = heroSliderElement.closest('.hero-stage');
  const controls = heroStage.querySelector('.hero-controls');
  const toggle = controls.querySelector('.hero-autoplay');
  let paused = motionPreference.matches;
  let inView = true;
  const slider = new window.Swiper(heroSliderElement, {
    loop: true,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: motionPreference.matches ? 0 : 850,
    autoplay: { delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true },
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: { prevEl: controls.querySelector('.hero-prev'), nextEl: controls.querySelector('.hero-next') },
    pagination: { el: controls.querySelector('.hero-pagination'), type: 'fraction' },
    a11y: {
      enabled: true,
      prevSlideMessage: '이전 건축 이미지',
      nextSlideMessage: '다음 건축 이미지',
      slideLabelMessage: '{{slidesLength}}장 중 {{index}}번째 건축 이미지',
      containerMessage: '건축 이미지 슬라이드',
    },
  });
  controls.hidden = false;
  function syncPlayback() {
    const canPlay = !paused && inView && !document.hidden && !heroStage.contains(document.activeElement);
    if (canPlay) slider.autoplay.start();
    else slider.autoplay.stop();
    toggle.textContent = paused ? '자동 재생' : '일시정지';
    toggle.setAttribute('aria-label', paused ? '슬라이드 자동 재생 시작' : '슬라이드 자동 재생 일시정지');
    toggle.setAttribute('aria-pressed', String(!paused));
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    // The explicit play control is allowed to resume while it has focus.
    syncPlayback();
    if (!paused && inView && !document.hidden) slider.autoplay.start();
  });
  heroStage.addEventListener('focusin', () => slider.autoplay.stop());
  heroStage.addEventListener('focusout', () => requestAnimationFrame(syncPlayback));
  document.addEventListener('visibilitychange', syncPlayback);
  motionPreference.addEventListener('change', event => {
    slider.params.speed = event.matches ? 0 : 850;
    if (event.matches) paused = true;
    syncPlayback();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.1 }).observe(heroStage);
  }
  syncPlayback();
}
