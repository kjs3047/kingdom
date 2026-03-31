import { test, expect } from '@playwright/test';

test('dashboard command selection updates visible state', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.clickable-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  const beforeHero = await page.locator('.hero-meta-card strong').first().textContent();
  await cards.nth(Math.min(1, count - 1)).click();
  const afterHero = await page.locator('.hero-meta-card strong').first().textContent();

  if (count > 1) {
    expect(afterHero).not.toBe(beforeHero);
  }

  await expect(page.locator('.panel-eyebrow').filter({ hasText: '선택 명령 분석' }).first()).toBeVisible();
});

test('workflow node click updates selected node panel', async ({ page }) => {
  await page.goto('/');

  const graphButtons = page.locator('svg g[role="button"]');
  await expect(graphButtons.first()).toBeVisible();
  await graphButtons.first().click();

  await expect(page.locator('.info-card-label').filter({ hasText: '현재 선택 노드' }).first()).toBeVisible();
});
