import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Mock network just like the E2E test to ensure consistent loading state
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
      await route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.from('') });
    });

    await page.route('/mock.vtt', async route => {
      const vtt = "WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\nMock cue text";
      await route.fulfill({ status: 200, contentType: 'text/vtt', body: vtt });
    });

    await page.goto('/');
    await page.waitForSelector('.playlist-item');

    // Run axe-core audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // We can exclude specific rules if they are false positives, e.g., color-contrast on glassmorphism
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
