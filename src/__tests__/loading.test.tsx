import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "@/app/loading";

describe("Loading component", () => {
  it("renders the spinner element", () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
