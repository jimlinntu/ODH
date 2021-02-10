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

    let X_mouse = 0;
    let Y_mouse = 0;

    let reposition = (e_move) => {
        let dx = e_move.screenX - X_mouse;
        let dy = e_move.screenY - Y_mouse;
        // fire the event to the ODHFront instance
        let delta = {"x": dx, "y": dy};

        // Update the iframe in incremental fashion
        window.parent.postMessage({
            action: 'moveIFrame',
            params: {
                delta: delta,
            }
        }, '*');

        // update the mouse position
        X_mouse = e_move.screenX;
        Y_mouse = e_move.screenY;
    }

    headsec.addEventListener("mousedown", (e_down) => {
        X_mouse = e_down.screenX;
        Y_mouse = e_down.screenY;
        headsec.addEventListener("mousemove", reposition);

        e_down.stopPropagation();
        e_down.preventDefault();
    });

    headsec.addEventListener("mouseup", (e) => {
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