/*
 * 选择 codec
 *  
 * an.rustfisher.com
 */

'use strict';

console.log('WebRTC示例，选择codec');

// --------- ui准备 ---------
const startBtn = document.getElementById('startBtn');
const callBtn = document.getElementById('callBtn');
const hangupBtn = document.getElementById('hangupBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

callBtn.disabled = true;
hangupBtn.disabled = true;
startBtn.addEventListener('click', start);
callBtn.addEventListener('click', call);
hangupBtn.addEventListener('click', hangup);
// ---------------------------

// -------- codec 的配置 --------
const codecPreferences = document.querySelector('#codecPreferences');
const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
  'setCodecPreferences' in window.RTCRtpTransceiver.prototype;
// -----------------------------

let startTime;

remoteVideo.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    console.log('视频流连接耗时: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
});

let localStream;
let pc1;
let pc2;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

// 启动本地视频
async function start() {
  console.log('启动本地视频');
  startBtn.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    console.log('获取到本地视频');
    localVideo.srcObject = stream;
    localStream = stream;
    callBtn.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
  if (supportsSetCodecPreferences) {
    const { codecs } = RTCRtpSender.getCapabilities('video');
    console.log('RTCRtpSender.getCapabilities(video):\n', codecs);
    codecs.forEach(codec => {
      if (['video/red', 'video/ulpfec', 'video/rtx'].includes(codec.mimeType)) {
        return;
      }
      const option = document.createElement('option');
      option.value = (codec.mimeType + ' ' + (codec.sdpFmtpLine || '')).trim();
      option.innerText = option.value;
      codecPreferences.appendChild(option);
    });
    codecPreferences.disabled = false;
  } else {
    console.warn('当前不支持更换codec');
  }
}

// 呼叫并建立连接
async function call() {
  callBtn.disabled = true;
  hangupBtn.disabled = false;
  console.log('开始呼叫');
  startTime = window.performance.now();
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`使用的摄像头: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`使用的麦克风: ${audioTracks[0].label}`);
  }
  const configuration = {};
  pc1 = new RTCPeerConnection(configuration);
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  pc2 = new RTCPeerConnection(configuration);
  pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
  pc2.addEventListener('track', gotRemoteStream);

  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
  if (supportsSetCodecPreferences) {
    // 获取选择的codec
    const preferredCodec = codecPreferences.options[codecPreferences.selectedIndex];
    if (preferredCodec.value !== '') {
      const [mimeType, sdpFmtpLine] = preferredCodec.value.split(' ');
      const { codecs } = RTCRtpSender.getCapabilities('video');
      const selectedCodecIndex = codecs.findIndex(c => c.mimeType === mimeType && c.sdpFmtpLine === sdpFmtpLine);
      const selectedCodec = codecs[selectedCodecIndex];
      codecs.splice(selectedCodecIndex, 1);
      codecs.unshift(selectedCodec);
      console.log(codecs);
      const transceiver = pc1.getTransceivers().find(t => t.sender && t.sender.track === localStream.getVideoTracks()[0]);
      transceiver.setCodecPreferences(codecs);
      console.log('选择的codec', selectedCodec);
    }
  }
  codecPreferences.disabled = true;

  try {
    const offer = await pc1.createOffer(offerOptions);
    await onCreateOfferSuccess(offer);
  } catch (e) {
    console.log(`Failed, pc1 createOffer: ${e.toString()}`);
  }
}

async function onCreateOfferSuccess(desc) {
  try {
    await pc1.setLocalDescription(desc);
    console.log('pc1 setLocalDescription 成功');
  } catch (e) {
    console.error('pc1 setLocalDescription 出错', e);
  }
  try {
    await pc2.setRemoteDescription(desc);
    console.log('pc2 setRemoteDescription ok');
  } catch (e) {
    console.error('pc2 setRemoteDescription fail', e);
  }
  try {
    const answer = await pc2.createAnswer();
    await onCreateAnswerSuccess(answer);
  } catch (e) {
    console.log(`pc2 create answer fail: ${e.toString()}`);
  }
}

function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}

// 应答（接收）成功
async function onCreateAnswerSuccess(desc) {
  console.log(`Answer from pc2:\n${desc.sdp}`);
  console.log('pc2 setLocalDescription start');
  try {
    await pc2.setLocalDescription(desc);
  } catch (e) {
    console.error('pc2 set local d fail', e);
  }
  console.log('pc1 setRemoteDescription start');
  try {
    await pc1.setRemoteDescription(desc);

    // Display the video codec that is actually used.
    setTimeout(async () => {
      const stats = await pc1.getStats();
      stats.forEach(stat => {
        if (!(stat.type === 'outbound-rtp' && stat.kind === 'video')) {
          return;
        }
        const codec = stats.get(stat.codecId);
        document.getElementById('actualCodec').innerText = 'Using ' + codec.mimeType +
          ' ' + (codec.sdpFmtpLine ? codec.sdpFmtpLine + ' ' : '') +
          ', payloadType=' + codec.payloadType + '. Encoder: ' + stat.encoderImplementation;
      });
    }, 1000);
  } catch (e) {
    console.error(e);
  }
}

async function onIceCandidate(pc, event) {
  try {
    await (getOtherPc(pc).addIceCandidate(event.candidate));
    onAddIceCandidateSuccess(pc);
  } catch (e) {
    onAddIceCandidateError(pc, e);
  }
  console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(pc) {
  console.log(`${getName(pc)} addIceCandidate success`);
}

function onAddIceCandidateError(pc, error) {
  console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

localVideo.addEventListener('loadedmetadata', function () {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function () {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

// 挂断
function hangup() {
  console.log('挂断');
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupBtn.disabled = true;
  callBtn.disabled = false;
  codecPreferences.disabled = false;
}
