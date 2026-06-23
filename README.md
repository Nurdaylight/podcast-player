# naiza - Interactive Subtitle Player

A fast, responsive, and aesthetically premium website that allows users to play podcast episodes and read synchronized interactive subtitles (parsed from WebVTT tracks).

---

## Features
- **Interactive Transcript**: Click any line of text in the transcript to jump the audio player straight to that moment.
- **Real-time Sync**: Active sentences highlight in real-time as the audio plays.
- **Auto-Scrolling**: Keeps the active subtitle line centered in the viewer automatically (can be toggled off).
- **Custom Media UI**: Fully custom player controls (Play/Pause, volume, progress seek bar, and playback speed adjustment: `0.8x` to `2.0x`).
- **Responsive Theme**: Premium, modern glassmorphic dark interface optimized for mobile, tablet, and desktop screens.
- **Zero Dependencies**: Pure HTML, CSS, and vanilla ES modules—no build steps or compilation needed!

---

## Fast & Free Deployment via Git & GitHub Pages

Since this website is completely static, you can host it for free on **GitHub Pages** with custom domains and SSL out-of-the-box. Follow these simple steps:

### Step 1: Initialize Git Local Repository
Open your terminal inside this directory and run:
```bash
git init
git add .
git commit -m "Initial commit of podcast app"
```

### Step 2: Create a Repository on GitHub
1. Go to [GitHub](https://github.com) and sign in.
2. Create a new repository (name it something like `podcast-website`). Keep it **Public** so that GitHub Pages can host it for free.
3. Copy the remote URL. It will look like:
   `https://github.com/YOUR-USERNAME/podcast-website.git`

### Step 3: Link and Push to GitHub
Run the following commands in your terminal:
```bash
git remote add origin https://github.com/YOUR-USERNAME/podcast-website.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your new repository on GitHub.
2. Click on **Settings** (with the gear icon).
3. Scroll down the left sidebar and click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment -> Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
6. Wait 1-2 minutes. GitHub will compile the page and present a live URL:
   `https://YOUR-USERNAME.github.io/podcast-website/`

---

## Local Development
To run this website locally without CORS issues (since fetching `data.json` and `.vtt` tracks requires a local server):
1. Install any static server, or if you have Python installed, run:
   ```bash
   python -m http.server 8000
   ```
2. Open `http://localhost:8000` in your web browser.
