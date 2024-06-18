let audioContext;
let analyser;
let currentScore = 0; // Variable para mantener el score actual
let timer; // Variable para el temporizador

function startAudioCapture() {
  console.info("Iniciando captura de audio...");

  // Verificar si el contexto de Audio ya está creado
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
  }

  // Solicitar acceso al micrófono
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
      let microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      analyser.fftSize = 2048;
      let bufferLength = analyser.frequencyBinCount;
      let dataArray = new Uint8Array(bufferLength);
      let dig = document.getElementById("digit-number");

      // Función para procesar el audio y calcular el puntaje
      function processAudio() {
        analyser.getByteFrequencyData(dataArray);

        let sum = dataArray.reduce((acc, val) => acc + val, 0);
        let average = sum / bufferLength;
        let percentage = (average / 255) * 100;
        percentage = Math.min(percentage, 100);

        // Calcular el nuevo score
        let newScore = Math.round(percentage);

        // Actualizar currentScore solo si newScore es mayor
        if (newScore > currentScore) {
          currentScore = newScore;
        }

        // Mostrar el score actualizado
        console.log("Score:", currentScore);
        dig.innerText = currentScore;

        // Verificar si han pasado 60 segundos
        if (audioContext.currentTime >= 11) {
          // Comprobar si los desniveles son menores o iguales a 4 para detener el proceso
          if (average <= 4) {
            console.log(
              "Desniveles menores o iguales a 4. Deteniendo proceso."
            );
            stopAudioCapture(); // Llamar a la función para detener la captura de audio
            return;
          }
        }

        // Llamar a processAudio aproximadamente cada 1/60 segundos
        timer = setTimeout(processAudio, 1000 / 60);
      }

      // Iniciar el proceso de audio
      processAudio();
    })
    .catch(function (err) {
      console.error("Error al acceder al micrófono:", err);
    });
}

// Función para detener la captura de audio
function stopAudioCapture() {
  // Detener cualquier temporizador activo
  clearTimeout(timer);

  // Cerrar el contexto de audio si está abierto
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close().then(function () {
      console.log("Contexto de audio cerrado correctamente.");
    });
  }
}