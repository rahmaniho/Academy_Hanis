/* ==========================================================================
   HANIS BEAUTY ACADEMY — INTERACTIVE ENGINE (Vanilla JS, Zero Dependencies)
   ========================================================================== */
(() => {
  'use strict';

  const basePrefix = document.documentElement.dataset.base || '';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  /* ------------------------------------------------------------------------
     0. Legacy #article-* Hash Redirect to Dedicated SEO Article Pages
     ------------------------------------------------------------------------ */
  const legacyArticleMap = {
    '#article-luxury-nail-art': 'magazine/luxury-nail-art/',
    '#article-velvet-skin-makeup': 'magazine/velvet-skin-makeup/',
    '#article-hair-color-revival': 'magazine/hair-color-revival/',
    '#article-nail-structure-care': 'magazine/nail-structure-care/',
    '#article-beauty-career-roadmap': 'magazine/beauty-career-roadmap/'
  };
  if (window.location.hash && legacyArticleMap[window.location.hash]) {
    window.location.replace(basePrefix + legacyArticleMap[window.location.hash]);
    return;
  }

  /* ------------------------------------------------------------------------
     1. Sticky Header, Mobile Drawer & Active Navigation State
     ------------------------------------------------------------------------ */
  const header = document.querySelector('.header');
  const menuBtn = document.querySelector('.menu');
  const nav = document.querySelector('.header nav');

  const updateHeaderScroll = () => {
    if (!header || header.classList.contains('header-solid')) return;
    header.classList.toggle('is-scrolled', window.scrollY > 36);
  };
  updateHeaderScroll();
  window.addEventListener('scroll', updateHeaderScroll, { passive: true });

  const closeMenu = () => {
    if (!nav || !menuBtn) return;
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  };

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
        menuBtn.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !header.contains(event.target)) {
        closeMenu();
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Subtle One-Time Scroll Reveal
     ------------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach((el) => revealObserver.observe(el));
    }
  }

  /* ------------------------------------------------------------------------
     3. Flagship Hero Scroll Cinema (#home)
     ------------------------------------------------------------------------ */
  const track = document.querySelector('.hero-scroll-track');
  const hero = document.querySelector('.hero');
  const video = document.querySelector('.hero-video');
  const titles = [...document.querySelectorAll('.hero-title')];
  const indexStrong = document.querySelector('.hero-index strong');

  if (track && hero && titles.length) {
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const smoothstep = (edge0, edge1, x) => {
      const t = clamp((x - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    };

    let duration = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let rafId = 0;
    let videoReady = false;
    let videoPrimed = false;

    const primeVideo = () => {
      if (videoPrimed || !video || reducedMotion.matches) return;
      videoPrimed = true;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.then === 'function') {
        playAttempt.then(() => video.pause()).catch(() => {});
      }
    };

    if (video) {
      const markReady = () => {
        duration = Number.isFinite(video.duration) ? video.duration : 0;
        if (duration > 0) {
          videoReady = true;
          video.classList.add('is-ready');
          requestTick();
        }
      };
      video.pause();
      if (video.readyState >= 1) markReady();
      video.addEventListener('loadedmetadata', markReady);
      video.addEventListener('durationchange', markReady);
      video.addEventListener('canplay', markReady, { once: true });
      window.addEventListener('touchstart', primeVideo, { passive: true, once: true });
      window.addEventListener('pointerdown', primeVideo, { passive: true, once: true });
    }

    const readScrollProgress = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = track.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return clamp(-rect.top / scrollable);
    };

    const updateTitles = (progress) => {
      const count = titles.length;
      const scaled = progress * count;
      const activeIndex = Math.min(count - 1, Math.floor(scaled));

      titles.forEach((title, idx) => {
        const local = scaled - idx;
        let reveal = 0;
        if (idx === activeIndex) {
          const enter = idx === 0 ? 1 : smoothstep(0, 0.28, local);
          const exit = idx === count - 1 ? 1 : 1 - smoothstep(0.74, 1, local);
          reveal = Math.min(enter, exit);
        }
        title.classList.toggle('is-active', idx === activeIndex);
        title.style.setProperty('--reveal', reveal.toFixed(3));
      });

      if (indexStrong) {
        indexStrong.textContent = String(activeIndex + 1).padStart(2, '0');
      }
    };

    const renderHero = () => {
      rafId = 0;
      const delta = targetProgress - currentProgress;
      currentProgress = Math.abs(delta) < 0.0008 ? targetProgress : currentProgress + delta * 0.14;

      const scale = 1.08 - currentProgress * 0.06;
      const panX = 3 - currentProgress * 4;
      const panY = -1 + currentProgress * 2.5;
      hero.style.setProperty('--progress', currentProgress.toFixed(4));
      hero.style.setProperty('--hero-scale', scale.toFixed(4));
      hero.style.setProperty('--hero-pan-x', `${panX.toFixed(2)}%`);
      hero.style.setProperty('--hero-pan-y', `${panY.toFixed(2)}%`);

      updateTitles(currentProgress);

      if (videoReady && duration > 0 && video) {
        const targetTime = clamp(currentProgress, 0, 0.999) * duration;
        if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.03) {
          try {
            video.currentTime = targetTime;
          } catch (_) {
            /* ignore transient Safari seek guard */
          }
        }
      }

      if (Math.abs(targetProgress - currentProgress) >= 0.0008) {
        rafId = window.requestAnimationFrame(renderHero);
      }
    };

    function requestTick() {
      if (reducedMotion.matches) {
        titles.forEach((title, idx) => {
          title.classList.toggle('is-active', idx === 0);
          title.style.setProperty('--reveal', idx === 0 ? '1' : '0');
        });
        return;
      }
      targetProgress = readScrollProgress();
      if (!rafId) rafId = window.requestAnimationFrame(renderHero);
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    reducedMotion.addEventListener('change', requestTick);
    requestTick();
  }

  /* ------------------------------------------------------------------------
     4. Lazy Ambient Background Videos (#courses 35% & #articles 30%)
     ------------------------------------------------------------------------ */
  const ambientSections = [
    { section: document.querySelector('#courses'), video: document.querySelector('.courses-bg-video') },
    { section: document.querySelector('#articles'), video: document.querySelector('.articles-bg-video') }
  ].filter((item) => item.section && item.video);

  ambientSections.forEach(({ section, video: bgVideo }) => {
    bgVideo.muted = true;
    bgVideo.defaultMuted = true;
    bgVideo.playsInline = true;
    let loadedSource = false;

    const pauseAmbient = () => {
      if (!bgVideo.paused) bgVideo.pause();
    };

    const playAmbient = () => {
      if (reducedMotion.matches || saveData) {
        pauseAmbient();
        return;
      }
      if (!loadedSource) {
        const dataSrc = bgVideo.dataset.src;
        if (dataSrc && !bgVideo.getAttribute('src')) {
          bgVideo.setAttribute('src', dataSrc);
          bgVideo.load();
        }
        loadedSource = true;
      }
      const p = bgVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) playAmbient();
            else pauseAmbient();
          });
        },
        { rootMargin: '320px 0px', threshold: 0.01 }
      );
      io.observe(section);
    } else {
      playAmbient();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseAmbient();
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) pauseAmbient();
    });
  });

  /* ------------------------------------------------------------------------
     5. Animated Portfolio Gallery, Beauty-Line Chapters & Lightbox Viewer
     ------------------------------------------------------------------------ */
  const portfolioChips = [...document.querySelectorAll('.portfolio-chip, [data-line-filter]')];
  const portfolioItems = [...document.querySelectorAll('.portfolio-item, .gallery-work-card')];
  const lineChapters = [...document.querySelectorAll('.gallery-line-chapter')];
  const lightbox = document.getElementById('portfolio-lightbox');

  const triggerCardStagger = (cards) => {
    if (reducedMotion.matches) return;
    cards.forEach((card, i) => {
      card.classList.remove('is-entering');
      card.style.setProperty('--stagger', `${Math.min(i, 11) * 55}ms`);
      void card.offsetWidth;
      card.classList.add('is-entering');
    });
  };

  /* Interactive pointer spotlight & subtle 3D editorial tilt */
  if (!reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.gallery-work-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = x / rect.width - 0.5;
        const py = y / rect.height - 0.5;
        card.style.setProperty('--mx', `${x.toFixed(0)}px`);
        card.style.setProperty('--my', `${y.toFixed(0)}px`);
        card.style.setProperty('--rx', `${(-py * 3.6).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(px * 3.6).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  if (portfolioChips.length && (portfolioItems.length || lineChapters.length)) {
    portfolioChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.portfolioFilter || chip.dataset.lineFilter || 'all';
        portfolioChips.forEach((btn) => {
          const active = btn === chip;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', String(active));
        });

        if (lineChapters.length) {
          lineChapters.forEach((chapter) => {
            const lineKey = chapter.dataset.beautyLine || '';
            chapter.hidden = !(cat === 'all' || lineKey === cat);
          });
          const newlyVisible = portfolioItems.filter((c) => !c.closest('[hidden]'));
          triggerCardStagger(newlyVisible);
        } else {
          const newlyVisible = [];
          portfolioItems.forEach((item) => {
            const cats = (item.dataset.category || '').split(/\s+/);
            const show = cat === 'all' || cats.includes(cat);
            item.hidden = !show;
            if (show) newlyVisible.push(item);
          });
          triggerCardStagger(newlyVisible);
        }
      });
    });
  }

  /* Course Hub Tier Filter (All / Workshop / Comprehensive / VIP) */
  const tierChips = [...document.querySelectorAll('[data-tier-filter]')];
  const tierCards = [...document.querySelectorAll('.pricing-tier-card[data-tier-kind]')];
  if (tierChips.length && tierCards.length) {
    tierChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const kind = chip.dataset.tierFilter || 'all';
        tierChips.forEach((btn) => {
          const active = btn === chip;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', String(active));
        });
        tierCards.forEach((card) => {
          card.hidden = !(kind === 'all' || card.dataset.tierKind === kind);
        });
      });
    });
  }

  if (lightbox && portfolioItems.length) {
    const lbImg = document.getElementById('lightbox-image');
    const lbCat = document.getElementById('lightbox-category');
    const lbTitle = document.getElementById('lightbox-title');
    const lbDesc = document.getElementById('lightbox-desc');
    const lbSpecs = document.getElementById('lightbox-specs');
    const lbCounter = document.getElementById('lightbox-counter');
    const lbCta = document.getElementById('lightbox-cta');
    const lbClose = lightbox.querySelector('.lightbox-close');
    const lbPrev = document.getElementById('lightbox-prev');
    const lbNext = document.getElementById('lightbox-next');

    let visibleTriggers = [];
    let currentIdx = 0;
    let lastFocusedTrigger = null;
    let touchStartX = 0;

    const populateLightbox = (idx) => {
      if (!visibleTriggers.length) return;
      currentIdx = (idx + visibleTriggers.length) % visibleTriggers.length;
      const trigger = visibleTriggers[currentIdx];

      if (lbImg) {
        lbImg.classList.add('is-switching');
        const nextSrc = trigger.dataset.full || trigger.querySelector('img')?.currentSrc || '';
        const applyImg = () => {
          lbImg.src = nextSrc;
          lbImg.alt = trigger.dataset.title || '';
          requestAnimationFrame(() => lbImg.classList.remove('is-switching'));
        };
        if (reducedMotion.matches) applyImg();
        else setTimeout(applyImg, 110);
      }
      if (lbCat) lbCat.textContent = trigger.dataset.catLabel || '';
      if (lbTitle) lbTitle.textContent = trigger.dataset.title || '';
      if (lbDesc) lbDesc.textContent = trigger.dataset.desc || '';
      if (lbCounter) {
        lbCounter.textContent = `${String(currentIdx + 1).padStart(2, '0')} / ${String(visibleTriggers.length).padStart(2, '0')}`;
      }
      if (lbSpecs) {
        lbSpecs.innerHTML = '';
        [trigger.dataset.tech, trigger.dataset.material, trigger.dataset.duration]
          .filter(Boolean)
          .forEach((txt) => {
            const chip = document.createElement('span');
            chip.className = 'lightbox-spec-chip';
            chip.textContent = txt;
            lbSpecs.appendChild(chip);
          });
      }
      if (lbCta && trigger.dataset.link) {
        lbCta.href = trigger.dataset.link;
        lbCta.textContent = trigger.dataset.linkLabel || 'مشاهده بخش مرتبط ←';
      }
    };

    const openLightbox = (trigger) => {
      visibleTriggers = portfolioItems
        .filter((item) => !item.hidden && !item.closest('[hidden]'))
        .map((item) => item.querySelector('.portfolio-trigger, .gallery-work-trigger'))
        .filter(Boolean);
      const startIndex = Math.max(0, visibleTriggers.indexOf(trigger));
      lastFocusedTrigger = trigger;
      populateLightbox(startIndex);
      if (typeof lightbox.showModal === 'function') {
        lightbox.showModal();
      } else {
        lightbox.setAttribute('open', '');
      }
      lbClose?.focus();
    };

    const closeLightbox = () => {
      if (typeof lightbox.close === 'function' && lightbox.open) {
        lightbox.close();
      } else {
        lightbox.removeAttribute('open');
      }
      if (lastFocusedTrigger) lastFocusedTrigger.focus();
    };

    portfolioItems.forEach((item) => {
      const trigger = item.querySelector('.portfolio-trigger, .gallery-work-trigger');
      if (trigger) {
        trigger.addEventListener('click', () => openLightbox(trigger));
      }
    });

    lbClose?.addEventListener('click', closeLightbox);
    lbPrev?.addEventListener('click', () => populateLightbox(currentIdx - 1));
    lbNext?.addEventListener('click', () => populateLightbox(currentIdx + 1));

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches?.[0]?.screenX || 0;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const diff = (e.changedTouches?.[0]?.screenX || 0) - touchStartX;
      if (Math.abs(diff) > 45) {
        populateLightbox(diff > 0 ? currentIdx - 1 : currentIdx + 1);
      }
    }, { passive: true });

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') populateLightbox(currentIdx - 1);
      if (event.key === 'ArrowLeft') populateLightbox(currentIdx + 1);
    });
  }

  /* ------------------------------------------------------------------------
     6. Magazine Category Filter & Instant Search (#articles / magazine/)
     ------------------------------------------------------------------------ */
  const filterButtons = [...document.querySelectorAll('.filter-chip')];
  const searchInput = document.querySelector('#article-search-input');
  const resetFilterBtn = document.querySelector('#reset-articles-filter');
  const emptyState = document.querySelector('#articles-empty');
  const articleUnits = [...document.querySelectorAll('#articles [data-category], #magazine-archive [data-category]')];

  if (articleUnits.length && (filterButtons.length || searchInput)) {
    let activeCategory = 'all';
    let searchQuery = '';

    const normalizePersian = (text) =>
      (text || '')
        .toLowerCase()
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/\u200c/g, ' ')
        .trim();

    const applyArticleFilters = () => {
      const query = normalizePersian(searchQuery);
      let visibleCount = 0;

      articleUnits.forEach((unit) => {
        const category = unit.dataset.category || '';
        const haystack = normalizePersian(`${unit.dataset.keywords || ''} ${unit.textContent || ''}`);
        const matchesCategory = activeCategory === 'all' || category === activeCategory;
        const matchesQuery = !query || haystack.includes(query);
        const show = matchesCategory && matchesQuery;

        unit.hidden = !show;
        if (show) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount > 0;
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.filter || 'all';
        filterButtons.forEach((chip) => {
          const selected = chip === btn;
          chip.classList.toggle('is-active', selected);
          chip.setAttribute('aria-pressed', String(selected));
        });
        applyArticleFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        searchQuery = event.target.value || '';
        applyArticleFilters();
      });
    }

    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        activeCategory = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        filterButtons.forEach((chip) => {
          const isAll = chip.dataset.filter === 'all';
          chip.classList.toggle('is-active', isAll);
          chip.setAttribute('aria-pressed', String(isAll));
        });
        applyArticleFilters();
      });
    }

    const params = new URLSearchParams(window.location.search);
    const initialCat = params.get('category');
    if (initialCat) {
      const targetBtn = filterButtons.find((b) => b.dataset.filter === initialCat);
      if (targetBtn) targetBtn.click();
    }
  }

  /* ------------------------------------------------------------------------
     7. Article Share / Copy Link Utility
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-copy-url]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const urlToCopy = window.location.href;
      try {
        await navigator.clipboard.writeText(urlToCopy);
        const original = btn.textContent;
        btn.textContent = 'لینک صفحه کپی شد ✓';
        setTimeout(() => { btn.textContent = original; }, 2600);
      } catch (_) {
        /* fallback ignored gracefully */
      }
    });
  });

  /* ------------------------------------------------------------------------
     8. Three-Flow Conversion Engine (Course / Service / Consultation)
        - Strict Persian validation + Persian digit normalization
        - Duplicate submission guard
        - Real fetch() if data-endpoint configured; otherwise honest local
          request builder with 1-click Copy (zero fake server submission,
          zero PII stored in URLs or logs)
     ------------------------------------------------------------------------ */
  const conversionTabs = [...document.querySelectorAll('.conversion-tab')];
  const conversionPanels = [...document.querySelectorAll('.conversion-panel')];

  const activateConversionTab = (flowId, preselectValue, preselectTier) => {
    const applySelects = (container) => {
      if (!container) return;
      if (preselectValue) {
        const selectEl = container.querySelector('select[name="selection"]');
        if (selectEl && [...selectEl.options].some((opt) => opt.value === preselectValue)) {
          selectEl.value = preselectValue;
        }
      }
      if (preselectTier) {
        const tierEl = container.querySelector('select[name="metaOption"]');
        if (tierEl && [...tierEl.options].some((opt) => opt.value === preselectTier)) {
          tierEl.value = preselectTier;
        }
      }
    };

    if (!conversionTabs.length) {
      applySelects(document.querySelector('.conversion-panel'));
      return;
    }
    conversionTabs.forEach((tab) => {
      const isSelected = tab.dataset.flowTarget === flowId;
      tab.setAttribute('aria-selected', String(isSelected));
    });
    conversionPanels.forEach((panel) => {
      const isMatch = panel.dataset.flowPanel === flowId;
      panel.hidden = !isMatch;
      if (isMatch) applySelects(panel);
    });
  };

  conversionTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activateConversionTab(tab.dataset.flowTarget);
    });
  });

  document.querySelectorAll('[data-open-flow]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const flow = trigger.dataset.openFlow;
      const item = trigger.dataset.flowItem || '';
      const tier = trigger.dataset.flowTier || '';
      activateConversionTab(flow, item, tier);
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const requestedFlow = urlParams.get('flow');
  const requestedItem = urlParams.get('item');
  const requestedTier = urlParams.get('tier');
  if (requestedFlow || requestedItem || requestedTier) {
    activateConversionTab(requestedFlow || 'course', requestedItem || '', requestedTier || '');
  }

  const toAsciiDigits = (str) =>
    String(str || '')
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[\s\-()]/g, '');

  const isValidPhone = (raw) => {
    const clean = toAsciiDigits(raw);
    return /^(\+98|0098|98|0)?9\d{9}$/.test(clean) || /^\+\d{8,15}$/.test(clean);
  };

  const submittedSignatures = new Set();

  document.querySelectorAll('.hanis-conversion-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const feedback = form.querySelector('.form-feedback');
      const submitBtn = form.querySelector('button[type="submit"]');
      const flowType = form.dataset.flowType || 'consultation';

      const setFieldError = (field, message) => {
        if (!field) return;
        const wrapper = field.closest('.form-field');
        const errEl = wrapper ? wrapper.querySelector('.field-error') : null;
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (errEl) errEl.textContent = message || '';
      };

      const nameInput = form.querySelector('[name="fullName"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const topicSelect = form.querySelector('[name="selection"]');
      const levelSelect = form.querySelector('[name="metaOption"]');
      const notesInput = form.querySelector('[name="notes"]');

      [nameInput, phoneInput, topicSelect].forEach((f) => setFieldError(f, ''));
      if (feedback) {
        feedback.hidden = true;
        feedback.className = 'form-feedback';
        feedback.textContent = '';
      }

      let hasError = false;
      const fullName = (nameInput?.value || '').trim();
      const rawPhone = (phoneInput?.value || '').trim();
      const selectedOptionText = topicSelect?.selectedOptions?.[0]?.textContent?.trim() || '';
      const selectedValue = topicSelect?.value || '';
      const metaText = levelSelect?.selectedOptions?.[0]?.textContent?.trim() || '';
      const notes = (notesInput?.value || '').trim();

      if (fullName.length < 3) {
        setFieldError(nameInput, 'لطفاً نام و نام خانوادگی خود را به‌صورت کامل وارد نمایید.');
        hasError = true;
      }
      if (!isValidPhone(rawPhone)) {
        setFieldError(phoneInput, 'لطفاً شماره موبایل معتبر (مانند ۰۹۱۲xxxxxxx یا با پیش‌شماره کشور) وارد نمایید.');
        hasError = true;
      }
      if (!selectedValue) {
        setFieldError(topicSelect, 'لطفاً یکی از گزینه‌های تخصصی این بخش را انتخاب نمایید.');
        hasError = true;
      }

      if (hasError) {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        firstInvalid?.focus();
        return;
      }

      const signature = `${flowType}|${fullName}|${toAsciiDigits(rawPhone)}|${selectedValue}|${notes}`;
      if (submittedSignatures.has(signature)) {
        if (feedback) {
          feedback.hidden = false;
          feedback.classList.add('is-error');
          feedback.innerHTML = '<strong>این درخواست پیش‌تر آماده شده است</strong><p>برای جلوگیری از ثبت تکراری، همان کد و متن درخواست قبلی شما معتبر است.</p>';
        }
        return;
      }

      const flowLabels = {
        course: 'پیش‌ثبت‌نام و مشاوره دوره آموزشی',
        service: 'درخواست هماهنگی نوبت خدمات زیبایی',
        consultation: 'درخواست مشاوره تخصصی آکادمی هانیس'
      };
      const endpoint = (form.dataset.endpoint || '').trim();
      const originalBtnLabel = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال بررسی اطلاعات...';
      }

      if (endpoint) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              flow: flowLabels[flowType] || flowType,
              fullName,
              phone: toAsciiDigits(rawPhone),
              selection: selectedOptionText,
              detail: metaText,
              notes
            })
          });

          if (!response.ok) throw new Error('endpoint_error');
          submittedSignatures.add(signature);
          form.reset();

          if (feedback) {
            feedback.hidden = false;
            feedback.classList.add('is-success');
            feedback.innerHTML = '<strong>درخواست شما با موفقیت ثبت شد</strong><p>واحد هماهنگی آکادمی زیبایی هانیس پس از بررسی ظرفیت، با شماره تماس شما ارتباط خواهد گرفت.</p>';
          }
        } catch (_) {
          if (feedback) {
            feedback.hidden = false;
            feedback.classList.add('is-error');
            feedback.innerHTML = '<strong>خطا در ارتباط با سرور پذیرش</strong><p>در حال حاضر امکان ارسال برخط وجود ندارد. لطفاً دقایقی دیگر تلاش نمایید.</p>';
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnLabel;
          }
        }
        return;
      }

      /* Truthful Static Mode: Never pretend data was sent to a server when no
         backend endpoint is configured. Prepare a clean structured summary for
         direct handoff without exposing PII in URLs or logs. */
      submittedSignatures.add(signature);
      const summaryLines = [
        `آکادمی زیبایی هانیس — ${flowLabels[flowType] || 'فرم درخواست'}`,
        `نام متقاضی: ${fullName}`,
        `شماره تماس: ${rawPhone}`,
        `موضوع انتخابی: ${selectedOptionText}`,
        metaText ? `جزئیات تکمیلی: ${metaText}` : '',
        notes ? `توضیحات: ${notes}` : ''
      ].filter(Boolean).join('\n');

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnLabel;
      }

      if (feedback) {
        feedback.hidden = false;
        feedback.innerHTML = '';

        const titleEl = document.createElement('strong');
        titleEl.textContent = 'خلاصه استاندارد درخواست شما آماده شد (نسخه ایستا بدون ذخیره روی سرور عمومی)';

        const descEl = document.createElement('p');
        descEl.textContent =
          'جهت حفاظت کامل از حریم خصوصی شما و شفافیت فنی، این پورتال ایستا اطلاعات شخصی را در مرورگر یا سرور واسط ذخیره نمی‌کند. متن استاندارد زیر آماده کپی و ارسال مستقیم به واحد پذیرش آکادمی زیبایی هانیس است:';

        const preBox = document.createElement('div');
        preBox.className = 'prepared-request-box';
        preBox.textContent = summaryLines;

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'button gold';
        copyBtn.textContent = 'کپی متن درخواست آماده ارسال';
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(summaryLines);
            copyBtn.textContent = 'متن درخواست در حافظه کپی شد ✓';
          } catch (_) {
            copyBtn.textContent = 'لطفاً متن بالا را انتخاب و کپی نمایید';
          }
        });

        feedback.append(titleEl, descEl, preBox, copyBtn);
      }
    });
  });
})();
