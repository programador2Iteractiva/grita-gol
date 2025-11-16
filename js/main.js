// main.optimizado.js

let intensityHistory = [];
const smoothingWindow = 5; // últimos 5 frames


let audioContext, analyser, microphone;
let currentScore = 0;
let isMeasuring = false;
let isScreaming = false;
let animationId = null;
let hasClicked = false;

const intensityThreshold = 40;
const scoreInterval = 200;
const maxScore = 4000;
const imageCount = 5;
const images = [
  'assets/Medellin.png',
  'assets/Cordoba.png',
  'assets/Cancun.png',
  'assets/Tampa.png',
  'assets/Madrid.png'
];

const ui = {
  startScream: document.getElementById('startingScream'),
  counterScore: document.getElementById('counterScore'),
  gameStart: document.getElementById('gameStart'),
  plane: document.getElementById('plane'),
  avion: document.getElementById('avion'),
  reload: document.getElementById('reload'),
  adviser: document.getElementById('adviserScream'),
  title: document.getElementById('titleGameTerminated'),
  card: document.getElementById('cardPointsTerminated'),
  overlay: document.getElementById('overlay'),
  countdown: document.querySelector('#overlay .countdown'),
  intro: document.getElementById('introSection'),
  game: document.getElementById('gameSection'),
  startBtn: document.getElementById('startGameBtn'),
  footer: document.getElementById('footerImage'),
  finalImage: document.getElementById('finalImageFull'),
  finalSection: document.getElementById('finalImageSection'),
  finalSectionWithBtn: document.getElementById('finalImageSectionWithButton'),
  lastImage: document.getElementById('lastImage'),
  body: document.querySelector('[name="body"]')
};

function initMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn("❌ Este navegador no soporta getUserMedia o no está disponible en contexto inseguro (usa HTTPS).");
    return;
  }

  navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: false,
    }
  })
    .then(() => {
      console.log("✅ Permiso para micrófono concedido.");
    })
    .catch(error => {
      console.error("❌ Error al solicitar acceso al micrófono:", error);
    });
}


function updateDigit(digitElement, value) {
  const container = digitElement.querySelector('.digit-inner');
  const digitHeight = container.querySelector('.card-number').offsetHeight;
  const translateY = -value * digitHeight;

  container.style.transform = `translateY(${translateY}px)`;
}

function updateCounter(score) {
  const digits = score.toString().padStart(6, '0').split('');
  document.querySelectorAll('.digit').forEach((d, i) => updateDigit(d, parseInt(digits[i])));
}

function getImageForScore(score) {
  if (score < 800) return images[0];             // Medellin
  if (score < 1600) return images[1];            // Cordoba
  if (score < 2400) return images[2];            // Cancun
  if (score < 3200) return images[3];            // Tampa
  return images[4];                              // Madrid
}

function closeGame() {
  microphone.disconnect();
  analyser.disconnect();
  audioContext.close();

  isMeasuring = false;
  isScreaming = false;
  cancelAnimationFrame(animationId);

  ui.avion.classList.add('d-none');
  ui.adviser.classList.replace('d-block', 'd-none');
  ui.title.classList.replace('d-none', 'd-block');
  ui.card.classList.replace('d-none', 'd-block');
  document.querySelector('.title-puntaje').textContent = 'Has logrado decibeles';

  const finalImage = getImageForScore(currentScore);
  ui.finalImage.src = finalImage;

  ui.body.classList.remove('state-game');
  ui.body.classList.add('state-scoring');

  setTimeout(() => {
    ui.card.classList.replace('d-block', 'd-none');
    ui.footer.style.display = 'none';
    ui.finalSection.style.display = 'block';
    ui.body.classList.remove('state-scoring');
    ui.body.classList.add('state-final-image');
  }, 4000);

  setTimeout(() => {
    ui.finalSection.style.display = 'none';
    ui.finalSectionWithBtn.style.display = 'block';
    ui.footer.style.display = 'block';
    ui.reload.classList.remove('d-none');
    ui.body.classList.remove('state-final-image');
    ui.body.classList.add('state-final-buttons');

  }, 10000);

  ui.body.id = 'reload';
  ui.body.addEventListener('click', () => window.location.reload());
}

function processAudio(bufferLength, dataArray) {
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
  const intensity = 20 * Math.log10(average) + 20;

  intensityHistory.push(intensity);
  if (intensityHistory.length > smoothingWindow) {
    intensityHistory.shift(); // eliminar el más antiguo
  }
  const smoothedIntensity = intensityHistory.reduce((a, b) => a + b, 0) / intensityHistory.length;

  if (smoothedIntensity > intensityThreshold && !isScreaming) {
    isScreaming = true;
    console.log(`🚀 Comenzó el grito: intensidad ${smoothedIntensity.toFixed(2)} dB > umbral (${intensityThreshold} dB)`);
  }

  if (isScreaming) {
    if (smoothedIntensity < intensityThreshold - 5) {
      console.log(`🎤 El grito terminó: intensidad actual ${smoothedIntensity.toFixed(2)} dB < umbral mínimo (${intensityThreshold - 5} dB)`);
      return closeGame();
    }
    currentScore += 2;
  } else {
    const baseScore = Math.round((average / 256) * 25);
    if (baseScore > currentScore) currentScore = baseScore;
  }

  updateCounter(currentScore);
  animationId = requestAnimationFrame(() => processAudio(bufferLength, dataArray));
}

function startAudioCapture() {
  if (!audioContext) {
    audioContext = new (window.AudioContext)();
    analyser = audioContext.createAnalyser();
  }

  navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: false,
    }
  }).then(stream => {
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    processAudio(bufferLength, dataArray);
  }).catch(console.error);
}

function startCountdown() {
  if (hasClicked) return;
  hasClicked = true;

  ui.body.classList.remove('state-scream-setup');
  ui.body.classList.add('state-game');

  let countdown = 5;
  ui.overlay.style.display = 'block';
  ui.countdown.textContent = countdown;

  const int = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      ui.countdown.textContent = countdown;
    } else {
      clearInterval(int);
      ui.countdown.textContent = '¡Comienza!';
      setTimeout(() => {
        ui.overlay.style.display = 'none';
        ui.gameStart.classList.add('d-none');
        ui.counterScore.style.display = 'block';
        ui.plane.style.display = 'block';
        startAudioCapture();
      }, 1000);
    }
  }, 1000);
}

function setupListeners() {
  const startEvent = e => {
    e.preventDefault();
    startCountdown();
  };

  ui.startScream.addEventListener('click', startEvent);
  ui.startScream.addEventListener('touchstart', startEvent, { passive: false }); // importante

  ui.startBtn.addEventListener('click', e => {
    e.preventDefault();
    setTimeout(() => {
      ui.intro.style.display = 'none';
      ui.game.style.display = 'block';
      ui.body.classList.remove('state-intro');
      ui.body.classList.add('state-scream-setup');
    }, 50);
  });

  ui.reload.addEventListener('click', () => window.location.reload());
}


document.addEventListener('DOMContentLoaded', () => {
  initMic();
  setupListeners();
  ui.body.classList.add('state-intro');
});