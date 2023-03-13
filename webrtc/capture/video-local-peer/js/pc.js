//
// an.rustfisher.com
// WebRTC 模拟连接节点传输视频
//

console.log('WebRTC 模拟连接节点传输视频 1214-1413');

'use strict';

const srcVideo = document.getElementById('fromVideo');
const toVideo = document.getElementById('toVideo');

let stream; // 源头的数据流

let pc1; // 源
let pc2; // 目标
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};

let startTime; // 记录的开始时间


function tryGetStream() {
    if (stream) {
        console.log('已经有视频流了，这里跳过');
        return;
    }
    if (srcVideo.captureStream) {
        stream = srcVideo.captureStream();
        console.log('captureStream获取到了视频流', stream);
        call();
    } else if (srcVideo.mozCaptureStream) {
        stream = srcVideo.mozCaptureStream();
        console.log('mozCaptureStream()获取到了视频流', stream);
        call();
    } else {
        console.log('不支持 captureStream()');
    }
}

srcVideo.oncanplay = tryGetStream; // 监听播放事件

if (srcVideo.readyState >= 3) {
    console.log('已经可以播放视频了 直接去拿视频流');
    tryGetStream();
}

srcVideo.play(); // 开始播放

toVideo.onloadedmetadata = () => {
    console.log(`toVideo onloadedmetadata 宽高${toVideo.videoWidth}px, ${toVideo.videoHeight}`);
};

toVideo.onresize = () => {
    console.log(`toVideo onresize: ${toVideo.videoWidth}x${toVideo.videoHeight}`);
    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        console.log('resize耗时: ' + elapsedTime.toFixed(3) + 'ms');
        startTime = null; // 消耗掉这个开始时间标志
    }
};


function call() {
    console.log('call 开始.....');
    startTime = window.performance.now();
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    if (videoTracks.length > 0) {
        console.log(`使用的视频设备: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
        console.log(`使用音频设备: ${audioTracks[0].label}`);
    }
    const servers = null;
    pc1 = new RTCPeerConnection(servers);
    console.log('创建本地节点pc1');
    pc1.onicecandidate = e => onIceCandidate(pc1, e);

    pc2 = new RTCPeerConnection(servers);
    console.log('创建远端节点pc2');
    pc2.onicecandidate = e => onIceCandidate(pc2, e);
    
    pc1.oniceconnectionstatechange = e => onIceStateChange(pc1, e);
    pc2.oniceconnectionstatechange = e => onIceStateChange(pc2, e);

    pc2.ontrack = gotRemoteStream;

    stream.getTracks().forEach(track => pc1.addTrack(track, stream));
    console.log('pc1加载视频流');

    console.log('pc1 创建offer');
    pc1.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
}


function onCreateSessionDescriptionError(error) {
    console.log(`创建会话描述出错: ${error.toString()}`);
}

function onCreateOfferSuccess(desc) {
    console.log(`Offer from pc1${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    pc1.setLocalDescription(desc, () => onSetLocalSuccess(pc1), onSetSessionDescriptionError);
    console.log('pc2 setRemoteDescription start');
    pc2.setRemoteDescription(desc, () => onSetRemoteSuccess(pc2), onSetSessionDescriptionError);
    console.log('pc2 createAnswer start');
    pc2.createAnswer(onCreateAnswerSuccess, onCreateSessionDescriptionError);
}

function onSetLocalSuccess(pc) {
    console.log(`${getName(pc)} setLocalDescription complete`);
}

function onSetRemoteSuccess(pc) {
    console.log(`${getName(pc)} setRemoteDescription complete`);
}

function onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
}

function gotRemoteStream(event) {
    if (toVideo.srcObject !== event.streams[0]) {
        toVideo.srcObject = event.streams[0];
        console.log('pc2 收到远端数据流', event);
    }
}

function onCreateAnswerSuccess(desc) {
    console.log(`Answer from pc2: ${desc.sdp}`);
    console.log('pc2 setLocalDescription start');
    pc2.setLocalDescription(desc, () => onSetLocalSuccess(pc2), onSetSessionDescriptionError);
    console.log('pc1 setRemoteDescription start');
    pc1.setRemoteDescription(desc, () => onSetRemoteSuccess(pc1), onSetSessionDescriptionError);
}

function onIceCandidate(pc, event) {
    getOtherPc(pc).addIceCandidate(event.candidate)
        .then(
            () => onAddIceCandidateSuccess(pc),
            err => onAddIceCandidateError(pc, err)
        );
    console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(pc) {
    console.log(`${getName(pc)} addIceCandidate success`);
}

function onAddIceCandidateError(pc, error) {
    console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(pc, event) {
    if (pc) {
        console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
        console.log('ICE state change event: ', event);
    }
}

function getName(pc) {
    return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
    return (pc === pc1) ? pc2 : pc1;
}
