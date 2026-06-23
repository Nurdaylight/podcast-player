// Application State
let episodes = [];
let currentEpisodeIndex = 0;
let parsedCues = [];
let activeCueIndex = -1;
let autoscrollEnabled = true;
let isSeeking = false;


// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const playlistContainer = document.getElementById('playlist');

const coverArt = document.getElementById('episode-cover');
const podcastTitle = document.getElementById('episode-podcast');
const trackTitle = document.getElementById('episode-title');
const trackDesc = document.getElementById('episode-desc');

const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const seekBar = document.getElementById('seek-bar');
const currentTimeLabel = document.getElementById('current-time');
const totalTimeLabel = document.getElementById('total-time');

const speedBtn = document.getElementById('speed-btn');
const speedMenu = document.getElementById('speed-menu');
const muteBtn = document.getElementById('mute-btn');
const volumeIcon = document.getElementById('volume-icon');
const volumeSlider = document.getElementById('volume-slider');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const transcriptBody = document.getElementById('transcript-body');
const autoscrollBtn = document.getElementById('autoscroll-btn');

// Initial Setup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('data.json?t=' + Date.now());
    episodes = await response.json();
    
    if (episodes.length > 0) {
      renderPlaylist();
      loadEpisode(0, false); // Load first episode without autoplay
    } else {
      playlistContainer.innerHTML = '<div class="loading-placeholder">No episodes found.</div>';
    }
  } catch (error) {
    console.error('Error fetching episode data:', error);
    playlistContainer.innerHTML = '<div class="loading-placeholder">Failed to load playlist.</div>';
  }
  
  setupEventListeners();
});

// Render Playlist Sidebar
function renderPlaylist() {
  playlistContainer.innerHTML = '';
  episodes.forEach((episode, index) => {
    const item = document.createElement('button');
    item.className = `playlist-item ${index === currentEpisodeIndex ? 'active' : ''}`;
    item.setAttribute('aria-label', `Play ${episode.title}`);
    item.innerHTML = `
      <img src="${episode.coverUrl}" alt="" class="item-cover">
      <div class="item-details">
        <h3 class="item-title">${episode.title}</h3>
        <div class="item-meta">
          <span>${episode.podcast}</span>
          <span>${episode.duration}</span>
        </div>
      </div>
    `;
    
    item.addEventListener('click', () => {
      if (index !== currentEpisodeIndex) {
        loadEpisode(index, true);
      }
    });
    
    playlistContainer.appendChild(item);
  });
}

