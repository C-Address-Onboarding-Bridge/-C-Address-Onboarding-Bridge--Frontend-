import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "@/app/loading";

describe("Loading component", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<Loading />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
