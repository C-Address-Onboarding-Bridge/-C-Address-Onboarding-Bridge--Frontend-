import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey !== undefined ? e.ctrlKey === shortcut.ctrlKey : true;
        const metaMatches = shortcut.metaKey !== undefined ? e.metaKey === shortcut.metaKey : true;
        const shiftMatches = shortcut.shiftKey !== undefined ? e.shiftKey === shortcut.shiftKey : true;
        const altMatches = shortcut.altKey !== undefined ? e.altKey === shortcut.altKey : true;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          shortcut.handler(e);
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function useSubmitShortcut(onSubmit: () => void) {
  useKeyboardShortcuts([
    {
      key: "Enter",
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        onSubmit();
      },
    },
    {
      key: "Enter",
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        onSubmit();
      },
    },
  ]);
}

export function useEscapeKey(onEscape: () => void) {
  useKeyboardShortcuts([
    {
      key: "Escape",
      handler: () => {
        onEscape();
      },
    },
  ]);
}
