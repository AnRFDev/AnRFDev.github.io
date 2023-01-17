/*
 * an.rustfisher.com
 * 
 * WebRTC 获取音频示例
 */

'use strict';

const sampleAudio = document.querySelector('#sample-audio'); // 本地音频

const instantMeter = document.querySelector('#instant meter');
const slowMeter = document.querySelector('#slow meter');
const clipMeter = document.querySelector('#clip meter');

const instantValueDisplay = document.querySelector('#instant .value');
const slowValueDisplay = document.querySelector('#slow .value');
const clipValueDisplay = document.querySelector('#clip .value');

const playAudio = document.querySelector('#play-audio');
const msgEle2 = document.querySelector("#msg");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById('stopBtn');

let meterRefresh = null;

const constraints = window.constraints = {
  audio: true,
  video: false
};

function gotAudioStream(stream) {
  stream.oninactive = function () {
    console.log('音频停止');
  };
  window.stream = stream;
  playAudio.srcObject = stream;

  console.log('对接麦克风的音频');

  const soundMeter = window.soundMeter = new SoundMeter(window.audioContext);

  soundMeter.connectToSource(stream, function (e) {
    if (e) {
      alert(e);
      return;
    }
    meterRefresh = setInterval(() => {
      instantMeter.value = instantValueDisplay.innerText =
        soundMeter.instant.toFixed(2);
      slowMeter.value = slowValueDisplay.innerText =
        soundMeter.slow.toFixed(2);
      clipMeter.value = clipValueDisplay.innerText =
        soundMeter.clip;
    }, 100);
  });
}

function onErr(error) {
  const errorMessage = '报错 navigator.MediaDevices.getUserMedia : ' + error.message + ' ' + error.name;
  msgEle2.innerText = errorMessage;
  console.error(errorMessage);
}

startBtn.onclick = function (e) {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();
  } catch (e) {
    alert('Web Audio API not supported.');
  }

  navigator.mediaDevices.getUserMedia(constraints).then(gotAudioStream).catch(onErr);
};

stopBtn.onclick = function (e) {
  console.log('停止');
  startBtn.disabled = false;
  stopBtn.disabled = true;

  window.stream.getTracks().forEach(track => track.stop());
  window.soundMeter.stop();
  clearInterval(meterRefresh);
  instantMeter.value = instantValueDisplay.innerText = '';
  slowMeter.value = slowValueDisplay.innerText = '';
  clipMeter.value = clipValueDisplay.innerText = '';

}