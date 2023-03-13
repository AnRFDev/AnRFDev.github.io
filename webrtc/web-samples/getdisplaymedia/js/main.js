/*
 *  分享屏幕
 */

'use strict';

const startBtn = document.getElementById('startBtn');
const recordBtn = document.getElementById('recordBtn');
const downloadBtn = document.getElementById('downloadBtn');
const video = document.querySelector('video'); // 预览用的

let mediaRecorder;
let isRecording = false;
let recordedBlobs = [];

startBtn.addEventListener('click', () => {
  navigator.mediaDevices.getDisplayMedia({video: true})
      .then(gotDisplayStream, onErr);
});

// 拿到屏幕数据流
function gotDisplayStream(stream) {
  startBtn.disabled = true;
  video.srcObject = stream; // 显示出来
  window.stream = stream;   // 缓存一下

  stream.getVideoTracks()[0].addEventListener('ended', () => {
    showMsg('用户停止了分享屏幕');
    startBtn.disabled = false;
    recordBtn.disabled = true;
  });
  recordBtn.disabled = false;
}

function onErr(error) {
  showMsg(`getDisplayMedia on err: ${error.name}`, error);
}

function showMsg(msg, error) {
  const msgEle = document.querySelector('#msg');
  msgEle.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  startBtn.disabled = false;
} else {
  showMsg('getDisplayMedia is not supported');
}

recordBtn.addEventListener('click', ()=> {
  if(isRecording == false) {
    startRecording();
  } else {
    stopRecord();
  }
});

function stopRecord() {
  isRecording = false;
  mediaRecorder.stop();
  downloadBtn.disabled = false;
  recordBtn.textContent = "开始录制";
}

function startRecording() {
  recordedBlobs = [];
  const mimeType = getSupportedMimeTypes()[0];
  const options = { mimeType };

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    showMsg(`创建MediaRecorder出错: ${JSON.stringify(e)}`);
    return;
  }
  recordBtn.textContent = '停止录制';
  isRecording = true;
  downloadBtn.disabled = true;
  mediaRecorder.onstop = (event) => {
    showMsg('录制停止了: ' + event);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  showMsg('录制开始 mediaRecorder: ' + mediaRecorder);
}

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function showMsg(msg) {
  console.log(msg);
  var msgEle = document.querySelector('div#msg');
  msgEle.innerHTML += "<p>" + msg + "</p>";
}

// 找到支持的格式
function getSupportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
  ];
  return possibleTypes.filter(mimeType => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

downloadBtn.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, { type: 'video/webm' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = '录屏_' + new Date().getTime() + '.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});