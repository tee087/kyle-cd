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
        document.querySelector('#resend').innerHTML = 'Vous n\'avez pas reçu le code? <span class="resend-link">Renvoyer</span>';
        document.querySelector('.resend-link').onclick = () => {
            seconds = 60;
            location.reload();
        };
    }
}, 1000);

function updateButtonState() {
    const ready = otpInput.value.length === 4;
    if (ready) {
        submitButton.disabled = false;
        submitButton.classList.add('active');
    } else {
        submitButton.disabled = true;
        submitButton.classList.remove('active');
    }
}

otpInput.addEventListener('input', () => {
    otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 4);
    const ready = otpInput.value.length === 4;
    submitButton.disabled = !ready;
});

otpInput.addEventListener('change', () => {
    const ready = otpInput.value.length === 4;
    submitButton.disabled = !ready;
});

// Also check on page load in case value is pre-filled
updateButtonState();

document.querySelector('#otp-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (otpInput.value.length === 4) {
        location.href = 'validation.html';
    }
});