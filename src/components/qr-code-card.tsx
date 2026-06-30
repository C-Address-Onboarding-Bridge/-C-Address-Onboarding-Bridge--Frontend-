'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toDataURL } from 'qrcode';
import { COPY_FEEDBACK_MS } from '@/lib/constants';
import { getSep0007Uri } from '@/lib/stellar';

type QRCodeFormat = 'plain' | 'sep0007';

interface QRCodeCardProps {
  address: string;
}

export function QRCodeCard({ address }: QRCodeCardProps) {
  const [format, setFormat] = useState<QRCodeFormat>('plain');
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState<'address' | 'value' | null>(null);

  const qrValue = useMemo(() => {
    return format === 'sep0007' ? getSep0007Uri(address) : address;
  }, [address, format]);

  useEffect(() => {
    let active = true;
    setQrSrc('');

    toDataURL(qrValue, {
      margin: 1,
      width: 220,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrSrc(url);
      })
      .catch(() => {
        if (active) setQrSrc('');
      });

    return () => {
      active = false;
    };
  }, [qrValue]);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied('address');
    setTimeout(() => setCopied(null), COPY_FEEDBACK_MS);
  };

  const handleCopyValue = async () => {
    await navigator.clipboard.writeText(qrValue);
    setCopied('value');
    setTimeout(() => setCopied(null), COPY_FEEDBACK_MS);
  };

  const formatLabel = format === 'plain' ? 'Plain text' : 'SEP-0007 URI';

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Receive to this C-address</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Scan the QR code or copy the address directly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormat('plain')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              format === 'plain'
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
            }`}
          >
            Plain
          </button>
          <button
            type="button"
            onClick={() => setFormat('sep0007')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              format === 'sep0007'
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
            }`}
          >
            SEP-0007
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-center">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt={`${formatLabel} QR code`}
              className="block h-[220px] w-[220px]"
            />
          ) : (
            <div className="h-[220px] w-[220px] animate-pulse rounded-3xl bg-[var(--surface-2)]" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Address</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyAddress}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)]"
          >
            {copied === 'address' ? (
              <>
                <Check className="h-3 w-3 text-[var(--success)]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy Address
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-muted)]">{formatLabel}</p>
          <button
            type="button"
            onClick={handleCopyValue}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)]"
          >
            {copied === 'value' ? (
              <>
                <Check className="h-3 w-3 text-[var(--success)]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                {format === 'plain' ? 'Copy text' : 'Copy URI'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
