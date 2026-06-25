"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export function KeyboardShortcutsInfo() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    {
      keys: ["Ctrl", "Enter"],
      mac: ["⌘", "Enter"],
      description: "Submit form from any field",
    },
    {
      keys: ["Esc"],
      mac: ["Esc"],
      description: "Close mobile menu or modal",
    },
    {
      keys: ["Tab"],
      mac: ["Tab"],
      description: "Navigate between interactive elements",
    },
    {
      keys: ["Shift", "Tab"],
      mac: ["Shift", "Tab"],
      description: "Navigate backwards",
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-[var(--primary)]/90 transition-colors z-40"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?, h)"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {typeof window !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
                      ? shortcut.mac.map((key, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono font-semibold">
                            {key}
                          </span>
                        ))
                      : shortcut.keys.map((key, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono font-semibold">
                            {key}
                          </span>
                        ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{shortcut.description}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
              <p>All interactive elements support focus indicators for keyboard navigation.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
