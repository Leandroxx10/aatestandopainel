// ================= CONFIGURAÇÃO DO FIREBASE =================

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyACjKi3thEvR4NJryXLWeXhA5Lpwc8f9cA",
  authDomain: "painelinfomaq.firebaseapp.com",
  databaseURL: "https://painelinfomaq-default-rtdb.firebaseio.com",
  projectId: "painelinfomaq",
  storageBucket: "painelinfomaq.firebasestorage.app",
  messagingSenderId: "79791250650",
  appId: "1:79791250650:web:9f0b0efeaaaf0e28a3d9e3"
};

// Inicializar Firebase
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

// Obter serviços do Firebase
const auth = firebase.auth();
const db = firebase.database();

// Referências principais
const maquinasRef = db.ref("maquinas");
const historicoRef = db.ref("historico");
const comentariosRef = db.ref("comentarios");
const imagensRef = db.ref("imagens");
const adminConfigRef = db.ref("adminConfig");
const manutencaoRef = db.ref("manutencao"); // NOVO: Status de manutenção

// ================= FUNÇÕES DE CONFIGURAÇÃO =================

// Limites padrão
const DEFAULT_LIMITS = {
    CRITICO: 3,
    BAIXO: 5,
    NORMAL: 6
};

// Carregar limites específicos da máquina
async function getLimitsForMachine(machineId) {
    return new Promise((resolve, reject) => {
        adminConfigRef.child("machineLimits").child(machineId).once("value")
            .then(snapshot => {
                const customLimits = snapshot.val();
                if (customLimits) {
                    resolve({
                        CRITICO: customLimits.critico || DEFAULT_LIMITS.CRITICO,
                        BAIXO: customLimits.baixo || DEFAULT_LIMITS.BAIXO,
                        NORMAL: customLimits.normal || DEFAULT_LIMITS.NORMAL
                    });
                } else {
                    resolve({ ...DEFAULT_LIMITS });
                }
            })
            .catch(error => {
                console.error("❌ Erro ao carregar limites:", error);
                reject(error);
            });
    });
}

// Salvar limites da máquina
async function saveMachineLimits(machineId, limits) {
    return new Promise((resolve, reject) => {
        adminConfigRef.child("machineLimits").child(machineId).set(limits)
            .then(() => {
                console.log(`✅ Limites salvos para máquina ${machineId}:`, limits);
                resolve(true);
            })
            .catch(error => {
                console.error(`❌ Erro ao salvar limites para máquina ${machineId}:`, error);
                reject(error);
            });
    });
}

// ================= FUNÇÕES DE MANUTENÇÃO =================

// Definir status de manutenção da máquina
async function setMachineMaintenance(machineId, isInMaintenance, reason = "") {
    console.log(`🔧 Definindo manutenção para ${machineId}: ${isInMaintenance}, motivo: "${reason}"`);
    
    return new Promise((resolve, reject) => {
        if (isInMaintenance) {
            // Colocar em manutenção
            const maintenanceData = {
                isInMaintenance: true,
                reason: reason,
                startedAt: Date.now(),
                startedBy: 'Administrador',
                updatedAt: Date.now()
            };
            
            manutencaoRef.child(machineId).set(maintenanceData)
                .then(() => {
                    console.log(`✅ Máquina ${machineId} colocada em manutenção`);
                    resolve(true);
                })
                .catch(error => {
                    console.error(`❌ Erro ao colocar máquina ${machineId} em manutenção:`, error);
                    reject(error);
                });
        } else {
            // Retirar da manutenção
            manutencaoRef.child(machineId).remove()
                .then(() => {
                    console.log(`✅ Máquina ${machineId} retirada da manutenção`);
                    resolve(true);
                })
                .catch(error => {
                    console.error(`❌ Erro ao retirar máquina ${machineId} da manutenção:`, error);
                    reject(error);
                });
        }
    });
}

// Obter status de manutenção da máquina
async function getMachineMaintenanceStatus(machineId) {
    return new Promise((resolve, reject) => {
        manutencaoRef.child(machineId).once("value")
            .then(snapshot => {
                const data = snapshot.val();
                resolve(data || { isInMaintenance: false });
            })
            .catch(error => {
                console.error(`❌ Erro ao obter status de manutenção da máquina ${machineId}:`, error);
                reject(error);
            });
    });
}

// ================= FUNÇÕES AUXILIARES =================

// Verificar conexão com o Firebase
function checkFirebaseConnection() {
    const connectedRef = db.ref(".info/connected");
    connectedRef.on("value", function(snap) {
        if (snap.val() === true) {
            console.log("✅ Conectado ao Firebase");
            updateConnectionStatus('connected', 'Conectado ao servidor');
        } else {
            console.log("⚠️ Desconectado do Firebase");
            updateConnectionStatus('disconnected', 'Desconectado do servidor');
        }
    });
}

// Atualizar status de conexão na interface
function updateConnectionStatus(status, message) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = message;
        
        switch(status) {
            case 'connected':
                statusElement.style.color = 'var(--success)';
                break;
            case 'disconnected':
                statusElement.style.color = 'var(--danger)';
                break;
            case 'loading':
                statusElement.style.color = 'var(--warning)';
                break;
        }
    }
}

// Inicializar verificação de conexão
document.addEventListener('DOMContentLoaded', function() {
    checkFirebaseConnection();
});

// Exportar para uso global
window.db = db;
window.auth = auth;
window.maquinasRef = maquinasRef;
window.historicoRef = historicoRef;
window.comentariosRef = comentariosRef;
window.imagensRef = imagensRef;
window.adminConfigRef = adminConfigRef;
window.manutencaoRef = manutencaoRef;
window.DEFAULT_LIMITS = DEFAULT_LIMITS;
window.getLimitsForMachine = getLimitsForMachine;
window.saveMachineLimits = saveMachineLimits;
window.setMachineMaintenance = setMachineMaintenance;
window.getMachineMaintenanceStatus = getMachineMaintenanceStatus;

console.log("✅ Firebase configurado e funções exportadas");