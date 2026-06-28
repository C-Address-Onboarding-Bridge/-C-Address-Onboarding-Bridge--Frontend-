"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface OfflineAction {
  id: string;
  run: () => Promise<void>;
}

interface ConnectivityContextType {
  isOnline: boolean;
  isOffline: boolean;
  pendingOfflineActions: number;
  queueOfflineAction: (action: () => Promise<void>) => void;
}

const ConnectivityContext = createContext<ConnectivityContextType | null>(null);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingOfflineActions, setPendingOfflineActions] = useState(0);
  const queuedActionsRef = useRef<OfflineAction[]>([]);

  const flushQueue = useCallback(async () => {
    const queuedActions = queuedActionsRef.current;
    if (queuedActions.length === 0 || !navigator.onLine) return;

    queuedActionsRef.current = [];
    setPendingOfflineActions(0);

    for (const queuedAction of queuedActions) {
      try {
        await queuedAction.run();
      } catch {
        // If the action fails for an unexpected reason while online, leave it dropped
        // so the user can retry manually. Re-queueing could create duplicate submissions.
      }
    }
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      flushQueue();
    }
  }, [isOnline, flushQueue]);

  const queueOfflineAction = useCallback((action: () => Promise<void>) => {
    queuedActionsRef.current = [
      ...queuedActionsRef.current,
      { id: `${Date.now()}-${queuedActionsRef.current.length}`, run: action },
    ];
    setPendingOfflineActions(queuedActionsRef.current.length);
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      isOffline: !isOnline,
      pendingOfflineActions,
      queueOfflineAction,
    }),
    [isOnline, pendingOfflineActions, queueOfflineAction],
  );

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error("useConnectivity must be used within a ConnectivityProvider");
  }
  return context;
}
