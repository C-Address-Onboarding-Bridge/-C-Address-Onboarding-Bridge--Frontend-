"use client";

import { useState, useEffect } from "react";
import { Lock, Trash2 } from "lucide-react";
import {
  getGrantedCapabilities,
  revokeCapability,
  FREIGHTER_CAPABILITIES,
  type CapabilityType,
  type GrantedCapabilities,
} from "@/lib/freighter-capabilities";

export function WalletPermissionsPanel() {
  const [grantedCapabilities, setGrantedCapabilities] = useState<GrantedCapabilities>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCapabilities = async () => {
      const granted = await getGrantedCapabilities();
      setGrantedCapabilities(granted);
      setLoading(false);
    };
    loadCapabilities();
  }, []);

  const handleRevokeCapability = async (capability: CapabilityType) => {
    if (confirm(`Revoke "${FREIGHTER_CAPABILITIES[capability].description}" permission?`)) {
      await revokeCapability(capability);
      const granted = await getGrantedCapabilities();
      setGrantedCapabilities(granted);
    }
  };

  if (loading) {
    return <div className="text-sm text-[var(--text-muted)]">Loading permissions...</div>;
  }

  const grantedList = Object.keys(grantedCapabilities).filter(
    (cap) => grantedCapabilities[cap as CapabilityType] === true
  );

  if (grantedList.length === 0) {
    return (
      <div className="text-sm text-[var(--text-muted)]">
        No permissions granted. Connect your wallet to grant permissions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Lock className="w-4 h-4" />
        Granted Permissions
      </h4>
      <div className="space-y-2">
        {grantedList.map((cap) => {
          const capability = FREIGHTER_CAPABILITIES[cap as CapabilityType];
          return (
            <div
              key={cap}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]"
            >
              <div>
                <p className="text-sm font-medium">{capability.description}</p>
                {capability.required && (
                  <p className="text-xs text-[var(--text-muted)]">Required for wallet connection</p>
                )}
              </div>
              {!capability.required && (
                <button
                  onClick={() => handleRevokeCapability(cap as CapabilityType)}
                  className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                  title="Revoke permission"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
