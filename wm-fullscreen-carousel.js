/* WMoldes - Tela Cheia: carrossel único automático */
(function () {
  'use strict';

  const SPEED_KEY = 'wmoldes_fullscreen_carousel_speed_seconds';
  const state = { active: false, index: 0, dir: 1, timer: null, speed: Number(localStorage.getItem(SPEED_KEY) || 6) };
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  function cards() {
    return qsa('#fornoSections .machine-card, #cardsContainer .machine-card').filter(c => {
      const st = getComputedStyle(c);
      return st.display !== 'none' && st.visibility !== 'hidden' && c.offsetParent !== null;
    });
  }

  function copyCanvases(srcCards, dstCards) {
    srcCards.forEach((src, i) => qsa('canvas', src).forEach((cv, j) => {
      const dst = qsa('canvas', dstCards[i] || [])[j];
      if (!dst) return;
      try { dst.width = cv.width; dst.height = cv.height; dst.getContext('2d').drawImage(cv, 0, 0); } catch (_) {}
    }));
  }

  function setSpeed(v) {
    state.speed = Math.max(2, Math.min(15, Number(v) || 6));
    localStorage.setItem(SPEED_KEY, String(state.speed));
    qsa('#fullscreenSpeedRange,#wmFsSpeedRange').forEach(e => e.value = state.speed);
    qsa('#fullscreenSpeedValue,#wmFsSpeedValue').forEach(e => e.textContent = state.speed + 's');
    restart();
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
    const counter = qs('#wmFsCounter', overlay);
    const total = qsa('.wm-fs-slide', overlay).length;
    if (counter) counter.textContent = (state.index + 1) + ' / ' + total;
  }

  function makeOverlay(sourceCards) {
    qs('#wmFullscreenCarouselOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'wmFullscreenCarouselOverlay';
    overlay.innerHTML = '<div class="wm-fs-topbar"><div class="wm-fs-title"><i class="fas fa-industry"></i> Máquinas em tela cheia</div><div class="wm-fs-controls"><label class="wm-fs-speed">Velocidade <input type="range" min="2" max="15" step="1" value="' + state.speed + '" id="wmFsSpeedRange"><strong id="wmFsSpeedValue">' + state.speed + 's</strong></label><button type="button" id="wmFsClose" class="wm-fs-close"><i class="fas fa-compress"></i> Sair</button></div></div><div class="wm-fs-viewport"><div class="wm-fs-track" id="wmFsTrack"></div></div><div class="wm-fs-counter" id="wmFsCounter"></div>';
    const track = qs('#wmFsTrack', overlay);
    sourceCards.forEach(card => {
      const slide = document.createElement('div');
      slide.className = 'wm-fs-slide';
      const clone = card.cloneNode(true);
      clone.removeAttribute('id');
      qsa('[id]', clone).forEach(el => el.removeAttribute('id'));
      slide.appendChild(clone);
      track.appendChild(slide);
    });
    document.body.appendChild(overlay);
    copyCanvases(sourceCards, qsa('.wm-fs-slide .machine-card', overlay));
    qs('#wmFsClose', overlay).addEventListener('click', deactivate);
    qs('#wmFsSpeedRange', overlay).addEventListener('input', e => setSpeed(e.target.value));
    return overlay;
  }

  function activate() {
    const sourceCards = cards();
    if (!sourceCards.length) { alert('Nenhuma máquina visível para exibir no carrossel.'); return; }
    state.active = true; state.index = 0; state.dir = 1;
    document.body.classList.add('wm-fullscreen-active');
    const btn = qs('#fullscreenCarouselBtn');
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); btn.innerHTML = '<i class="fas fa-compress"></i> Sair Tela Cheia'; }
    const overlay = makeOverlay(sourceCards);
    update(); restart();
    if (overlay.requestFullscreen) overlay.requestFullscreen().catch(() => {});
  }

  function deactivate() {
    state.active = false; clearInterval(state.timer); state.timer = null;
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
      #wmFullscreenCarouselOverlay{position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#f8fafc 0%,#eaf2ff 100%);display:flex;flex-direction:column;padding:22px;overflow:hidden}.wm-fs-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 14px;background:rgba(255,255,255,.94);border:1px solid #dbe3ef;border-radius:18px;box-shadow:0 12px 30px rgba(15,23,42,.10)}.wm-fs-title{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:900;color:#0f172a}.wm-fs-controls{display:flex;align-items:center;gap:12px}.wm-fs-speed{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:800;color:#0f172a}.wm-fs-speed input{width:160px;accent-color:#2563eb}.wm-fs-speed strong{min-width:34px;color:#2563eb}.wm-fs-close{border:0;border-radius:12px;padding:12px 16px;background:#2563eb;color:white;font-weight:900;cursor:pointer}.wm-fs-viewport{flex:1;overflow:hidden;display:flex;align-items:center;margin-top:18px}.wm-fs-track{display:flex;width:100%;height:100%;transition:transform 900ms cubic-bezier(.22,.61,.36,1);will-change:transform}.wm-fs-slide{flex:0 0 100%;display:flex;align-items:center;justify-content:center;padding:16px}.wm-fs-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.84);color:#fff;padding:8px 14px;border-radius:999px;font-weight:900}
      .wm-fs-slide .machine-card{width:min(74vw,980px)!important;min-width:min(74vw,980px)!important;min-height:72vh!important;padding:34px!important;border-radius:28px!important;box-shadow:0 26px 70px rgba(15,23,42,.18)!important}.wm-fs-slide .card-header{margin-bottom:28px!important}.wm-fs-slide .machine-name{font-size:42px!important}.wm-fs-slide .machine-name i{font-size:34px!important}.wm-fs-slide .machine-prefix{font-size:44px!important;max-width:420px!important}.wm-fs-slide .forno-badge{font-size:18px!important;padding:10px 16px!important}.wm-fs-slide .gauges-container{gap:56px!important;justify-content:center!important}.wm-fs-slide .gauge-title{font-size:18px!important}.wm-fs-slide .gauge-canvas{width:210px!important;height:210px!important}.wm-fs-slide .gauge-canvas canvas{width:210px!important;height:210px!important}.wm-fs-slide .gauge-value{font-size:42px!important}.wm-fs-slide .gauge-label{font-size:16px!important}.wm-fs-slide .status-indicators{font-size:22px!important;padding:22px!important}.wm-fs-slide .status-value{font-size:28px!important}.wm-fs-slide .details-btn{font-size:18px!important;padding:16px 22px!important}@media(max-width:800px){.speed-control{width:100%;justify-content:space-between}.wm-fs-topbar{align-items:flex-start;flex-direction:column}.wm-fs-slide .machine-card{width:92vw!important;min-width:92vw!important}}
    `;
    document.head.appendChild(st);
  }

  function bind() {
    css(); setSpeed(state.speed);
    const btn = qs('#fullscreenCarouselBtn');
    if (btn && btn.dataset.wmFsBound !== 'true') { btn.dataset.wmFsBound = 'true'; btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); state.active ? deactivate() : activate(); }); }
    const range = qs('#fullscreenSpeedRange');
    if (range && range.dataset.wmFsBound !== 'true') { range.dataset.wmFsBound = 'true'; range.addEventListener('input', e => setSpeed(e.target.value)); }
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.active) deactivate(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && state.active) deactivate(); });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', bind) : bind();
})();
