import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ToastContainer, type Toast } from "@/components/toast";

function renderToasts(toasts: Toast[]) {
  return render(<ToastContainer toasts={toasts} onClose={() => {}} />);
}

describe("Toast ARIA live regions", () => {
  it("gives success toasts role=status and aria-live=polite", () => {
    renderToasts([{ id: "1", message: "Transaction confirmed", type: "success" }]);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
    expect(el).toHaveTextContent("Transaction confirmed");
  });

  it("gives info toasts role=status and aria-live=polite", () => {
    renderToasts([{ id: "2", message: "Heads up", type: "info" }]);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
  });

  it("gives pending toasts role=status and aria-live=polite", () => {
    renderToasts([{ id: "3", message: "Submitting transaction...", type: "pending" }]);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
  });

  it("gives error toasts role=alert and aria-live=assertive so they interrupt immediately", () => {
    renderToasts([{ id: "4", message: "Transaction failed on-chain", type: "error" }]);
    const el = screen.getByRole("alert");
    expect(el).toHaveAttribute("aria-live", "assertive");
    expect(el).toHaveTextContent("Transaction failed on-chain");
  });

  it("sets aria-atomic=true so the full message is announced, not just the diff", () => {
    renderToasts([{ id: "5", message: "Transaction confirmed", type: "success" }]);
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
  });

  it("labels the toast container region for screen reader context", () => {
    renderToasts([]);
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("announces multiple simultaneous toasts with correct distinct roles", () => {
    renderToasts([
      { id: "6", message: "Transaction confirmed", type: "success" },
      { id: "7", message: "Transaction failed on-chain", type: "error" },
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Transaction confirmed");
    expect(screen.getByRole("alert")).toHaveTextContent("Transaction failed on-chain");
  });
});
