//
// an.rustfisher.com
// WebRTC插入多个转发节点
//

'use strict';

console.log('an.rustfisher.com: 插入多个转发节点示例 2021-12-21 0917');

// 获取ui
const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');
const statusDiv = document.querySelector('div#status');
const audioCheckbox = document.querySelector('input#audio');
const startBtn = document.querySelector('button#start');
const callBtn = document.querySelector('button#call');
const insertRelayBtn = document.querySelector('button#insertRelay');
const hangupBtn = document.querySelector('button#hangup');

const connectionList = [];

let localStream;
let remoteStream;

startBtn.onclick = start;
callBtn.onclick = call;
insertRelayBtn.onclick = insertRelay;
hangupBtn.onclick = hangup;

function gotStream(stream) {
    video1.srcObject = stream;
    localStream = stream;
    callBtn.disabled = false;
}

function gotremoteStream(stream) {
    remoteStream = stream;
    video2.srcObject = stream;
    console.log('接收到了传输后的数据流');
    statusDiv.textContent = `当前节点数: ${connectionList.length * 2}`;
    insertRelayBtn.disabled = false;
}

function start() {
    startBtn.disabled = true;
    const options = audioCheckbox.checked ? { audio: true, video: true } : { audio: false, video: true };
    navigator.mediaDevices.getUserMedia(options)
        .then(gotStream)
        .catch(function (e) {
            alert(`获取媒体失败 ${e}`);
        });
}

function call() {
    callBtn.disabled = true;
    insertRelayBtn.disabled = false;
    hangupBtn.disabled = false;
    console.log('呼叫!');
    connectionList.push(new Connection2(localStream, gotremoteStream));
}

function insertRelay() {
    connectionList.push(new Connection2(remoteStream, gotremoteStream));
    insertRelayBtn.disabled = true;
}

function hangup() {
    console.log('挂断');
    while (connectionList.length > 0) {
        const pipe = connectionList.pop();
        pipe.close();
    }
    insertRelayBtn.disabled = true;
    hangupBtn.disabled = true;
    callBtn.disabled = false;
}