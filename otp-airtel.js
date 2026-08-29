const otpInput = document.querySelector('#otp');
const submitButton = document.querySelector('#confirm');
const otpForm = document.querySelector('#otp-form');
const phone = sessionStorage.getItem('airtelPhone');

if (phone) document.querySelector('#phone-display').textContent = '+243 ' + phone;

function updateButtonState() {
  // Keep the field numeric even for pasted or autofilled codes.
  otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 4);
  const isComplete = otpInput.value.length === 4;
  submitButton.disabled = !isComplete;
  submitButton.classList.toggle('active', isComplete);
  submitButton.setAttribute('aria-disabled', String(!isComplete));
}

otpInput.addEventListener('input', updateButtonState);
otpInput.addEventListener('change', updateButtonState);
otpInput.addEventListener('paste', () => requestAnimationFrame(updateButtonState));
otpInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && otpInput.value.length !== 4) event.preventDefault();
});

// Covers browser OTP autofill, which may happen after the page has loaded.
updateButtonState();
requestAnimationFrame(updateButtonState);

otpForm.addEventListener('submit', event => {
  event.preventDefault();
  updateButtonState();
  if (!submitButton.disabled) location.href = 'validation.html';
});

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
