const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
const defaultPageTitle = document.title;

menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? '×' : '☰';
});

nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.textContent = '☰';
}));

document.querySelector('#contact-form').addEventListener('submit', e => {
  e.preventDefault();
  document.querySelector('.form-message').textContent =
    'فرم آماده است؛ برای ارسال درخواست، اتصال به سامانه یا راه ارتباطی آکادمی باید تنظیم شود.';
});

// Pre-select consultation topic when navigating from contextual CTAs.
const interestSelect = document.querySelector('#contact-interest');
document.querySelectorAll('.js-consult-link').forEach(link => {
  link.addEventListener('click', () => {
    const targetInterest = link.dataset.interest;
    if (interestSelect && targetInterest) {
      const opt = [...interestSelect.options].find(o => o.value === targetInterest);
      if (opt) interestSelect.value = targetInterest;
    }
  });
});

// =========================================================================
// 1. Scroll-driven Hero Cinema (assets/InShot_20261030_223328747.mp4)
// =========================================================================
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
const smooth = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

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
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(renderHero);
  }
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

// =========================================================================
// 2. Active Navigation Scroll-Spy
// =========================================================================
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const spySections = navLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

function updateActiveNav() {
  const scrollMid = window.scrollY + window.innerHeight * 0.35;
  let currentId = 'home';
  spySections.forEach(sec => {
    if (sec.offsetTop <= scrollMid) currentId = sec.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// =========================================================================
// 3. Soft & Calm Ambient Background Video in #articles (30% opacity)
// =========================================================================
const articlesSection = document.querySelector('#articles');
const articlesBgVideo = document.querySelector('#articles-bg-video');
const CALM_PLAYBACK_RATE = 0.6;

if (articlesBgVideo && articlesSection) {
  const applyCalmRate = () => {
    try {
      articlesBgVideo.defaultPlaybackRate = CALM_PLAYBACK_RATE;
      articlesBgVideo.playbackRate = CALM_PLAYBACK_RATE;
    } catch (_) { /* Fallback to normal rate if unsupported */ }
  };

  articlesBgVideo.addEventListener('loadedmetadata', applyCalmRate);
  articlesBgVideo.addEventListener('play', applyCalmRate);
  applyCalmRate();

  const syncArticlesBgPlayback = inView => {
    if (reduceMotion.matches) {
      articlesBgVideo.pause();
      return;
    }
    if (inView) {
      applyCalmRate();
      articlesBgVideo.play().catch(() => {});
    } else if (!articlesBgVideo.paused) {
      articlesBgVideo.pause();
    }
  };

  let sectionInView = false;
  if ('IntersectionObserver' in window) {
    const bgObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        sectionInView = entry.isIntersecting;
        syncArticlesBgPlayback(sectionInView);
      });
    }, { rootMargin: '250px 0px', threshold: 0.01 });
    bgObserver.observe(articlesSection);
  } else {
    syncArticlesBgPlayback(true);
  }

  const onMotionPrefChange = () => syncArticlesBgPlayback(sectionInView);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPrefChange);
  else reduceMotion.addListener(onMotionPrefChange);
}

// =========================================================================
// 4. Articles Category Filtering & Persian-Normalized Instant Search
// =========================================================================
const filterChips = [...document.querySelectorAll('.filter-chip')];
const searchInput = document.querySelector('#article-search-input');
const articleItems = [...document.querySelectorAll('.js-article-item')];
const emptyState = document.querySelector('#articles-empty');
const resetBtn = document.querySelector('#articles-reset-btn');
let activeCategory = 'all';

function normalizePersian(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyArticleFilters() {
  const query = normalizePersian(searchInput ? searchInput.value : '');
  let visibleCount = 0;

  articleItems.forEach(item => {
    const matchesCat = activeCategory === 'all' || item.dataset.category === activeCategory;
    const textContent = normalizePersian(item.textContent);
    const matchesQuery = !query || textContent.includes(query);
    const show = matchesCat && matchesQuery;

    item.hidden = !show;
    if (show) visibleCount += 1;
  });

  if (emptyState) emptyState.hidden = visibleCount > 0;
}

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    activeCategory = chip.dataset.filter || 'all';
    filterChips.forEach(c => {
      const isSelected = c === chip;
      c.classList.toggle('is-active', isSelected);
      c.setAttribute('aria-pressed', String(isSelected));
    });
    applyArticleFilters();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', applyArticleFilters);
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    activeCategory = 'all';
    if (searchInput) searchInput.value = '';
    filterChips.forEach(c => {
      const isAll = c.dataset.filter === 'all';
      c.classList.toggle('is-active', isAll);
      c.setAttribute('aria-pressed', String(isAll));
    });
    applyArticleFilters();
  });
}

