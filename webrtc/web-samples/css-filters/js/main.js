/**
 * WebRTC与css滤镜的使用
 * an.rustfisher.com
 */

'use strict';

// 先处理滤镜示例
const sampleCanvas = document.querySelector('#sample-canvas');
var img = new Image();
img.src = 'webrtc-fish.png'; // rustfisher.com pic
img.onload = function () {
  sampleCanvas.getContext('2d').drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height);
}

var slider = document.getElementById("myRange");
var sliderValue = document.getElementById("slide-value");
sliderValue.innerHTML = slider.value; // 选择的数值

const snapshotButton = document.querySelector('button#snapshot');
const filterSelect = document.querySelector('select#filter');

const video = window.video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas#main');
canvas.width = 480;
canvas.height = 360;

filterSelect.onchange = function () {
  changeFilter();
};

const constraints = { audio: false, video: true };

// 改变滤镜的值
function changeFilter() {
  var filterValue = "" + filterSelect.value + "(" + slider.value + "%)";
  if (filterSelect.value == "blur") {
    filterValue = "" + filterSelect.value + "(" + slider.value + "px)";
  } else if (filterSelect.value == "none") {
    filterValue = "";
  }
  sampleCanvas.style.filter = filterValue; // 图片的滤镜
  canvas.style.filter = filterValue;       // 图片的滤镜
  video.style.filter = filterValue;        // 视频预览的滤镜
}

function gotStream(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
}

function onError(error) {
  console.log('打开摄像头失败: ', error.message, error.name);
}

function startVideo() {
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(onError);
}

slider.oninput = function () {
  sliderValue.innerHTML = this.value;
  changeFilter();
}

document.querySelector("#start").onclick = function () {
  startVideo();
}
snapshotButton.onclick = function () {
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
};