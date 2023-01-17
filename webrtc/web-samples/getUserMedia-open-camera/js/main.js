/**
 * 显示本地摄像头的视频
 */

'use strict';

const constraints = window.constraints = {
  audio: false,
  video: true
};

function gotStream(stream) {
  const videoEle = document.querySelector('video');
  const videoTracks = stream.getVideoTracks();
  showMsg(`正在使用的设备: ${videoTracks[0].label}`);
  window.stream = stream;
  videoEle.srcObject = stream;
}

function onErr(error) {
  if (error.name === 'OverconstrainedError') {
    const v = constraints.video;
    showErrMsg(`设备不支持分辨率 ${v.width.exact}x${v.height.exact} px `);
  } else if (error.name === 'NotAllowedError') {
    showErrMsg('请允许浏览器打开摄像头');
  }
  showErrMsg(`getUserMedia error: ${error.name}`, error);
}

function showErrMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

function showMsg(msg) {
    const msgEle = document.querySelector('#tipMsg');
    msgEle.innerHTML += `<p>-> ${msg}</p>`;
    console.log(msg);
}

async function openCamera(e) {
  try {
    showMsg('正在打开摄像头');
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    showMsg('获取到了stream');
    gotStream(stream);
    e.target.disabled = true;
  } catch (err) {
    onErr(err);
  }
}

function stopVideo(e) {
    showMsg("停止视频");
    const videoElem = document.querySelector('video');
    const stream = videoElem.srcObject;

    document.querySelector('#showVideo').disabled = false; // 允许开启

    if(stream == null) {
        return;
    }
    const tracks = stream.getTracks();
  
    tracks.forEach(function(track) {
      track.stop();
    });
    videoElem.srcObject = null;
}

document.querySelector('#showVideo').addEventListener('click', e => openCamera(e));
document.querySelector('#stopVideo').addEventListener('click', e => stopVideo(e));

showMsg("准备完毕")