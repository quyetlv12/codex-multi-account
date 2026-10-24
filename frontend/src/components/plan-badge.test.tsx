import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanBadge } from "@/components/plan-badge";

describe("PlanBadge", () => {
  it("uses the active green treatment for Plus", () => {
    render(<PlanBadge planType="PLUS" />);

    const badge = screen.getByText("Plus").closest("[data-slot='badge']");
    expect(badge).toHaveAttribute("data-plan", "plus");
    expect(badge).toHaveClass("bg-emerald-500/15", "text-emerald-700", "dark:text-emerald-400");
  });

  it("selects a distinct known-plan color and label", () => {
    render(<PlanBadge planType="prolite" />);

    const badge = screen.getByText("Pro Lite").closest("[data-slot='badge']");
    expect(badge).toHaveClass("bg-indigo-500/15");
  });

  it("keeps unknown plan values readable with a neutral fallback", () => {
    render(<PlanBadge planType="custom_partner" />);

    const badge = screen.getByText("Custom partner").closest("[data-slot='badge']");
    expect(badge).toHaveAttribute("data-plan", "custom_partner");
    expect(badge).toHaveClass("bg-zinc-500/15");
  });
});
