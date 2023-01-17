'use strict';

var btnConn = document.querySelector('button#connect');
var btnLeave = document.querySelector('button#leave');
var btnSend = document.querySelector('button#send');
var userNicknameInput = document.querySelector('input#user-nickname');
var userInput = document.querySelector('input#user-input');
var msgList = document.querySelector('ul#msg-list');

var socket = null; // 连接
var uid = null;
var nickname = "RustFisher"; // 昵称

var nameList = ["人参", "卜芥", "儿茶", "八角", "丁香", "刀豆", "三七", "大蓟", "山药", "川乌", "天冬", "天麻", "元胡"];
var nameIndex = Math.floor(Math.random() * nameList.length);
nickname = nameList[nameIndex]; // 随机昵称
userNicknameInput.value = nickname;

function ranId(num) {
    var len = num || 32;
    var chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
    var maxPos = chars.length;
    var res = "";
    for (var i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return res;
}

uid = ranId(32);

function addMsgToList(type, msgBody) {
    var li = document.createElement("li");
    li.setAttribute("id", "newli");
    if (type == 0) {
        li.innerHTML = msgBody;
    } else if (type == 1) {
        li.innerHTML = msgBody.nickname + ": " + msgBody.msg;
    }
    msgList.appendChild(li);
}

// 发起连接
function conn() {
    if (uid == null) {
        console.error('无法连接，还没获取到uid');
        return;
    }
    console.log('try connect');

    //const wssUrl = "http://localhost:9010"; //
    const wssUrl = "wss://antalkws.rustfisher.com" // release
    socket = io(wssUrl, { path: '/chat1' });

    socket.on('connect', function () {
        console.log('连接成功');// 连接状态 连上
        addMsgToList(0, '连接成功');
    });

    socket.on('disconnect', (socket) => {
        console.log('socket已断开', socket);// 连接状态 已断开
        socket = null;
    });

    socket.on('debug', (data) => {
        console.log('[服务器消息][debug], ', data);
    });

    socket.on('allMsg', (data) => {
        console.log('[服务器消息][allMsg], ', data);
        addMsgToList(1, data);
    });

    socket.emit('debug', { uid: uid, msg: "web连接" });
    return true;
}

function disconnect() {
    if (socket) {
        socket.disconnect();
    }
}

function sendMsg() {
    var input = userInput.value;
    if (input == null || input.length == 0) {
        console.warn('请输入文本');
        return;
    }
    if (socket) {
        socket.emit('m2s',
            {
                uid: uid,
                nickname: userNicknameInput.value,
                msg: input
            });
    }
}

btnConn.onclick = conn;
btnLeave.onclick = disconnect;
btnSend.onclick = sendMsg;


