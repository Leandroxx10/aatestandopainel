// ================= SCRIPT PRINCIPAL =================

// Configurações globais
let isDarkMode = false;
let currentUser = null;
// prefixDatabase removido aqui para evitar duplicação

// ================= TEMA =================
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('dashboardTheme') || 'light';
    console.log("🎨 Tema salvo:", savedTheme);
    
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}

function toggleTheme() {
    console.log("🔄 Alternando tema. Atual:", isDarkMode ? 'escuro' : 'claro');
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    localStorage.setItem('dashboardTheme', 'dark');
    
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
        themeBtn.style.background = 'var(--warning)';
        themeBtn.style.color = 'white';
    }
    
    console.log("🌙 Modo escuro ativado");
    
    if (typeof filteredMachinesData !== 'undefined' && Object.keys(filteredMachinesData).length > 0) {
        setTimeout(() => {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        }, 100);
    }
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    localStorage.setItem('dashboardTheme', 'light');
    
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i> Modo Escuro';
        themeBtn.style.background = '';
        themeBtn.style.color = '';
    }
    
    console.log("☀️ Modo claro ativado");
    
    if (typeof filteredMachinesData !== 'undefined' && Object.keys(filteredMachinesData).length > 0) {
        setTimeout(() => {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        }, 100);
    }
}

// ================= CARREGAR BANCO DE PREFIXOS PARA DASHBOARD =================
function loadPrefixDatabaseForDashboard() {
    if (typeof db === 'undefined') {
        console.warn("⚠️ Firebase não inicializado, tentando novamente em 2 segundos...");
        setTimeout(loadPrefixDatabaseForDashboard, 2000);
        return;
    }
    
    const prefixRef = db.ref("prefixDatabase");
    prefixRef.on("value", (snapshot) => {
        const data = snapshot.val() || {};
        window.prefixDatabase = data;
        console.log("✅ Banco de prefixos carregado para dashboard:", Object.keys(data).length, "prefixos");
    }, (error) => {
        console.error("❌ Erro ao carregar banco de prefixos:", error);
    });
}

// ================= CONFIGURAR BOTÕES =================
function setupButtons() {
    console.log("🔘 Configurando botões...");
    
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
        console.log("✅ Botão de tema configurado");
    }
    
    const refreshBtn = document.querySelector('[onclick*="refreshData"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
        console.log("✅ Botão de atualizar configurado");
    }
    
    const filtersBtn = document.getElementById('filtersBtn');
    if (filtersBtn) {
        filtersBtn.addEventListener('click', openFilters);
        console.log("✅ Botão de filtros configurado");
    }
}

