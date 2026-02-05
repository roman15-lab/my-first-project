// script.js — надійна версія: анімації + hero ефекти + cart (robust, error-handling)
(() => {
  try {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = (sel, ctx = document) => (ctx || document).querySelector(sel);
    const qa = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
    const gsapLib = window.gsap && typeof window.gsap === 'object' ? window.gsap : null;

    const AUTO_HIDE_DELAY = 4000;
    const IMAGE_LOAD_TIMEOUT = 5000;

    function safeAnimate(el, keyframes, options = {}) {
      try {
        if (!el) return null;
        if (el.animate) return el.animate(keyframes, options);
        Object.assign(el.style, keyframes[keyframes.length - 1]);
      } catch (e) { /* noop */ }
      return null;
    }

    /* helpers to hide/restore hero elements while intro is visible */
    function setHeroHiddenState(hidden) {
      try {
        const els = qa('.hero-content, .hero-art');
        els.forEach(el => {
          if (!el) return;
          if (hidden) {
            // store previous inline values so we can restore
            if (el.dataset._introPrevVisibility === undefined) el.dataset._introPrevVisibility = el.style.visibility || '';
            if (el.dataset._introPrevPointer === undefined) el.dataset._introPrevPointer = el.style.pointerEvents || '';
            if (el.dataset._introPrevOpacity === undefined) el.dataset._introPrevOpacity = el.style.opacity || '';
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
            el.style.opacity = '0';
          } else {
            // restore previous inline styles (or clear)
            if (el.dataset._introPrevVisibility !== undefined) { el.style.visibility = el.dataset._introPrevVisibility; delete el.dataset._introPrevVisibility; } else el.style.visibility = '';
            if (el.dataset._introPrevPointer !== undefined) { el.style.pointerEvents = el.dataset._introPrevPointer; delete el.dataset._introPrevPointer; } else el.style.pointerEvents = '';
            if (el.dataset._introPrevOpacity !== undefined) { el.style.opacity = el.dataset._introPrevOpacity; delete el.dataset._introPrevOpacity; } else el.style.opacity = '';
          }
        });
      } catch (e) { /* noop */ }
    }

    /* ---------- Intro ---------- */
    const intro = q('#intro');
    const enterBtn = q('#enterBtn');
    let autoHideTimer = null;

    function clearAutoHideTimer() { if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; } }
    function scheduleAutoHideDelay(ms = AUTO_HIDE_DELAY) { clearAutoHideTimer(); autoHideTimer = setTimeout(() => hideIntroAnimated(true), ms); }

    function hideIntroAnimated(persist = true) {
      try {
        clearAutoHideTimer();
        if (!intro || intro.classList.contains('hide')) {
          // already hidden — ensure hero is visible
          setHeroHiddenState(false);
          return;
        }

        if (prefersReducedMotion) {
          intro.classList.add('hide');
          intro.style.display = 'none';
          setHeroHiddenState(false);
        } else if (gsapLib) {
          const tl = gsapLib.timeline({
            onComplete() {
              try {
                intro.classList.add('hide');
                intro.style.display = 'none';
                setHeroHiddenState(false);
              } catch (e) { /* noop */ }
            }
          });
          tl.to(intro, { opacity: 0, y: -12, duration: 0.45, ease: 'power2.in' });
        } else {
          safeAnimate(intro, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: 450, easing: 'ease-in' });
          setTimeout(() => {
            try { intro.classList.add('hide'); intro.style.display = 'none'; setHeroHiddenState(false); } catch (e) {}
          }, 480);
        }

        if (persist) try { localStorage.setItem('coffeehouse.introHidden', '1'); } catch (e) {}
        setTimeout(() => {
          try {
            const firstHeading = document.querySelector('main h2, main h1');
            if (firstHeading) { firstHeading.setAttribute('tabindex', '-1'); firstHeading.focus({ preventScroll: true }); }
          } catch (e) {}
        }, 560);
      } catch (err) { console.error('hideIntroAnimated error', err); }
    }

    function animateIntroIn() {
      try {
        if (!intro) return;
        // while intro is showing — hide hero content to avoid overlapping texts
        setHeroHiddenState(true);

        intro.style.opacity = '1';
        intro.style.visibility = 'visible';
        if (prefersReducedMotion) return;
        if (gsapLib) {
          gsapLib.fromTo(intro, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' });
          const bean = q('.bean', intro);
          if (bean) gsapLib.fromTo(bean, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1,0.6)', delay: 0.2 });
        } else {
          safeAnimate(intro, [{ opacity: 0, transform: 'scale(1.02)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' });
        }
      } catch (err) { console.error('animateIntroIn error', err); }
    }

    function getHeroBgImageUrl() {
      try {
        const heroBg = q('.hero-bg');
        if (!heroBg) return null;
        const bg = window.getComputedStyle(heroBg).backgroundImage || '';
        const m = bg.match(/url\((?:'|")?(.*?)(?:'|")?\)/);
        return m ? m[1] : null;
      } catch (e) { return null; }
    }

    function waitForImageLoad(url, timeout = IMAGE_LOAD_TIMEOUT) {
      return new Promise((resolve) => {
        if (!url) return resolve(false);
        const img = new Image();
        let done = false;
        const finish = (ok) => { if (done) return; done = true; img.onload = img.onerror = null; resolve(ok); };
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        img.src = url;
        if (img.complete) setTimeout(() => { if (!done) finish(true); }, 20);
        setTimeout(() => finish(false), timeout);
      });
    }

    const persisted = (() => { try { return localStorage.getItem('coffeehouse.introHidden') === '1'; } catch (e) { return false; } })();
    if (intro && !persisted) {
      animateIntroIn();
      (async () => {
        const url = getHeroBgImageUrl();
        if (url && !prefersReducedMotion) {
          try { await waitForImageLoad(url); } catch (e) {}
        }
        scheduleAutoHideDelay(AUTO_HIDE_DELAY);
      })();
      if (enterBtn) {
        enterBtn.addEventListener('click', () => { clearAutoHideTimer(); hideIntroAnimated(true); });
        enterBtn.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); clearAutoHideTimer(); hideIntroAnimated(true); } });
      }
    } else if (intro) {
      // intro already dismissed/persisted: ensure hero visible and intro removed
      try { intro.classList.add('hide'); intro.style.display = 'none'; setHeroHiddenState(false); } catch (e) {}
    }

    /* ---------- Hero reveal + small animations ---------- */
    function playHeroTimeline() {
      try {
        const hero = q('.hero-modern');
        if (!hero) return;
        const heroLabel = q('.hero-label');
        const heroTitle = q('.hero-title');
        const heroSubtitle = q('.hero-subtitle');
        const heroActions = qa('.hero-actions a, .hero-actions button');
        const navbar = q('.navbar');
        if (prefersReducedMotion) {
          [heroLabel, heroTitle, heroSubtitle, ...heroActions].forEach(el => { if (el) el.style.opacity = '1'; });
          if (navbar) navbar.style.opacity = '1';
          return;
        }
        if (gsapLib) {
          const tl = gsapLib.timeline();
          if (navbar) tl.from(navbar, { opacity: 0, y: -10, duration: 0.8, ease: 'power2.out' }, 0);
          if (heroLabel) tl.from(heroLabel, { opacity: 0, y: 12, duration: 0.8 }, 0.1);
          if (heroTitle) tl.from(heroTitle, { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out' }, 0.35);
          if (heroSubtitle) tl.from(heroSubtitle, { opacity: 0, y: 20, duration: 0.8 }, 0.9);
          if (heroActions.length) tl.from(heroActions, { opacity: 0, y: 18, stagger: 0.12, duration: 0.7 }, 1.1);
        } else {
          const elems = [navbar, heroLabel, heroTitle, heroSubtitle, ...qa('.hero-actions a, .hero-actions button')].filter(Boolean);
          elems.forEach((el, i) => setTimeout(() => { el.style.transition = 'opacity .45s, transform .45s'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 120 + i * 120));
        }
      } catch (err) { console.error('playHeroTimeline error', err); }
    }

    // Observe hero once
    try {
      const hero = q('.hero-modern');
      if (hero && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => { if (entry.isIntersecting) { playHeroTimeline(); obs.disconnect(); } });
        }, { threshold: 0.15 });
        io.observe(hero);
      } else playHeroTimeline();
    } catch (err) { console.error('hero observer init error', err); }

    /* ---------- Parallax for hero artwork (light) ---------- */
    (function initParallax() {
      try {
        const heroEl = q('.hero-modern'); if (!heroEl || prefersReducedMotion) return;
        const heroBg = q('.hero-bg'); if (!heroBg) return;
        const floaters = qa('.hero-art #beans g');
        let rect = heroEl.getBoundingClientRect();
        function updateRect() { rect = heroEl.getBoundingClientRect(); }
        let needUpdate = false, lastX = 0, lastY = 0;

        function onMove(e) {
          const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
          lastX = (clientX - rect.left) / rect.width - 0.5;
          lastY = (clientY - rect.top) / rect.height - 0.5;
          if (!needUpdate) { needUpdate = true; requestAnimationFrame(apply); }
        }
        function apply() {
          needUpdate = false;
          const strength = 10;
          const x = -lastX * strength;
          const y = -lastY * strength * 0.6;
          heroBg.style.transform = `translate(${x}px, ${y}px) scale(1.06)`;
          floaters.forEach((el, i) => {
            const depth = 1 + i * 0.6;
            const fx = lastX * strength * depth * 0.6;
            const fy = lastY * strength * depth * 0.35;
            el.style.transform = `translate(${fx}px, ${fy}px) rotate(${(lastX * 8 * depth).toFixed(2)}deg)`;
          });
        }

        heroEl.addEventListener('pointermove', onMove, { passive: true });
        heroEl.addEventListener('pointerleave', () => { heroBg.style.transform = 'translate(0,0) scale(1.06)'; floaters.forEach(el => el.style.transform = ''); });
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);
      } catch (err) { console.error('initParallax error', err); }
    })();

    /* ---------- Cart (localStorage) ---------- */
    (function initCart() {
      try {
        const CART_KEY = 'coffeehouse.cart.v1';
        function readCart() { try { const raw = localStorage.getItem(CART_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
        function writeCart(cart) { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }
        function calcTotal(cart) { return cart.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0); }

        const cartCountEl = q('#cartCount');
        const cartItemsEl = q('#cartItems');
        const cartTotalEl = q('#cartTotal');

        function updateCartBadge(cart) {
          if (!cartCountEl) return;
          const totalQty = cart.reduce((s, i) => s + (i.qty || 0), 0);
          cartCountEl.textContent = totalQty;
          cartCountEl.style.display = totalQty > 0 ? 'inline-block' : 'none';
        }

        function renderCart() {
          if (!cartItemsEl) return;
          const cart = readCart();
          updateCartBadge(cart);
          cartItemsEl.innerHTML = '';
          if (!cart.length) { cartItemsEl.innerHTML = '<div class="text-center text-muted">Your cart is empty.</div>'; if (cartTotalEl) cartTotalEl.textContent = '0 UAH'; return; }
          cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'list-group-item d-flex gap-3 align-items-center';
            itemEl.dataset.id = item.id;
            itemEl.innerHTML = `
              <img src="${item.img}" alt="${item.name}" width="64" height="64" class="rounded" style="object-fit:cover;">
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between"><div><strong>${item.name}</strong></div><div><strong>${(item.price * item.qty)} UAH</strong></div></div>
                <div class="d-flex align-items-center gap-2 mt-2">
                  <div class="input-group input-group-sm" style="width:120px">
                    <button class="btn btn-outline-secondary btn-qty-minus" type="button">−</button>
                    <input class="form-control text-center qty-input" value="${item.qty}" inputmode="numeric" style="max-width:44px;">
                    <button class="btn btn-outline-secondary btn-qty-plus" type="button">+</button>
                  </div>
                  <button class="btn btn-sm btn-outline-danger ms-2 btn-remove-item">Remove</button>
                </div>
              </div>
            `;
            cartItemsEl.appendChild(itemEl);
          });
          if (cartTotalEl) cartTotalEl.textContent = `${calcTotal(readCart())} UAH`;
        }

        function addToCartFromCard(cardEl) {
          if (!cardEl || !cardEl.dataset) return;
          const id = cardEl.dataset.id;
          const name = cardEl.dataset.name || cardEl.querySelector('.card-title')?.textContent || 'Item';
          const price = Number(cardEl.dataset.price || 0);
          const img = cardEl.dataset.img || cardEl.querySelector('img')?.src || '';
          if (!id) return;
          const cart = readCart();
          const existing = cart.find(i => i.id === id);
          if (existing) existing.qty = (existing.qty || 0) + 1; else cart.push({ id, name, price, qty: 1, img });
          writeCart(cart); renderCart();
          const btn = cardEl.querySelector('.btn-add-cart');
          if (btn) { const old = btn.textContent; btn.textContent = 'Added ✓'; btn.disabled = true; setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 900); }
        }

        document.addEventListener('click', (ev) => {
          const target = ev.target;
          const targetEl = (target instanceof Element) ? target : (target && target.parentElement) || null;

          const addBtn = targetEl && typeof targetEl.closest === 'function' ? targetEl.closest('.btn-add-cart') : null;
          if (addBtn) { addToCartFromCard(addBtn.closest('.drink-card')); return; }

          const minus = targetEl && typeof targetEl.closest === 'function' ? targetEl.closest('.btn-qty-minus') : null;
          if (minus) {
            const id = minus.closest('[data-id]')?.dataset?.id; if (!id) return;
            const cart = readCart();
            const it = cart.find(x => x.id === id); if (!it) return;
            it.qty = Math.max(1, (it.qty || 1) - 1); writeCart(cart); renderCart(); return;
          }

          const plus = targetEl && typeof targetEl.closest === 'function' ? targetEl.closest('.btn-qty-plus') : null;
          if (plus) {
            const id = plus.closest('[data-id]')?.dataset?.id; if (!id) return;
            const cart = readCart();
            const it = cart.find(x => x.id === id); if (!it) return;
            it.qty = (it.qty || 1) + 1; writeCart(cart); renderCart(); return;
          }

          const remove = targetEl && typeof targetEl.closest === 'function' ? targetEl.closest('.btn-remove-item') : null;
          if (remove) {
            const id = remove.closest('[data-id]')?.dataset?.id; if (!id) return;
            let cart = readCart(); cart = cart.filter(i => i.id !== id); writeCart(cart); renderCart(); return;
          }
        });

        document.addEventListener('input', (ev) => {
          const target = ev.target;
          const targetEl = (target instanceof Element) ? target : (target && target.parentElement) || null;
          const input = targetEl && typeof targetEl.closest === 'function' ? targetEl.closest('.qty-input') : null;
          if (!input) return;
          const id = input.closest('[data-id]')?.dataset?.id; if (!id) return;
          let val = parseInt(input.value || '0', 10); if (isNaN(val) || val < 1) val = 1;
          const cart = readCart(); const it = cart.find(x => x.id === id); if (!it) return; it.qty = val; writeCart(cart); renderCart();
        });

        const checkoutBtn = q('#checkoutBtn');
        checkoutBtn?.addEventListener('click', () => {
          const cart = readCart();
          if (!cart.length) { if (q('#cartItems')) q('#cartItems').innerHTML = '<div class="text-center text-muted">Your cart is empty.</div>'; return; }
          writeCart([]); renderCart();
          const modalBody = q('#cartModal .modal-body');
          if (modalBody) modalBody.innerHTML = `<div class="text-center py-4"><h5>Thank you!</h5><p class="text-muted">Your order has been received (demo).</p><p class="small text-muted">We will contact you to confirm pickup/delivery.</p><button class="btn btn-primary mt-2" data-bs-dismiss="modal">Close</button></div>`;
        });

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderCart); else renderCart();
      } catch (err) { console.error('initCart error', err); }
    })();

    /* ---------- wire hero order button ---------- */
    function wireOrderButton() {
      try {
        const orderBtn = q('#heroOrder');
        if (!orderBtn) return;
        orderBtn.addEventListener('click', () => {
          const cartModalEl = q('#cartModal');
          if (cartModalEl && window.bootstrap && bootstrap.Modal) {
            const modal = new bootstrap.Modal(cartModalEl);
            modal.show();
          } else {
            const menu = q('#menu');
            if (menu) menu.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      } catch (err) { console.error('wireOrderButton error', err); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireOrderButton); else wireOrderButton();

    /* ---------- accessibility: focus outlines on Tab ---------- */
    document.addEventListener('keyup', (ev) => { if (ev.key === 'Tab') document.documentElement.classList.add('show-focus-outline'); });

    // Expose safe API
    window.__coffeeAnimations = { hideIntroAnimated, playHeroTimeline, prefersReducedMotion };
  } catch (err) {
    console.error('script.js runtime error:', err);
  }
})();