import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "./App";

describe("approved site behavior", () => {
  test("AC-HOME-001 AC-HOME-016 · the home page opens as an agentic framework with SGAD built in", () => {
    render(<App page="sleepy-hollow" />);
    expect(screen.getAllByText(/agentic-first headless API framework for Node\.js and Bun/i)[0]).toBeVisible();
    expect(screen.getAllByText(/Specification-Governed Agentic Development/i)[0]).toBeVisible();
    expect(screen.getAllByText(/in development/i)[0]).toBeVisible();
    expect(screen.getByText(/test-driven development/i)).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Observe expected red" })).not.toBeInTheDocument();
  });

  test("AC-HOME-017 AC-HOME-018 · the home page carries the analogy and a four-step method", () => {
    const { container } = render(<App page="sleepy-hollow" />);
    expect(screen.getAllByText(/procedures/i)[0]).toBeVisible();
    const steps = container.querySelectorAll(".home-method__steps > li");
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.length).toBeLessThanOrEqual(5);
    expect(screen.getByRole("heading", { name: /tests come first/i })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /how SGAD works/i })[0]).toHaveAttribute(
      "href", expect.stringMatching(/\/sgad\/$/),
    );
  });

  test("AC-HOME-011 AC-HOME-014 · the home page shows how to install it and where to learn it", () => {
    render(<App page="sleepy-hollow" />);
    expect(screen.getByText("npm install @sleepy-hollow/framework", { exact: true })).toBeVisible();
    expect(screen.getByText("npm install -g @sleepy-hollow/framework", { exact: true })).toBeVisible();
    expect(screen.getByRole("link", { name: /read the documentation/i })).toHaveAttribute(
      "href", expect.stringMatching(/\/docs\/$/),
    );
  });

  test("AC-HOME-012 AC-HOME-013 · the home page shows a real route and what verification rejects", () => {
    render(<App page="sleepy-hollow" />);
    expect(screen.getAllByText(/defineRoute/)[0]).toBeVisible();
    expect(screen.getAllByText(/hollow check/)[0]).toBeVisible();
  });

  test("AC-HOME-004 AC-HOME-005 · home expands SGAD and routes to its own page", () => {
    render(<App page="sleepy-hollow" />);
    // The method is named on the first screen and again at the closing band.
    const routes = screen.getAllByRole("link", { name: /read how SGAD works/i });
    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(route).toHaveAttribute("href", expect.stringMatching(/\/sgad\/$/));
    }
    expect(screen.getAllByText(/Specification-Governed Agentic Development/i)[0]).toBeVisible();
    expect(screen.getAllByText(/built in/i)[0]).toBeVisible();
  });

  test("AC-WEB-SGAD-001 AC-WEB-SGAD-003 · the SGAD page defines and orders the method", () => {
    render(<App page="sgad" />);
    expect(screen.getByRole("heading", { level: 1, name: /Specification-Governed/i })).toBeVisible();
    expect(screen.getByText(/without Sleepy Hollow/i)).toBeVisible();
    for (const stage of ["Specify", "Approve", "Write acceptance tests", "Observe expected red", "Implement", "Verify independently", "Deliver with evidence"]) {
      expect(screen.getByRole("heading", { name: stage })).toBeVisible();
    }
  });

  test("AC-WEB-SGAD-012 · the SGAD page provides the standalone skill install line", () => {
    render(<App page="sgad" />);
    expect(screen.getByText("Install the standalone SGAD skill", { exact: true })).toBeVisible();
    expect(screen.getByText("npx skills add coryfail/SleepyHollow --skill sgad-workflow", { exact: true })).toBeVisible();
  });

  test("AC-SITE-002 · navigation identifies the current page", () => {
    render(<App page="sgad" />);
    const navigation = screen.getByRole("navigation", { name: /primary/i });
    expect(within(navigation).getByRole("link", { name: "SGAD Methodology" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: "Sleepy Hollow" })).not.toHaveAttribute("aria-current");
  });

  test("AC-DOCS-001 AC-DOCS-005 · the documentation index lists every guide and the API reference", () => {
    render(<App page="docs" route="/docs/" />);
    expect(screen.getByRole("heading", { level: 1, name: /documentation/i })).toBeVisible();
    for (const guide of ["Getting started", "Routing", "Data", "Security", "Verification", "Deployment", "CLI reference"]) {
      expect(screen.getAllByRole("link", { name: new RegExp(`^${guide}$`, "i") })[0]).toBeVisible();
    }
    expect(screen.getAllByRole("link", { name: /API reference/i })[0]).toHaveAttribute(
      "href", expect.stringMatching(/\/api\/$/),
    );
  });

  test("AC-DOCS-002 AC-DOCS-004 · a guide renders its prose, marks itself current, and points to the next", () => {
    const { container } = render(<App page="docs" route="/docs/routing/" />);
    expect(within(container).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Routing" })).toBeVisible();
    expect(container.querySelector(".doc-article")).toBeInTheDocument();
    expect(container.querySelector(".docs-nav__link[aria-current='page']")).toHaveTextContent("Routing");
    expect(container.querySelector(".docs-next")).toBeInTheDocument();
  });

  test("AC-SITE-006 · every route exposes one h1 and semantic landmarks", () => {
    for (const [page, route] of [["sleepy-hollow", undefined], ["sgad", undefined], ["docs", "/docs/"], ["docs", "/docs/routing/"]] as const) {
      const { container, unmount } = render(<App page={page} route={route} />);
      expect(within(container).getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(container.querySelector("header, nav, main, footer")).toBeInTheDocument();
      unmount();
    }
  });

  test("AC-SITE-006 · keyboard order starts with the skip link", async () => {
    const user = userEvent.setup();
    render(<App page="sleepy-hollow" />);
    await user.tab();
    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveFocus();
  });

  test("AC-SITE-009 AC-DOCS-010 · no route contains a data-entry surface", () => {
    for (const [page, route] of [["sleepy-hollow", undefined], ["sgad", undefined], ["docs", "/docs/"], ["docs", "/docs/routing/"]] as const) {
      const { container, unmount } = render(<App page={page} route={route} />);
      expect(container.querySelector("form, input, textarea, select")).not.toBeInTheDocument();
      unmount();
    }
  });
});
