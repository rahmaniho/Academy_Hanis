const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}));document.querySelector('#contact-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('.form-message').textContent='فرم آماده است؛ برای ارسال درخواست، اتصال به سامانه یا راه ارتباطی آکادمی باید تنظیم شود.'});

// The clip is paused and scrubbed rather than autoplayed, so scrolling in either
// direction maps to the same frame. Keep the last desired frame while seeking.
const track = document.querySelector('.hero-scroll-track');
const video = document.querySelector('.hero-video');
const counter = document.querySelector('.scroll-percent');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let targetTime = 0, scheduled = false;
function seekHero() {
  scheduled = false;
  if (reduceMotion.matches || !Number.isFinite(video.duration) || video.duration <= 0) return;
  const distance = Math.max(1, track.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / distance));
  targetTime = progress * Math.max(0, video.duration - 0.05);
  counter.textContent = String(Math.round(progress * 100)).padStart(2, '0');
  document.querySelector('.hero-scroll').style.setProperty('--progress', progress);
  if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.035) {
    try { video.currentTime = targetTime; } catch (_) { /* Keep the poster on unsupported browsers. */ }
  }
}
function scheduleHero() { if (!scheduled) { scheduled = true; requestAnimationFrame(seekHero); } }
video.addEventListener('loadeddata', () => { video.classList.add('is-ready'); scheduleHero(); });
video.addEventListener('seeked', () => { if (Math.abs(video.currentTime - targetTime) > 0.035) scheduleHero(); });
video.addEventListener('error', () => { video.classList.remove('is-ready'); });
window.addEventListener('scroll', scheduleHero, { passive: true });
window.addEventListener('resize', scheduleHero);
reduceMotion.addEventListener('change', scheduleHero);
scheduleHero();
