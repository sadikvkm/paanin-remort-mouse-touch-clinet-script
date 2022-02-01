loadScript('https://cdn.socket.io/4.4.1/socket.io.min.js');
loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');

const APP_SOCKET_URL = "https://dev.api.panvisual.com"
const APP_TOUCH_PAD_URL = "https://panvisual-mouse-pad.vercel.app/touch-pad";
var appSocketConnection;
var pointer;

var mousePointX = 0;
var mousePointY = 0;

const translate = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

class MultiTouchPad {

    constructor() {
        setTimeout(() => this.initAppConfig(), 1000);
    }

    initAppConfig() {
        this.initAppSocket();
        pointer = this.initAppSvgIcon(document.body);
        moveElement(pointer, translate.x, translate.y);
    }

    initAppSvgIcon(node) {
        const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const iconPath = document.createElementNS('http://www.w3.org/2000/svg','path');
        const iconSet = document.createElementNS('http://www.w3.org/2000/svg','g');
    
        svgIcon.setAttribute('fill', 'none');
        svgIcon.setAttribute('width', '25');
        svgIcon.setAttribute('height', '25');
        svgIcon.setAttribute('fill', 'white');
        svgIcon.setAttribute('stroke', 'black');
        svgIcon.style.position = "absolute";
        svgIcon.style.top = "2px";
        svgIcon.style.left = "2px";
        svgIcon.style.zIndex = 99999;
        iconPath.setAttribute('d','m7,7l10,67l19,-22l26,30l12,-10l-27,-30l18,-20l-58,-15z');
        iconPath.setAttribute('stroke-width', '4');
        iconSet.setAttribute("transform", "scale(0.25)");
        iconSet.appendChild(iconPath)
        svgIcon.appendChild(iconSet);
        node.appendChild(svgIcon);
        return svgIcon
    }

    initAppSocket() {
        const socket = io(APP_SOCKET_URL);
        initAppSocketEvents(socket)
        
    }
}

function appAppendQrCodeAttr(attr) {
    const el = document.createElement("div");
    el.style.background = '#fff';
    el.style.padding = '10px',
    el.style.display = 'inline-block';
    el.style.borderRadius = '10px';
    el.style.position = 'absolute';
    el.style.right = '10px';
    el.style.bottom = '10px';
    el.innerHTML = `<div id="${attr}"></div>`
    document.body.appendChild(el);
}

function loadScript(filename){
    var head=document.getElementsByTagName("head")[0];
    var script=document.createElement('script')
    head.appendChild(script);
    script.setAttribute("type","text/javascript")
    script.setAttribute("src", filename)
}

const mover = new MouseEvent('mouseover', {'view': window, 'bubbles': true, 'cancelable': true});
const mentor = new MouseEvent('mouseenter', {'view': window, 'bubbles': true, 'cancelable': true});

function inViewport(el) {
    var r, html;
    if (!el || 1 !== el.nodeType) { return false; }
    html = document.documentElement;
    r = el.getBoundingClientRect();

    return (!!r && r.bottom >= 0 && r.right >= 0 && r.top <= html.clientHeight && r.left <= html.clientWidth);
}



function moveElement(element, x, y) {
    element.style.transform = "translate(" + x + "px," + y + "px)";
    element.focus();
    if (!inViewport(element)) element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
    const t = element.getBoundingClientRect();
    element = getElementAtXY(t.x - 1, t.y - 1);
    if (element) element.dispatchEvent(mover);
    if (element) element.dispatchEvent(mentor);
}

function initAppSocketEvents(socket) {
    let token = getAccessToken();
    socket.emit('device-launched', { access_token: token });
    socket.on('device-lunched-success', function(data) {
        
        if(! token) {
            let token = data.access_token;
            setAccessToken(token)
        }

        appGenerateQR(token)
    });

    if(token) {
        console.log('use-touch-pad-' + token)
    }

    socket.on('touch-pad-event', function(data) {
        console.log(data);

        mousePointX = data.clientX;
        mousePointY = data.clientY;

        simulateEvent(data, document.body)

        
    });
}


function setAccessToken(token) {
    localStorage.setItem('access_token', token);
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function appGenerateQR(token) {
    let attr = "app-touch-qrCode-append";
    appAppendQrCodeAttr(attr)
    var qr = new QRCode(attr, {
        width: 180,
        height: 180,
    });
    qr.makeCode(APP_TOUCH_PAD_URL + '?token=' + token);
}

function pointerEvent(el, type, x, y, button) {
    el.dispatchEvent(new PointerEvent("pointerover",
      {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: (type == "pointerdown") ? 1 : (type == "pointermove") ? 2 : 3,
        pointerType: "mouse",
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y
      }))
}

function getElementAtXY(x, y) {
    let el = document.elementFromPoint(x, y);
    if (el instanceof HTMLIFrameElement)
      el = el.contentWindow.document.elementFromPoint(x, y);
    return el
}

var lastMouseEvent = {};
function simulateEvent(ev, el) {
    let t;
    switch (ev.type) {
        case 'click':
            t = pointer.getBoundingClientRect();
            el = getElementAtXY(t.x - 1, t.y - 1) || el;
            el.focus();
            pointerEvent(el, "pointerdown", t.x - 1, t.y - 1, ev.button);
            mouseEvent(el, ev.type, t.x - 1, t.y - 1, ev.button);
        break;
        case 'touchstart':
            lastMouseEvent = ev;
            t = pointer.getBoundingClientRect();
            el = getElementAtXY(t.x - 1, t.y - 1) || el;
            pointerEvent(el, "pointerdown", t.x - 1, t.y - 1, ev.button)
            mouseEvent(el, "mousedown", t.x - 1, t.y - 1, ev.button)
            break;

        case 'touchmove':
            console.log(ev, 'evevevevevevev', lastMouseEvent)
            dx = (ev.clientX - lastMouseEvent.clientX);
            dy = (ev.clientY - lastMouseEvent.clientY);
            console.log("move " + dx + " " + dy)
            if ((dx > 0 || dx < 0) && (dy > 0 || dy < 0)) {
              cx = translate.x + dx;
              cy = translate.y + dy;
              translate.x = parseInt(clamp(cx, -0.1, window.innerWidth + 1));
              translate.y = parseInt(clamp(cy, -0.1, window.innerHeight + 1))
              lastMouseEvent = ev;
              moveElement(pointer, translate.x, translate.y);
              t = pointer.getBoundingClientRect();
              el = getElementAtXY(t.x - 1, t.y - 1) || el;
              el.focus();
              pointerEvent(el, "pointermove", t.x - 1, t.y - 1, ev.button)
              mouseEvent(el, "mousemove", t.x - 1, t.y - 1, ev.button)
            }
            break;
    
        default:
            break;
    }
    
}

function mouseEvent(el, type, x, y, button) {
    el.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: false,
        view: window,
        button: button,
        buttons: button ? 1 : 0,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y
    }))
}



function clamp(a, b, c) {
    return (a < b) ? b : (a > c) ? c : a
}

new MultiTouchPad();


