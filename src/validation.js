let seconds = 3;
const label = document.querySelector('#count');
const timer = setInterval(() => {
    seconds--;
    label.textContent = seconds;
    if (seconds <= 0) {
        clearInterval(timer);
        location.href = 'confirmation.html';
    }
}, 1000);