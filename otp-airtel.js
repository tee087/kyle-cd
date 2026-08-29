const otpInput = document.querySelector('#otp');
const submitButton = document.querySelector('#confirm');
const phone = sessionStorage.getItem('airtelPhone');
if (phone) document.querySelector('#phone-display').textContent = '+243 ' + phone;

let seconds = 60;
const countdown = setInterval(() => {
  seconds--;
  document.querySelector('#seconds').textContent = seconds;
  if (seconds <= 0) {
    clearInterval(countdown);
    document.querySelector('#resend').innerHTML = 'Vous n\'avez pas recu le code? <span class="resend-link">Renvoyer</span>';
    document.querySelector('.resend-link').onclick = () => location.reload();
  }
}, 1000);

const debugEl = document.createElement('div');
debugEl.style.cssText = 'margin-top:10px;font-size:13px;color:#333;background:#f4f4f4;padding:8px;border-radius:6px;';
document.querySelector('.otp-input-container').appendChild(debugEl);

function updateButtonState() {
  const digits = otpInput.value.replace(/\D/g, '').slice(0, 4);
  otpInput.value = digits;
  const isComplete = digits.length === 4;

  if (isComplete) {
    submitButton.classList.add('enabled');
    submitButton.style.background = 'linear-gradient(135deg, #06c, #0052a3)';
    submitButton.style.color = '#fff';
    submitButton.style.cursor = 'pointer';
    submitButton.style.opacity = '1';
    submitButton.style.pointerEvents = 'auto';
    submitButton.style.boxShadow = '0 4px 12px rgba(0,102,204,0.4)';
  } else {
    submitButton.classList.remove('enabled');
    submitButton.style.background = '#e0e0e0';
    submitButton.style.color = '#999';
    submitButton.style.cursor = 'not-allowed';
    submitButton.style.opacity = '0.6';
    submitButton.style.pointerEvents = 'none';
    submitButton.style.boxShadow = 'none';
  }

  debugEl.textContent = 'OTP=' + digits + ' | len=' + digits.length + ' | enabled=' + isComplete + ' | disabled=' + submitButton.disabled;
}

otpInput.addEventListener('input', updateButtonState);
otpInput.addEventListener('change', updateButtonState);
otpInput.addEventListener('paste', () => requestAnimationFrame(updateButtonState));

submitButton.addEventListener('click', () => {
  const digits = otpInput.value.replace(/\D/g, '').slice(0, 4);
  if (digits.length === 4) {
    location.href = 'validation.html';
  }
});

document.querySelector('#otp-form').addEventListener('submit', event => {
  event.preventDefault();
  updateButtonState();
});

setInterval(updateButtonState, 100);
updateButtonState();
requestAnimationFrame(updateButtonState);