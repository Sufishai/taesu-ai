const face = document.getElementById("face");

const frames = [
  "assets/talk1.png",
  "assets/talk2.png",
  "assets/talk3.png",
  "assets/talk2.png"
];

let i = 0;

setInterval(() => {
  face.src = frames[i];
  i = (i + 1) % frames.length;
}, 120);