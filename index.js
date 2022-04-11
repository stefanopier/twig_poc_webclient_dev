const debug = true;
const red5proDebug = false;
// DOM
let loginContainer;
let showContainer;
let loginForm;
let eInput; 
let pInput;
let eField;
let userForm;
let nickInput;
let loginFormBtn;
let userFormBtn;
let pics; 
let streamingEvents;
let streamingEventsContainer;
let streamingEventCompositions;
let streamingEventCompositionsContainer;

let devModeBtn;
let devModeSection;
let cameraSelect;
let micSelect;
let resContainer;
let settingsControls;

let streamStatusField;

let programPubStatusStreamTitle;
let programPubAddressField;
let programSubStatusStreamTitle;
let programSubAddressField;

let statsField;
let statsBitrateField;
let statsPacketsField;
let statsResolutionField;
let statsSampleRateField;
let statsSampleSizeField;

let leaveEventBtn;
let joinGroupBtn;
let groupSection;

let programSubscriberContainer;
let programSubscriberDOM;
let programPublisherDOM;
let videoGridSelfPublisherDOM;
let audioGridSelfPublisherDOM;
let peerSubscribersContainer;
let gridSubscriberDOM;

const standardFetchTimeout = 1000; // INTERVALLO in ms TIMEOUT forza timeout rispetto a 90s Firefox 300s Chrome
let authObj;
let actualSession;
let verboseLogging = false;
let pubShuttingDown = false;
let subShuttingDown = false;
let devMode = false;
let activeEventIndex;
let activeCompositionIndex;

function setDeveloperMode() {
  devMode = !devMode;
  if(devMode) {
    devModeSection.classList.remove('hideEl');
  } else {
    devModeSection.classList.add('hideEl');
  }
}

function getDOMElements() {
  loginContainer = document.getElementById("login-container");
  showContainer = document.getElementById("show-container");
  loginForm = document.getElementById("login-form");
  eInput = document.getElementById("eInput");
  pInput = document.getElementById("pInput");
  eField = document.getElementById("eField");
  userForm = document.getElementById("user-form");
  nickInput = document.getElementById("nickname-input");
  picsSelection = document.getElementById("pics");
  loginFormBtn = document.getElementById("login-form-submit");
  userFormBtn = document.getElementById("user-form-submit");
  streamingEventsContainer = document.getElementById('streaming-events-container');
  programSubscriberContainer = document.getElementById('program-subscriber-container');
  programSubscriberDOM = document.getElementById('program-subscriber');
  videoGridSelfPublisherDOM = document.getElementById('red5pro-grid-publisher');
  audioGridSelfPublisherDOM = document.getElementById('red5pro-audio-grid-publisher');
  peerSubscribersContainer = document.getElementById('peer-subscribers-container');
  devModeBtn = document.getElementById('dev-mode');
  devModeSection = document.getElementById('dev-mode-section');
  //cameraSelect = document.getElementById('camera-select');
  micSelect = document.getElementById('mic-select');
  settingsControls = document.getElementsByClassName('settings-control');
  resContainer = document.getElementById('res-container');
  programSubStatusStreamTitle = document.getElementById('program-sub-stream-title');
  streamStatusField = document.getElementById('stream-status-field');
  statsField = document.getElementById('stats-field');
  statsBitrateField = document.getElementById('stats-bitrate-field');
  statsPacketsField = document.getElementById('stats-packets-field');
  statsSampleRateField = document.getElementById('stats-samplerate-field');
  statsSampleSizeField = document.getElementById('stats-samplesize-field');
  statsResolutionField = document.getElementById('stats-resolution-field');
  programSubAddressField = document.getElementById('program-sub-address-field');
  leaveEventBtn = document.getElementById('leave-event');
  joinGroupBtn = document.getElementById('join-group');
  groupSection= document.getElementById('group-section');
}
/**
 * ****************************************************************************
 * 
 * RED5
 */