// ================= ATUALIZAR DADOS =================
function refreshData() {
    console.log("🔄 Atualizando dados manualmente...");
    
    const btn = document.querySelector('[onclick*="refreshData"]');
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Atualizando...';
    btn.disabled = true;
    
    if (typeof maquinasRef !== 'undefined') {
        maquinasRef.once("value").then(snapshot => {
            const data = snapshot.val();
            if (data) {
                if (typeof allMachinesData !== 'undefined') {
                    allMachinesData = data;
                }
                
                if (typeof applyFilters === 'function') {
                    applyFilters();
                }
                
                if (typeof updateStatistics === 'function') {
                    updateStatistics();
                }
                
                updateLastUpdateTime();
                
                btn.innerHTML = '<i class="fas fa-check"></i> Atualizado!';
                btn.style.background = 'var(--success)';
                btn.style.color = 'white';
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.disabled = false;
                }, 1500);
                
                console.log("✅ Dados atualizados manualmente");
            }
        }).catch(error => {
            console.error("❌ Erro ao atualizar dados:", error);
            
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro!';
            btn.style.background = 'var(--danger)';
            btn.style.color = 'white';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 2000);
        });
    } else {
        console.error("❌ maquinasRef não está definido");
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// ================= INICIALIZAR TEMA =================
function initTheme() {
    checkSavedTheme();
}

// ================= FUNÇÃO DE ATUALIZAÇÃO =================
function updateLastUpdateTime() {
    const lastUpdateTime = document.getElementById('lastUpdateTime');
    if (!lastUpdateTime) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('pt-BR');
    
    lastUpdateTime.textContent = `${dateString} ${timeString}`;
}

// ================= FUNÇÕES DE FILTRO GLOBAIS =================
function openFilters() {
    console.log("🔍 Abrindo/fechando filtros...");
    
    const filtersBar = document.getElementById('filtersBar');
    const filtersBtn = document.getElementById('filtersBtn');
    
    if (!filtersBar || !filtersBtn) {
        console.error("❌ Elementos de filtro não encontrados");
        return;
    }
    
    const isActive = filtersBar.classList.contains('active');
    
    if (isActive) {
        filtersBar.classList.remove('active');
        filtersBtn.innerHTML = '<i class="fas fa-filter"></i> Filtros';
        filtersBtn.style.background = '';
        filtersBtn.style.color = '';
        console.log("📌 Filtros fechados");
    } else {
        filtersBar.classList.add('active');
        filtersBtn.innerHTML = '<i class="fas fa-times"></i> Fechar Filtros';
        filtersBtn.style.background = 'var(--primary)';
        filtersBtn.style.color = 'white';
        console.log("📌 Filtros abertos");
    }
}

// ================= FUNÇÕES DE FILTRO CORRIGIDAS =================
function toggleFornoFilter(forno) {
    console.log(`🔥 Alternando filtro do forno ${forno}`);
    
    const btn = document.querySelector(`.filter-btn[data-forno="${forno}"]`);
    if (!btn) return;
    
    btn.classList.toggle('active');
    
    if (typeof activeFilters !== 'undefined') {
        if (btn.classList.contains('active')) {
            if (!activeFilters.fornos.includes(forno)) {
                activeFilters.fornos.push(forno);
            }
        } else {
            activeFilters.fornos = activeFilters.fornos.filter(f => f !== forno);
        }
        
        console.log("Fornos ativos:", activeFilters.fornos);
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    }
}

function toggleStatusFilter(status) {
    console.log(`⚠️ Alternando filtro de status: ${status}`);
    
    document.querySelectorAll('.filter-btn[data-status]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const btn = document.querySelector(`.filter-btn[data-status="${status}"]`);
    if (btn) {
        btn.classList.add('active');
    }
    
    if (typeof activeFilters !== 'undefined') {
        let statusValue = '';
        switch(status) {
            case 'critico':
                statusValue = 'critical';
                break;
            case 'baixo':
                statusValue = 'warning';
                break;
            case 'normal':
                statusValue = 'normal';
                break;
        }
        
        activeFilters.status = statusValue;
        
        console.log("Status filtrado:", activeFilters.status);
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    }
}

function clearFornoFilters() {
    console.log("🧹 Limpando filtros de forno");
    
    document.querySelectorAll('.filter-btn[data-forno]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (typeof activeFilters !== 'undefined') {
        activeFilters.fornos = [];
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    }
}

function clearStatusFilters() {
    console.log("🧹 Limpando filtros de status");
    
    document.querySelectorAll('.filter-btn[data-status]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (typeof activeFilters !== 'undefined') {
        activeFilters.status = null;
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    }
}

function filterMachinesBySearch() {
    const searchInput = document.getElementById('machineSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    console.log(`🔎 Buscando: ${searchTerm}`);
    
    if (typeof activeFilters !== 'undefined') {
        activeFilters.search = searchTerm;
        
        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    }
}

// ================= REDIMENSIONAMENTO DA JANELA =================
window.addEventListener('resize', function() {
    if (typeof filteredMachinesData !== 'undefined' && Object.keys(filteredMachinesData).length > 0) {
        setTimeout(() => {
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        }, 100);
    }
});

// ================= INICIALIZAÇÃO AUTOMÁTICA =================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM carregado, inicializando...");
    
    setupButtons();
    checkSavedTheme();
    setupFilterEvents();
    loadPrefixDatabaseForDashboard();
    
    console.log("✅ Script principal inicializado");
});

// ================= CONFIGURAR EVENTOS DOS FILTROS =================
function setupFilterEvents() {
    console.log("🔧 Configurando eventos dos filtros...");
    
    const clearFornoBtn = document.getElementById('clearFornoBtn');
    if (clearFornoBtn) {
        clearFornoBtn.addEventListener('click', clearFornoFilters);
        console.log("✅ Botão limpar forno configurado");
    }
    
    const clearStatusBtn = document.getElementById('clearStatusBtn');
    if (clearStatusBtn) {
        clearStatusBtn.addEventListener('click', clearStatusFilters);
        console.log("✅ Botão limpar status configurado");
    }
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const modal = document.getElementById('machineModal');
            if (modal) modal.classList.remove('active');
        });
        console.log("✅ Botão fechar modal configurado");
    }
    
    const searchInput = document.getElementById('machineSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterMachinesBySearch();
            }, 300);
        });
        console.log("✅ Busca configurada");
    }
    
    document.querySelectorAll('.filter-btn[data-forno]').forEach(btn => {
        const forno = btn.getAttribute('data-forno');
        btn.addEventListener('click', () => toggleFornoFilter(forno));
    });
    
    document.querySelectorAll('.filter-btn[data-status]').forEach(btn => {
        const status = btn.getAttribute('data-status');
        btn.addEventListener('click', () => toggleStatusFilter(status));
    });
    
    console.log("✅ Eventos de filtro configurados");
}

// ================= FUNÇÕES AUXILIARES GLOBAIS =================
function getGaugeColorWithLimits(value, limits) {
    if (!limits) return '#10b981';
    
    if (value <= limits.CRITICO) {
        return '#ef4444';
    } else if (value <= limits.BAIXO) {
        return '#f59e0b';
    } else {
        return '#10b981';
    }
}

