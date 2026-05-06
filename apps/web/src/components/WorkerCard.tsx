'use client';

import { CheckCircle, Copy, ExternalLink, MapPin } from 'lucide-react';
import { useCallback, useState } from 'react';
import { formatAmount, truncatePublicKey } from '@/lib/stellar';
import { copyToClipboard } from '@/lib/utils';
import type { Worker } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/types';

interface WorkerCardProps {
  worker: Worker;
  onPay?: (worker: Worker) => void;
  className?: string;
}

export function WorkerCard({ worker, onPay, className }: WorkerCardProps) {
  const [copied, setCopied] = useState(false);

  const country = SUPPORTED_COUNTRIES.find((c) => c.code === worker.country);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(worker.publicKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [worker.publicKey]);

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`group relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:border-brand-500/30 hover:bg-white/[0.07] hover:shadow-card-hover ${className ?? ''}`}
    >
      {/* Avatar + Name */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-brand-glow">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white">{worker.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {country && <span className="text-base leading-none">{country.flag}</span>}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                {country?.name ?? worker.country}
              </div>
            </div>
          </div>
        </div>

        {/* Total received badge */}
        <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-center">
          <p className="text-xs font-medium text-green-400">
            {formatAmount(worker.totalReceived, 'USDC')}
          </p>
          <p className="text-[10px] text-slate-500">Total received</p>
        </div>
      </div>

      {/* Wallet address */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
        <p className="flex-1 font-mono text-xs text-slate-400">
          {truncatePublicKey(worker.publicKey, 8)}
        </p>
        <button
          onClick={handleCopy}
          className="text-slate-500 transition-colors hover:text-slate-300"
          aria-label={copied ? 'Copied!' : 'Copy wallet address'}
        >
          {copied ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${worker.publicKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 transition-colors hover:text-slate-300"
          aria-label="View on Stellar Explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Last payment */}
      {worker.lastPayment && (
        <p className="mb-4 text-xs text-slate-500">
          Last payment: <span className="text-slate-400">{worker.lastPayment}</span>
        </p>
      )}

      {/* Pay button */}
      {onPay && (
        <button
          onClick={() => onPay(worker)}
          className="w-full rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:shadow-brand-glow"
          aria-label={`Send payment to ${worker.name}`}
        >
          Pay {worker.name.split(' ')[0]}
        </button>
      )}
    </div>
  );
}
