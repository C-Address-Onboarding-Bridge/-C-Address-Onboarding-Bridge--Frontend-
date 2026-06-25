import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ErrorComponent from "@/app/error";

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorComponent
          error={this.state.error}
          reset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

function Thrower(): never {
  throw new Error("child error");
}

describe("Error component", () => {
  it("renders 'Something went wrong'", () => {
    render(<ErrorComponent error={new Error("")} reset={() => {}} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders the error message when provided", () => {
    render(<ErrorComponent error={new Error("Custom error")} reset={() => {}} />);
    expect(screen.getByText("Custom error")).toBeInTheDocument();
  });

  it("calls reset when Try Again is clicked", () => {
    const reset = vi.fn();
    render(<ErrorComponent error={new Error("")} reset={reset} />);
    fireEvent.click(screen.getByText("Try Again"));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("catches errors thrown by a child component", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <TestErrorBoundary>
        <Thrower />
      </TestErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("child error")).toBeInTheDocument();
    spy.mockRestore();
  });
});
