// an.rustfisher.com
// 音频通话升级到视频通话

'use strict';

const startBtn = document.getElementById('startBtn');
const callBtn = document.getElementById('callBtn');
const upgradeToVideoBtn = document.getElementById('upgradeBtn');
const hangupBtn = document.getElementById('hangupBtn');
const localVideo = document.getElementById('localVideo');   // 本地预览
const remoteVideo = document.getElementById('remoteVideo'); // 接收方

console.log('先禁用其他按钮');
callBtn.disabled = true;
upgradeToVideoBtn.disabled = true;
hangupBtn.disabled = true;

localVideo.addEventListener('loadedmetadata', function () {
    console.log(`localVideo 宽高: ${this.videoWidth}px, ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function () {
    console.log(`remoteVideo 宽高: ${this.videoWidth}px, ${this.videoHeight}px`);
});

let startTime;
remoteVideo.onresize = () => {
    console.log(`remoteVideo onresize 宽高: ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        console.log(`建立连接耗时: ${elapsedTime.toFixed(3)}ms`);
        startTime = null;
    }
};

startBtn.onclick = start;
callBtn.onclick = call;
upgradeToVideoBtn.onclick = upgrade;
hangupBtn.onclick = hangup;

let localStream; // 本地数据流
let pc1;
let pc2;
const offerOptions = {
    offerToReceiveAudio: 1, // 最开始只给音频
    offerToReceiveVideo: 0
};

function getName(pc) {
    return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
    return (pc === pc1) ? pc2 : pc1;
}

function gotStream(stream) {
    console.log('获取到了本地数据流');
    localVideo.srcObject = stream;
    localStream = stream;
    callBtn.disabled = false;
}

function start() {
    console.log('请求本地数据流 纯音频');
    startBtn.disabled = true;
    navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(gotStream)
        .catch(e => alert(`getUserMedia() error: ${e.name}`));
}


function call() {
    callBtn.disabled = true;
    upgradeToVideoBtn.disabled = false;
    hangupBtn.disabled = false;
    console.log('开始呼叫...');
    startTime = window.performance.now();
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
        console.log(`使用的音频设备: ${audioTracks[0].label}`);
    }
    const servers = null; // 就在本地测试
    pc1 = new RTCPeerConnection(servers);
    console.log('创建本地节点 pc1');
    pc1.onicecandidate = e => onIceCandidate(pc1, e);
    pc2 = new RTCPeerConnection(servers);
    console.log('rustfisher.com:创建模拟远端节点 pc2');
    pc2.onicecandidate = e => onIceCandidate(pc2, e);
    pc1.oniceconnectionstatechange = e => onIceStateChange(pc1, e);
    pc2.oniceconnectionstatechange = e => onIceStateChange(pc2, e);
    pc2.ontrack = gotRemoteStream;

    localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
    console.log('rustfisher.com:将本地数据流交给pc1');

    console.log('rustfisher.com:pc1开始创建offer');
    pc1.createOffer(offerOptions).then(onCreateOfferSuccess, onCreateSessionDescriptionError);
}

function gotRemoteStream(e) {
    console.log('获取到远程数据流', e.track, e.streams[0]);
    remoteVideo.srcObject = null;
    remoteVideo.srcObject = e.streams[0];
}

function onIceCandidate(pc, event) {
    getOtherPc(pc)
        .addIceCandidate(event.candidate)
        .then(() => onAddIceCandidateSuccess(pc), err => onAddIceCandidateError(pc, err));
    console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onCreateOfferSuccess(desc) {
    console.log(`pc1提供了offer\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    pc1.setLocalDescription(desc).then(() => onSetLocalSuccess(pc1), onSetSessionDescriptionError);
    console.log('pc2 setRemoteDescription start');
    pc2.setRemoteDescription(desc).then(() => onSetRemoteSuccess(pc2), onSetSessionDescriptionError);
    console.log('pc2 createAnswer start');
    pc2.createAnswer().then(onCreateAnswerSuccess, onCreateSessionDescriptionError);
}

function onCreateAnswerSuccess(desc) {
    console.log(`rustfisher.com:pc2应答成功:  ${desc.sdp}`);
    console.log('pc2 setLocalDescription start');
    pc2.setLocalDescription(desc).then(() => onSetLocalSuccess(pc2), onSetSessionDescriptionError);
    console.log('pc1 setRemoteDescription start');
    pc1.setRemoteDescription(desc).then(() => onSetRemoteSuccess(pc1), onSetSessionDescriptionError);
}

function upgrade() {
    upgradeToVideoBtn.disabled = true;
    navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(stream => {
            console.log('rustfisher.com:获取到了视频流');
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                console.log(`video device: ${videoTracks[0].label}`);
            }
            localStream.addTrack(videoTracks[0]);
            localVideo.srcObject = null; // 重置视频流
            localVideo.srcObject = localStream;
            pc1.addTrack(videoTracks[0], localStream);
            return pc1.createOffer();
        })
        .then(offer => pc1.setLocalDescription(offer))
        .then(() => pc2.setRemoteDescription(pc1.localDescription))
        .then(() => pc2.createAnswer())
        .then(answer => pc2.setLocalDescription(answer))
        .then(() => pc1.setRemoteDescription(pc2.localDescription));
}

function hangup() {
    console.log('rustfisher.com:挂断');
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;

    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach(videoTrack => {
        videoTrack.stop();
        localStream.removeTrack(videoTrack);
    });

    localVideo.srcObject = null;
    localVideo.srcObject = localStream;

    hangupBtn.disabled = true;
    callBtn.disabled = false;
}

// --------------- 监听状态变化 START ---------------
function onCreateSessionDescriptionError(error) {
    console.log(`rustfisher.com:创建会话描述失败, session description err: ${error.toString()}`);
}

function onIceStateChange(pc, event) {
    if (pc) {
        console.log(`rustfisher.com:${getName(pc)} ICE状态: ${pc.iceConnectionState}`);
        console.log('rustfisher.com:ICE状态变化: ', event);
    }
}

function onAddIceCandidateSuccess(pc) {
    console.log(`rustfisher.com:${getName(pc)} addIceCandidate success 添加ICE候选成功`);
}

function onAddIceCandidateError(pc, error) {
    console.log(`rustfisher.com:${getName(pc)} 添加ICE候选失败 failed to add ICE Candidate: ${error.toString()}`);
}

function onSetLocalSuccess(pc) {
    console.log(`rustfisher.com:${getName(pc)} setLocalDescription 成功`);
}

function onSetSessionDescriptionError(error) {
    console.log(`rustfisher.com:设置会话描述失败: ${error.toString()}`);
}

function onSetRemoteSuccess(pc) {
    console.log(`rustfisher.com:${getName(pc)} 设置远程描述成功 setRemoteDescription complete`);
}
// --------------- 监听状态变化 END ---------------
