/* =========================================================
   Party Cleanup! — скрипты
   Сайт работает и без них (и без GSAP с CDN): всё ниже —
   улучшения поверх обычной страницы.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var COLORS = ['#ffd23f', '#3ec5ff', '#8ddc2a', '#ffffff', '#ff3d9a', '#ff9a3d'];

  /* ---------- Плавный скролл (Lenis) ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.11 });
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  // Якорные ссылки — через Lenis, чтобы прокрутка была плавной
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; } // заглушки href="#" пока никуда не ведут
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -20 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Меню-бургер ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('site-nav');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !e.target.closest('.header')) setMenu(false);
  });

  /* ---------- Первый экран: конфетти и воздуходувка ---------- */
  var hero = document.querySelector('.hero');
  var canvas = hero.querySelector('.hero__confetti');
  var ctx = canvas.getContext('2d');
  var cursor = document.querySelector('.blower-cursor');
  var pieces = [];
  var pointer = { x: -9999, y: -9999, vx: 0, vy: 0 };
  var W = 0, H = 0, dpr = 1;
  var heroVisible = true;

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    H = hero.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePieces() {
    var count = Math.round(Math.min(560, (W * H) / 2300));
    pieces = [];
    for (var i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0, vy: 0,
        r: Math.random() * Math.PI * 2, vr: 0,
        w: 6 + Math.random() * 10,
        h: 4 + Math.random() * 5,
        c: COLORS[i % COLORS.length]
      });
    }
  }

  function drawPieces() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }

  function stepPieces() {
    var R = W < 640 ? 90 : 150;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var dx = p.x - pointer.x, dy = p.y - pointer.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < R) {
        var k = (R - d) / R;
        p.vx += (dx / d) * k * 3 + pointer.vx * 0.06 * k;
        p.vy += (dy / d) * k * 3 + pointer.vy * 0.06 * k;
        p.vr += (Math.random() - 0.5) * k * 0.8;
      }
      p.vx *= 0.9; p.vy *= 0.9; p.vr *= 0.92;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
    }
    pointer.vx *= 0.8; pointer.vy *= 0.8;
  }

  function loop() {
    if (heroVisible) {
      stepPieces();
      drawPieces();
    }
    requestAnimationFrame(loop);
  }

  sizeCanvas();
  makePieces();
  drawPieces();

  if (!reduceMotion) {
    hero.classList.add('has-blower');
    var finePointer = window.matchMedia('(pointer: fine)').matches;

    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (pointer.x > -9000) { pointer.vx = x - pointer.x; pointer.vy = y - pointer.y; }
      pointer.x = x; pointer.y = y;
      if (finePointer) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursor.classList.add('is-on');
        cursor.classList.toggle('is-link', !!e.target.closest('a, button'));
      }
    });
    hero.addEventListener('pointerleave', function () {
      pointer.x = pointer.y = -9999;
      cursor.classList.remove('is-on');
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(hero);
    }
    requestAnimationFrame(loop);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (Math.abs(hero.clientWidth - W) < 2 && Math.abs(hero.clientHeight - H) < 120) return;
      sizeCanvas();
      makePieces();
      drawPieces();
    }, 150);
  });

  /* ---------- Мусор по краям разделов ---------- */
  var messLayers = document.querySelectorAll('.mess');
  messLayers.forEach(function (layer) {
    var n = window.innerWidth < 640 ? 14 : 26;
    for (var i = 0; i < n; i++) {
      var bit = document.createElement('span');
      bit.className = 'bit';
      var left = Math.random() < 0.5 ? Math.random() * 14 : 86 + Math.random() * 14; // только у краёв
      bit.style.left = left + '%';
      bit.style.top = (Math.random() * 96) + '%';
      bit.style.width = (8 + Math.random() * 12) + 'px';
      bit.style.height = (5 + Math.random() * 6) + 'px';
      bit.style.background = COLORS[(i * 7) % COLORS.length];
      bit.style.transform = 'rotate(' + Math.round(Math.random() * 180) + 'deg)';
      bit.dataset.side = left < 50 ? '-1' : '1';
      layer.appendChild(bit);
    }
  });

  /* ---------- Вкладки инструментов ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.slot'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); selectTab(next); next.focus(); }
    });
  });
  // клавиши 1–3, как в игре
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= tabs.length) {
      var rect = document.getElementById('tools').getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) selectTab(tabs[n - 1]);
    }
  });

  /* ---------- Улики: нажми, чтобы найти ---------- */
  var cluesSection = document.getElementById('clues');
  var clueButtons = cluesSection.querySelectorAll('.clue');
  var clueCount = cluesSection.querySelector('.clue-count');
  clueButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var found = !btn.classList.contains('is-found');
      btn.classList.toggle('is-found', found);
      btn.setAttribute('aria-pressed', String(found));
      var total = cluesSection.querySelectorAll('.clue.is-found').length;
      clueCount.textContent = total;
      cluesSection.classList.toggle('is-solved', total === clueButtons.length);
    });
  });

  /* ---------- Локации: подсветка фото ---------- */
  var locButtons = document.querySelectorAll('button.loc');
  locButtons.forEach(function (btn) {
    var photo = document.querySelector('.photo .shot[data-shot="' + btn.dataset.shot + '"]');
    if (!photo) return;
    var li = photo.parentElement;
    btn.addEventListener('mouseenter', function () { li.classList.add('is-hot'); });
    btn.addEventListener('mouseleave', function () { li.classList.remove('is-hot'); });
    btn.addEventListener('click', function () { openLightbox(photo); });
  });

  /* ---------- Лайтбокс ---------- */
  var dialog = document.getElementById('lightbox');
  var media = dialog.querySelector('.lightbox__media');
  var caption = dialog.querySelector('.lightbox__caption');
  var closeBtn = dialog.querySelector('.lightbox__close');
  var lastTrigger = null;
  var hasModal = typeof dialog.showModal === 'function';

  function openLightbox(trigger) {
    lastTrigger = document.activeElement;
    var img = trigger.querySelector('img');
    var big = new Image();
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    media.replaceChildren(big);
    caption.textContent = trigger.dataset.caption || '';
    if (lenis) lenis.stop();
    if (hasModal) dialog.showModal(); else dialog.setAttribute('open', '');
    closeBtn.focus();
  }
  function closeLightbox() {
    if (hasModal) dialog.close(); else { dialog.removeAttribute('open'); onClosed(); }
  }
  function onClosed() {
    if (lenis) lenis.start();
    if (lastTrigger) lastTrigger.focus();
  }
  document.querySelectorAll('.shot').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(btn); });
  });
  closeBtn.addEventListener('click', closeLightbox);
  dialog.addEventListener('close', onClosed);
  dialog.addEventListener('click', function (e) { if (e.target === dialog) closeLightbox(); });

  /* ---------- HUD «Убрано N%» ---------- */
  var hud = document.querySelector('.hud');
  var hudValue = hud.querySelector('.hud__value');
  var hudFill = hud.querySelector('.hud__fill');
  var lastPct = -1;
  var hudTimer = 0;

  function updateHud() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    var pct = max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 100;
    if (pct === lastPct) return;
    lastPct = pct;
    hudValue.textContent = pct === 100 ? 'всё!' : pct + '%';
    hudFill.style.transform = 'scaleX(' + pct / 100 + ')';
    hud.classList.toggle('is-done', pct === 100);
  }

  // HUD виден, только пока листаешь: остановился читать — он прячется и не закрывает текст
  function onScroll() {
    updateHud();
    hud.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.5);
    clearTimeout(hudTimer);
    hudTimer = setTimeout(function () {
      hud.classList.remove('is-visible');
    }, lastPct === 100 ? 2500 : 1200);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  updateHud();

  // на телефоне HUD не должен закрывать главную кнопку в финале
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      hud.classList.toggle('is-over-finale', entries[0].isIntersecting);
    }, { rootMargin: '0px 0px -40% 0px' }).observe(document.querySelector('.finale'));
  }

  /* ---------- Сцены прокрутки (GSAP) ---------- */
  if (!hasGsap || reduceMotion) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Первый экран: мусор сдувает, Pinyo пугается и убегает
  var pinyoImg = hero.querySelector('.hero__pinyo-img');
  var heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6,
      onUpdate: function (self) {
        // разворачивается в сторону бегства
        var running = self.progress > 0.08;
        var src = running ? 'assets/pinyo/pinyo_other_side.webp' : 'assets/pinyo/pinyo_three_quarter.webp';
        if (pinyoImg.getAttribute('src') !== src) pinyoImg.setAttribute('src', src);
      }
    }
  });
  heroTl
    .to('.hero__pinyo', { xPercent: 160, yPercent: -6, rotate: 4, ease: 'power2.in' }, 0)
    .to('.junk', {
      x: function (i) { return (i % 2 ? 1 : -1) * (200 + i * 60); },
      y: function (i) { return -150 - i * 40; },
      rotate: function (i) { return (i % 2 ? 1 : -1) * 180; },
      ease: 'power1.in', stagger: 0.03
    }, 0)
    .to('.hero__title', { yPercent: -18, ease: 'none' }, 0);

  // предзагрузим кадр «бегущей» Pinyo, чтобы не мигало
  new Image().src = 'assets/pinyo/pinyo_other_side.webp';

  // Мусор у краёв разделов сдувает при прокрутке — «уборка»
  messLayers.forEach(function (layer) {
    var bits = layer.querySelectorAll('.bit');
    gsap.to(bits, {
      x: function (i, el) { return el.dataset.side * (160 + Math.random() * 260); },
      y: function () { return -80 - Math.random() * 200; },
      rotate: function () { return (Math.random() - 0.5) * 720; },
      opacity: 0,
      ease: 'power1.in',
      scrollTrigger: { trigger: layer.parentElement, start: 'top 75%', end: 'center 30%', scrub: 0.8 }
    });
  });

  // История: горизонтальная лента на широких экранах
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (min-height: 560px)', function () {
    var story = document.querySelector('.story');
    var track = story.querySelector('.story__track');
    story.classList.add('story--h');

    var distance = function () { return track.scrollWidth - window.innerWidth; };
    var tween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: story,
        pin: story.querySelector('.story__pin'),
        start: 'top top',
        end: function () { return '+=' + distance(); },
        scrub: 0.5,
        invalidateOnRefresh: true
      }
    });

    // кадры чуть «качаются» на въезде
    story.querySelectorAll('.panel').forEach(function (panel) {
      gsap.from(panel, {
        rotate: gsap.utils.random(-6, 6), scale: 0.92,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 95%', end: 'left 55%', scrub: 0.5 }
      });
    });

    return function () { story.classList.remove('story--h'); gsap.set(track, { clearProps: 'x' }); };
  });

  // Цифры таймеров «сжимаются» по очереди
  gsap.from('.timer b', {
    scale: 1.25, opacity: 0, transformOrigin: 'left bottom',
    stagger: 0.12, duration: 0.6, ease: 'back.out(2.4)',
    scrollTrigger: { trigger: '.timers', start: 'top 80%' }
  });

  // Финал: Pinyo осторожно выглядывает
  gsap.from('.finale__pinyo', {
    xPercent: 60, rotate: 10, ease: 'power2.out',
    scrollTrigger: { trigger: '.finale', start: 'top 85%', end: 'center 60%', scrub: 0.6 }
  });

  // после загрузки шрифтов и картинок пересчитать размеры
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
