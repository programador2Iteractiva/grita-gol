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
var digitHeight = $('.digit div').height();

const intensityThreshold = 15;
const silenceThreshold = -40;
let microphone;
var hasclicked = false;

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
  let percentage = 0; // Inicializa percentage a 0
  let screamSeconds = 0; // Variable para contar los segundos del grito
  let silenceTimer = null; // Timer para detectar silencio

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

      console.log(microphone);

      analyser.fftSize = 2048;
      maxIntensity = 0;
      isMeasuring = true;

      let bufferLength = analyser.frequencyBinCount;
      let dataArray = new Uint8Array(bufferLength);

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

        // Calcular percentage considerando screamSeconds
        percentage = ((average / 255) * 100) + screamSeconds; // Suma screamSeconds al percentage
        percentage = Math.min(percentage, 100);

        // Calcular el nuevo score y multiplicarlo por 100
        let newScore = Math.round(percentage * 25);

        // Actualizar currentScore solo si newScore es mayor
        if (newScore > currentScore) {
          currentScore = newScore;
          updateCounter(currentScore); // Actualiza el contador cuando cambia el puntaje
        }

        // Mostrar el puntaje actualizado
        console.log("Puntaje:", currentScore);

        // Lógica para detectar si el usuario está hablando (gritando)
        if (isMeasuring) {
          console.log("Entrando a medición");
          if (intensity <= maxIntensity && !isScreaming) {
            // Grito detectado
            isScreaming = true;
            screamSeconds = 0; // Reiniciar los segundos de grito
            console.log(isScreaming);
            console.log('¡Grito detectado!');

            // Reiniciar el temporizador de silencio si existe
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
          } else if (isScreaming && intensity > maxIntensity) {
            // Si estamos gritando pero la intensidad es alta, considerar que aún se está gritando
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
          } else {
            // Si no se detecta un grito, iniciar el temporizador de silencio
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
                  }, 2500);
                });
              }
            }, 1500);


          }

          // Si se está gritando, incrementar los segundos de grito
          if (isScreaming) {
            screamSeconds++;
          }
        }

        if (isScreaming) {
          if (intensity < maxIntensity - 0.5) {
            close();
          }
        }

        // Si no se detecta un grito, mostrar el botón de recarga
        if (!isScreaming) {
          btnReload.classList.remove('d-none');
          btnReload.classList.add('d-block');
        }

        // Reiniciar el temporizador para procesar el audio
        if (isScreaming) {
          clearTimeout(timer);
          timer = setTimeout(processAudio, 1000 / 1);
        }
      }

      // Iniciar el proceso de audio
      processAudio();
    })
    .catch(function (err) {
      console.error("Error al acceder al micrófono:", err);
    });
}


// Function to update a single digit
function updateDigit(digit, value) {
  var digitHeight = $(digit).children('div').height(); // Adjust this to your digit height
  var translateY = -value * digitHeight;
  $(digit).children('div').css('transform', 'translateY(' + translateY + 'px)');
}

// Function to update the counter display
function updateCounter(number) {
  var numberStr = number.toString().padStart(6, '0'); // Adjust to 6 digits
  $('.digit').each(function (index) {
    var digitValue = parseInt(numberStr[index]);
    updateDigit(this, digitValue);
  });
}

// Function to start the counter animation
function startCounter(initialNumber, finalNumber) {
  targetNumber = finalNumber;
  clearInterval(interval);
  var currentNumber = initialNumber;

  // Determine the direction of the counter
  var increment = initialNumber < finalNumber ? 1 : -1;

  interval = setInterval(function () {
    updateCounter(currentNumber);
    currentNumber += increment;

    // Check if the final number is reached
    if ((increment > 0 && currentNumber > finalNumber) || (increment < 0 && currentNumber < finalNumber)) {
      clearInterval(interval);
      updateCounter(finalNumber); // Ensure the counter ends exactly at finalNumber
    }
  }, 200); // Increment every 200 ms
}

// Document ready function
$(document).ready(function () {
  $('#startCounter').click(function () {
    var inputNumber = parseInt($('#inputNumber').val());
    if (!isNaN(inputNumber)) {
      startCounter(0, inputNumber);
    }
  });
});



btnReload.addEventListener('click', () => {
  window.location.reload();
})

startScream.addEventListener('click', () => {
  if (hasclicked === true) {
    return;
  }


  hasclicked = true;

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