async function getStreamingEvents() {
  streamingEvents = await getData('/event');
  // show events thumbnails
  if(streamingEvents) {  
    for (let i = 0; i < streamingEvents.length; i++) {
      const d1 = document.createElement('div');
      d1.className = 'col-md-4 themed-grid-col border';
      streamingEventsContainer.appendChild(d1);

      const d2 = document.createElement('div');
      d2.className = 'row justify-content-center';
      d1.appendChild(d2);

      const d3 = document.createElement('div');
      d3.className = 'col-md-6 themed-grid-col';
      d2.appendChild(d3);
      const d4 = document.createElement('img');
      d4.id = `event${i}`;
      d4.className = 'img-thumbnail cursorlink';
      d4.setAttribute('src', streamingEvents[i].img);
      d3.appendChild(d4);

      const d5 = document.createElement('div');
      d3.appendChild(d5);
      const d6 = document.createElement('p');
      d6.textContent = `${streamingEvents[i].name} ${streamingEvents[i].date}`;
      d5.appendChild(d6);

      // join event on click
      d4.addEventListener('click', async (event) => {
        // hide Events
        streamingEventsContainer.classList.add('hideEl');
        activeEventIndex = parseInt(event.target.id.slice(5));
        await joinEvent();
      });
    }
  }
}

function setLogLevel() {
  red5prosdk.setLogLevel(verboseLogging ? red5prosdk.LOG_LEVELS.TRACE : red5prosdk.LOG_LEVELS.WARN);
}
/**
 * ****************************************************************************
 * 
 * AUTH
 */
async function login(e) {
  e.preventDefault(); //preventing from form submitting
  (eInput.value == "") ? eInput.classList.add('uk-form-danger') : checkEmail();
  (pInput.value == "") ? pInput.classList.add('uk-form-danger') : checkPass();

  function checkEmail(){
    let pattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/; //pattern for validate email
    if(!eInput.value.match(pattern)){
      eInput.classList.add('uk-form-danger');
      eInput.classList.remove('uk-form-success');
      (eInput.value != "") ? eField.innerText = "Enter a valid email address" : eField.innerText = "Email can't be blank";
    }else{
      eInput.classList.add('uk-form-success');
      eInput.classList.remove('uk-form-danger');
      eField.innerText = '';
    }
  }

  function checkPass(){
    if(pInput.value == ""){
      pInput.classList.add('uk-form-danger');
      pInput.classList.remove('uk-form-success');
    }else{ 
      pInput.classList.add('uk-form-success');
      pInput.classList.remove('uk-form-danger');
    }
  }

  eInput.onkeyup = ()=>{checkEmail();} //calling checkEmail function on email input keyup
  pInput.onkeyup = ()=>{checkPass();} //calling checkPassword function on pass input keyup

  if(!eInput.classList.contains('uk-form-danger') && !pInput.classList.contains('uk-form-danger')){
    //authObj = await postData('/authentication', { "email": eInput.value, "password": pInput.value, "tester": true });
    authObj = await postData('/authentication', { "email": eInput.value, "password": pInput.value });
    if (authObj) {  
      reqHeaders.headers = {
        'Authorization': authObj.accessToken,
      }
      if(debug) console.log('Login response',authObj);
      
      actualSession = await getData(`/session/${authObj.session_id}`);
      await getStreamingServerData();
      await getStreamingEvents();  
      loginContainer.classList.add('hideEl');
      showContainer.classList.remove('hideEl');
    }
  }
}
/**
 * ****************************************************************************
 * 
 * RUNTIME
 */
 async function leaveEventSeq() {
  await subscribersShutdown();
  await publishersShutdown();
  programSubscriberDOM.classList.add('hideEl');
  streamingEventsContainer.classList.add('hideEl');
  leaveEventBtn.classList.add('hideEl');
}

async function unloadFlow() {
  await subscribersShutdown();
  await publishersShutdown();
}