// Load Episode
async function loadEpisode(index, autoplay = true) {
  currentEpisodeIndex = index;
  const episode = episodes[index];
  
  // Highlight active playlist item
  const items = playlistContainer.querySelectorAll('.playlist-item');
  items.forEach((item, idx) => {
    if (idx === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Set episode info
  coverArt.src = episode.coverUrl;
  coverArt.alt = `${episode.title} Cover Art`;
  podcastTitle.textContent = episode.podcast;
  trackTitle.textContent = episode.title;
  trackDesc.textContent = episode.description;
  
  // Set audio source
  audioPlayer.src = episode.audioUrl;
  audioPlayer.load();
  
  // Reset player UI
  seekBar.value = 0;
  currentTimeLabel.textContent = '0:00';
  totalTimeLabel.textContent = episode.duration;
  activeCueIndex = -1;
  
  // Load and parse Subtitles
  transcriptBody.innerHTML = '<div class="loading-placeholder"><span class="material-symbols-rounded">sync</span> Loading subtitles...</div>';
  try {
    const vttResponse = await fetch(episode.vttUrl + '?t=' + Date.now());
    if (!vttResponse.ok) throw new Error('WebVTT not found');
    const vttText = await vttResponse.text();
    parsedCues = parseWebVTT(vttText);
    renderTranscript(parsedCues);
  } catch (error) {
    console.error('Failed to load subtitles:', error);
    transcriptBody.innerHTML = `
      <div class="no-transcript-placeholder">
        <span class="material-symbols-rounded">subtitles_off</span>
        <p>Subtitles unavailable for this episode.</p>
      </div>
    `;
    parsedCues = [];
  }

  if (autoplay) {
    playAudio();
  }
}

// WebVTT Subtitle Parser
function parseWebVTT(vttText) {
  const lines = vttText.split(/\r?\n/);
  const cues = [];
  let currentCue = null;
  
  // Time regex matches HH:MM:SS.mmm or MM:SS.mmm
  const timeRegex = /^(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = timeRegex.exec(line);
    if (match) {
      if (currentCue) {
        cues.push(currentCue);
      }
      
      const parseSeconds = (hours, mins, secs, ms) => {
        const h = parseFloat(hours || 0);
        const m = parseFloat(mins || 0);
        const s = parseFloat(secs || 0);
        const milli = parseFloat(ms || 0) / 1000;
        return h * 3600 + m * 60 + s + milli;
      };
      
      const startSec = parseSeconds(match[1], match[2], match[3], match[4]);
      const endSec = parseSeconds(match[5], match[6], match[7], match[8]);
      
      currentCue = {
        start: startSec,
        end: endSec,
        text: ''
      };
    } else if (currentCue && line !== 'WEBVTT') {
      currentCue.text += (currentCue.text ? ' ' : '') + line;
    }
  }
  
  if (currentCue) {
    cues.push(currentCue);
  }
  
  return cues;
}

// Render Subtitles to Panel
function renderTranscript(cues) {
  if (cues.length === 0) {
    transcriptBody.innerHTML = `
      <div class="no-transcript-placeholder">
        <span class="material-symbols-rounded">subtitles</span>
        <p>No subtitle content found.</p>
      </div>
    `;
    return;
  }
  
  transcriptBody.innerHTML = '';
  cues.forEach((cue, index) => {
    const p = document.createElement('p');
    p.className = 'transcript-line';
    p.textContent = cue.text;
    p.setAttribute('data-index', index);
    
    p.addEventListener('click', () => {
      audioPlayer.currentTime = cue.start;
      playAudio();
    });
    
    transcriptBody.appendChild(p);
  });
}

// Format Seconds to MM:SS
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Audio Control Actions
function playAudio() {
  audioPlayer.play();
  playIcon.textContent = 'pause';
  playPauseBtn.setAttribute('aria-label', 'Pause');
}

function pauseAudio() {
  audioPlayer.pause();
  playIcon.textContent = 'play_arrow';
  playPauseBtn.setAttribute('aria-label', 'Play');
}

function togglePlay() {
  if (audioPlayer.paused) {
    playAudio();
  } else {
    pauseAudio();
  }
}

// Event Listeners Binding
function setupEventListeners() {
  // Play / Pause Toggle
  playPauseBtn.addEventListener('click', togglePlay);
  
  // Update timeline progress bar and labels
  audioPlayer.addEventListener('timeupdate', () => {
    const current = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 0;
    
    if (!isSeeking) {
      // Update seek slider
      if (duration > 0) {
        seekBar.value = (current / duration) * 100;
      }
      // Update time label
      currentTimeLabel.textContent = formatTime(current);
    }
    
    // Subtitle synchronization (always run to keep captions aligned)
    syncSubtitles(current);
  });
  
  // Load total duration when metadata is ready
  audioPlayer.addEventListener('loadedmetadata', () => {
    totalTimeLabel.textContent = formatTime(audioPlayer.duration);
  });
  
  // Seek bar interaction
  seekBar.addEventListener('mousedown', () => {
    isSeeking = true;
  });
  
  seekBar.addEventListener('touchstart', () => {
    isSeeking = true;
  });
  
  seekBar.addEventListener('input', () => {
    const pct = seekBar.value;
    const duration = audioPlayer.duration || 0;
    currentTimeLabel.textContent = formatTime((pct / 100) * duration);
  });
  
  seekBar.addEventListener('change', () => {
    const pct = seekBar.value;
    const duration = audioPlayer.duration || 0;
    audioPlayer.currentTime = (pct / 100) * duration;
    isSeeking = false;
  });
  
  // Handlers for releasing mouse/touch outside seek bar bounds
  const endSeek = () => {
    if (isSeeking) {
      const pct = seekBar.value;
      const duration = audioPlayer.duration || 0;
      audioPlayer.currentTime = (pct / 100) * duration;
      isSeeking = false;
    }
  };
  
  seekBar.addEventListener('mouseup', endSeek);
  seekBar.addEventListener('touchend', endSeek);
  
  // Playback speed settings
  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speedMenu.classList.toggle('show');
  });
  
  document.addEventListener('click', () => {
    speedMenu.classList.remove('show');
  });
  
  speedMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.getAttribute('data-speed'));
      audioPlayer.playbackRate = speed;
      speedBtn.textContent = `${speed}x`;
      
      speedMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Volume and mute controls
  volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
    audioPlayer.muted = false;
    updateVolumeIcon(volumeSlider.value);
  });
  
  muteBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted;
    if (audioPlayer.muted) {
      volumeIcon.textContent = 'volume_off';
      volumeSlider.value = 0;
    } else {
      volumeSlider.value = audioPlayer.volume;
      updateVolumeIcon(audioPlayer.volume);
    }
  });

  // Track navigation
  prevBtn.addEventListener('click', () => {
    let prevIdx = currentEpisodeIndex - 1;
    if (prevIdx < 0) prevIdx = episodes.length - 1;
    loadEpisode(prevIdx, true);
  });
  
  nextBtn.addEventListener('click', () => {
    let nextIdx = currentEpisodeIndex + 1;
    if (nextIdx >= episodes.length) nextIdx = 0;
    loadEpisode(nextIdx, true);
  });
  
  // Handle auto-play on next when active ends
  audioPlayer.addEventListener('ended', () => {
    let nextIdx = currentEpisodeIndex + 1;
    if (nextIdx < episodes.length) {
      loadEpisode(nextIdx, true);
    } else {
      pauseAudio();
    }
  });
  
  // Toggle auto-scroll transcript setting
  autoscrollBtn.addEventListener('click', () => {
    autoscrollEnabled = !autoscrollEnabled;
    autoscrollBtn.classList.toggle('active', autoscrollEnabled);
  });
}

