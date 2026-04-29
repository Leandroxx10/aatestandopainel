/* WMoldes - Tela Cheia: carrossel profissional com filtros e quantidade por tela */
(function () {
  'use strict';

  const SPEED_KEY = 'wmoldes_fullscreen_carousel_speed_seconds';
  const SHOW_MAINT_KEY = 'wmoldes_fullscreen_show_maintenance';
  const ALL_MACHINES_KEY = 'wmoldes_fullscreen_all_machines';
  const PER_VIEW_KEY = 'wmoldes_fullscreen_cards_per_view';

  const state = {
    active: false,
    index: 0,
    dir: 1,
    timer: null,
    speed: Number(localStorage.getItem(SPEED_KEY) || 6),
    showMaintenance: localStorage.getItem(SHOW_MAINT_KEY) !== 'false',
    allMachines: localStorage.getItem(ALL_MACHINES_KEY) === 'true',
    perView: Number(localStorage.getItem(PER_VIEW_KEY) || 1)
  };

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  function isVisible(el) {
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && el.offsetParent !== null;
  }

  function isMaintenance(card) {
    return card.dataset.maintenance === 'true' || card.classList.contains('maintenance');
  }

  function allCards() {
    const seen = new Set();
    return qsa('#fornoSections .machine-card, #cardsContainer .machine-card')
      .filter(card => {
        const id = card.dataset.machineId || card.textContent.trim();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }

  function sourceCards() {
    return allCards().filter(card => {
      if (!state.allMachines && !isVisible(card)) return false;
      if (!state.showMaintenance && isMaintenance(card)) return false;
      return true;
    });
  }

  function chunk(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  function copyCanvases(srcCards, dstCards) {
    srcCards.forEach((src, i) => qsa('canvas', src).forEach((cv, j) => {
      const dst = qsa('canvas', dstCards[i] || [])[j];
      if (!dst) return;
      try {
        dst.width = cv.width;
        dst.height = cv.height;
        dst.getContext('2d').drawImage(cv, 0, 0);
      } catch (_) {}
    }));
  }

  function setSpeed(v) {
    state.speed = Math.max(2, Math.min(15, Number(v) || 6));
    localStorage.setItem(SPEED_KEY, String(state.speed));
    qsa('#fullscreenSpeedRange,#wmFsSpeedRange').forEach(e => e.value = state.speed);
    qsa('#fullscreenSpeedValue,#wmFsSpeedValue').forEach(e => e.textContent = state.speed + 's');
    restart();
  }

  function setPerView(v) {
    state.perView = Math.max(1, Math.min(4, Number(v) || 1));
    localStorage.setItem(PER_VIEW_KEY, String(state.perView));
    qsa('#wmFsPerView').forEach(e => e.value = state.perView);
    qsa('#wmFsPerViewValue').forEach(e => e.textContent = state.perView);
    if (state.active) rebuildSlides();
  }

  function step() {
    const total = qsa('#wmFullscreenCarouselOverlay .wm-fs-slide').length;
    if (total <= 1) return;
    if (state.index >= total - 1) state.dir = -1;
    if (state.index <= 0) state.dir = 1;
    state.index += state.dir;
    update();
  }

  function restart() {
    clearInterval(state.timer);
    if (state.active) state.timer = setInterval(step, state.speed * 1000);
  }

  function update() {
    const overlay = qs('#wmFullscreenCarouselOverlay');
    const track = qs('#wmFsTrack', overlay || document);
    if (!track) return;
    track.style.transform = 'translateX(-' + (state.index * 100) + '%)';
    const totalSlides = qsa('.wm-fs-slide', overlay).length;
    const totalCards = qsa('.wm-fs-slide .machine-card', overlay).length;
    const counter = qs('#wmFsCounter', overlay);
    if (counter) counter.textContent = totalSlides ? (state.index + 1) + ' / ' + totalSlides + ' telas • ' + totalCards + ' máquinas' : '0 máquinas';
    const allBtn = qs('#wmFsAllMachines', overlay);
    const maintBtn = qs('#wmFsMaintenance', overlay);
    if (allBtn) {
      allBtn.classList.toggle('active', state.allMachines);
      allBtn.innerHTML = state.allMachines ? '<i class="fas fa-layer-group"></i> Todas as máquinas' : '<i class="fas fa-eye"></i> Apenas visíveis';
    }
    if (maintBtn) {
      maintBtn.classList.toggle('active', state.showMaintenance);
      maintBtn.innerHTML = state.showMaintenance ? '<i class="fas fa-tools"></i> Manutenção visível' : '<i class="fas fa-eye-slash"></i> Ocultar manutenção';
    }
  }

  function appendSlide(track, group) {
    const slide = document.createElement('div');
    slide.className = 'wm-fs-slide';
    slide.style.setProperty('--wm-fs-per-view', String(state.perView));
    group.forEach(card => {
      const slot = document.createElement('div');
      slot.className = 'wm-fs-card-slot';
      const clone = card.cloneNode(true);
      clone.removeAttribute('id');
      qsa('[id]', clone).forEach(el => el.removeAttribute('id'));
      slot.appendChild(clone);
      slide.appendChild(slot);
    });
    track.appendChild(slide);
  }

  function rebuildSlides() {
    const overlay = qs('#wmFullscreenCarouselOverlay');
    const track = qs('#wmFsTrack', overlay || document);
    const empty = qs('#wmFsEmpty', overlay || document);
    if (!track) return;
    const cards = sourceCards();
    track.innerHTML = '';
    state.index = 0;
    state.dir = 1;
    if (!cards.length) {
      if (empty) empty.style.display = 'flex';
      update();
      restart();
      return;
    }
    if (empty) empty.style.display = 'none';
    chunk(cards, state.perView).forEach(group => appendSlide(track, group));
    copyCanvases(cards, qsa('.wm-fs-slide .machine-card', overlay));
    update();
    restart();
  }

  function makeOverlay() {
    qs('#wmFullscreenCarouselOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'wmFullscreenCarouselOverlay';
    overlay.innerHTML = `
      <div class="wm-fs-topbar">
        <div class="wm-fs-title"><i class="fas fa-industry"></i> Máquinas em tela cheia</div>
        <div class="wm-fs-controls">
          <button type="button" id="wmFsAllMachines" class="wm-fs-option"></button>
          <button type="button" id="wmFsMaintenance" class="wm-fs-option"></button>
          <label class="wm-fs-select">Cards por tela
            <select id="wmFsPerView">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
          <label class="wm-fs-speed">Velocidade <input type="range" min="2" max="15" step="1" value="${state.speed}" id="wmFsSpeedRange"><strong id="wmFsSpeedValue">${state.speed}s</strong></label>
          <button type="button" id="wmFsClose" class="wm-fs-close"><i class="fas fa-compress"></i> Sair</button>
        </div>
      </div>
      <div class="wm-fs-viewport">
        <div class="wm-fs-track" id="wmFsTrack"></div>
        <div class="wm-fs-empty" id="wmFsEmpty"><i class="fas fa-info-circle"></i> Nenhuma máquina disponível com os filtros atuais.</div>
      </div>
      <div class="wm-fs-counter" id="wmFsCounter"></div>`;
    document.body.appendChild(overlay);

    qs('#wmFsClose', overlay).addEventListener('click', deactivate);
    qs('#wmFsSpeedRange', overlay).addEventListener('input', e => setSpeed(e.target.value));
    qs('#wmFsPerView', overlay).addEventListener('change', e => setPerView(e.target.value));
    qs('#wmFsAllMachines', overlay).addEventListener('click', () => {
      state.allMachines = !state.allMachines;
      localStorage.setItem(ALL_MACHINES_KEY, String(state.allMachines));
      rebuildSlides();
    });
    qs('#wmFsMaintenance', overlay).addEventListener('click', () => {
      state.showMaintenance = !state.showMaintenance;
      localStorage.setItem(SHOW_MAINT_KEY, String(state.showMaintenance));
      rebuildSlides();
    });
    qs('#wmFsPerView', overlay).value = String(state.perView);
    rebuildSlides();
    return overlay;
  }

  function activate() {
    if (!sourceCards().length && !allCards().length) { alert('Nenhuma máquina encontrada para exibir no carrossel.'); return; }
    state.active = true;
    state.index = 0;
    state.dir = 1;
    document.body.classList.add('wm-fullscreen-active');
    const btn = qs('#fullscreenCarouselBtn');
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); btn.innerHTML = '<i class="fas fa-compress"></i> Sair Tela Cheia'; }
    const overlay = makeOverlay();
    if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
  }

  function deactivate() {
    state.active = false;
    clearInterval(state.timer);
    state.timer = null;
    document.body.classList.remove('wm-fullscreen-active');
    qs('#wmFullscreenCarouselOverlay')?.remove();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    const btn = qs('#fullscreenCarouselBtn');
    if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia'; }
  }

  function css() {
    if (qs('#wmFullscreenCarouselCss')) return;
    const st = document.createElement('style');
    st.id = 'wmFullscreenCarouselCss';
    st.textContent = `
      .speed-control{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--border,#dbe3ef);border-radius:8px;background:var(--card-bg,#fff);color:var(--text,#0f172a);font-size:13px;font-weight:700}.speed-control input{width:110px;accent-color:var(--primary,#2563eb)}.speed-control strong{min-width:28px;color:var(--primary,#2563eb)}#fullscreenCarouselBtn.active{background:var(--primary,#2563eb)!important;color:#fff!important;border-color:var(--primary,#2563eb)!important}
      .machine-prefix{background:transparent!important;color:#000!important;border-radius:0!important;padding:0!important;margin-left:4px!important;font-size:22px!important;line-height:1!important;font-weight:900!important;max-width:190px!important;letter-spacing:.2px}body.dark-mode .machine-prefix{color:#000!important;text-shadow:0 1px 0 rgba(255,255,255,.55)}
      #wmFullscreenCarouselOverlay{position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#f8fafc 0%,#eaf2ff 100%);display:flex;flex-direction:column;padding:16px;overflow:hidden}.wm-fs-topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:10px 14px;background:rgba(255,255,255,.96);border:1px solid #dbe3ef;border-radius:18px;box-shadow:0 12px 30px rgba(15,23,42,.10)}.wm-fs-title{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:900;color:#0f172a;white-space:nowrap}.wm-fs-controls{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}.wm-fs-option,.wm-fs-close{border:1px solid #dbe3ef;border-radius:12px;padding:11px 14px;background:#fff;color:#0f172a;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(15,23,42,.06)}.wm-fs-option.active{background:#0f172a;color:#fff;border-color:#0f172a}.wm-fs-close{border:0;background:#2563eb;color:#fff}.wm-fs-select,.wm-fs-speed{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:900;color:#0f172a;background:#fff;border:1px solid #dbe3ef;border-radius:12px;padding:9px 12px}.wm-fs-select select{border:0;background:#eef2f7;border-radius:8px;padding:6px 10px;font-weight:900;color:#0f172a}.wm-fs-speed input{width:150px;accent-color:#2563eb}.wm-fs-speed strong{min-width:34px;color:#2563eb}.wm-fs-viewport{position:relative;flex:1;overflow:hidden;display:flex;align-items:center;margin-top:18px}.wm-fs-track{display:flex;width:100%;height:100%;transition:transform 900ms cubic-bezier(.22,.61,.36,1);will-change:transform}.wm-fs-slide{flex:0 0 100%;display:grid;grid-template-columns:repeat(var(--wm-fs-per-view),minmax(0,1fr));align-items:center;justify-items:center;gap:22px;padding:16px}.wm-fs-card-slot{width:100%;display:flex;align-items:center;justify-content:center}.wm-fs-empty{display:none;position:absolute;inset:0;align-items:center;justify-content:center;gap:10px;color:#334155;font-size:22px;font-weight:900}.wm-fs-counter{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.86);color:#fff;padding:8px 14px;border-radius:999px;font-weight:900;z-index:2}
      .wm-fs-slide .machine-card{width:100%!important;min-width:0!important;max-width:980px!important;min-height:68vh!important;padding:32px!important;border-radius:28px!important;box-shadow:0 26px 70px rgba(15,23,42,.18)!important}.wm-fs-slide[style*="--wm-fs-per-view: 2"] .machine-card{min-height:62vh!important}.wm-fs-slide[style*="--wm-fs-per-view: 3"] .machine-card,.wm-fs-slide[style*="--wm-fs-per-view: 4"] .machine-card{min-height:54vh!important;padding:24px!important}.wm-fs-slide .card-header{margin-bottom:24px!important}.wm-fs-slide .machine-name{font-size:42px!important}.wm-fs-slide .machine-name i{font-size:34px!important}.wm-fs-slide .machine-prefix{font-size:44px!important;max-width:420px!important}.wm-fs-slide[style*="--wm-fs-per-view: 3"] .machine-name,.wm-fs-slide[style*="--wm-fs-per-view: 4"] .machine-name{font-size:28px!important}.wm-fs-slide[style*="--wm-fs-per-view: 3"] .machine-prefix,.wm-fs-slide[style*="--wm-fs-per-view: 4"] .machine-prefix{font-size:28px!important}.wm-fs-slide .gauges-container{gap:46px!important;justify-content:center!important}.wm-fs-slide .gauge-title{font-size:18px!important}.wm-fs-slide .gauge-canvas{width:200px!important;height:200px!important}.wm-fs-slide .gauge-canvas canvas{width:200px!important;height:200px!important}.wm-fs-slide .gauge-value{font-size:40px!important}.wm-fs-slide .gauge-label{font-size:15px!important}.wm-fs-slide[style*="--wm-fs-per-view: 3"] .gauge-canvas,.wm-fs-slide[style*="--wm-fs-per-view: 4"] .gauge-canvas,.wm-fs-slide[style*="--wm-fs-per-view: 3"] .gauge-canvas canvas,.wm-fs-slide[style*="--wm-fs-per-view: 4"] .gauge-canvas canvas{width:132px!important;height:132px!important}.wm-fs-slide[style*="--wm-fs-per-view: 3"] .gauge-value,.wm-fs-slide[style*="--wm-fs-per-view: 4"] .gauge-value{font-size:28px!important}.wm-fs-slide .status-indicators{font-size:20px!important;padding:20px!important}.wm-fs-slide .status-value{font-size:26px!important}.wm-fs-slide .details-btn{font-size:18px!important;padding:16px 22px!important}@media(max-width:1100px){.wm-fs-topbar{align-items:flex-start;flex-direction:column}.wm-fs-controls{justify-content:flex-start}.wm-fs-slide{grid-template-columns:1fr!important}.wm-fs-slide .machine-card{width:92vw!important;min-height:64vh!important}.wm-fs-speed input{width:110px}}@media(max-width:800px){.speed-control{width:100%;justify-content:space-between}.wm-fs-option,.wm-fs-close,.wm-fs-select,.wm-fs-speed{width:100%;justify-content:space-between}.wm-fs-title{font-size:20px}.wm-fs-slide .machine-card{width:92vw!important;min-height:62vh!important}}
    `;
    document.head.appendChild(st);
  }

  function bind() {
    css();
    setSpeed(state.speed);
    setPerView(state.perView);
    const btn = qs('#fullscreenCarouselBtn');
    if (btn && btn.dataset.wmFsBound !== 'true') {
      btn.dataset.wmFsBound = 'true';
      btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); state.active ? deactivate() : activate(); });
    }
    const range = qs('#fullscreenSpeedRange');
    if (range && range.dataset.wmFsBound !== 'true') {
      range.dataset.wmFsBound = 'true';
      range.addEventListener('input', e => setSpeed(e.target.value));
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.active) deactivate(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && state.active) deactivate(); });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', bind) : bind();
})();
