const playBtn = document.getElementById("playBtn");
const record = document.getElementById("record");
const resetBtn = document.getElementById("resetBtn");
const music = document.getElementById("music");
const tonearm = document.getElementById("tonearm");
const progress = document.getElementById("progress");
const progressContainer = document.getElementById("progressContainer");
const timeDisplay = document.getElementById("timeDisplay");
const volume = document.getElementById("volume");
music.volume = volume.value;
const fileInput = document.getElementById("fileInput");
const songTitle = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");
const coverImage = document.getElementById("coverImage");
const gramophone = document.getElementById("gramophone");
let currentObjectURL = null;
let isPlaying = false;
let musicLoaded = false;
function formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );

}
playBtn.addEventListener("click", () => {
   if (!musicLoaded) {
    fileInput.click();
    return;
}
    if (!isPlaying) {
        record.classList.add("spin");
        tonearm.classList.remove("moveArm");
       void tonearm.offsetWidth;
       tonearm.classList.add("moveArm");
       music.play().catch(() => {});
        playBtn.textContent = "⏸";
        isPlaying = true;
    } else {
        record.classList.remove("spin");
        music.pause();
        tonearm.classList.remove("moveArm");
        playBtn.textContent = "▶";
        isPlaying = false;
    }

});
music.addEventListener("loadedmetadata", () => {

    timeDisplay.textContent =
        "00:00 / " + formatTime(music.duration);

});
resetBtn.addEventListener("click", () => {

    record.classList.remove("spin");
   tonearm.classList.remove("moveArm");
    music.pause();

    music.currentTime = 0;
     progress.style.width = "0%";
   timeDisplay.textContent =
    "00:00 / " + formatTime(music.duration);
    playBtn.textContent = "▶";

    isPlaying = false;

});
music.addEventListener("ended", () => {

    record.classList.remove("spin");

    tonearm.classList.remove("moveArm");
   playBtn.textContent = "▶";
   isPlaying = false;
});
music.addEventListener("timeupdate", () => {

if (!music.duration) return;

    const percent = (music.currentTime / music.duration) * 100;

    progress.style.width = percent + "%";
   timeDisplay.textContent =
    formatTime(music.currentTime) +
    " / " +
    formatTime(music.duration);
});
progressContainer.addEventListener("click", (event) => {

if (!music.duration) return;

    const width = progressContainer.clientWidth;

    const clickX = event.offsetX;

    const percent = clickX / width;

    music.currentTime = percent * music.duration;

});
volume.addEventListener("input", () => {

    music.volume = volume.value;

});
document.addEventListener("keydown", (event) => {

    if (event.code === "Space") {

        event.preventDefault();

        playBtn.click();

    }

});
function loadMusic(file) {
  if (!file.type.startsWith("audio/")) {
    alert("Only audio files are allowed.");
    return;
}
if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    }
  const url = 
  URL.createObjectURL(file);
  currentObjectURL = url;
  music.src = url;
music.load();
musicLoaded = true;

music.addEventListener("canplay", () => {
    music.play().catch(() => {});
}, { once: true });

record.classList.add("spin");

tonearm.classList.remove("moveArm");
void tonearm.offsetWidth;
tonearm.classList.add("moveArm");

playBtn.textContent = "⏸";

isPlaying = true;
  

  coverImage.style.display = 
  "none";
coverImage.style.opacity = "0";
coverImage.src = "";

}
fileInput.addEventListener("change", () => {

const file = fileInput.files[0];

if (!file) return;

if (!file.type.startsWith("audio/")) {
    return;
}

loadMusic(file);

   jsmediatags.read(file, {
    onSuccess: function(tag) {

        songTitle.textContent =
            tag.tags.title || "Unknown Song";

        artistName.textContent =
            tag.tags.artist || "Unknown Artist";
        if (tag.tags.picture) {

    const picture = tag.tags.picture;

    let imageData = "";

    for (let i = 0; i < picture.data.length; i++) {
        imageData += String.fromCharCode(picture.data[i]);
    }

    const base64String = btoa(imageData);

    coverImage.src =
        "data:" +
        picture.format +
        ";base64," +
        base64String;

    coverImage.style.display = "block";
   coverImage.style.opacity = "1";
} else {

    coverImage.style.display = "none";
   coverImage.style.opacity = "0";
    coverImage.src = "";

}
    },

    onError: function() {

        songTitle.textContent = "Unknown Song";

        artistName.textContent = "Unknown Artist";
        coverImage.style.display = "none";
       coverImage.style.opacity = "0";
       coverImage.src = "";

    }

});
});
gramophone.addEventListener("dragover", (event) => {
    event.preventDefault();
});
gramophone.addEventListener("drop", (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0];

    if (!file) return;

    fileInput.files = event.dataTransfer.files;
    
    fileInput.dispatchEvent(new Event("change"));
});
window.addEventListener("beforeunload", () => {
    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
    }
});
