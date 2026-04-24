/* ==========================================================
   WMoldes - Histórico Admin | Integração V11
   Correção: Tutorial e Exportar PDF ficam dentro do card de filtros,
   na área superior esquerda acima de Máquina/Data.
   ========================================================== */
(function () {
  const READY_DELAY = 350;
  const LOOP_DELAY = 1800;

  function norm(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  }

  function hasText(el, needle) {
    return norm(el.textContent).includes(norm(needle));
  }

  function makeButton(id, className, icon, title, subtitle, action) {
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
    }
    btn.dataset.historyAction = action;
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

    const exportBtn = Array.from(document.querySelectorAll('button, a')).find(el => {
      const t = norm(el.textContent);
      return t.includes('exportar') && t.includes('pdf') && el.id !== 'exportHistoryPdfBtn';
    });
    if (exportBtn && typeof exportBtn.click === 'function') return exportBtn.click();

    alert('Exportação PDF indisponível. Verifique se history-charts.js está carregado antes de history-polish.js.');
  }

  function removeOldActionRows() {
    document.querySelectorAll('#historyActionRow, .history-action-row, .hc-action-row, .history-export-actions').forEach(row => {
      if (row.id === 'historyActionRow' || row.querySelector('#historyTutorialBtn, #exportHistoryPdfBtn')) row.remove();
    });

    Array.from(document.querySelectorAll('button, a')).forEach(el => {
      const t = norm(el.textContent);
      const isOurButton = el.id === 'historyTutorialBtn' || el.id === 'exportHistoryPdfBtn' || el.dataset.historyAction === 'tutorial' || el.dataset.historyAction === 'export-pdf';
      const oldGenerated = (t.includes('tutorial') && t.includes('historico')) || (t.includes('exportar') && t.includes('pdf'));
      const badButtons = t === 'barras' || t.includes('gerar analise');
      if (isOurButton || badButtons || (oldGenerated && el.closest('aside, nav, .sidebar, .admin-sidebar'))) {
        el.remove();
      }
    });
  }

  function findHistoryFilterCard() {
    const nodes = Array.from(document.querySelectorAll('section, form, .admin-card, .history-card, .history-section, .tab-content, .admin-tab-content, div'))
      .filter(visible)
      .filter(el => !el.closest('aside, nav, .sidebar, .admin-sidebar'))
      .filter(el => {
        const t = norm(el.textContent);
        return t.includes('maquina') && t.includes('data') && t.includes('periodo') && (t.includes('24h') || t.includes('turno'));
      })
      .map(el => {
        const r = el.getBoundingClientRect();
        return { el, area: r.width * r.height, width: r.width, height: r.height, top: r.top };
      })
      .filter(item => item.width >= 520 && item.height >= 180);

    if (nodes.length) {
      nodes.sort((a, b) => a.area - b.area || a.top - b.top);
      return nodes[0].el;
    }

    const periodElement = Array.from(document.querySelectorAll('*')).find(el => visible(el) && hasText(el, 'período')) ||
                          Array.from(document.querySelectorAll('*')).find(el => visible(el) && hasText(el, 'periodo'));
    if (periodElement) {
      let cur = periodElement;
      while (cur && cur !== document.body) {
        if (visible(cur) && !cur.closest('aside, nav, .sidebar, .admin-sidebar')) {
          const t = norm(cur.textContent);
          const r = cur.getBoundingClientRect();
          if (t.includes('maquina') && t.includes('data') && r.width >= 520) return cur;
        }
        cur = cur.parentElement;
      }
    }

    return null;
  }

  function installTopActions() {
    removeOldActionRows();

    const card = findHistoryFilterCard();
    if (!card) return;

    card.classList.add('history-filter-card-with-actions');
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';

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

    row.replaceChildren(tutorialBtn, pdfBtn);

    if (row.parentElement !== card) card.insertBefore(row, card.firstChild);
  }

  function ensureEmptyState() {
    const canvas = document.querySelector('canvas');
    const chartBox = canvas ? (canvas.closest('.chart-container, .history-chart-container, .admin-card, section, div') || canvas.parentElement) : null;
    if (!chartBox) return;

    if (getComputedStyle(chartBox).position === 'static') chartBox.style.position = 'relative';

    const emptyText = Array.from(document.querySelectorAll('*')).find(el => visible(el) && (
      hasText(el, 'Nenhum dado encontrado para o período') || hasText(el, 'Nenhum dado encontrado para o periodo')
    ));

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
    empty.style.display = emptyText ? 'flex' : 'none';
  }

  function boot() {
    installTopActions();
    ensureEmptyState();
    setInterval(() => {
      installTopActions();
      ensureEmptyState();
    }, LOOP_DELAY);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, READY_DELAY));
  } else {
    setTimeout(boot, READY_DELAY);
  }
})();
