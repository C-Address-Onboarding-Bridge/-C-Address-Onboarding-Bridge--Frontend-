import { useCallback, useEffect, useRef, useState } from "react";

export interface FormState {
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
}

interface HistoryEntry {
  state: FormState;
  timestamp: number;
}

export function useFormHistory(formState: FormState, onRestore: (state: FormState) => void): {
  updateHistory: (newState: FormState) => void;
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
} {
  const historyRef = useRef<HistoryEntry[]>([]);
  const currentIndexRef = useRef(-1);
  const [showUndo, setShowUndo] = useState(false);
  const [showRedo, setShowRedo] = useState(false);

  const updateHistory = useCallback((newState: FormState) => {
    // Remove future entries if we're not at the end
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state to history
    historyRef.current.push({
      state: { ...newState },
      timestamp: Date.now(),
    });

    currentIndexRef.current = historyRef.current.length - 1;
    setShowUndo(currentIndexRef.current > 0);
    setShowRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const previousState = historyRef.current[currentIndexRef.current].state;
      onRestore(previousState);
      setShowUndo(currentIndexRef.current > 0);
      setShowRedo(true);
      return true;
    }
    return false;
  }, [onRestore]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const nextState = historyRef.current[currentIndexRef.current].state;
      onRestore(nextState);
      setShowUndo(true);
      setShowRedo(currentIndexRef.current < historyRef.current.length - 1);
      return true;
    }
    return false;
  }, [onRestore]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    setShowUndo(false);
    setShowRedo(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (redo()) {
            // Toast will be shown by parent
          }
        } else {
          if (undo()) {
            // Toast will be shown by parent
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    updateHistory,
    undo,
    redo,
    clearHistory,
    canUndo: showUndo,
    canRedo: showRedo,
  };
}
