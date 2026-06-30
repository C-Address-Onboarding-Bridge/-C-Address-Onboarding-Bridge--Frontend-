'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function KeyboardShortcutsInfo() {
  const [isOpen, setIsOpen] = useState(false);

  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const shortcuts = [
    {
      keys: ['Ctrl', 'Enter'],
      mac: ['⌘', 'Enter'],
      description: 'Submit form from any field',
    },
    {
      keys: ['Esc'],
      mac: ['Esc'],
      description: 'Close mobile menu or modal',
    },
    {
      keys: ['Tab'],
      mac: ['Tab'],
      description: 'Navigate between interactive elements',
    },
    {
      keys: ['Shift', 'Tab'],
      mac: ['Shift', 'Tab'],
      description: 'Navigate backwards',
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-40 rounded-full bg-[var(--primary)] p-3 text-white shadow-lg transition-colors hover:bg-[var(--primary)]/90"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?, h)"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    );
  }

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-[var(--surface-2)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 space-y-4 overflow-y-auto p-4">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {typeof window !== 'undefined' &&
                    /Mac|iPhone|iPad|iPod/.test(navigator.platform)
                      ? shortcut.mac.map((key, i) => (
                          <span
                            key={i}
                            className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-xs font-semibold"
                          >
                            {key}
                          </span>
                        ))
                      : shortcut.keys.map((key, i) => (
                          <span
                            key={i}
                            className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-xs font-semibold"
                          >
                            {key}
                          </span>
                        ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {shortcut.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border)] p-4 text-xs text-[var(--text-muted)]">
              <p>
                All interactive elements support focus indicators for keyboard
                navigation.
              </p>
            </div>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}