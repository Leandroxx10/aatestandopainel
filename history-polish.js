/* ==========================================================
   WMoldes - Histórico Admin | Integração V10
   - Botões Tutorial e Exportar PDF fixados no topo esquerdo
     do card de filtros do Histórico
   - Mantém o visual do filtro de período
   - Garante ilustração profissional quando não houver dados
   ========================================================== */
(function () {
  const READY_DELAY = 450;
  const LOOP_DELAY = 1800;

  function byText(selector, text) {
    const target = String(text || '').toLowerCase();
    return Array.from(document.querySelectorAll(selector)).find(el => (el.textContent || '').toLowerCase().includes(target));
  }

  function makeButton(id, className, icon, title, subtitle, action) {
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
      btn.dataset.historyAction = action;
    }
    btn.className = className;
    btn.innerHTML = `
      <span class="history-action-icon"><i class="${icon}"></i></span>
      <span class="history-action-text"><strong>${title}</strong><small>${subtitle}</small></span>
    `;
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

  function getHistoryFilterCard() {
    const machineLabel = byText('label, h3, h4, .form-label, .filter-label, .history-filter-label, div, span', 'máquina') || byText('label, h3, h4, .form-label, .filter-label, .history-filter-label, div, span', 'maquina');
    const periodLabel = byText('label, h3, h4, .form-label, .filter-label, .history-filter-label, div, span', 'período') || byText('label, h3, h4, .form-label, .filter-label, .history-filter-label, div, span', 'periodo');

    const candidates = [
      '.history-filter-card',
      '.history-filters-card',
      '.history-controls-card',
      '.history-controls',
      '.history-filters',
      '.admin-card',
      'section',
      'div'
    ];

    const machineAncestors = machineLabel ? getAncestors(machineLabel) : [];
    const periodAncestors = periodLabel ? getAncestors(periodLabel) : [];
    const common = machineAncestors.find(node => periodAncestors.includes(node));
    if (common && common !== document.body && common !== document.documentElement) return common;

    for (const selector of candidates) {
      const node = document.querySelector(selector);
      if (node) return node;
    }
    return document.body;
  }

  function getAncestors(node) {
    const list = [];
    let current = node;
    while (current) {
      list.push(current);
      current = current.parentElement;
    }
    return list;
  }

  function normalizeActionButtons() {
    // Remove botões que ficaram de versões anteriores e não devem mais existir.
    Array.from(document.querySelectorAll('button')).forEach(btn => {
      const txt = (btn.textContent || '').trim().toLowerCase();
      if (txt === 'barras' || txt.includes('gerar análise') || txt.includes('gerar analise')) btn.remove();
    });

    const card = getHistoryFilterCard();
    if (!card) return;

    if (card !== document.body && getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }
    if (card !== document.body) card.classList.add('history-controls-has-top-actions');

    let row = document.getElementById('historyActionRow');
    if (!row) {
      row = document.createElement('div');
      row.id = 'historyActionRow';
    }
    row.className = 'history-action-row history-top-action-row';

    const tutorialBtn = makeButton(
      'historyTutorialBtn',
      'history-btn history-tutorial-btn',
      'fas fa-graduation-cap',
      'Tutorial',
      'Como usar o histórico',
      'tutorial'
    );
    const pdfBtn = makeButton(
      'exportHistoryPdfBtn',
      'history-btn history-export-pdf-btn',
      'fas fa-file-pdf',
      'Exportar PDF',
      'Gráfico + tabela',
      'export-pdf'
    );

    tutorialBtn.onclick = openTutorial;
    pdfBtn.onclick = exportPdfFallback;

    row.innerHTML = '';
    row.appendChild(tutorialBtn);
    row.appendChild(pdfBtn);

    if (row.parentElement !== card) {
      card.insertBefore(row, card.firstChild);
    }
  }

  function ensureEmptyState() {
    const canvas = document.querySelector('canvas');
    const chartBox = canvas ? (canvas.closest('.chart-container, .history-chart-container, .admin-card, section, div') || canvas.parentElement) : null;
    if (!chartBox) return;

    if (getComputedStyle(chartBox).position === 'static') chartBox.style.position = 'relative';

    const plainEmpty = byText('*', 'Nenhum dado encontrado para o período') || byText('*', 'Nenhum dado encontrado para o periodo');
    const hasVisibleEmptyText = plainEmpty && plainEmpty.offsetParent !== null;

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
    }, LOOP_DELAY);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, READY_DELAY));
  } else {
    setTimeout(boot, READY_DELAY);
  }
})();
