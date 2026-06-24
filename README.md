# naiza - Interactive Subtitles Podcast Player

An aesthetically premium, high-performance web application designed for playing podcast episodes with interactive, synchronized subtitles. Built with modern web standards (HTML5 `<audio>`, `<track>`, WebVTT) and migrated to a robust React SPA using Vite, complete with PWA offline capabilities.

## Features

- **Interactive Transcripts:** Powered by native HTML5 WebVTT (`textTracks`) parsing. Click on any subtitle cue to seek precisely to that moment in the audio.
- **Progressive Web App (PWA):** Equipped with a Service Worker (via Workbox) that caches the UI shell, typography, and `data.json` for offline access and instant loading.
- **Accessibility (A11y):** Screen reader optimized with `aria-live="polite"` on active subtitles, robust `role` attributes, keyboard navigation (Space/Enter) on all interactive elements.
- **Custom Player Controls:** Adjust playback speed, seek timeline, and volume seamlessly.
- **Glassmorphic UI:** A dark, visually engaging, responsive interface that feels alive with micro-animations.

## Getting Started

### Prerequisites

You need Node.js and npm installed.

### Development

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the Vite development server.

### Building for Production

To create an optimized, minified bundle with generated Service Workers:

```bash
npm run build
```

This will output the static files to the `dist` directory.

## GitHub Pages Deployment

To host this Vite + React PWA for free on GitHub Pages:

**Using GitHub Actions (Recommended)**
1. Create a `.github/workflows/deploy.yml` in your repository.
2. Configure it to build the project (`npm run build`) and deploy the `dist` folder to GitHub Pages.
3. Go to your repository settings -> Pages, and set the source to "GitHub Actions".

Alternatively, you can manually build and push the `dist` folder to a `gh-pages` branch.
