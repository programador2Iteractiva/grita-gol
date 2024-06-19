let audioContext;
let analyser;
let currentScore = 0; // Variable para mantener el score actual
let maxIntensity = 0;
let lastIntensity = 0;
let isMeasuring = false;
let isScreaming = false;
let timer; // Variable para el temporizador

const intensityThreshold = 15;
const silenceThreshold = -40;
let microphone;

const startScream = document.getElementById('startingScream');
const counterScore = document.getElementById('counterScore');
const componentGameStart = document.getElementById('gameStart');

const overlay = document.getElementById('overlay');
const countdownElement = overlay.querySelector('.countdown');

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

        console.info("max: ",maxIntensity, " intensity: ",intensity);

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

          if (isScreaming) {
            if (intensity < maxIntensity - 5) {
              // Fin del grito de gol
              stopAudioCapture();
              console.log('Fin del grito de gol detectado');
            }
          }
        }

        lastIntensity = intensity;

        // Llamar a processAudio aproximadamente cada 1/60 segundos
        timer = setTimeout(processAudio, 1000 / 1);
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
        startAudioCapture();
      }, 1000);
    }
  }, 1000);
})

// Función para detener la captura de audio
function stopAudioCapture() {
  microphone.disconnect();
  analyser.disconnect();
  audioContext.close();
  isMeasuring = false;
  isScreaming = false;
  // Detener cualquier temporizador activo
  clearTimeout(timer);
  
  if (microphone) {
    alert('Termino el tiempo :(');
  }

  // Cerrar el contexto de audio si está abierto
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close().then(function () {
      console.log("Contexto de audio cerrado correctamente.");
    });
  }
}