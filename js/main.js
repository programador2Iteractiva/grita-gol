// main.optimizado.js

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
  navigator.mediaDevices.getUserMedia({ audio: true }).catch(console.error);
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

  setTimeout(() => {
    ui.card.classList.replace('d-block', 'd-none');
    ui.footer.style.display = 'none';
    ui.finalSection.style.display = 'block';
  }, 4000);

  setTimeout(() => {
    ui.finalSection.style.display = 'none';
    ui.finalSectionWithBtn.style.display = 'block';
    ui.footer.style.display = 'block';
    ui.reload.classList.remove('d-none');
    ui.lastImage.src = 'assets/Fondo.png';
  }, 10000);

  ui.body.id = 'reload';
  ui.body.addEventListener('click', () => window.location.reload());
}

function processAudio(bufferLength, dataArray) {
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
  const intensity = 20 * Math.log10(average) + 20;

  if (intensity > intensityThreshold && !isScreaming) {
    isScreaming = true;
    console.log(`🚀 Comenzó el grito: intensidad ${intensity.toFixed(2)} dB > umbral (${intensityThreshold} dB)`);
  }

  if (isScreaming) {
    if (intensity < intensityThreshold - 5) return closeGame();
    console.log(`🎤 El grito terminó: intensidad actual ${intensity.toFixed(2)} dB < umbral mínimo (${intensityThreshold - 5} dB)`);
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

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
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
    }, 50);
  });

  ui.reload.addEventListener('click', () => window.location.reload());
}


document.addEventListener('DOMContentLoaded', () => {
  initMic();
  setupListeners();
});