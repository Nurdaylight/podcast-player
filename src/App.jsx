import React, { useState, useEffect, useRef } from 'react';
import './index.css';

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function App() {
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  const [activeCueId, setActiveCueId] = useState(null);
  const [cuesList, setCuesList] = useState([]);
  const [autoscrollEnabled, setAutoscrollEnabled] = useState(true);

  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const transcriptRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then(res => res.json())
      .then(data => setEpisodes(data))
      .catch(err => console.error("Failed to load episodes:", err));
  }, []);

  const currentEpisode = episodes[currentEpisodeIndex] || null;

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleDurationChange = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentEpisode]);

  // Track (WebVTT) Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // We must poll slightly or wait for the track to load its cues
    let interval;
    const checkTrack = () => {
      const tracks = audio.textTracks;
      if (tracks && tracks.length > 0) {
        const track = tracks[0];
        track.mode = 'hidden'; // Must be hidden so the browser parses it, but doesn't render native captions
        
        if (track.cues && track.cues.length > 0) {
          setCuesList(prev => {
            if (prev.length === 0) {
              clearInterval(interval);
              return Array.from(track.cues);
            }
            return prev;
          });
        }


      }
    };

    interval = setInterval(checkTrack, 500);

    return () => clearInterval(interval);
  }, [currentEpisode, cuesList.length]);

  // Autoscroll
  useEffect(() => {
    if (autoscrollEnabled && activeCueId && transcriptRef.current) {
      const activeEl = transcriptRef.current.querySelector('.transcript-line.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeCueId, autoscrollEnabled]);

  // Controls
  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime;
    setCurrentTime(time);
    
    // Sync active subtitle
    if (cuesList.length > 0) {
      const activeCue = cuesList.find(c => time >= c.startTime && time <= c.endTime);
      if (activeCue) {
        setActiveCueId(activeCue.id || activeCue.startTime);
      } else {
        setActiveCueId(null);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolume = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    audioRef.current.volume = vol;
    if (vol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const changeSpeed = (speed) => {
    setPlaybackRate(speed);
    audioRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  const playEpisode = (index) => {
    setCurrentEpisodeIndex(index);
    setCuesList([]); // reset cues
    setActiveCueId(null);
    setIsPlaying(true); // Optimistically set playing
  };

  // Autoplay when episode changes
  useEffect(() => {
    if (isPlaying && audioRef.current && currentEpisode) {
      audioRef.current.play().catch(e => {
        console.log("Autoplay prevented:", e);
        setIsPlaying(false);
      });
    }
  }, [currentEpisodeIndex]);

  const jumpToCue = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      if (!isPlaying) audioRef.current.play();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left-group">
          <div className="window-controls">
            <span className="dot close"></span>
            <span className="dot minimize"></span>
            <span className="dot maximize"></span>
          </div>
          <div className="logo">
            <span className="material-symbols-rounded logo-icon">graphic_eq</span>
            <h1>naiza</h1>
          </div>
        </div>
        <div className="header-tag">Interactive Transcripts</div>
      </header>

      <main className="app-main">
        {/* Sidebar */}
        <section className="sidebar-panel" aria-label="Podcast Playlist">
          <h2 className="panel-title">Episodes</h2>
          <div className="playlist-container">
            {episodes.length === 0 ? (
              <div className="loading-placeholder">Loading playlist...</div>
            ) : (
              episodes.map((ep, idx) => (
                <div 
                  key={ep.id}
                  className={`playlist-item ${idx === currentEpisodeIndex ? 'active' : ''}`}
                  onClick={() => playEpisode(idx)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') playEpisode(idx); }}
                >
                  <img src={`${import.meta.env.BASE_URL}${ep.coverUrl}`} alt="" className="item-cover" />
                  <div className="item-details">
                    <div className="item-title">{ep.title}</div>
                    <div className="item-meta">
                      <span>{ep.podcast || 'LibriVox'}</span>
                      <span>{ep.duration}</span>
                    </div>
                  </div>
                  {idx === currentEpisodeIndex && isPlaying && (
                    <span className="playing-indicator">
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Main Grid */}
        <div className="content-grid">
          
          {/* Player Panel */}
          <section className="player-panel" aria-label="Podcast Player">
            {currentEpisode ? (
              <>
                <div className="episode-details">
                  <img src={`${import.meta.env.BASE_URL}${currentEpisode.coverUrl}`} alt="Episode Cover Art" className="cover-art" />
                  <div className="episode-info">
                    <span className="podcast-title">{currentEpisode.podcast}</span>
                    <h2 className="track-title">{currentEpisode.title}</h2>
                    <p className="track-desc">{currentEpisode.description}</p>
                  </div>
                </div>

                <div className="player-controls-container">
                  <audio 
                    ref={audioRef} 
                    src={currentEpisode.audioUrl} 
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                  >
                    <track 
                      ref={trackRef}
                      kind="subtitles" 
                      src={`${import.meta.env.BASE_URL}${currentEpisode.vttUrl}`} 
                      default 
                    />
                  </audio>
                  
                  <div className="progress-container">
                    <span className="time-label">{formatTime(currentTime)}</span>
                    <input 
                      type="range" 
                      className="seek-slider" 
                      min="0" 
                      max={duration || 100} 
                      value={currentTime} 
                      onChange={handleSeek}
                      aria-label="Seek track"
                    />
                    <span className="time-label">{formatTime(duration)}</span>
                  </div>

                  <div className="control-bar">
                    <div className="speed-control">
                      <button 
                        className="control-btn secondary-btn" 
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        aria-label="Playback speed"
                      >
                        {playbackRate}x
                      </button>
                      {showSpeedMenu && (
                        <div className="speed-menu" style={{ display: 'flex' }}>
                          {[0.8, 1.0, 1.2, 1.5, 2.0].map(speed => (
                            <button 
                              key={speed}
                              className={playbackRate === speed ? 'active' : ''}
                              onClick={() => changeSpeed(speed)}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="primary-controls">
                      <button 
                        className="control-btn secondary-btn" 
                        onClick={() => playEpisode(Math.max(0, currentEpisodeIndex - 1))}
                        aria-label="Previous episode"
                      >
                        <span className="material-symbols-rounded">skip_previous</span>
                      </button>
                      <button 
                        className="control-btn play-btn" 
                        onClick={togglePlay}
                        aria-label="Play/Pause"
                      >
                        <span className="material-symbols-rounded">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <button 
                        className="control-btn secondary-btn" 
                        onClick={() => playEpisode(Math.min(episodes.length - 1, currentEpisodeIndex + 1))}
                        aria-label="Next episode"
                      >
                        <span className="material-symbols-rounded">skip_next</span>
                      </button>
                    </div>

                    <div className="volume-control">
                      <button 
                        className="control-btn secondary-btn" 
                        onClick={toggleMute}
                        aria-label="Mute/Unmute"
                      >
                        <span className="material-symbols-rounded">
                          {isMuted || volume === 0 ? 'volume_off' : 'volume_up'}
                        </span>
                      </button>
                      <input 
                        type="range" 
                        className="volume-slider" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={isMuted ? 0 : volume} 
                        onChange={handleVolume}
                        aria-label="Volume"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="episode-details">
                <div className="episode-info">
                  <h2 className="track-title">Select an episode</h2>
                  <p className="track-desc">Choose an episode from the sidebar.</p>
                </div>
              </div>
            )}
          </section>

          {/* Transcript Panel */}
          <section className="transcript-panel" aria-label="Interactive Transcript">
            <div className="transcript-header">
              <h2 className="panel-title">Interactive Subtitles</h2>
              <div className="transcript-actions">
                <button 
                  className={`action-toggle ${autoscrollEnabled ? 'active' : ''}`} 
                  onClick={() => setAutoscrollEnabled(!autoscrollEnabled)}
                  aria-label="Toggle Auto-Scroll"
                >
                  <span className="material-symbols-rounded">arrow_downward</span> Auto-Scroll
                </button>
              </div>
            </div>
            <div 
              className="transcript-body" 
              ref={transcriptRef}
              aria-live="polite" // Screen readers will announce changes
            >
              {!currentEpisode ? (
                <div className="no-transcript-placeholder">
                  <span className="material-symbols-rounded">subtitles</span>
                  <p>Select an episode to view subtitles.</p>
                </div>
              ) : cuesList.length === 0 ? (
                <div className="no-transcript-placeholder">
                  <p>Loading subtitles...</p>
                </div>
              ) : (
                cuesList.map((cue, i) => {
                  const cueId = cue.id || cue.startTime;
                  const isActive = activeCueId === cueId;
                  return (
                    <div 
                      key={i} 
                      className={`transcript-line ${isActive ? 'active' : ''}`}
                      onClick={() => jumpToCue(cue.startTime)}
                      role="button"
                      tabIndex="0"
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') jumpToCue(cue.startTime); }}
                    >
                      {cue.text}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2026 naiza. Powered by React, Vite, and native WebVTT. Hosted for free.</p>
      </footer>
    </div>
  );
}