async function joinEvent() {    
  let evt = await patchData(`/session/${authObj.session_id}`, { "event_id": streamingEvents[activeEventIndex].id });
  if(!evt) return;
  if(debug) console.log('Active event',streamingEvents[activeEventIndex]);
  // subscribe to program
  try {      
    programSubscriberDOM.classList.remove('hideEl');
    await trySubProgram();
    programSubStatusStreamTitle.innerText = streamingEvents[activeEventIndex].eventStreams[0].streamName;
   } catch (error) {
    console.error(`[joinEvent] subscribe ${error}`);
  }

  if (streamingEvents[activeEventIndex].allowGroups) {
    joinGroupBtn.disabled = false;
    groupSection.classList.remove('hideEl');
  } else {
    joinGroupBtn.disabled = true;
    groupSection.classList.add('hideEl');
  }
  // start grid publishers 
  videoGridSelfPublisherDOM.classList.remove('hideEl');
  audioGridSelfPublisherDOM.classList.remove('hideEl');      
  streamingEvents[activeEventIndex].publishStreams.forEach(el => {
    if(el.video) {
      videoGridSelfPublisherStreamName = el.streamName;
    } else {
      audioGridSelfPublisherStreamName = el.streamName;
    }
  });

  setVideoGridPublishableState(true);
  setAudioGridPublishableState(true);
  await setVideoGridPublisher();
  await setAudioGridPublisher();

  try {
    await startVideoGridPublisher();
    await startAudioGridPublisher();
    if(!leaveEventBtn) getDOMElements();
    leaveEventBtn.classList.remove('hideEl');
    leaveEventBtn.addEventListener("click", leaveEventSeq);
  } catch (error) {
    console.error(`[joinEvent] publish ${error}`);
  }
}

window.onload = async () => {
   // Set Red5Pro log level.
   if (red5proDebug) {
    red5prosdk.setLogLevel('debug');
  }
  else {
    red5prosdk.setLogLevel('error');
  }

  getDOMElements();
  if(devModeBtn) {
    devModeBtn.addEventListener('click', () => {
      setDeveloperMode();
    });

    if(cameraSelect) {
      cameraSelect.innerHTML = cameraSelectInnerHTML;
      cameraSelect.addEventListener('change', function() {
        onMediaSelect(statsField);
      });
    };
  }

  if(loginFormBtn) {
    loginFormBtn.addEventListener("click", login); 
  }

  if(userFormBtn) {
    userFormBtn.addEventListener("click", async (e)=>{
      e.preventDefault(); //preventing from form submitting
      e = await patchData(`/user/${authObj.user.id}`, { "nickname": nickInput.value, "avatar": picsSelection.value });
      if(!e) return;
    });
  }

  if(joinGroupBtn)  {
    joinGroupBtn.addEventListener('click', async (event) => {
      actualSession = await patchData(`/session/${authObj.session_id}`, { "joinRandomGroup": true });

      console.log('********************actualSession', actualSession.joinedGroup)

      actualSession.joinedGroup.sessions.forEach(async (el) =>{
        if(el.session_id !== authObj.session_id) {
          const d1 = document.createElement('div');
          d1.className = 'pb-3 peer-subscriber-container';
          peerSubscribersContainer.appendChild(d1);
          const d2 = document.createElement('audio');
          d2.id = el.session_id;
          d2.className = 'red5pro-subscriber red5pro-media-background peer-subscriber-dom';
          d2.controls = true;
          d2.autoplay = true;
          d2.setAttribute("playsinline",'');
          d1.appendChild(d2);
          try {
            d2.addEventListener('canplay', (event) => {
              onVideoElementPlayback(event, d2)
            });
            await starPeerSubscriber(el.streamName, d2);
          } catch (error) {
            console.log(`Subscribe to peer error ${error}`);
            d1.remove();
            d2.remove();
          }  
        }
      });
    });
  }

  if(leaveEventBtn) {
    leaveEventBtn.classList.add('hideEl');
  }

  window.addEventListener('pagehide', unloadFlow);
  window.addEventListener('beforeunload', unloadFlow);
}
