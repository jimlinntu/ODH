/* global spell */
function getImageSource(id) {
    return document.querySelector(`#${id}`).src;
}

function registerAddNoteLinks() {
    for (let link of document.getElementsByClassName('odh-addnote')) {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const ds = e.currentTarget.dataset;
            e.currentTarget.src = getImageSource('load');
            window.parent.postMessage({
                action: 'addNote',
                params: {
                    nindex: ds.nindex,
                    dindex: ds.dindex,
                    context: document.querySelector('.spell-content').innerHTML
                }
            }, '*');
        });
    }
}

function registerAudioLinks() {
    for (let link of document.getElementsByClassName('odh-playaudio')) {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const ds = e.currentTarget.dataset;
            window.parent.postMessage({
                action: 'playAudio',
                params: {
                    nindex: ds.nindex,
                    dindex: ds.dindex
                }
            }, '*');
        });
    }
}

function registerSoundLinks() {
    for (let link of document.getElementsByClassName('odh-playsound')) {
        link.setAttribute('src', getImageSource('play'));
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const ds = e.currentTarget.dataset;
            window.parent.postMessage({
                action: 'playSound',
                params: {
                    sound: ds.sound,
                }
            }, '*');
        });
    }
}

function registerDragbar() {
    let headsec = document.querySelector(".odh-headsection");
    if (!headsec) {
        return;
    }

    // https://stackoverflow.com/questions/10231805/get-iframe-src-param-from-inside-the-iframe-itself
    let iframe = window.frameElement;

    let X_mouse = 0;
    let Y_mouse = 0;

    let x_transform = (x) => {
        return x + iframe.offsetLeft;
    };

    let y_transform = (y) => {
        return y + iframe.offsetTop;
    };

    let reposition = (e_move) => {
        let dx = x_transform(e_move.clientX) - X_mouse;
        let dy = y_transform(e_move.clientY) - Y_mouse;

        let delta = {"x": dx, "y": dy};

        window.parent.postMessage({
            action: 'mousemove',
            params: {
                delta: delta,
            }
        }, '*');

    }

    headsec.addEventListener("mousedown", (e_down) => {
        X_mouse = x_transform(e_down.clientX);
        Y_mouse = y_transform(e_down.clientY);

        window.parent.postMessage({
            action: 'mousedown',
            params: {}
        }, "*");

        headsec.addEventListener("mousemove", reposition);

        e_down.stopPropagation();
        e_down.preventDefault();
    });

    headsec.addEventListener("mouseup", (e) => {

        window.parent.postMessage({
            action: 'mouseup',
            params: {}
        }, "*");

        headsec.removeEventListener("mousemove", reposition);
    });
}

function initSpellnTranslation(){
    document.querySelector('#odh-container').appendChild(spell());
    document.querySelector('.spell-content').innerHTML=document.querySelector('#context').innerHTML;
    if (document.querySelector('#monolingual').innerText == '1')
        hideTranslation();
}

function registerHiddenClass() {
    for (let div of document.getElementsByClassName('odh-definition')) {
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTranslation();
        });
    }
    // Enable anchor tags
    for (const a of document.querySelectorAll('a')) {
        a.target = "_blank"; // open on a new tab
        a.onclick = (e) => {
            // This is necessary!
            // Otherwise if the event bubbles up,
            // it may be cancelled by the parent handler (i.e. preventDefault)
            e.stopPropagation();
        };
    }
}

function hideTranslation(){
    let className = 'span.chn_dis, span.chn_tran, span.chn_sent, span.tgt_tran, span.tgt_sent'; // to add your bilingual translation div class name here.
    for (let div of document.querySelectorAll(className)) {
        div.classList.toggle('hidden');
    }
}

function onDomContentLoaded() {
    registerAddNoteLinks();
    registerAudioLinks();
    registerSoundLinks();
    registerHiddenClass();
    registerDragbar();
    initSpellnTranslation();
}

function onMessage(e) {
    const { action, params } = e.data;
    const method = window['api_' + action];
    if (typeof(method) === 'function') {
        method(params);
    }
}

function api_setActionState(result) {
    const { response, params } = result;
    const { nindex, dindex } = params;

    const match = document.querySelector(`.odh-addnote[data-nindex="${nindex}"].odh-addnote[data-dindex="${dindex}"]`);
    if (response)
        match.src = getImageSource('good');
    else
        match.src = getImageSource('fail');

    setTimeout(() => {
        match.src = getImageSource('plus');
    }, 1000);
}

function onMouseWheel(e) {
    document.querySelector('html').scrollTop -= e.wheelDeltaY / 3;
    document.querySelector('body').scrollTop -= e.wheelDeltaY / 3;
    e.preventDefault();
}

document.addEventListener('DOMContentLoaded', onDomContentLoaded, false);
window.addEventListener('message', onMessage);
window.addEventListener('wheel', onMouseWheel, {passive: false});