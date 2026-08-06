import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "./App";

describe("approved two-page behavior", () => {
  test("AC-HOME-001 AC-HOME-002 · the home page stays product-focused", () => {
    render(<App page="sleepy-hollow" />);
    expect(screen.getByText(/agentic-first headless API framework for Deno/i)).toBeVisible();
    expect(screen.getByText(/in development/i)).toBeVisible();
    expect(screen.getByText(/test-driven development/i)).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Observe expected red" })).not.toBeInTheDocument();
  });

  test("AC-HOME-004 AC-HOME-005 · home introduces SGAD through its own route", () => {
    render(<App page="sleepy-hollow" />);
    expect(screen.getByRole("link", { name: /read how SGAD works/i })).toHaveAttribute(
      "href", expect.stringMatching(/\/sgad\/$/),
    );
    expect(screen.getByText(/Sleepy Hollow is built through SGAD/i)).toBeVisible();
  });

  test("AC-SGAD-001 AC-SGAD-003 · the SGAD page defines and orders the method", () => {
    render(<App page="sgad" />);
    expect(screen.getByRole("heading", { level: 1, name: /Specification-Governed/i })).toBeVisible();
    expect(screen.getByText(/without Sleepy Hollow/i)).toBeVisible();
    for (const stage of ["Specify", "Approve", "Write acceptance tests", "Observe expected red", "Implement", "Verify independently", "Deliver with evidence"]) {
      expect(screen.getByRole("heading", { name: stage })).toBeVisible();
    }
  });

  test("AC-SITE-002 · navigation identifies the current page", () => {
    render(<App page="sgad" />);
    const navigation = screen.getByRole("navigation", { name: /primary/i });
    expect(within(navigation).getByRole("link", { name: "SGAD" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: "Sleepy Hollow" })).not.toHaveAttribute("aria-current");
  });

  test("AC-SITE-006 · both routes expose one h1 and semantic landmarks", () => {
    for (const page of ["sleepy-hollow", "sgad"] as const) {
      const { container, unmount } = render(<App page={page} />);
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

  test("AC-SITE-009 · neither route contains a data-entry surface", () => {
    for (const page of ["sleepy-hollow", "sgad"] as const) {
      const { container, unmount } = render(<App page={page} />);
      expect(container.querySelector("form, input, textarea, select")).not.toBeInTheDocument();
      unmount();
    }
  });
});
