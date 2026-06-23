# GEMINI Project Guide - Interactive Podcast Subtitles

This file tracks the project overview, tech stack, and design guidelines for the Interactive Podcast Subtitles web application.

## Project Goal
Create a fast, responsive, and aesthetically premium website that allows users to select podcast episodes, listen to the audio playback, and read a synchronized interactive transcript. Clicking on any part of the transcript seeks the audio player to that timestamp.

## Tech Stack
- **Structure**: Semantic HTML5 (`<audio>`, `<track>`, grids, flex layout)
- **Styling**: Vanilla CSS (CSS Grid, Flexbox, glassmorphic design, custom variables)
- **Logic**: Vanilla ES Modules (WebVTT parser, DOM synchronization, event listeners)
- **Deployment**: GitHub Pages (static files, zero costs, fast CDN delivery)

## Design Guidelines
- **Color Palette**: Dark Slate background (`#0f172a`), Dark Indigo accent background (`#1e1b4b`), vibrant blue/cyan highlighting (`#06b6d4`, `#38bdf8`), and soft borders/shadows.
- **Glassmorphism**: Elegant semi-transparent cards using `backdrop-filter: blur(12px)` and thin borders with opacity.
- **Animations**: Smooth transitions on hover states, pulsing waveform when playing, fade-in for page elements, and smooth auto-scrolling transcripts.

## Project Lifecycle Status
1. **Planning**: Done. Approved by user.
2. **Implementation**: Done.
3. **Verification**: Complete. Local server running at http://localhost:8000.