// =========================================================================
// 5. Editorial Article Reader Modal + Deep-Linking (#article-...)
// =========================================================================
const modal = document.querySelector('#article-modal');
const modalScroller = document.querySelector('#article-modal-scroller');
const modalProgressBar = document.querySelector('#reader-progress-bar');
const modalCategory = document.querySelector('#modal-article-category');
const modalReadtime = document.querySelector('#modal-article-readtime');
const modalDate = document.querySelector('#modal-article-date');
const modalTitle = document.querySelector('#modal-article-title');
const modalToc = document.querySelector('#modal-toc');
const modalBody = document.querySelector('#modal-article-body');
const modalMedia = document.querySelector('#modal-media-container');
const modalCloseBtn = document.querySelector('#modal-close-btn');
const modalCopyBtn = document.querySelector('#modal-copy-link');
const modalConsultCta = document.querySelector('#modal-consult-cta');
const modalPrevBtn = document.querySelector('#modal-prev-article');
const modalNextBtn = document.querySelector('#modal-next-article');

let currentArticleId = null;
let lastTriggerElement = null;

function updateReaderProgress() {
  if (!modalScroller || !modalProgressBar) return;
  const maxScroll = Math.max(1, modalScroller.scrollHeight - modalScroller.clientHeight);
  const pct = (modalScroller.scrollTop / maxScroll) * 100;
  modalProgressBar.style.width = `${Math.min(100, Math.max(0, pct)).toFixed(1)}%`;
}

function closeArticleModal(restoreHash = true) {
  if (!modal || !modal.open) return;
  modal.close();
  document.body.style.overflow = '';
  document.title = defaultPageTitle;
  currentArticleId = null;

  if (restoreHash && window.location.hash.startsWith('#article-')) {
    history.replaceState(null, '', '#articles');
  }
  if (lastTriggerElement && typeof lastTriggerElement.focus === 'function') {
    lastTriggerElement.focus({ preventScroll: true });
  }
}

