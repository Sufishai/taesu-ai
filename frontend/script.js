const face = document.getElementById("face");
let currentEmotion = "neutral";
/* preload */
["idle", "talk1", "talk2", "talk3"].forEach(e => {
  const img = new Image();
  img.src = `assets/${e}.png`;
});

// voice loading
let selectedVoice = null;
let recognitionStarted = false;

// speechSynthesis.onvoiceschanged = () => {
//   const voices = speechSynthesis.getVoices();

//   selectedVoice =
//     voices.find(v => v.name.includes("David")) ||
//     voices.find(v => v.name.includes("Mark")) ||
//     voices.find(v => v.name.includes("Male")) ||
//     voices.find(v => v.lang === "en-US") ||
//     voices[0];

//   console.log("Using voice:", selectedVoice ? selectedVoice.name : "default");
// };

/* state */ 
const STATE = {
  IDLE: "idle",
  ACTIVE: "active",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

let currentState = STATE.IDLE;
let lastInteractionTime = Date.now();
let canSend = true;
let speechTimeout;

/* talking animation frames */
const talkingFrames = [
  "assets/talk1.png",
  "assets/talk2.png",
  "assets/talk3.png",
  "assets/talk2.png"
];

let talkIndex = 0;
let talkInterval;

/* wake word */
// function isWakeWord(text) {
//   return text.includes("taesu");

// }
function isWakeWord(text) {
  const keywords = [ "taesu", "tesu", "teisu", "tasu", "hatisu", "hetesu", "taesoo", "hey taesu","hi taesu","hi taisu", "hey teisu", "hey tasu", "hey hatisu", "hey hetesu"];

  return keywords.some(word => text.includes(word));
}

function isSleepWord(text) {
  const sleepWords = [
    "ok done",
    "okay done",
    "goodbye",
    "bye",
    "stop",
    "sleep",
    "go idle",
    "that's all",
    "ok were done",
    "okay were done",
    "taesu stop",
    "taesu sleep",
    "taesu go idle"
  ];

  return sleepWords.some(word => text.includes(word));
}
/* speech recognition */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = "en-US";

// recognition.onresult = (event) => {
//   const text =
//     event.results[event.results.length - 1][0].transcript.toLowerCase();

//   console.log("Heard:", text);

//   if (text.length < 3) return;

//   if (currentState === STATE.IDLE && isWakeWord(text)) {
//     enterActiveMode();
//     return;
//   }

//   if (currentState === STATE.ACTIVE) {
//     handleUserSpeech(text);
//   }
// };

recognition.onresult = (event) => {

  const text =
    event.results[event.results.length - 1][0]
      .transcript
      .toLowerCase()
      .trim();

  console.log("Heard:", text);

  if (currentState === STATE.IDLE) {

    if (isWakeWord(text)) {
      enterActiveMode();
    }

    return;
  }

  if (isSleepWord(text)) {

    speakText("Alright. Returning to idle mode.");

    setTimeout(() => {
      goIdle();
    }, 1500);

    return;
  }

  if (currentState === STATE.ACTIVE) {
    handleUserSpeech(text);
  }
};
recognition.onend = () => recognition.start();

recognition.onstart = () => {
  console.log(" Mic started listening...");
};
/* active mode */
function enterActiveMode() {
  currentState = STATE.ACTIVE;
  face.src = "assets/idle.png";

  lastInteractionTime = Date.now();
  speakText("Hi… I'm here.Hows it going?");
}

/* handle speech */
function handleUserSpeech(text) {
  clearTimeout(speechTimeout);

  speechTimeout = setTimeout(() => {
    if (!canSend) return;

    canSend = false;
    sendMessage(text);

    setTimeout(() => {
      canSend = true;
    }, 3000);
  }, 1500);
  lastInteractionTime = Date.now();
}

/* backend */
// async function sendMessage(text) {
//   currentState = STATE.THINKING;
//   face.src = "assets/idle.png";

//   try {
//     const res = await fetch("http://127.0.0.1:8000/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message: text })
//     });

//     const data = await res.json();
//     console.log("RESPONSE:", data); 
//     speakResponse(data);

//   } catch (err) {
//     console.error(err);
//     speakText("Something went wrong.");
//   }
// }
async function sendMessage(text) {
  currentState = STATE.THINKING;
}

speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();

  selectedVoice =
    voices.find(v => v.name.includes("David")) ||
    voices.find(v => v.name.includes("Mark")) ||
    voices.find(v => v.name.includes("Male")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  console.log("Using voice:", selectedVoice ? selectedVoice.name : "default");
};

function safeStartRecognition() {
  if (recognitionStarted) return;

  try {
    recognition.start();
    recognitionStarted = true;
  } catch (e) {
    console.log("Recognition already running");
  }
}

function safeStopRecognition() {
  if (!recognitionStarted) return;

  try {
    recognition.stop();
    recognitionStarted = false;
  } catch (e) {
    console.log("Recognition already stopped");
  }
}

recognition.onend = () => {
  recognitionStarted = false;

  if (currentState !== STATE.SPEAKING) {
    safeStartRecognition();
  }
};

recognition.onstart = () => {
  recognitionStarted = true;
  console.log("Mic started listening...");
};

function speakResponse(data) {
  if (!data || !data.response) return;

  currentEmotion = data.emotion || "neutral";
  speakText(data.response);
}

function addNaturalPauses(text) {
  return text
    .replace(/\./g, "... ")
    .replace(/,/g, ", ");
}

function speakText(text) {
  currentState = STATE.SPEAKING;

  speechSynthesis.cancel();

  text = addNaturalPauses(text);

  const utter = new SpeechSynthesisUtterance(text);

  if (selectedVoice) {
    utter.voice = selectedVoice;
  }

  switch (currentEmotion) {
    case "happy":
      utter.rate = 1.05;
      utter.pitch = 1.05;
      break;

    case "sad":
      utter.rate = 0.85;
      utter.pitch = 0.8;
      break;

    case "thinking":
      utter.rate = 0.9;
      utter.pitch = 0.9;
      break;

    case "calm":
      utter.rate = 0.9;
      utter.pitch = 0.85;
      break;

    default:
      utter.rate = 0.93;
      utter.pitch = 0.82;
  }

  utter.onstart = () => {
    safeStopRecognition();
    startTalkingAnimation();
  };

  utter.onend = () => {
    stopTalkingAnimation();
    currentState = STATE.ACTIVE;
    face.src = "assets/idle.png";
    lastInteractionTime = Date.now();
    safeStartRecognition();
  };

  speechSynthesis.speak(utter);
}

function startTalkingAnimation() {
  stopTalkingAnimation();

  talkInterval = setInterval(() => {
    face.src = talkingFrames[talkIndex];
    talkIndex = (talkIndex + 1) % talkingFrames.length;
  }, 120);
}

function stopTalkingAnimation() {
  clearInterval(talkInterval);
  face.src = "assets/idle.png";
}

setInterval(() => {
  if (
    currentState === STATE.ACTIVE &&
    Date.now() - lastInteractionTime > 30000
  ) {
    goIdle();
  }
}, 2000);

function goIdle() {
  currentState = STATE.IDLE;
  face.src = "assets/idle.png";
  console.log("Taesu idle mode");
}

safeStartRecognition();
/* animation */
function startTalkingAnimation() {
  stopTalkingAnimation();

  talkInterval = setInterval(() => {
    face.src = talkingFrames[talkIndex];
    talkIndex = (talkIndex + 1) % talkingFrames.length;
  }, 120);
}

function stopTalkingAnimation() {
  clearInterval(talkInterval);
   face.src = "assets/idle.png";
}

/* idle mode */
setInterval(() => {
  if (
    currentState === STATE.ACTIVE &&
    Date.now() - lastInteractionTime > 30000
  ) {
    goIdle();
  }
}, 2000);

function goIdle() {
  currentState = STATE.IDLE;
  face.src = "assets/idle.png";
  console.log("Taeiya idle mode");
}

safeStartRecognition();