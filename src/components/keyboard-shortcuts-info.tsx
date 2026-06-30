"use client";

import { Keyboard, X } from "lucide-react";
import { useState, useEffect } from "react";
import { FocusTrap } from "./focus-trap";
import { useEscapeKey } from "@/hooks/use-keyboard-shortcuts";

export default function KeyboardShortcutsInfo() {
  const [isOpen, setIsOpen] = useState(false);

  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const shortcuts = [
    { keys: ["⌘", "K"], description: "Open command palette" },
    { keys: ["⌘", "/"], description: "Toggle help" },
    { keys: ["⌘", "B"], description: "Toggle sidebar" },
    { keys: ["Esc"], description: "Close modals" },
    { keys: ["⌘", "Enter"], description: "Submit form" },
    { keys: ["⌘", "Shift", "R"], description: "Refresh data" },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-[var(--primary)]/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        aria-label="Open keyboard shortcuts help"
      >
        <Keyboard className="w-5 h-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <FocusTrap active={isOpen} onClose={() => setIsOpen(false)}>
        <div
          className="relative max-w-md w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              aria-label="Close keyboard shortcuts"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.keys.join("-")}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <span className="text-sm text-[var(--text-muted)]">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-mono bg-[var(--surface-2)] rounded border border-[var(--border)]">
                  {shortcut.keys.join(" ")}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}