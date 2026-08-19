import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  { name: "Sleepy Hollow", path: "/" },
  { name: "SGAD", path: "/sgad/" },
  { name: "Documentation index", path: "/docs/" },
  { name: "Routing guide", path: "/docs/routing/" },
] as const;

const requiredViewports = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
];

test("AC-SITE-002 · the two destinations are separate and mutually navigable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sleepy Hollow", exact: true }))
    .toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "SGAD Methodology", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sgad\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Specification-Governed/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "SGAD Methodology", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("AC-HOME-001 AC-HOME-005 AC-HOME-010 AC-HOME-016 · home leads as an agentic framework with SGAD built in", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText(/agentic-first headless API framework for Node\.js and Bun/i).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/Specification-Governed Agentic Development/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/in development/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /how SGAD works/i }).first())
    .toHaveAttribute("href", "/sgad/");
  await expect(page.locator(".evidence-trail, svg")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Observe expected red/i }))
    .toHaveCount(0);
});

test("AC-HOME-018 · the compact method loop is at most four steps and sits above the code", async ({ page }) => {
  await page.goto("/");
  const steps = page.locator(".home-method__steps > li");
  const count = await steps.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(5);
  await expect(page.getByRole("heading", { name: /tests come first/i }))
    .toBeVisible();

  const method = await page.locator(".home-method").boundingBox();
  const code = await page.locator(".home-code").boundingBox();
  expect(method).not.toBeNull();
  expect(code).not.toBeNull();
  expect(method!.y).toBeLessThan(code!.y);
});

test("AC-HOME-011 AC-HOME-012 AC-HOME-013 AC-HOME-014 · home shows how to install, write, and check a route", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("npm install @sleepy-hollow/framework", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/defineRoute/).first()).toBeVisible();
  await expect(page.getByText(/hollow check/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /read the documentation/i }))
    .toHaveAttribute("href", "/docs/");
});

test("AC-DOCS-001 AC-DOCS-004 AC-DOCS-005 · the documentation index lists and routes to every guide", async ({ page }) => {
  await page.goto("/docs/");
  await expect(page.getByRole("heading", { level: 1, name: /documentation/i }))
    .toBeVisible();
  await expect(page.getByRole("link", { name: /API reference/i }).first())
    .toHaveAttribute("href", "/api/");

  await page.getByRole("link", { name: "Routing", exact: true }).first()
    .click();
  await expect(page).toHaveURL(/\/docs\/routing\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Routing" }))
    .toBeVisible();

  const current = page.locator(".docs-nav__link[aria-current='page']");
  await expect(current).toHaveText("Routing");
  await expect(page.locator(".docs-next")).toBeVisible();
});

test("AC-SITE-013 · the generated API reference is published and reachable", async ({ page }) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });

  await page.goto("/docs/");
  await page.getByRole("link", { name: /API reference/i }).first().click();
  await expect(page).toHaveURL(/\/api\/$/);
  await expect(page.locator("body")).toContainText(/Sleepy Hollow/i);
  await expect(page.getByRole("link", { name: /defineRoute/ }).first())
    .toBeVisible();
  expect(failures).toEqual([]);

  // The generated reference has no knowledge of the site that links to it, so
  // without an injected route back it is a dead end for anyone who arrives.
  await page.getByRole("link", { name: /back to the documentation/i }).click();
  await expect(page).toHaveURL(/\/docs\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /documentation/i }))
    .toBeVisible();
});

test("AC-DOCS-002 AC-DOCS-006 · a guide renders its canonical prose with resolved links", async ({ page }) => {
  await page.goto("/docs/getting-started/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /verification/i }).first())
    .toHaveAttribute("href", /^\/docs\/verification\/$/);
  await expect(page.locator(".doc-article a[href$='.md']")).toHaveCount(0);
  await expect(page.locator(".doc-article .code-block").first()).toBeVisible();
});

test("AC-DOCS-008 · guide code blocks scroll inside their own region at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/docs/routing/");
  const overflowing = await page.locator(".doc-article .code-block")
    .evaluateAll((blocks) =>
      blocks.filter((block) => getComputedStyle(block).overflowX !== "auto")
        .length
    );
  expect(overflowing).toBe(0);
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});

test("AC-WEB-SGAD-001 AC-WEB-SGAD-003 AC-WEB-SGAD-006 AC-WEB-SGAD-012 · SGAD is a complete independent methodology page", async ({ page }) => {
  await page.goto("/sgad/");
  await expect(page.getByText(/without Sleepy Hollow/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "The SGAD lifecycle" }))
    .toBeVisible();
  await expect(page.locator(".lifecycle > li")).toHaveCount(7);
  await expect(page.getByText(/independent verification command/i))
    .toBeVisible();
  await expect(page.locator(".file-map__files > li")).toHaveCount(2);
  await expect(page.locator(".file-map__nested > li")).toHaveCount(6);
  await expect(page.getByText("my-application/", { exact: true }))
    .toBeVisible();
  await expect(
    page.getByText("requirements/application.req.md", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("account/", { exact: true })).toBeVisible();
  await expect(page.getByText("profile.req.md", { exact: true })).toBeVisible();
  await expect(page.getByText("profile.test.ts", { exact: true }))
    .toBeVisible();
  await expect(page.getByText("profile.ts", { exact: true })).toBeVisible();
  await expect(page.getByText("password-reset.req.md", { exact: true }))
    .toBeVisible();
  await expect(page.getByText("password-reset.test.ts", { exact: true }))
    .toBeVisible();
  await expect(page.getByText("password-reset.ts", { exact: true }))
    .toBeVisible();
  await expect(
    page.getByText(
      /named \.req\.md file contains its complete governance history/i,
    ),
  ).toBeVisible();
  await expect(page.getByText(/criterion mapping/i)).toBeVisible();
  await expect(page.getByText(/supporting provenance/i)).toBeVisible();
  await expect(
    page.getByText(
      /application-wide intent belongs in requirements\/application\.req\.md/i,
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      /repository-wide behavior uses its own meaningful \.req\.md name/i,
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Install the standalone SGAD skill", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "npx skills add coryfail/SleepyHollow --skill sgad-workflow",
      { exact: true },
    ),
  ).toBeVisible();
});

