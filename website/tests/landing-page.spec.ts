import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  { name: "Sleepy Hollow", path: "/" },
  { name: "SGAD", path: "/sgad/" },
] as const;

const requiredViewports = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
];

test("AC-SITE-002 · the two destinations are separate and mutually navigable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sleepy Hollow", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "SGAD", exact: true }).click();
  await expect(page).toHaveURL(/\/sgad\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Specification-Governed/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "SGAD", exact: true })).toHaveAttribute("aria-current", "page");
});

test("AC-HOME-001 AC-HOME-005 AC-HOME-010 · home is a product page with no process illustration", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/agentic-first headless API framework for Deno/i)).toBeVisible();
  await expect(page.getByText(/in development/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /read how SGAD works/i })).toHaveAttribute("href", "/sgad/");
  await expect(page.locator(".evidence-trail, svg")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Observe expected red/i })).toHaveCount(0);
});

test("AC-SGAD-001 AC-SGAD-003 AC-SGAD-006 AC-SGAD-012 · SGAD is a complete independent methodology page", async ({ page }) => {
  await page.goto("/sgad/");
  await expect(page.getByText(/without Sleepy Hollow/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "The SGAD lifecycle" })).toBeVisible();
  await expect(page.locator(".lifecycle > li")).toHaveCount(7);
  await expect(page.getByText(/independent verification command/i)).toBeVisible();
  await expect(page.locator(".file-map__files > li")).toHaveCount(3);
  await expect(page.locator(".file-map__nested > li")).toHaveCount(3);
  await expect(page.getByText("my-application/", { exact: true })).toBeVisible();
  await expect(page.getByText("requirements/application.md", { exact: true })).toBeVisible();
  await expect(page.getByText("feature/", { exact: true })).toBeVisible();
  await expect(page.getByText("requirements.md", { exact: true })).toBeVisible();
  await expect(page.getByText("feature.test.ts", { exact: true })).toBeVisible();
  await expect(page.getByText("feature.ts", { exact: true })).toBeVisible();
  await expect(page.getByText("evidence/verification.md", { exact: true })).toBeVisible();
  await expect(page.getByText("Install the standalone SGAD skill", { exact: true })).toBeVisible();
  await expect(page.getByText("npx skills add coryfail/SleepyHollow --skill sgad-workflow", { exact: true })).toBeVisible();
});

test("AC-SGAD-001 · SGAD introduction follows the shared navigation without an excessive empty band", async ({ page }) => {
  await page.setViewportSize({ width: 889, height: 936 });
  await page.goto("/sgad/");

  const navigation = await page.locator(".nav-pill").boundingBox();
  const introduction = await page.getByText("An open methodology · Public draft", { exact: true }).boundingBox();

  expect(navigation).not.toBeNull();
  expect(introduction).not.toBeNull();
  expect(introduction!.y - (navigation!.y + navigation!.height)).toBeLessThanOrEqual(180);
});

for (const route of routes) {
  test(`AC-SITE-003 · ${route.name} loads directly with all local assets`, async ({ page }) => {
    const failures: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(failures).toEqual([]);
  });

  test(`AC-SITE-006 · ${route.name} passes WCAG 2.2 AA automated checks`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);

    const firstNavigationLink = page.getByRole("navigation").getByRole("link").first();
    await firstNavigationLink.hover();
    const hoverResults = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(hoverResults.violations).toEqual([]);
  });

  test(`AC-SITE-006 · ${route.name} exposes immediate keyboard focus`, async ({ page }) => {
    await page.goto(route.path);
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused).toBeVisible();
    expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  });

  test(`AC-SITE-008 · ${route.name} removes spatial motion when reduced motion is requested`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route.path);
    const animated = await page.locator("*").evaluateAll((elements) => elements.filter((element) => {
      const style = getComputedStyle(element);
      return style.animationName !== "none" && style.animationDuration !== "0s";
    }).length);
    expect(animated).toBe(0);
  });

  for (const viewport of requiredViewports) {
    test(`AC-SITE-007 · ${route.name} at ${viewport.width}px has no document overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route.path);
      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
      for (const action of await page.locator(".nav-pill a, .text-action").all()) {
        expect(await action.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe("nowrap");
      }
    });
  }
}

test("AC-HOME-001 · the essential product opening fits 1280 by 800", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  for (const subject of [page.getByText(/in development/i), page.getByRole("heading", { level: 1 }), page.locator(".hero__lede")]) {
    const bounds = await subject.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800);
  }
});

test("AC-SITE-004 · core content remains available without JavaScript on both pages", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Sleepy Hollow" })).toBeVisible();
  await expect(page.getByRole("link", { name: /read how SGAD works/i })).toBeVisible();

  await page.goto("/sgad/");
  await expect(page.getByRole("heading", { level: 1, name: /Specification-Governed/i })).toBeVisible();
  await expect(page.getByText(/You can use it without Sleepy Hollow/i)).toBeVisible();
  await context.close();
});
