// 0. Collapsible elements
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}

// 1. SELECT ELEMENTS
const audios = document.querySelectorAll('audio');
const playAllBtn = document.getElementById('playAll');
const shuffleBtn = document.getElementById('shuffleBtn');
const shuffleStatus = document.getElementById('shuffleStatus');
const collapsibles = document.getElementsByClassName("collapsible");

let isShuffle = false;
let currentTrackIndex = -1;

// 2. COLLAPSIBLE LYRICS LOGIC
for (let i = 0; i < collapsibles.length; i++) {
    collapsibles[i].addEventListener("click", function() {
        this.classList.toggle("active");
        const content = this.nextElementSibling;
        content.style.display = (content.style.display === "block") ? "none" : "block";
    });
}

// 3. VISUAL HELPERS
function updatePlayAllUI(isPlaying) {
    if (isPlaying) {
        playAllBtn.classList.add('is-playing');
        playAllBtn.innerHTML = '<span class="icon">⏸</span> PLAYING...';
    } else {
        playAllBtn.classList.remove('is-playing');
        playAllBtn.innerHTML = '<span class="icon">▶</span> PLAY ALL';
    }
}

function highlightCard(index) {
    audios.forEach((audio, i) => {
        const card = audio.closest('.track-card');
        if (i === index) {
            card.classList.add('playing');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.classList.remove('playing');
        }
    });
}

// 4. CORE PLAYBACK ENGINE
function playTrack(index) {
    if (index < 0 || index >= audios.length) return;
    
    // Stop all other audios
    audios.forEach(a => { a.pause(); a.currentTime = 0; });

    currentTrackIndex = index;
    audios[index].play();
    highlightCard(index);
    updatePlayAllUI(true);
}

// 5. EVENT LISTENERS
playAllBtn.addEventListener('click', () => playTrack(0));

shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active-mode');
    shuffleStatus.innerText = isShuffle ? "ON" : "OFF";
});

audios.forEach((audio, index) => {
    // When a song is clicked/started manually
    audio.addEventListener('play', () => {
        // Stop others
        audios.forEach((other, i) => {
            if (other !== audio) {
                other.pause();
                other.closest('.track-card').classList.remove('playing');
            }
        });
        highlightCard(index);
        updatePlayAllUI(true);
    });

    // When a song is paused manually
    audio.addEventListener('pause', () => {
        const anyPlaying = Array.from(audios).some(a => !a.paused);
        if (!anyPlaying) updatePlayAllUI(false);
    });

    // NEXT SONG LOGIC (Sequence or Shuffle)
    audio.addEventListener('ended', () => {
        let nextIndex;
        if (isShuffle) {
            do {
                nextIndex = Math.floor(Math.random() * audios.length);
            } while (nextIndex === index && audios.length > 1);
        } else {
            nextIndex = index + 1;
        }

        if (nextIndex < audios.length) {
            playTrack(nextIndex);
        } else {
            updatePlayAllUI(false); // End of playlist
        }
    });
});