let audioContext;
let analyser;
let currentScore = 0; // Variable para mantener el score actual
let maxIntensity = 0;
let lastIntensity = 0;
let isMeasuring = false;
let isScreaming = false;
let timer; // Variable para el temporizador
const isclosed = false;
let timerSwallClose = 0;

const intensityThreshold = 15;
const silenceThreshold = -40;
let microphone;

const startScream = document.getElementById('startingScream');
const counterScore = document.getElementById('counterScore');
const componentGameStart = document.getElementById('gameStart');
const plane = document.getElementById('plane');
const avion = document.getElementById('avion');
const btnReload = document.getElementById('reload');
const adviserStar = document.getElementById('adviserScream');
const gameTerminatedText = document.getElementById('titleGameTerminated');
const cardTerminatedGame = document.getElementById('cardPointsTerminated')

const overlay = document.getElementById('overlay');
const countdownElement = overlay.querySelector('.countdown');


document.addEventListener('DOMContentLoaded', () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
    })
    .catch(error => {
      console.error('Permiso denegado o hubo un error: ', error);
    });
})

function startAudioCapture() {
  console.info("Iniciando captura de audio...");

  // Verificar si el contexto de Audio ya está creado
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
  }

  // Solicitar acceso al micrófono
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      console.log(microphone)

      analyser.fftSize = 2048;
      maxIntensity = 0;
      isMeasuring = true;

      let bufferLength = analyser.frequencyBinCount;
      let dataArray = new Uint8Array(bufferLength);



      let digits = [
        document.getElementById("digit-1"),
        document.getElementById("digit-2"),
        document.getElementById("digit-3"),
        document.getElementById("digit-4"),
        document.getElementById("digit-5"),
        document.getElementById("digit-6"),
      ];

      // Función para procesar el audio y calcular el puntaje
      function processAudio() {
        analyser.getByteFrequencyData(dataArray);

        let sum = dataArray.reduce((acc, val) => acc + val, 0);
        let average = sum / bufferLength;

        let intensity = 20 * Math.log10(average) + 20;
        intensity = Math.max(intensity, 0);

        if (intensity > maxIntensity) {
          maxIntensity = intensity;
        }

        console.info("max: ", maxIntensity, " intensity: ", intensity);

        let percentage = (average / 255) * 100;
        percentage = Math.min(percentage, 100);

        // Calcular el nuevo score y multiplicarlo por 100
        let newScore = Math.round(percentage * 25);

        // Actualizar currentScore solo si newScore es mayor
        if (newScore > currentScore) {
          currentScore = newScore;
        }

        // Mostrar el score actualizado
        console.log("Score:", currentScore);
        updateCounter(currentScore, digits);

        if (isMeasuring) {
          console.log("entro a measuri")
          if (intensity <= maxIntensity && !isScreaming) {
            // Grito de gol detectado
            isScreaming = true;
            console.log(isScreaming)
            console.log('Grito de gol detectado');
          }

          console.log("antes if")
          setTimeout(() => {
            if (maxIntensity === 0) {
              close();
          
              console.log("en medio del if", maxIntensity);
          
              // Mostrar el toast
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'no gritaste, termino el juego',
                customClass: {
                  title: "text-center"
                },
                showConfirmButton: false, // Mostrar el botón de confirmación
                timer: 2500,
                timerProgressBar: true,
              }).then(() => {
                // Después de que el toast desaparezca, recargar la página
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              });
            }
          }, 3000);
          console.log("abajo if")


          if (isScreaming) {
            if (intensity < maxIntensity - 3) {
              close();
            } 
          } 
        }

        lastIntensity = intensity;

        // Llamar a processAudio aproximadamente cada 1/60 segundos
        if (isScreaming) {
          timer = setTimeout(processAudio, 1000 / 1);
        }


        if (!isScreaming) {

          // mostramos el boton
          btnReload.classList.remove('d-none')
          btnReload.classList.add('d-block')
        }
      }

      // Iniciar el proceso de audio
      processAudio();
    })
    .catch(function (err) {
      console.error("Error al acceder al micrófono:", err);
    });
}

function updateCounter(score, digits) {
  const scoreStr = String(score).padStart(digits.length, '0'); // Asegurar que siempre tenga 6 dígitos

  for (let i = 0; i < digits.length; i++) {
    const digitIndex = digits.length - 1 - i; // Distribuir desde el final al principio
    if (digits[digitIndex].innerText !== scoreStr[digitIndex]) {
      digits[digitIndex].style.transform = 'translateY(-100%)';
      setTimeout(() => {
        digits[digitIndex].innerText = scoreStr[digitIndex];
        digits[digitIndex].style.transform = 'translateY(0)';
      }, 500);
    }
  }
}

btnReload.addEventListener('click', () => {
  window.location.reload();
})

startScream.addEventListener('click', () => {
  let countdown = 5;

  // Mostrar el overlay
  overlay.style.display = 'block';

  // Actualizar el texto del countdown
  countdownElement.textContent = countdown;

  // Iniciar la cuenta regresiva
  const interval = setInterval(() => {
    countdown -= 1;
    if (countdown > 0) {
      countdownElement.textContent = countdown;
    } else {
      countdownElement.textContent = '¡Comienza!';
      clearInterval(interval);
      // Ocultar el overlay después de mostrar "¡Comienza!" por 2 segundo
      setTimeout(() => {
        overlay.style.display = 'none';
        componentGameStart.classList.add('d-none');
        counterScore.style.display = 'block';
        plane.style.display = 'block'
        startAudioCapture();
      }, 1000);
    }
  }, 1000);
})

function close() {

  // Fin del grito de gol
  microphone.disconnect();
  analyser.disconnect();
  audioContext.close();
  isMeasuring = false;
  isScreaming = false;
  // Detener cualquier temporizador activo
  clearTimeout(timer);
  avion.classList.add('d-none');

  // removemos el aviso
  adviserStar.classList.remove('d-block');
  adviserStar.classList.add('d-none');

  // mostramos titulo de puntos
  gameTerminatedText.classList.remove('d-none');
  gameTerminatedText.classList.add('d-block');

  // mostramos tu puntaje
  cardTerminatedGame.classList.remove('d-none');
  cardTerminatedGame.classList.add('d-block')
  console.log('Fin del grito de gol detectado');
}