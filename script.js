const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}));document.querySelector('#contact-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('.form-message').textContent='فرم آماده است؛ برای ارسال درخواست، اتصال به سامانه یا راه ارتباطی آکادمی باید تنظیم شود.'});

// The local film is paused: the scroll position is its playback clock.
const track = document.querySelector('.hero-scroll-track');
const video = document.querySelector('.hero-video');
const counter = document.querySelector('.scroll-percent');
const hero = document.querySelector('.hero');
const titles = [...document.querySelectorAll('.hero-title')];
const indicator = document.querySelector('.hero-scroll');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let targetTime = 0;
let scheduled = false;

const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function renderHero() {
  scheduled = false;
  if (reduceMotion.matches) {
    hero.style.removeProperty('--hero-scale');
    hero.style.removeProperty('--hero-pan-x');
    hero.style.removeProperty('--hero-pan-y');
    titles.forEach((title, index) => {
      title.style.removeProperty('--reveal');
      title.classList.toggle('is-active', index === 0);
      title.setAttribute('aria-hidden', String(index !== 0));
    });
    return;
  }

  const distance = Math.max(1, track.offsetHeight - hero.offsetHeight);
  const progress = clamp(-track.getBoundingClientRect().top / distance);
  const camera = smooth(progress);
  hero.style.setProperty('--hero-scale', (1.08 + 0.22 * camera).toFixed(3));
  hero.style.setProperty('--hero-pan-x', (3 - 6 * camera).toFixed(2) + '%');
  hero.style.setProperty('--hero-pan-y', (-1 + 2 * camera).toFixed(2) + '%');

  // Each title opens, holds, and closes as the user scrolls in either direction.
  const reveals = [
    1 - smooth((progress - 0.19) / 0.11),
    smooth((progress - 0.24) / 0.11) * (1 - smooth((progress - 0.56) / 0.11)),
    smooth((progress - 0.61) / 0.11)
  ];
  const active = reveals.indexOf(Math.max(...reveals));
  titles.forEach((title, index) => {
    title.style.setProperty('--reveal', reveals[index].toFixed(3));
    title.classList.toggle('is-active', index === active);
    title.setAttribute('aria-hidden', String(index !== active));
  });
  counter.textContent = String(Math.round(progress * 100)).padStart(2, '0');
  indicator.style.setProperty('--progress', progress);
  if (Number.isFinite(video.duration) && video.duration > 0) {
    targetTime = progress * Math.max(0, video.duration - 0.04);
    if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.04) {
      try { video.currentTime = targetTime; } catch (_) { /* Show the poster if seeking is unavailable. */ }
    }
  }
}
function scheduleHero() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(renderHero); }
}
video.addEventListener('loadeddata', () => { video.classList.add('is-ready'); scheduleHero(); });
video.addEventListener('loadedmetadata', scheduleHero);
video.addEventListener('seeked', () => { if (Math.abs(video.currentTime - targetTime) > 0.04) scheduleHero(); });
video.addEventListener('error', () => video.classList.remove('is-ready'));
window.addEventListener('scroll', scheduleHero, { passive: true });
window.addEventListener('resize', scheduleHero);
if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', scheduleHero);
else reduceMotion.addListener(scheduleHero);
scheduleHero();
