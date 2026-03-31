import { test, expect } from '@playwright/test';

test('dashboard command selection updates hero, detail, conversation, and agency state', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.clickable-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  const heroBefore = await page.locator('.hero-meta-card strong').first().textContent();
  const agencyBefore = await page.locator('.panel:has-text("기관 상태") .info-card p').first().textContent();
  const conversationBefore = await page.locator('.panel:has-text("교신 기록") .message p').first().textContent();

  await cards.nth(Math.min(1, count - 1)).click();

  const heroAfter = await page.locator('.hero-meta-card strong').first().textContent();
  const detailEyebrow = page.locator('.panel-eyebrow').filter({ hasText: '선택 명령 분석' }).first();
  const agencyAfter = await page.locator('.panel:has-text("기관 상태") .info-card p').first().textContent();
  const conversationAfter = await page.locator('.panel:has-text("교신 기록") .message p').first().textContent();

  await expect(detailEyebrow).toBeVisible();

  if (count > 1) {
    expect(heroAfter).not.toBe(heroBefore);
    expect(agencyAfter).not.toBe(agencyBefore);
    expect(conversationAfter).not.toBe(conversationBefore);
  }
});

test('workflow node click updates selected node panel', async ({ page }) => {
  await page.goto('/');

  const graphButtons = page.locator('svg g[role="button"]');
  await expect(graphButtons.first()).toBeVisible();
  await graphButtons.first().click();

  await expect(page.locator('.info-card-label').filter({ hasText: '현재 선택 노드' }).first()).toBeVisible();
});

test('dashboard preserves selected command while polling refresh runs', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.clickable-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  if (count < 2) test.skip();

  await cards.nth(1).click();
  const selectedBefore = await page.locator('.hero-meta-card strong').first().textContent();

  await page.waitForTimeout(6000);

  const selectedAfter = await page.locator('.hero-meta-card strong').first().textContent();
  expect(selectedAfter).toBe(selectedBefore);
});
