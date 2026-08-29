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

function updateButtonState() {
  otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 4);
  const isComplete = otpInput.value.length === 4;
  submitButton.disabled = !isComplete;
  submitButton.classList.toggle('enabled', isComplete);
}

otpInput.addEventListener('input', updateButtonState);
otpInput.addEventListener('change', updateButtonState);
otpInput.addEventListener('paste', () => requestAnimationFrame(updateButtonState));

document.querySelector('#otp-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!submitButton.disabled) location.href = 'validation.html';
});

updateButtonState();
requestAnimationFrame(updateButtonState);