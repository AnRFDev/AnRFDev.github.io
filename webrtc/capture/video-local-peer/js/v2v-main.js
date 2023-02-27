/*
*  an.rustfisher.com
*  video to video
*/

'use strict';

const srcVideo = document.getElementById('fromVideo');
const toVideo = document.getElementById('toVideo');

srcVideo.addEventListener('canplay', () => {
  let stream;
  const fps = 0;
  if (srcVideo.captureStream) {
    stream = srcVideo.captureStream(fps);
  } else if (srcVideo.mozCaptureStream) {
    stream = srcVideo.mozCaptureStream(fps);
  } else {
    console.error('Stream capture is not supported');
    stream = null;
  }
  toVideo.srcObject = stream;
});
