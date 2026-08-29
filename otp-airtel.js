const otpInput=document.querySelector('#otp');
const submitButton=document.querySelector('#confirm');
const phone=sessionStorage.getItem('airtelPhone');
if(phone)document.querySelector('#phone-display').textContent=`+243 ${phone}`;
otpInput.addEventListener('input',()=>{otpInput.value=otpInput.value.replace(/\D/g,'').slice(0,4);const ready=otpInput.value.length===4;submitButton.disabled=!ready;submitButton.classList.toggle('active',ready);});
document.querySelector('#otp-form').addEventListener('submit',event=>{event.preventDefault();if(otpInput.value.length===4)location.href='validation.html';});
let seconds=60;const countdown=setInterval(()=>{seconds--;document.querySelector('#seconds').textContent=seconds;if(seconds<=0){clearInterval(countdown);document.querySelector('#resend').innerHTML='Vous n\'avez pas reçu le code? <span class="resend-link">Renvoyer</span>';document.querySelector('.resend-link').onclick=()=>{seconds=60;location.reload();};}},1000);
