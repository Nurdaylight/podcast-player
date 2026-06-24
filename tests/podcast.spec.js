import { test, expect } from '@playwright/test';

test.describe('Podcast Player E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the app to fetch data and render episodes
    await page.route('/data.json', async route => {
      const json = [{
        "id": "ep1",
        "title": "Mock Episode",
        "podcast": "Mock Podcast",
        "description": "Mock description",
        "coverUrl": "cover.png",
        "audioUrl": "mock.mp3",
        "vttUrl": "mock.vtt",
        "duration": "01:00"
      }];
      await route.fulfill({ json });
    });

    await page.route('/mock.mp3', async route => {
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

  test('Audio player configuration', async ({ page }) => {
    const audio = page.locator('audio');
    await expect(audio).toHaveAttribute('src', '/mock.mp3');
    
    const track = page.locator('audio track');
    await expect(track).toHaveAttribute('src', '/mock.vtt');
  });

  test('Auto-scroll toggle visually updates', async ({ page }) => {
    const toggleBtn = page.getByLabel('Toggle Auto-Scroll');
    await expect(toggleBtn).toHaveClass(/active/);
    await toggleBtn.click({ force: true });
    await expect(toggleBtn).not.toHaveClass(/active/);
  });
});
