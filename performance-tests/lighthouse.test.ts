import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

describe('Lighthouse Performance Tests', () => {
  let chrome: any;

  beforeAll(async () => {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  });

  afterAll(async () => {
    await chrome.kill();
  });

  it('should meet performance thresholds', async () => {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse('http://localhost:3000', options);
    const score = runnerResult?.lhr.categories.performance.score || 0;

    expect(score * 100).toBeGreaterThanOrEqual(90);
  });

  it('should have good accessibility score', async () => {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['accessibility'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse('http://localhost:3000', options);
    const score = runnerResult?.lhr.categories.accessibility.score || 0;

    expect(score * 100).toBeGreaterThanOrEqual(95);
  });
});
