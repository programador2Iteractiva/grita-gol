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
let animationId = null;
let interval;

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
const bodyElement = document.querySelector('[name="body"]');
const countdownElement = overlay.querySelector('.countdown');

const introSection = document.getElementById('introSection');
const gameSection = document.getElementById('gameSection');
const startGameBtn = document.getElementById('startGameBtn');
const footerImage = document.getElementById('footerImage')


document.addEventListener('DOMContentLoaded', () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
    })
    .catch(error => {
      console.error('Permiso denegado o hubo un error: ', error);
    });
})

startGameBtn.addEventListener('click', (event) => {
  event.stopPropagation(); // Evita que el evento se propague
  // Opcional: prevenir acción por defecto
  event.preventDefault();

  // Agrega un retardo pequeño para cambiar de sección
  setTimeout(() => {
    introSection.style.display = 'none';
    gameSection.style.display = 'block';
  }, 50);
});

// Function to start audio capture
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

      console.log(microphone);

      analyser.fftSize = 2048;
      maxIntensity = 0;
      isMeasuring = true;

      let bufferLength = analyser.frequencyBinCount;
      let dataArray = new Uint8Array(bufferLength);

      // Función para procesar el audio y calcular el puntaje
      function processAudio() {
        analyser.getByteFrequencyData(dataArray);

        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / bufferLength;
        const intensity = 20 * Math.log10(average) + 20;

        // Score basado en intensidad
        const percentage = average / 256;
        const baseScore = Math.round(percentage * 25);

        const screamThreshold = 30; // define tu propio umbral

        // Si supera el umbral, empieza el grito
        if (intensity > screamThreshold && !isScreaming) {
          isScreaming = true;
        }

        // Mientras se mantenga gritando
        if (isScreaming) {
          // Si bajó la intensidad, termina el grito
          if (intensity < screamThreshold - 5) {
            close();
            return;
          }

          // Sumar score por duración del grito
          currentScore += 2;
          console.log("Puntaje actual:", Math.floor(currentScore));
          updateCounter(currentScore);
        } else {
          // Aún no está gritando, pero actualizamos el score si la intensidad supera lo anterior
          if (baseScore > currentScore) {
            currentScore = baseScore;
            updateCounter(currentScore);
          }
        }

        animationId = requestAnimationFrame(processAudio);
      }


      // Iniciar el proceso de audio
      processAudio();
    })
    .catch(function (err) {
      console.error("Error al acceder al micrófono:", err);
    });
}

// Function to update a single digit
// function updateDigit(digit, value) {
//   var digitHeight = $(digit).children('div').height(); // Adjust this to your digit height
//   var translateY = -value * digitHeight;
//   $(digit).children('div').css('transform', 'translateY(' + translateY + 'px)');
// }

function updateDigit(digit, value) {
  // digit es el div con clase "digit"
  var isLastDigit = $(digit).hasClass('last-digit');

  var digitHeight = $(digit).children('div').height(); // Adjust this to your digit height
  var translateY = -value * digitHeight;

  // Aplicamos la animación: más lenta para el último dígito
  if (isLastDigit) {
    $(digit).children('div').css('transition', 'transform 1s ease-out');
    $(digit).children('div').css('transform', 'translateY(' + translateY + 'px)');
  } else {
    $(digit).children('div').css('transition', 'transform 0s ease-out');
    $(digit).children('div').css('transform', 'translateY(' + translateY + 'px)');
  }
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


startScream.addEventListener('click', (event) => {
  event.stopPropagation();
  event.preventDefault();
  console.log("Click en startingScream");
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
  // document.querySelector('.title-puntaje').textContent = 'Has logrado ' + currentScore + ' decibeles';
  document.querySelector('.title-puntaje').textContent = 'Has logrado decibeles';
  console.log('Fin del grito de gol detectado');

  // >>> Lógica adicional para determinar la imagen final según el score <<<
  const maxScore = 4000; // Puntaje máximo alcanzable
  const imageCount = 5; // Número de imágenes disponibles
  const imageRanges = maxScore / imageCount; // Definimos el rango de cada imagen

  const lastImage = 'assets/Fondo.png';

  // Array de rutas de imágenes
  const images = [
    'assets/Medellin.png',  // 0 - 800
    'assets/Cordoba.png', // 800 - 1600
    'assets/Cancun.png', // 1600 - 2400
    'assets/Tampa.png', // 2400 - 3200
    'assets/Madrid.png'// 3200 - 4000
  ];

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Función para determinar la imagen según el puntaje del usuario
  function getImageForScore(score) {

    console.log(score);

    const index = Math.min(Math.floor(score / imageRanges), imageCount - 1);

    console.log('index', index)

    if (score >= maxScore) {
      console.log('Entro', images.length - 1)
      console.log(images[images.length - 1]);
      return images[images.length - 1];
    } else {
      return images[index];
    }

  }

  // Obtener la imagen correspondiente al puntaje final
  const finalImagePath = getImageForScore(currentScore);

  // Actualizamos el src del elemento que usaremos para la imagen a pantalla completa
  document.getElementById('finalImageFull').src = finalImagePath;
  // Nota: Si el elemento 'finalImage' no existe, no lo actualizamos.
  // >>> Fin de la lógica adicional <<<

  // Nueva lógica para mostrar la imagen de fondo y el botón con delays

  // 1. Después de 10 segundos se oculta la card de puntos y se muestra la sección de imagen final
  setTimeout(() => {
    console.log("Mostrando la imagen final a pantalla completa");
    cardTerminatedGame.classList.add('d-none');
    cardTerminatedGame.classList.remove('d-block');
    document.getElementById('footerImage').style.display = 'none';
    document.getElementById('finalImageSection').style.display = 'block';
  }, 4000); // 10 segundos

  // 2. Después de 20 segundos en total (10 segundos más) se oculta la sección anterior y se muestra la sección con imagen y botón
  setTimeout(() => {
    console.log("Mostrando la sección de imagen final con botón");
    // Ocultamos la sección sin botón
    document.getElementById('finalImageSection').style.display = 'none';
    // Mostramos la sección que contiene la imagen y el botón
    document.getElementById('finalImageSectionWithButton').style.display = 'block';
    document.getElementById('footerImage').style.display = 'block';

    // Mostramos el botón de reinicio
    btnReload.classList.remove('d-none');
    // btnReload.classList.add('d-block');

    document.getElementById('lastImage').src = lastImage;
  }, 10000);// 20 segundos

  bodyElement.id = 'reload'

  if (bodyElement.id === 'reload') {
    bodyElement.addEventListener('click', () => {
      window.location.reload();
    })
  }
}


btnReload.addEventListener('click', () => {
  window.location.reload();
})