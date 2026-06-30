'use client';

import { useState, useEffect } from 'react';
import { Lock, Trash2 } from 'lucide-react';
import {
  getGrantedCapabilities,
  revokeCapability,
  FREIGHTER_CAPABILITIES,
  type CapabilityType,
  type GrantedCapabilities,
} from '@/lib/freighter-capabilities';

export function WalletPermissionsPanel() {
  const [grantedCapabilities, setGrantedCapabilities] =
    useState<GrantedCapabilities>({});
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
    if (
      confirm(
        `Revoke "${FREIGHTER_CAPABILITIES[capability].description}" permission?`
      )
    ) {
      await revokeCapability(capability);
      const granted = await getGrantedCapabilities();
      setGrantedCapabilities(granted);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-[var(--text-muted)]">
        Loading permissions...
      </div>
    );
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
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4" />
        Granted Permissions
      </h4>
      <div className="space-y-2">
        {grantedList.map((cap) => {
          const capability = FREIGHTER_CAPABILITIES[cap as CapabilityType];
          return (
            <div
              key={cap}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
            >
              <div>
                <p className="text-sm font-medium">{capability.description}</p>
                {capability.required && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Required for wallet connection
                  </p>
                )}
              </div>
              {!capability.required && (
                <button
                  onClick={() => handleRevokeCapability(cap as CapabilityType)}
                  className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  title="Revoke permission"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
