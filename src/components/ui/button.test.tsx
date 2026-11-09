import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

// verify the shared action primitive preserves native disabled and navigation semantics
 describe("Button", () => {
  // prevent visual variants from making a disabled action interactive
  it("preserves disabled button behavior", () => {
    render(<Button disabled>Save draft</Button>);
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  });
  // keep navigation as a real link rather than an action disguised as a button
  it("supports a native link through its child slot", () => {
    render(<Button asChild><a href="/projects">Projects</a></Button>);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
  });
});
