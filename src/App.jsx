import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const BASE = import.meta.env.BASE_URL;

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function App() {
  // Episode state
  const [episodes, setEpisodes] = useState([]);
  const [episodeIdx, setEpisodeIdx] = useState(0);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  // Subtitle state
  const [cues, setCues] = useState([]);
  const [activeCueIdx, setActiveCueIdx] = useState(-1);
  const [autoscroll, setAutoscroll] = useState(true);

  // Refs
  const audioRef = useRef(null);
  const transcriptRef = useRef(null);

  // Load episodes
  useEffect(() => {
    fetch(`${BASE}data.json`)
      .then(r => r.json())
      .then(setEpisodes)
      .catch(e => console.error('Failed to load episodes:', e));
  }, []);

  const episode = episodes[episodeIdx] || null;

  // Parse VTT manually — way more reliable than the TextTrack API
  useEffect(() => {
    if (!episode) return;
    setCues([]);
    setActiveCueIdx(-1);

    fetch(`${BASE}${episode.vttUrl}`)
      .then(r => r.text())
      .then(text => {
        const parsed = [];
        const blocks = text.split(/\n\n+/);
        for (const block of blocks) {
          const lines = block.trim().split('\n');
          const timeLine = lines.find(l => l.includes('-->'));
          if (!timeLine) continue;
          const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
          const textContent = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
          if (!textContent) continue;
          parsed.push({
            start: parseTimestamp(startStr),
            end: parseTimestamp(endStr),
            text: textContent,
          });
        }
        setCues(parsed);
      })
      .catch(e => console.error('Failed to load VTT:', e));
  }, [episode]);

  function parseTimestamp(str) {
    // Handles "MM:SS.mmm" or "HH:MM:SS.mmm"
    const parts = str.split(':');
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }

  // Sync active cue on time update
  const onTimeUpdate = () => {
    const t = audioRef.current.currentTime;
    setTime(t);
    const idx = cues.findIndex(c => t >= c.start && t < c.end);
    setActiveCueIdx(idx);
  };

  // Autoscroll to active cue
  useEffect(() => {
    if (!autoscroll || activeCueIdx < 0 || !transcriptRef.current) return;
    const el = transcriptRef.current.children[activeCueIdx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeCueIdx, autoscroll]);

  // Player controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };

  const seek = (e) => {
    const t = parseFloat(e.target.value);
    audioRef.current.currentTime = t;
    setTime(t);
  };

  const changeVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioRef.current.volume = v;
    if (v > 0) setMuted(false);
  };

  const toggleMute = () => {
    setMuted(!muted);
    audioRef.current.muted = !muted;
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    audioRef.current.playbackRate = s;
    setSpeedMenuOpen(false);
  };

  const selectEpisode = (idx) => {
    setEpisodeIdx(idx);
    setCues([]);
    setActiveCueIdx(-1);
    setPlaying(true);
  };

  // Autoplay on episode change
  useEffect(() => {
    if (playing && audioRef.current && episode) {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [episodeIdx]);

  const jumpTo = (startTime) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = startTime;
    if (!playing) audioRef.current.play();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left-group">
          <div className="window-controls">
            <span className="dot close" />
            <span className="dot minimize" />
            <span className="dot maximize" />
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
                  className={`playlist-item ${idx === episodeIdx ? 'active' : ''}`}
                  onClick={() => selectEpisode(idx)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectEpisode(idx); }}
                >
                  <img src={`${BASE}${ep.coverUrl}`} alt="" className="item-cover" />
                  <div className="item-details">
                    <div className="item-title">{ep.title}</div>
                    <div className="item-meta">
                      <span>{ep.podcast}</span>
                      <span>{ep.duration}</span>
                    </div>
                  </div>
                  {idx === episodeIdx && playing && (
                    <span className="playing-indicator">
                      <span className="bar" /><span className="bar" /><span className="bar" />
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
            {episode ? (
              <>
                <div className="episode-details">
                  <img src={`${BASE}${episode.coverUrl}`} alt="Episode Cover Art" className="cover-art" />
                  <div className="episode-info">
                    <span className="podcast-title">{episode.podcast}</span>
                    <h2 className="track-title">{episode.title}</h2>
                    <p className="track-desc">{episode.description}</p>
                  </div>
                </div>

                <div className="player-controls-container">
                  <audio
                    ref={audioRef}
                    src={/^https?:\/\//.test(episode.audioUrl) ? episode.audioUrl : `${BASE}${episode.audioUrl}`}
                    preload="metadata"
                    onTimeUpdate={onTimeUpdate}
                    onDurationChange={() => setDuration(audioRef.current.duration)}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                  />

                  <div className="progress-container">
                    <span className="time-label">{formatTime(time)}</span>
                    <input
                      type="range"
                      className="seek-slider"
                      min="0"
                      max={duration || 100}
                      value={time}
                      onChange={seek}
                      aria-label="Seek track"
                    />
                    <span className="time-label">{formatTime(duration)}</span>
                  </div>

                  <div className="control-bar">
                    <div className="speed-control">
                      <button
                        className="control-btn secondary-btn"
                        onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                        aria-label="Playback speed"
                      >
                        {speed}x
                      </button>
                      {speedMenuOpen && (
                        <div className="speed-menu" style={{ display: 'flex' }}>
                          {[0.8, 1.0, 1.2, 1.5, 2.0].map(s => (
                            <button
                              key={s}
                              className={speed === s ? 'active' : ''}
                              onClick={() => changeSpeed(s)}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="primary-controls">
                      <button
                        className="control-btn secondary-btn"
                        onClick={() => selectEpisode(Math.max(0, episodeIdx - 1))}
                        aria-label="Previous episode"
                      >
                        <span className="material-symbols-rounded">skip_previous</span>
                      </button>
                      <button
                        className="control-btn play-btn"
                        onClick={togglePlay}
                        aria-label={playing ? 'Pause' : 'Play'}
                        id="play-pause-btn"
                      >
                        <span className="material-symbols-rounded">
                          {playing ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <button
                        className="control-btn secondary-btn"
                        onClick={() => selectEpisode(Math.min(episodes.length - 1, episodeIdx + 1))}
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
                          {muted || volume === 0 ? 'volume_off' : 'volume_up'}
                        </span>
                      </button>
                      <input
                        type="range"
                        className="volume-slider"
                        min="0" max="1" step="0.05"
                        value={muted ? 0 : volume}
                        onChange={changeVolume}
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
              <button
                className={`action-toggle ${autoscroll ? 'active' : ''}`}
                onClick={() => setAutoscroll(!autoscroll)}
                aria-label="Toggle Auto-Scroll"
              >
                <span className="material-symbols-rounded">arrow_downward</span> Auto-Scroll
              </button>
            </div>
            <div className="transcript-body" ref={transcriptRef} aria-live="polite">
              {!episode ? (
                <div className="no-transcript-placeholder">
                  <span className="material-symbols-rounded">subtitles</span>
                  <p>Select an episode to view subtitles.</p>
                </div>
              ) : cues.length === 0 ? (
                <div className="no-transcript-placeholder">
                  <p>Loading subtitles...</p>
                </div>
              ) : (
                cues.map((cue, i) => (
                  <div
                    key={i}
                    className={`transcript-line ${i === activeCueIdx ? 'active' : ''}`}
                    onClick={() => jumpTo(cue.start)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') jumpTo(cue.start); }}
                  >
                    {cue.text}
                  </div>
                ))
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
