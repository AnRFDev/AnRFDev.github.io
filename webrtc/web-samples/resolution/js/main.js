/*
 *  WebRTC视频分辨率
 */

'use strict';

const dimensionsInfo = document.querySelector('#dimensions');
const video = document.querySelector('video');
let stream;

const videoblock = document.querySelector('#videoblock'); // 视频区域
const messagebox = document.querySelector('#msg');

const widthInput = document.querySelector('div#width input');
const widthOutput = document.querySelector('div#width span');
const aspectLock = document.querySelector('#aspectlock');
const fullWidSetting = document.querySelector('#isFullWidth');

let currentWidth = 0;
let currentHeight = 0;

document.querySelector('#b320').onclick = () => {
  const c320 = {
    video: { width: { exact: 320 }, height: { exact: 240 } }
  };
  startPlay(c320);
};

document.querySelector('#b240-320').onclick = () => {
  const c = {
    video: { width: { exact: 240 }, height: { exact: 320 } }
  };
  startPlay(c);
}

document.querySelector('#b640').onclick = () => {
  const c640 = {
    video: { width: { exact: 640 }, height: { exact: 480 } }
  };
  startPlay(c640);
};

document.querySelector('#b1280').onclick = () => {
  const c1280 = {
    video: { width: { exact: 1280 }, height: { exact: 720 } }
  };
  startPlay(c1280);
};

document.querySelector('#b1920').onclick = () => {
  const c1920 = {
    video: { width: { exact: 1920 }, height: { exact: 1080 } }
  };
  startPlay(c1920);
};

document.querySelector('#b2048').onclick = () => {
  const c2048 = {
    video: { width: { exact: 2048 }, height: { exact: 1152 } }
  };
  startPlay(c2048);
};

function gotStream(mediaStream) {
  stream = window.stream = mediaStream; // 给控制台
  video.srcObject = mediaStream;
  messagebox.style.display = 'none';
  videoblock.style.display = 'block';
  const track = mediaStream.getVideoTracks()[0];
  const constraints = track.getConstraints();
  console.log('当前constraints: ' + JSON.stringify(constraints));
  if (constraints && constraints.width && constraints.width.exact) {
    widthInput.value = constraints.width.exact;
    widthOutput.textContent = constraints.width.exact;
  } else if (constraints && constraints.width && constraints.width.min) {
    widthInput.value = constraints.width.min;
    widthOutput.textContent = constraints.width.min;
  }
}

function showErrMsg(who, what) {
  const message = who + ': ' + what;
  messagebox.innerText = message;
  messagebox.style.display = 'block';
  console.log(message);
}

function clearMsg() {
  messagebox.style.display = 'none';
}

// 显示视频尺寸信息
function displayVideoDimensions(whereSeen) {
  if (video.videoWidth) {
    dimensionsInfo.innerText = '实际video尺寸: ' + video.videoWidth +
      'x' + video.videoHeight + 'px.';
    if (currentWidth !== video.videoWidth ||
      currentHeight !== video.videoHeight) {
      console.log(whereSeen + ': ' + dimensionsInfo.innerText);
      currentWidth = video.videoWidth;
      currentHeight = video.videoHeight;
    }
  } else {
    dimensionsInfo.innerText = '拿不到video的宽度';
  }
}

// 载入meta信息
video.onloadedmetadata = () => {
  displayVideoDimensions('loadedmetadata');
};

// 修改了尺寸
video.onresize = () => {
  displayVideoDimensions('resize');
};

function onConstraintChange(e) {
  widthOutput.textContent = e.target.value;
  const track = window.stream.getVideoTracks()[0];
  let constraints;
  if (aspectLock.checked) {
    constraints = {
      width: { exact: e.target.value },
      aspectRatio: {
        exact: video.videoWidth / video.videoHeight
      }
    };
  } else {
    constraints = { width: { exact: e.target.value } };
  }
  clearMsg();
  console.log('使用配置 ' + JSON.stringify(constraints));
  track.applyConstraints(constraints)
    .then(() => {
      console.log('applyConstraint success');
      displayVideoDimensions('applyConstraints');
    })
    .catch(err => {
      showErrMsg('applyConstraints', err.name);
    });
}

widthInput.onchange = onConstraintChange;

fullWidSetting.onchange = () => {
  if (fullWidSetting.checked) {
    video.style.width = '100%';
  } else {
    video.style.width = 'auto';
  }
};

function startPlay(constraints) {
  stopStream();
  clearMsg();
  videoblock.style.display = 'none';
  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(e => {
      showErrMsg('getUserMedia报错 ' + e, JSON.stringify(constraints));
    });
}

document.querySelector("#stop").onclick = () => {
  stopStream();
};

function stopStream() {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

let supported = navigator.mediaDevices.getSupportedConstraints();
console.log(supported);