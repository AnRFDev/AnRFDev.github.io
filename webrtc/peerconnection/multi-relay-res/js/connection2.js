// 增加转发节点

function doNothing() { }

function errFunc(context) {
    return function (error) {
        trace('报错 ' + context + ': ' + error.toString);
    };
}

// 新建2个节点并建立连接
function Connection2(stream, handler) {
    let servers = null;
    let pc1 = new RTCPeerConnection(servers);
    let pc2 = new RTCPeerConnection(servers);

    pc1.addStream(stream);
    pc1.onicecandidate = function (event) {
        if (event.candidate) {
            pc2.addIceCandidate(new RTCIceCandidate(event.candidate),
                doNothing, errFunc('AddIceCandidate'));
        }
    };
    pc2.onicecandidate = function (event) {
        if (event.candidate) {
            pc1.addIceCandidate(new RTCIceCandidate(event.candidate),
                doNothing, errFunc('AddIceCandidate'));
        }
    };
    pc2.onaddstream = function (e) {
        handler(e.stream);
    };
    pc1.createOffer(function (desc) {
        pc1.setLocalDescription(desc);
        pc2.setRemoteDescription(desc);
        pc2.createAnswer(function (desc2) {
            pc2.setLocalDescription(desc2);
            pc1.setRemoteDescription(desc2);
        }, errFunc('pc2.createAnswer'));
    }, errFunc('pc1.createOffer'));
    this.pc1 = pc1;
    this.pc2 = pc2;
}

Connection2.prototype.close = function () {
    this.pc1.close();
    this.pc2.close();
};
