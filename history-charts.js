// ================= GRÁFICOS DE HISTÓRICO =================
// ATUALIZA APENAS COM NOVO REGISTRO OU ALTERAÇÃO REAL
// SEM ANIMAÇÃO INFINITA E SEM LOOP DE RECARREGAMENTO

(function() {
    "use strict";
    
    console.log("📊 Carregando módulo de gráficos...");
    
    let chart = null;
    let currentData = [];
    let currentMachine = '';
    let currentDate = '';
    let chartType = 'line';
    
    const CORES = {
        molde: '#2563eb',
        blank: '#4b5563',
        neckring: '#b45309',
        funil: '#6b7280'
    };
    
    let datasetVisibility = {
        molde: true,
        blank: true,
        neckring: true,
        funil: true
    };
    
    // Estado do listener realtime
    let historyListenerRef = null;
    let historyListenerHandler = null;
    let historyListenerMachine = null;
    let historyListenerDate = null;
    
    // Registros já conhecidos atualmente exibidos no gráfico
    // chave: id do registro
    // valor: assinatura do registro
    let knownHistoryEntries = {};
    
    // Impede múltiplos carregamentos concorrentes
    let isLoadingHistory = false;
    
    function buildRecordSignature(record) {
        return [
            record.timestamp || 0,
            record.hora || '',
            record.horaNum || 0,
            record.minutoNum || 0,
            record.molde || 0,
            record.blank || 0,
            record.neck_ring || 0,
            record.funil || 0,
            record.tipo || ''
        ].join('|');
    }
    
    // ===== BUSCAR HISTÓRICO REAL =====
    async function getHistoryFromFirebase(machineId, dataBR) {
        console.log(`🔍 Buscando histórico: Máquina ${machineId}, Data ${dataBR}`);
        
        return new Promise((resolve, reject) => {
            if (!machineId) {
                reject(new Error("Máquina não especificada"));
                return;
            }
            
            if (typeof historicoRef === 'undefined') {
                console.error("❌ historicoRef não está definido");
                resolve([]);
                return;
            }
            
            historicoRef.child(machineId).once('value')
                .then(snapshot => {
                    const records = snapshot.val() || {};
                    const resultados = [];
                    
                    const [dia, mes, ano] = dataBR.split('/').map(Number);
                    
                    Object.keys(records).forEach(key => {
                        const record = records[key];
                        
                        if (
                            record.data === dataBR ||
                            (record.dataISO && record.dataISO === `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`)
                        ) {
                            const data = new Date(record.timestamp || 0);
                            const hora = data.getHours();
                            const minuto = data.getMinutes();
                            
                            resultados.push({
                                id: key,
                                timestamp: record.timestamp,
                                hora: record.hora || `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
                                horaNum: record.horaNum !== undefined ? record.horaNum : hora,
                                minutoNum: record.minutoNum !== undefined ? record.minutoNum : minuto,
                                molde: record.molde !== undefined ? record.molde : (record.new_molde || 0),
                                blank: record.blank !== undefined ? record.blank : (record.new_blank || 0),
                                neck_ring: record.neck_ring !== undefined ? record.neck_ring : (record.new_neckring || 0),
                                funil: record.funil !== undefined ? record.funil : (record.new_funil || 0),
                                tipo: record.tipo || 'hourly'
                            });
                        }
                    });
                    
                    resultados.sort((a, b) => a.timestamp - b.timestamp);
                    resolve(resultados);
                })
                .catch(error => {
                    console.error("❌ Erro ao buscar histórico:", error);
                    resolve([]);
                });
        });
    }
        
    // ===== SELECT DE DATA =====
    function preencherSelectData() {
        const select = document.getElementById('historyDate');
        if (!select) return;
        
        select.innerHTML = '';
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 30; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() - i);
            
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            
            const dataBR = `${dia}/${mes}/${ano}`;
            const option = document.createElement('option');
            option.value = dataBR;
            option.textContent = dataBR + (i === 0 ? ' (Hoje)' : '');
            select.appendChild(option);
        }
        
        if (select.options.length > 0) {
            select.selectedIndex = 0;
            currentDate = select.value;
        }
    }
    
    // ===== SELECT DE MÁQUINA =====
    function preencherSelectMaquina() {
        const select = document.getElementById('historyMachineSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione uma máquina</option>';
        
        let maquinas = [];
        
        if (typeof window.allAdminMachines !== 'undefined' && window.allAdminMachines) {
            maquinas = Object.keys(window.allAdminMachines).sort();
        } else if (typeof window.allMachinesData !== 'undefined' && window.allMachinesData) {
            maquinas = Object.keys(window.allMachinesData).sort();
        }
        
        maquinas.forEach(maquina => {
            const option = document.createElement('option');
            option.value = maquina;
            option.textContent = `Máquina ${maquina}`;
            select.appendChild(option);
        });
    }
    
    // ===== EVENTOS =====
    function configurarEventos() {
        const machineSelect = document.getElementById('historyMachineSelect');
        if (machineSelect) {
            const novoSelect = machineSelect.cloneNode(true);
            machineSelect.parentNode.replaceChild(novoSelect, machineSelect);
            
            novoSelect.addEventListener('change', function() {
                currentMachine = this.value;
                
                const triggerButton = document.querySelector('.machine-select-button');
                if (triggerButton) {
                    const buttonText = triggerButton.querySelector('.selected-machine-text');
                    if (buttonText) {
                        buttonText.textContent = this.value ? `Máquina ${this.value}` : 'Selecionar máquina';
                    }
                }
                
                if (this.value && currentDate) {
                    carregarDados();
                }
            });
        }
        
        const dateSelect = document.getElementById('historyDate');
        if (dateSelect) {
            const novoDateSelect = dateSelect.cloneNode(true);
            dateSelect.parentNode.replaceChild(novoDateSelect, dateSelect);
            
            novoDateSelect.addEventListener('change', function() {
                currentDate = this.value;
                const machine = document.getElementById('historyMachineSelect')?.value;
                if (machine) {
                    carregarDados();
                }
            });
        }
        
        const generateBtn = document.querySelector('.btn-generate');
        if (generateBtn) {
            const novoBtn = generateBtn.cloneNode(true);
            generateBtn.parentNode.replaceChild(novoBtn, generateBtn);
            
            novoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                carregarDados();
            });
        }
        
        const toggleBtn = document.getElementById('toggleChartBtn');
        if (toggleBtn) {
            const novoToggle = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(novoToggle, toggleBtn);
            
            novoToggle.addEventListener('click', function(e) {
                e.preventDefault();
                toggleChartType();
            });
        }
    }
    
    function toggleChartType() {
        chartType = chartType === 'line' ? 'bar' : 'line';
        
        const btn = document.getElementById('toggleChartBtn');
        if (btn) {
            btn.innerHTML = chartType === 'line'
                ? '<i class="fas fa-chart-bar"></i> Barras'
                : '<i class="fas fa-chart-line"></i> Linha';
        }
        
        if (currentData.length > 0) {
            criarGrafico(currentData);
        }
    }
    
    // ===== CARREGAR DADOS =====
    async function carregarDados() {
        if (isLoadingHistory) return;
        
        const machineSelect = document.getElementById('historyMachineSelect');
        const dateSelect = document.getElementById('historyDate');
        
        const machine = machineSelect ? machineSelect.value : '';
        const data = dateSelect ? dateSelect.value : '';
        
        if (!machine) {
            showAlert('erro', 'Selecione uma máquina');
            return;
        }
        
        if (!data) {
            showAlert('erro', 'Selecione uma data');
            return;
        }
        
        currentMachine = machine;
        currentDate = data;
        isLoadingHistory = true;
        
        mostrarLoading();
        
        try {
            const dados = await getHistoryFromFirebase(machine, data);
            currentData = dados;
                        
            // Memória dos registros já conhecidos.
            // Isso evita que o replay inicial do Firebase gere atualização infinita.
            knownHistoryEntries = {};
            dados.forEach(item => {
                knownHistoryEntries[item.id] = buildRecordSignature(item);
            });
            
            const periodoAtivo = document.querySelector('.period-btn.active');
            let dadosFiltrados = dados;
            
            if (periodoAtivo) {
                const periodo = periodoAtivo.getAttribute('data-period');
                if (periodo === 'custom') {
                    const startTime = document.getElementById('customStartTime')?.value || '00:00';
                    const endTime = document.getElementById('customEndTime')?.value || '23:59';
                    dadosFiltrados = filtrarPorPeriodo(dados, startTime, endTime);
                }
            }
            
            if (dadosFiltrados.length === 0) {
                criarGraficoVazio();
                atualizarTabela([]);
                atualizarInsights([]);
                showAlert('info', 'Nenhum dado encontrado para este período');
            } else {
                criarGrafico(dadosFiltrados);
                atualizarTabela(dadosFiltrados);
                atualizarInsights(dadosFiltrados);
            }
            
            setupRealtimeHistoryListener(machine, data);
            
        } catch (error) {
            console.error("❌ Erro ao carregar dados:", error);
            showAlert('erro', 'Erro ao carregar dados: ' + error.message);
        } finally {
            esconderLoading();
            isLoadingHistory = false;
        }
    }
    
    // ===== LISTENER DO HISTÓRICO =====
    function setupRealtimeHistoryListener(machineId, dataBR) {
        if (historyListenerRef && historyListenerHandler) {
            try {
                historyListenerRef.off('child_added', historyListenerHandler);
                historyListenerRef.off('child_changed', historyListenerHandler);
            } catch (err) {
                console.warn('⚠️ Erro ao remover listeners antigos:', err);
            }
        }
        
        const [dia, mes, ano] = dataBR.split('/');
        const dateISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        const handler = function(snapshot) {
            const record = snapshot.val() || {};
            const recordId = snapshot.key;
            
            if (
                record.data === dataBR ||
                (record.dataISO && record.dataISO === dateISO)
            ) {
                const normalizedRecord = {
                    id: recordId,
                    timestamp: record.timestamp,
                    hora: record.hora,
                    horaNum: record.horaNum,
                    minutoNum: record.minutoNum,
                    molde: record.molde !== undefined ? record.molde : (record.new_molde || 0),
                    blank: record.blank !== undefined ? record.blank : (record.new_blank || 0),
                    neck_ring: record.neck_ring !== undefined ? record.neck_ring : (record.new_neckring || 0),
                    funil: record.funil !== undefined ? record.funil : (record.new_funil || 0),
                    tipo: record.tipo || 'hourly'
                };
                
                const newSignature = buildRecordSignature(normalizedRecord);
                const oldSignature = knownHistoryEntries[recordId];
                
                // Caso 1: registro novo
                // Caso 2: registro existente foi alterado
                if (!oldSignature || oldSignature !== newSignature) {
                    knownHistoryEntries[recordId] = newSignature;
                    
                    setTimeout(() => {
                        if (
                            document.getElementById('historyMachineSelect')?.value === machineId &&
                            document.getElementById('historyDate')?.value === dataBR
                        ) {
                            carregarDados();
                        }
                    }, 250);
                }
            }
        };
        
        // Query apenas da máquina selecionada
        const ref = historicoRef.child(machineId);
        ref.on('child_added', handler);
        ref.on('child_changed', handler);
        
        historyListenerRef = ref;
        historyListenerHandler = handler;
        historyListenerMachine = machineId;
        historyListenerDate = dataBR;
    }
    
    function filtrarPorPeriodo(dados, startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return dados.filter(item => {
            const itemMinutes = (item.horaNum || 0) * 60 + (item.minutoNum || 0);
            
            if (startMinutes <= endMinutes) {
                return itemMinutes >= startMinutes && itemMinutes <= endMinutes;
            } else {
                return itemMinutes >= startMinutes || itemMinutes <= endMinutes;
            }
        });
    }
        
    // ===== GRÁFICO =====
    function criarGrafico(dados) {
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (chart) {
            chart.destroy();
        }
        
        const pontos = dados.map(item => ({
            label: item.hora,
            horaNum: item.horaNum,
            minutoNum: item.minutoNum,
            molde: item.molde || 0,
            blank: item.blank || 0,
            neckring: item.neck_ring || 0,
            funil: item.funil || 0,
            tipo: item.tipo || 'hourly'
        }));
        
        pontos.sort((a, b) => {
            if (a.horaNum !== b.horaNum) return a.horaNum - b.horaNum;
            return a.minutoNum - b.minutoNum;
        });
        
        const labels = pontos.map(p => p.label);
        const moldeData = pontos.map(p => p.molde);
        const blankData = pontos.map(p => p.blank);
        const neckringData = pontos.map(p => p.neckring);
        const funilData = pontos.map(p => p.funil);
        
        const datasets = [];
        
        if (datasetVisibility.molde) {
            datasets.push({
                label: 'Moldes',
                data: moldeData,
                borderColor: CORES.molde,
                backgroundColor: chartType === 'bar' ? CORES.molde + '80' : 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1
            });
        }
        
        if (datasetVisibility.blank) {
            datasets.push({
                label: 'Blanks',
                data: blankData,
                borderColor: CORES.blank,
                backgroundColor: chartType === 'bar' ? CORES.blank + '80' : 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1
            });
        }
        
        if (datasetVisibility.neckring) {
            datasets.push({
                label: 'Neck Rings',
                data: neckringData,
                borderColor: CORES.neckring,
                backgroundColor: chartType === 'bar' ? CORES.neckring + '80' : 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1
            });
        }
        
        if (datasetVisibility.funil) {
            datasets.push({
                label: 'Funís',
                data: funilData,
                borderColor: CORES.funil,
                backgroundColor: chartType === 'bar' ? CORES.funil + '80' : 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1
            });
        }
        
        chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    function criarGraficoVazio() {
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        if (chart) {
            chart.destroy();
        }
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Nenhum dado encontrado para o período'
                    }
                }
            }
        });
    }
    
    function atualizarTabela(dados) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;
        
        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhum registro encontrado</td></tr>';
            return;
        }
        
        const ordenados = [...dados].sort((a, b) => {
            if (a.horaNum !== b.horaNum) return a.horaNum - b.horaNum;
            return a.minutoNum - b.minutoNum;
        });
        
        let html = '';
        ordenados.forEach(item => {
            const tipoIcon = item.tipo === 'real_time' ? '⚡' : '⏰';
            html += `
                <tr>
                    <td>${item.hora} ${tipoIcon}</td>
                    <td style="color: #2563eb; font-weight: 500;">${item.molde}</td>
                    <td style="color: #4b5563; font-weight: 500;">${item.blank}</td>
                    <td style="color: #b45309; font-weight: 500;">${item.neck_ring}</td>
                    <td style="color: #6b7280; font-weight: 500;">${item.funil}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    function atualizarInsights(dados) {
        const container = document.getElementById('chartInsights');
        if (!container) return;
        
        if (dados.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        let totalMolde = 0, totalBlank = 0, totalNeck = 0, totalFunil = 0;
        
        dados.forEach(item => {
            totalMolde += item.molde || 0;
            totalBlank += item.blank || 0;
            totalNeck += item.neck_ring || 0;
            totalFunil += item.funil || 0;
        });
        
        container.innerHTML = `
            <div style="display:flex;gap:20px;padding:20px;background:#f9fafb;border-radius:8px;margin-top:20px;flex-wrap:wrap;">
                <div><strong>Total Moldes:</strong> ${totalMolde}</div>
                <div><strong>Total Blanks:</strong> ${totalBlank}</div>
                <div><strong>Total Neck Rings:</strong> ${totalNeck}</div>
                <div><strong>Total Funís:</strong> ${totalFunil}</div>
                <div><strong>Registros:</strong> ${dados.length}</div>
            </div>
        `;
    }
    
    function configurarToggleButtons() {
        const toggleMolde = document.getElementById('toggleMolde');
        const toggleBlank = document.getElementById('toggleBlank');
        const toggleNeckring = document.getElementById('toggleNeckring');
        const toggleFunil = document.getElementById('toggleFunil');
        
        if (toggleMolde) {
            const novo = toggleMolde.cloneNode(true);
            toggleMolde.parentNode.replaceChild(novo, toggleMolde);
            novo.addEventListener('click', function() {
                datasetVisibility.molde = !datasetVisibility.molde;
                this.classList.toggle('active');
                if (currentData.length > 0) criarGrafico(currentData);
            });
        }
        
        if (toggleBlank) {
            const novo = toggleBlank.cloneNode(true);
            toggleBlank.parentNode.replaceChild(novo, toggleBlank);
            novo.addEventListener('click', function() {
                datasetVisibility.blank = !datasetVisibility.blank;
                this.classList.toggle('active');
                if (currentData.length > 0) criarGrafico(currentData);
            });
        }
        
        if (toggleNeckring) {
            const novo = toggleNeckring.cloneNode(true);
            toggleNeckring.parentNode.replaceChild(novo, toggleNeckring);
            novo.addEventListener('click', function() {
                datasetVisibility.neckring = !datasetVisibility.neckring;
                this.classList.toggle('active');
                if (currentData.length > 0) criarGrafico(currentData);
            });
        }
        
        if (toggleFunil) {
            const novo = toggleFunil.cloneNode(true);
            toggleFunil.parentNode.replaceChild(novo, toggleFunil);
            novo.addEventListener('click', function() {
                datasetVisibility.funil = !datasetVisibility.funil;
                this.classList.toggle('active');
                if (currentData.length > 0) criarGrafico(currentData);
            });
        }
    }
    
    function configurarPeriodButtons() {
        const buttons = document.querySelectorAll('.period-btn');
        
        buttons.forEach(btn => {
            const novo = btn.cloneNode(true);
            btn.parentNode.replaceChild(novo, btn);
            
            novo.addEventListener('click', function(e) {
                e.preventDefault();
                
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const periodo = this.getAttribute('data-period');
                const customContainer = document.getElementById('customTimeContainer');
                
                if (customContainer) {
                    customContainer.style.display = periodo === 'custom' ? 'block' : 'none';
                }
                
                if (currentData.length > 0 || (currentMachine && currentDate)) {
                    carregarDados();
                }
            });
        });
    }
    
    function mostrarLoading() {
        const container = document.querySelector('.chart-container');
        if (container) container.style.opacity = '0.6';
    }
    
    function esconderLoading() {
        const container = document.querySelector('.chart-container');
        if (container) container.style.opacity = '1';
    }
    
    function showAlert(type, message) {
        if (typeof window.showAlert === 'function') {
            window.showAlert(type, message);
        } else {
            alert(message);
        }
    }
    
    window.initHistorySection = function() {
        preencherSelectData();
        preencherSelectMaquina();
        configurarEventos();
        configurarToggleButtons();
        configurarPeriodButtons();
    };
    
    window.loadHistoryChart = carregarDados;
    window.toggleChartType = toggleChartType;
    
    console.log("✅ history-charts.js carregado");
    
})();