// Update Volume Icon based on scale
function updateVolumeIcon(volume) {
  if (volume == 0) {
    volumeIcon.textContent = 'volume_off';
  } else if (volume < 0.5) {
    volumeIcon.textContent = 'volume_down';
  } else {
    volumeIcon.textContent = 'volume_up';
  }
}

// Subtitles Sync Loop
function syncSubtitles(time) {
  if (parsedCues.length === 0) return;
  
  // Find current active cue
  let currentCueIdx = parsedCues.findIndex(cue => time >= cue.start && time <= cue.end);
  
  // If active cue changed
  if (currentCueIdx !== activeCueIndex) {
    activeCueIndex = currentCueIdx;
    
    // Remove active highlight from all lines
    const lines = transcriptBody.querySelectorAll('.transcript-line');
    lines.forEach(line => line.classList.remove('active'));
    
    if (activeCueIndex !== -1) {
      const activeLine = transcriptBody.querySelector(`.transcript-line[data-index="${activeCueIndex}"]`);
      if (activeLine) {
        activeLine.classList.add('active');
        
        // Auto Scroll to active subtitle centered in panel
        if (autoscrollEnabled) {
          transcriptBody.scrollTo({
            top: activeLine.offsetTop - (transcriptBody.clientHeight / 2) + (activeLine.clientHeight / 2),
            behavior: 'smooth'
          });
        }
      }
    }
  }
}
