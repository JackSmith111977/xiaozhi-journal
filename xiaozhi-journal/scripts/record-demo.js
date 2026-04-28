// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const videoDir = path.join(__dirname, '..', 'video');

  const browser = await chromium.launch({
    headless: true,
    args: ['--lang=zh-CN'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 800 },
    },
    locale: 'zh-CN',
  });

  const page = await context.newPage();

  console.log('🎬 Step 1: Navigate to app');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('🎬 Step 2: Select mood (开心)');
  await page.getByRole('radio', { name: '开心' }).click();
  await page.waitForTimeout(800);

  console.log('🎬 Step 3: Type journal content');
  await page.getByPlaceholder('随便写点什么吧，哪怕只有一句话').click();
  await page.keyboard.type('今天阳光很好，窗外的樱花开了，突然觉得生活真美好。', { delay: 80 });
  await page.waitForTimeout(1500);

  console.log('🎬 Step 4: Click save button');
  await page.getByRole('button', { name: '记下来' }).click();
  await page.waitForTimeout(1000);

  console.log('🎬 Step 5: Wait for AI response...');
  await page.waitForTimeout(6000);

  console.log('🎬 Step 6: Verify AI response appeared');
  await page.locator('main').screenshot({ path: path.join(videoDir, 'result-screenshot.png') });
  console.log('Screenshot saved');

  console.log('🎬 Step 7: Check emotion chart');
  await page.waitForTimeout(1000);

  console.log('🎬 Step 8: Click history link');
  await page.getByRole('link', { name: '查看过往记录' }).click();
  await page.waitForTimeout(2000);

  console.log('🎬 Step 9: Browse history list');
  await page.waitForTimeout(1500);

  console.log('🎬 Step 10: Click first journal detail');
  const firstCard = page.locator('a[href*="/history/"]').first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
    await page.waitForTimeout(2000);
  }

  console.log('🎬 Step 11: Back to home');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await browser.close();

  console.log('✅ Video recording complete!');
  const fs = require('fs');
  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files[files.length - 1];
    console.log(`📹 Video saved as: video/${latest}`);
  }
})();
