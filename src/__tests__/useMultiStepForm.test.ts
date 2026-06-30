// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";

const STEPS = ["form", "review", "confirm"] as const;

describe("useMultiStepForm", () => {
  it("starts on the first step by default", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS]));
    expect(result.current.currentStep).toBe("form");
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it("starts on the provided initial step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS], "review"));
    expect(result.current.currentStep).toBe("review");
  });

  it("goTo navigates to the specified step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS]));
    act(() => result.current.goTo("confirm"));
    expect(result.current.currentStep).toBe("confirm");
  });

  it("next advances to the next step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS]));
    act(() => result.current.next());
    expect(result.current.currentStep).toBe("review");
  });

  it("next does nothing on the last step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS], "confirm"));
    act(() => result.current.next());
    expect(result.current.currentStep).toBe("confirm");
  });

  it("back goes to the previous step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS], "review"));
    act(() => result.current.back());
    expect(result.current.currentStep).toBe("form");
  });

  it("back does nothing on the first step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS]));
    act(() => result.current.back());
    expect(result.current.currentStep).toBe("form");
  });

  it("isFirst is true only on the first step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS]));
    expect(result.current.isFirst).toBe(true);
    act(() => result.current.next());
    expect(result.current.isFirst).toBe(false);
  });

  it("isLast is true only on the last step", () => {
    const { result } = renderHook(() => useMultiStepForm([...STEPS], "confirm"));
    expect(result.current.isLast).toBe(true);
    act(() => result.current.back());
    expect(result.current.isLast).toBe(false);
  });
});
