import { test, expect } from '@playwright/test';

test.describe('Podcast Player E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/data.json', async route => {
      const json = [{
        "id": "ep1",
        "title": "Mock Episode",
        "podcast": "Mock Podcast",
        "description": "Mock description",
        "coverUrl": "/cover.png",
        "audioUrl": "/mock.mp3",
        "vttUrl": "/mock.vtt",
        "duration": "01:00"
      }];
      await route.fulfill({ json });
    });

    await page.route('/mock.mp3', async route => {
      // Mock empty mp3 response
      await route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: Buffer.from('')
      });
    });

    await page.route('/mock.vtt', async route => {
      const vtt = "WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\nMock cue text";
      await route.fulfill({
        status: 200,
        contentType: 'text/vtt',
        body: vtt
      });
    });

    await page.goto('/');
    await page.waitForSelector('.playlist-item');
  });

  test('Initial Load & State', async ({ page }) => {
    await expect(page.locator('.logo h1')).toHaveText('naiza');
    const items = page.locator('.playlist-item');
    expect(await items.count()).toBeGreaterThan(0);
    await expect(items.first()).toHaveClass(/active/);
    await expect(page.locator('.player-panel')).toBeVisible();
    await expect(page.locator('.transcript-panel')).toBeVisible();
  });

  test('Playback & Controls (Play/Pause, Mute, Speed)', async ({ page }) => {
    const playBtn = page.locator('.play-btn');
    await playBtn.click({ force: true });
    // It might not play since audio is empty buffer, just check UI
    
    const muteBtn = page.getByLabel('Mute/Unmute');
    await muteBtn.click({ force: true });
    await expect(muteBtn).toContainText('volume_off');

    const speedBtn = page.getByLabel('Playback speed');
    await speedBtn.click({ force: true });
    const speedMenu = page.locator('.speed-menu');
    await expect(speedMenu).toBeVisible();
    await page.locator('.speed-menu button', { hasText: '1.5x' }).click({ force: true });
    await expect(speedBtn).toHaveText('1.5x');
  });

  test('Transcript Interaction (Click to seek)', async ({ page }) => {
    // Wait for mock cues to be rendered
    await page.waitForSelector('.transcript-cue', { timeout: 10000 });
    const firstCue = page.locator('.transcript-cue').first();
    await firstCue.click({ force: true });
    
    // Note initial time
    const timeLabels = page.locator('.time-label');
    const initialTime = await timeLabels.first().innerText();
    
    // Click cue
    await firstCue.click();
    
    // Wait for time to change
    await page.waitForFunction(
      (initialTime) => {
        const current = document.querySelectorAll('.time-label')[0].innerText;
        return current !== initialTime && current !== '0:00';
      },
      initialTime
    );
    
    const newTime = await timeLabels.first().innerText();
    expect(newTime).not.toEqual(initialTime);
  });

  test('Auto-scroll behavior toggle', async ({ page }) => {
    const toggleBtn = page.getByLabel('Toggle Auto-Scroll');
    await expect(toggleBtn).toHaveClass(/active/);
    await toggleBtn.click();
    await expect(toggleBtn).not.toHaveClass(/active/);
  });
});