function openArticleById(articleId, updateUrl = true) {
  const articleEl = document.getElementById(articleId);
  if (!articleEl || !modal) return;

  currentArticleId = articleId;
  const headlineEl = articleEl.querySelector('[itemprop="headline"]');
  const sectionEl = articleEl.querySelector('[itemprop="articleSection"]');
  const dateEl = articleEl.querySelector('time[itemprop="datePublished"]');
  const fullBodyEl = articleEl.querySelector('.article-full-body');
  const readTimeEl = articleEl.querySelector('.read-pill') ||
    [...articleEl.querySelectorAll('.article-meta-bar span')].find(s => s.textContent.includes('مطالعه'));

  const headline = headlineEl ? headlineEl.textContent.trim() : '';
  if (modalTitle) modalTitle.textContent = headline;
  if (modalCategory) modalCategory.textContent = sectionEl ? sectionEl.textContent.trim() : 'مقاله تخصصی';
  if (modalReadtime) modalReadtime.textContent = readTimeEl ? readTimeEl.textContent.trim() : '۶ دقیقه مطالعه';
  if (modalDate && dateEl) {
    modalDate.textContent = `تاریخ انتشار: ${dateEl.textContent.trim()}`;
    modalDate.setAttribute('datetime', dateEl.getAttribute('datetime') || '');
  }

  // Render Editorial Cover inside Reader Sidebar
  if (modalMedia) {
    modalMedia.innerHTML = '';
    const imageSrc = articleEl.dataset.image;
    if (imageSrc) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-image-wrap';
      const img = document.createElement('img');
      const cardImg = articleEl.querySelector('img[itemprop="image"]');
      img.src = imageSrc;
      img.alt = cardImg ? cardImg.alt : headline;
      wrap.appendChild(img);
      modalMedia.appendChild(wrap);
    }
  }

  // Populate Full Body & Auto-Build Table of Contents
  if (modalBody && fullBodyEl) {
    modalBody.innerHTML = fullBodyEl.innerHTML;
    const headings = [...modalBody.querySelectorAll('h4')];
    if (modalToc) {
      if (headings.length > 0) {
        modalToc.hidden = false;
        modalToc.innerHTML = '<strong>فهرست سرفصل‌های این مقاله:</strong>';
        const ol = document.createElement('ol');
        headings.forEach((h, idx) => {
          const secId = `reader-sec-${idx + 1}`;
          h.id = secId;
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${secId}`;
          a.textContent = h.textContent;
          a.addEventListener('click', ev => {
            ev.preventDefault();
            h.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
          });
          li.appendChild(a);
          ol.appendChild(li);
        });
        modalToc.appendChild(ol);
      } else {
        modalToc.hidden = true;
      }
    }

    // Wire internal links inside modal prose
    modalBody.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', ev => {
        const href = link.getAttribute('href') || '';
        if (link.dataset.target || href.startsWith('#article-')) {
          ev.preventDefault();
          openArticleById(link.dataset.target || href.slice(1));
        } else {
          closeArticleModal(false);
        }
      });
    });
  }

  // Prev / Next Article Navigation
  const idx = articleItems.findIndex(el => el.id === articleId);
  if (idx !== -1 && articleItems.length > 1) {
    const prevEl = articleItems[(idx - 1 + articleItems.length) % articleItems.length];
    const nextEl = articleItems[(idx + 1) % articleItems.length];
    if (modalPrevBtn && prevEl) {
      const prevTitle = prevEl.querySelector('[itemprop="headline"]').textContent.trim();
      modalPrevBtn.innerHTML = `<small>→ مقاله قبلی</small><span>${prevTitle}</span>`;
      modalPrevBtn.onclick = () => openArticleById(prevEl.id);
    }
    if (modalNextBtn && nextEl) {
      const nextTitle = nextEl.querySelector('[itemprop="headline"]').textContent.trim();
      modalNextBtn.innerHTML = `<small>مقاله بعدی ←</small><span>${nextTitle}</span>`;
      modalNextBtn.onclick = () => openArticleById(nextEl.id);
    }
  }

  if (modalConsultCta) {
    modalConsultCta.onclick = () => {
      if (interestSelect) {
        interestSelect.value = articleEl.dataset.category === 'career'
          ? 'مشاوره انتخاب لاین شغلی'
          : 'دوره‌های آموزشی (میکاپ، ناخن، مو)';
      }
      closeArticleModal(false);
    };
  }

  if (!modal.open) {
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  }
  document.body.style.overflow = 'hidden';
  if (modalScroller) modalScroller.scrollTop = 0;
  updateReaderProgress();

  document.title = `${headline} | مجله آکادمی زیبایی هانیس`;
  if (updateUrl) {
    history.replaceState(null, '', `#${articleId}`);
  }
}

document.querySelectorAll('.js-open-article').forEach(trigger => {
  trigger.addEventListener('click', ev => {
    const targetId = trigger.dataset.target || (trigger.getAttribute('href') || '').replace(/^#/, '');
    if (targetId && document.getElementById(targetId)) {
      ev.preventDefault();
      lastTriggerElement = trigger;
      openArticleById(targetId);
    }
  });
});

if (modalScroller) {
  modalScroller.addEventListener('scroll', updateReaderProgress, { passive: true });
}
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', () => closeArticleModal(true));
}
if (modal) {
  modal.addEventListener('click', ev => {
    if (ev.target === modal) closeArticleModal(true);
  });
  modal.addEventListener('close', () => {
    document.body.style.overflow = '';
    document.title = defaultPageTitle;
  });
}

if (modalCopyBtn) {
  modalCopyBtn.addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${currentArticleId || 'articles'}`;
    const labelSpan = modalCopyBtn.querySelector('span');
    const done = () => {
      if (!labelSpan) return;
      labelSpan.textContent = 'کپی شد ✓';
      setTimeout(() => { labelSpan.textContent = 'کپی لینک'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(done).catch(done);
    } else {
      done();
    }
  });
}

// Open article automatically if page loads or navigates with #article-... hash
function checkArticleHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('article-') && document.getElementById(hash)) {
    openArticleById(hash, false);
  }
}
window.addEventListener('hashchange', checkArticleHash);
checkArticleHash();
