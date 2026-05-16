const face = document.getElementById("face");
let currentEmotion = "neutral";
/* preload */
["idle", "talk1", "talk2", "talk3"].forEach(e => {
  const img = new Image();
  img.src = `assets/${e}.png`;
});

// voice loading
let selectedVoice = null;

speechSynthesis.onvoiceschanged = () => {
const voices = speechSynthesis.getVoices();

const selectedVoice =
  voices.find(v => v.name.includes("David")) ||
  voices.find(v => v.name.includes("Mark")) ||
  voices.find(v => v.name.includes("Male")) ||
  voices.find(v => v.lang === "en-US") ||
  voices[0];

utter.voice = selectedVoice;
};
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
  const keywords = ["hi", "hey", "taesu", "tesu", "teisu", "tasu", "hatisu", "hetesu", "taesoo", "hey taesu", "hey teisu", "hey tasu", "hey hatisu", "hey hetesu"];

  return keywords.some(word => text.includes(word));
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
    event.results[event.results.length - 1][0].transcript.toLowerCase();

  console.log(" Heard:", text);

  if (isWakeWord(text)) {
    console.log("Wake word detected");
    enterActiveMode();
    return;
  }

  if (currentState === STATE.ACTIVE) {
    handleUserSpeech(text);
  }
};
recognition.onend = () => recognition.start();
function startListening() {
    try {
  recognition.start();
  console.log("Manual start triggered");
  } catch (e) {
    console.log("Already started");
  }
}
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
  face.src = "assets/idle.png";

  try {
    console.log("Sending:", text);

    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    console.log("Status:", res.status);

    if (!res.ok) {
      throw new Error("Server error: " + res.status);
    }

    let data;

    try {
      data = await res.json();
    } catch (e) {
      console.warn("JSON parse failed");
      data = {
        response: "Fallback response",
        emotion: "neutral"
      };
    }

    console.log("Parsed Response:", data);

    speakResponse(data);

  } catch (err) {
    console.error("Error:", err);

    if (currentState !== STATE.SPEAKING) {
      speakText("Something went wrong.");
    }
  }
}

/* speaking with animation */
// function speakResponse(data) {
//   currentState = STATE.SPEAKING;

//   let emotion = data.emotion || "neutral";

//   if (emotion === "angry") emotion = "neutral";

//   const audio = new Audio(data.voice);

//   startTalkingAnimation();
//   audio.play();

//   audio.onended = () => {
//     stopTalkingAnimation();
//     currentState = STATE.ACTIVE;
//     face.src = "assets/idle.png";
//     lastInteractionTime = Date.now();
//   };
// }
function speakResponse(data) {
  if (!data.voice && !data.response) return;

  if (data.voice) {
    const audio = new Audio(data.voice);

    audio.onplay = () => {
      startTalkingAnimation();
    };

    audio.onended = () => {
      stopTalkingAnimation();
      currentState = STATE.ACTIVE;
      face.src = "assets/idle.png";
      lastInteractionTime = Date.now();
    };

    audio.onerror = () => {
      stopTalkingAnimation();
      speakText("Audio failed");
    };
    audio.load();
    audio.play().catch(err => {
      console.error("Play error:", err);
    });

  } else {
    speakText(data.response);
  }
}
function addNaturalPauses(text) {
    return text
      .replace(/\./g, "... ")
      .replace(/,/g, ", ");
}
function speakText(text) {

  const utter = new SpeechSynthesisUtterance(text);

  const voices = speechSynthesis.getVoices();

  const selectedVoice =
    voices.find(v => v.name.includes("David")) ||
    voices.find(v => v.name.includes("Mark")) ||
    voices.find(v => v.name.includes("Male")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  utter.voice = selectedVoice;

  utter.onstart = () => {
    startTalkingAnimation();
  };

  utter.onend = () => {
    stopTalkingAnimation();
    currentState = STATE.ACTIVE;
    face.src = "assets/idle.png";
    lastInteractionTime = Date.now();
  };

  speechSynthesis.speak(utter);


  text = addNaturalPauses(text);

// Voice tuning
  switch (currentEmotion) {

    case "happy":
      utter.rate = 1.05;
      utter.pitch = 1.1;
      break;

    case "sad":
      utter.rate = 0.85;
      utter.pitch = 0.8;
      break;

    case "thinking":
      utter.rate = 0.9;
      utter.pitch = 0.95;
      break;

    case "calm":
      utter.rate = 0.9;
      utter.pitch = 0.85;
      break;

    default: 
      
     utter.rate = 0.93;
     utter.pitch = 0.82;

  }
}
  utter.onstart = () => {
    startTalkingAnimation();
  };

  utter.onend = () => {
    stopTalkingAnimation();
    currentState = STATE.ACTIVE;
    face.src = "assets/idle.png";
    lastInteractionTime = Date.now();
  };

  speechSynthesis.speak(utter);
  speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};

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