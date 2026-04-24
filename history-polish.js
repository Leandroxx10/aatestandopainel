/* ==========================================================
   WMoldes - Histórico Admin | Integração V7
   - Abre tutorial em historico-tutorial.html
   - Padroniza botões Exportar PDF e Tutorial
   - Garante estado visual profissional quando não houver dados
   ========================================================== */
(function () {
  const READY_DELAY = 450;

  function byText(selector, text) {
    const target = String(text || '').toLowerCase();
    return Array.from(document.querySelectorAll(selector)).find(el => (el.textContent || '').toLowerCase().includes(target));
  }

  function makeButton(id, className, icon, label, action) {
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
      btn.dataset.historyAction = action;
      btn.innerHTML = `<i class="${icon}"></i><span>${label}</span>`;
    }
    btn.className = className;
    return btn;
  }

  function openTutorial() {
    window.location.href = 'historico-tutorial.html';
  }

  function exportPdfFallback() {
    const nativeExport = window.exportHistoryPdf || window.exportarHistoricoPDF || window.exportarGraficoHistoricoPDF;
    if (typeof nativeExport === 'function') return nativeExport();
    alert('Exportação PDF indisponível. Verifique se history-charts.js está carregado antes de history-polish.js.');
  }

  function normalizeActionButtons() {
    // Remove botões que ficaram de versões anteriores e não devem mais existir.
    Array.from(document.querySelectorAll('button')).forEach(btn => {
      const txt = (btn.textContent || '').trim().toLowerCase();
      if (txt === 'barras' || txt.includes('gerar análise') || txt.includes('gerar analise')) btn.remove();
    });

    const periodLabel = byText('label, h3, h4, .form-label, .filter-label, .history-filter-label, div, span', 'período');
    const periodContainer = periodLabel ? (periodLabel.closest('.form-group, .filter-group, .history-filter-group, .history-period-card, .admin-card, section, div') || periodLabel.parentElement) : null;
    const host = periodContainer?.parentElement || document.querySelector('.history-controls, .history-filters, .admin-card') || document.body;

    let row = document.getElementById('historyActionRow');
    if (!row) {
      row = document.createElement('div');
      row.id = 'historyActionRow';
      row.className = 'history-action-row';
      host.appendChild(row);
    }

    const tutorialBtn = makeButton('historyTutorialBtn', 'history-btn history-tutorial-btn', 'fas fa-graduation-cap', 'Tutorial', 'tutorial');
    const pdfBtn = makeButton('exportHistoryPdfBtn', 'history-btn history-export-pdf-btn', 'fas fa-file-pdf', 'Exportar PDF', 'export-pdf');

    tutorialBtn.onclick = openTutorial;
    pdfBtn.onclick = exportPdfFallback;

    row.innerHTML = '';
    row.appendChild(tutorialBtn);
    row.appendChild(pdfBtn);

    // Tenta aplicar grade responsiva no contêiner de filtros.
    if (host && host !== document.body) host.classList.add('history-period-grid');
  }

  function ensureEmptyState() {
    const canvas = document.querySelector('canvas');
    const chartBox = canvas ? (canvas.closest('.chart-container, .history-chart-container, .admin-card, section, div') || canvas.parentElement) : null;
    if (!chartBox) return;

    if (getComputedStyle(chartBox).position === 'static') chartBox.style.position = 'relative';

    const plainEmpty = byText('*', 'Nenhum dado encontrado para o período');
    const hasVisibleEmptyText = plainEmpty && plainEmpty.offsetParent !== null;
    const dataLabels = document.querySelectorAll('.chartjs-render-monitor, canvas');

    let empty = document.getElementById('historyEmptyState');
    if (!empty) {
      empty = document.createElement('div');
      empty.id = 'historyEmptyState';
      empty.className = 'history-empty-state';
      empty.innerHTML = `
        <div class="history-empty-card">
          <div class="history-empty-illustration"></div>
          <h3>Nenhum dado encontrado</h3>
          <p>Não existem registros para a máquina e o período selecionados. Altere a data, o turno ou escolha outra máquina.</p>
        </div>`;
      chartBox.appendChild(empty);
    }

    empty.style.display = hasVisibleEmptyText ? 'flex' : 'none';
  }

  function boot() {
    normalizeActionButtons();
    ensureEmptyState();
    setInterval(() => {
      normalizeActionButtons();
      ensureEmptyState();
    }, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, READY_DELAY));
  } else {
    setTimeout(boot, READY_DELAY);
  }
})();