function createCircularGauge(canvasId, value, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 45;
    const maxValue = 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    // Usar cinza escuro fixo para modo escuro
    if (document.body.classList.contains('dark-mode')) {
        ctx.strokeStyle = '#1e293b'; // Cinza escuro para modo dark
    } else {
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
    }
    
    ctx.lineWidth = 8;
    ctx.stroke();
    
    const progress = Math.min(value / maxValue, 1);
    const startAngle = Math.PI / 2;
    const endAngle = Math.PI * 2 * progress + startAngle;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    const pointAngle = endAngle;
    const pointX = centerX + radius * Math.cos(pointAngle);
    const pointY = centerY + radius * Math.sin(pointAngle);
    
    ctx.beginPath();
    ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Borda do ponto - também ajustada para modo escuro
    if (document.body.classList.contains('dark-mode')) {
        ctx.strokeStyle = '#e2e2e2'; // Cinza médio para modo dark
    } else {
        ctx.strokeStyle = 'white';
    }
    
    ctx.lineWidth = 3.5;
    ctx.stroke();
}

// ================= FUNÇÕES AUXILIARES PARA FILTROS =================
function clearAllFilters() {
    console.log("🧹 Limpando todos os filtros");
    
    clearFornoFilters();
    clearStatusFilters();
    
    const searchInput = document.getElementById('machineSearch');
    if (searchInput) searchInput.value = '';
    
    if (typeof activeFilters !== 'undefined') {
        activeFilters.search = '';
    }
    
    if (typeof applyFilters === 'function') {
        applyFilters();
    }
}

// ================= FUNÇÃO PARA RECRIAR MEDIDORES =================
function recreateGauges() {
    if (typeof filteredMachinesData !== 'undefined' && Object.keys(filteredMachinesData).length > 0) {
        setTimeout(() => {
            Object.keys(filteredMachinesData).forEach(machineId => {
                if (typeof getGaugeColorWithLimits === 'function' && typeof createCircularGauge === 'function') {
                    const machineData = filteredMachinesData[machineId];
                    const moldeValue = machineData.molde || 0;
                    const blankValue = machineData.blank || 0;
                    const limits = typeof machineLimits !== 'undefined' ? machineLimits[machineId] : DEFAULT_LIMITS;
                    
                    const moldeColor = getGaugeColorWithLimits(moldeValue, limits);
                    const blankColor = getGaugeColorWithLimits(blankValue, limits);
                    
                    const moldeCanvas = document.getElementById(`gauge-molde-${machineId}`);
                    const blankCanvas = document.getElementById(`gauge-blank-${machineId}`);
                    
                    if (moldeCanvas) {
                        createCircularGauge(`gauge-molde-${machineId}`, moldeValue, moldeColor);
                    }
                    
                    if (blankCanvas) {
                        createCircularGauge(`gauge-blank-${machineId}`, blankValue, blankColor);
                    }
                }
            });
        }, 100);
    }
}

// ================= FUNÇÃO PARA RENDERIZAR MÁQUINA COM PREFIXO =================
function renderMachineWithPrefix(machineId, machineData) {
    const prefixKey = adminPrefixes && adminPrefixes[machineId];
    let prefixInfo = '';
    
    if (prefixKey && typeof window.prefixDatabase !== 'undefined' && window.prefixDatabase[prefixKey]) {
        const prefixData = window.prefixDatabase[prefixKey];
        prefixInfo = `
            <div class="prefix-info" style="background: rgba(139, 92, 246, 0.1); padding: 8px 12px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #8b5cf6;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                    <i class="fas fa-tag" style="color: #8b5cf6;"></i>
                    <span style="font-weight: 600; color: var(--text);">${prefixKey}</span>
                    <span style="color: var(--text-light);">(${prefixData.processo || 'Sem processo'})</span>
                </div>
                ${prefixData.terminacoes?.prefixoMolde ? 
                    `<div style="font-size: 11px; color: var(--text); margin-top: 4px;">
                        <i class="fas fa-cube"></i> Molde: ${prefixData.terminacoes.prefixoMolde}
                    </div>` : ''}
                ${prefixData.terminacoes?.prefixoBlank ? 
                    `<div style="font-size: 11px; color: var(--text); margin-top: 2px;">
                        <i class="fas fa-square"></i> Blank: ${prefixData.terminacoes.prefixoBlank}
                    </div>` : ''}
            </div>
        `;
    }
    
    return prefixInfo;
}

// ================= EXPORTAÇÃO DE FUNÇÕES GLOBAIS =================
window.toggleFornoFilter = toggleFornoFilter;
window.toggleStatusFilter = toggleStatusFilter;
window.clearFornoFilters = clearFornoFilters;
window.clearStatusFilters = clearStatusFilters;
window.filterMachinesBySearch = filterMachinesBySearch;
window.clearAllFilters = clearAllFilters;
window.toggleTheme = toggleTheme;
window.refreshData = refreshData;
window.openFilters = openFilters;
window.renderMachineWithPrefix = renderMachineWithPrefix;
window.loadPrefixDatabaseForDashboard = loadPrefixDatabaseForDashboard;