test("AC-WEB-SGAD-001 · SGAD introduction follows the shared navigation without an excessive empty band", async ({ page }) => {
  await page.setViewportSize({ width: 889, height: 936 });
  await page.goto("/sgad/");

  const navigation = await page.locator(".nav-bar").boundingBox();
  const introduction = await page.getByText(
    "An open methodology · Public draft",
    { exact: true },
  ).boundingBox();

  expect(navigation).not.toBeNull();
  expect(introduction).not.toBeNull();
  expect(introduction!.y - (navigation!.y + navigation!.height))
    .toBeLessThanOrEqual(180);
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
    const results = await new AxeBuilder({ page }).withTags([
      "wcag2a",
      "wcag2aa",
      "wcag22aa",
    ]).analyze();
    expect(results.violations).toEqual([]);

    const firstNavigationLink = page.getByRole("navigation").getByRole("link")
      .first();
    await firstNavigationLink.hover();
    const hoverResults = await new AxeBuilder({ page }).withRules([
      "color-contrast",
    ]).analyze();
    expect(hoverResults.violations).toEqual([]);
  });

  test(`AC-SITE-006 · ${route.name} exposes immediate keyboard focus`, async ({ page }) => {
    await page.goto(route.path);
    await page.bringToFront();
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused).toBeVisible();
    expect(
      await focused.evaluate((element) =>
        getComputedStyle(element).outlineStyle
      ),
    ).not.toBe("none");
  });

  test(`AC-SITE-008 · ${route.name} removes spatial motion when reduced motion is requested`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route.path);
    const animated = await page.locator("*").evaluateAll((elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.animationName !== "none" &&
          style.animationDuration !== "0s";
      }).length
    );
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
      for (
        const action of await page.locator(
          ".nav-bar__links a, .wordmark, .text-action",
        ).all()
      ) {
        expect(
          await action.evaluate((element) =>
            getComputedStyle(element).whiteSpace
          ),
        ).toBe("nowrap");
      }
    });
  }
}

test("AC-SITE-005 · no section heading pins over the content scrolling beneath it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  // A sticky intro only works when it has its own column. In a single-column
  // section it overlaps whatever scrolls under it, which is a real defect the
  // static screenshots at the top of the page cannot show.
  const overlaps = await page.evaluate(() => {
    const found: string[] = [];
    for (const section of document.querySelectorAll("main > section")) {
      const intro = section.querySelector(".section-intro");
      if (!intro) continue;
      const columns =
        getComputedStyle(section).gridTemplateColumns.split(" ").length;
      if (columns > 1) continue;
      if (getComputedStyle(intro).position === "sticky") {
        found.push(section.className);
      }
    }
    return found;
  });
  expect(overlaps).toEqual([]);

  for (const name of ["home-capabilities"]) {
    const section = page.locator(`.${name}`);
    await section.scrollIntoViewIfNeeded();
    const intro = await section.locator(".section-intro").boundingBox();
    const content = await section.locator(".framework__ledger").boundingBox();
    expect(intro).not.toBeNull();
    expect(content).not.toBeNull();
    expect(intro!.y + intro!.height).toBeLessThanOrEqual(content!.y + 1);
  }
});

test("AC-HOME-001 · the essential product opening fits 1280 by 800", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  for (
    const subject of [
      page.getByText(/in development/i),
      page.getByRole("heading", { level: 1 }),
      page.locator(".hero__lede"),
    ]
  ) {
    const bounds = await subject.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800);
  }
});

test("AC-SITE-004 AC-DOCS-007 · core content remains available without JavaScript on every page", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Sleepy Hollow" }))
    .toBeVisible();
  await expect(page.getByRole("link", { name: /read how SGAD works/i }))
    .toBeVisible();

  await page.goto("/sgad/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Specification-Governed/i }),
  ).toBeVisible();
  await expect(page.getByText(/You can use it without Sleepy Hollow/i))
    .toBeVisible();

  await page.goto("/docs/");
  await expect(page.getByRole("heading", { level: 1, name: /documentation/i }))
    .toBeVisible();
  await expect(page.getByRole("link", { name: "Routing", exact: true }).first())
    .toBeVisible();

  await page.goto("/docs/routing/");
  await expect(page.getByRole("heading", { level: 1, name: "Routing" }))
    .toBeVisible();
  // A phrase that sits on one source line: the rendered paragraph keeps the
  // Markdown's own line breaks, which a regex across them would not match.
  await expect(page.getByText(/The filesystem is the only source of paths/i))
    .toBeVisible();
  await expect(page.getByRole("link", { name: "Data", exact: true }).first())
    .toBeVisible();
  await context.close();
});
