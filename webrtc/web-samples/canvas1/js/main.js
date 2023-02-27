/**
 * WebRTC截取视频帧并显示出来
 * an.rustfisher.com
 */

'use strict';

const video = document.querySelector('video');
const mCanvas = window.canvas = document.querySelector('#mainCanvas');
mCanvas.width = 480;
mCanvas.height = 360;
const list = document.querySelector('#list'); // 拿来存放多个元素

const constraints = {
  audio: false,
  video: true
};

function gotStream(stream) {
  window.stream = stream; // 拿到stream实例存一下
  video.srcObject = stream;
}

function onError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function openCamera(e) {
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(onError);
}

function takeSnapshot(e) {
  mCanvas.width = video.videoWidth;
  mCanvas.height = video.videoHeight;
  mCanvas.getContext('2d').drawImage(video, 0, 0, mCanvas.width, mCanvas.height);

  // 新增1张
  var divItem = document.createElement("div");
  divItem.style.display = "block";
  divItem.width = 100;
  divItem.height = divItem.width * video.videoHeight / video.videoWidth; // 计算一下比例
  divItem.style.width = divItem.width + "px";
  divItem.style.height = divItem.height + "px";
  console.log("div item size: ", divItem.width, divItem.height);

  var c1 = document.createElement("canvas");
  c1.width = divItem.width;
  c1.height = divItem.height;
  c1.getContext('2d').drawImage(video, 0, 0, mCanvas.width, mCanvas.height, 0, 0, c1.width, c1.height);

  divItem.appendChild(c1);
  list.appendChild(divItem);
}

function clearList(e) {
  var child = list.lastElementChild;
  while (child) {
    list.removeChild(child);
    child = list.lastElementChild;
  }
}

document.querySelector('#showVideo').addEventListener('click', e => openCamera(e));
document.querySelector('#takeSnapshot').addEventListener('click', e => takeSnapshot(e));
document.querySelector('#clearList').addEventListener('click', e => clearList(e));
