'use client';

import {
  AlertCircle,
  ArrowUpRight,
  Home,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SendPaymentForm } from '@/components/SendPaymentForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WalletConnect } from '@/components/WalletConnect';
import type { Balance } from '@/lib/stellar';
import { formatAmount, getBalance } from '@/lib/stellar';

function BalanceCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtext}</p>
    </div>
  );
}

export default function DashboardPage() {
  const _router = useRouter();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const loadBalance = useCallback(async (pk: string) => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const bal = await getBalance(pk);
      setBalance(bal);
    } catch (err) {
      setBalanceError(err instanceof Error ? err.message : 'Failed to load balance');
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const handleConnect = useCallback(
    (pk: string) => {
      setPublicKey(pk);
      loadBalance(pk);
    },
    [loadBalance]
  );

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
    setBalance(null);
    setBalanceError(null);
  }, []);

  // Auto-redirect to home if user navigates here without connecting
  // (only after a brief delay to allow auto-connect)
  useEffect(() => {
    const timer = setTimeout(() => {
      // This is handled via WalletConnect's auto-connect logic
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-stellar-blue/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
              aria-label="Back to home"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
                <span className="text-xs font-bold text-white">RC</span>
              </div>
              <span className="font-semibold text-white">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/worker"
              className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <Users className="h-4 w-4" />
              Worker Portal
            </Link>
            <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!publicKey ? (
          /* Not connected — prompt */
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Wallet className="h-10 w-10 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Connect Your Wallet</h1>
              <p className="mt-2 max-w-sm text-slate-400">
                Connect your Freighter wallet to view your balance and send USDC payments to your
                workers.
              </p>
            </div>
            <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
            <p className="text-xs text-slate-600">
              Don't have Freighter?{' '}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 hover:text-brand-400"
              >
                Download it here
              </a>
            </p>
          </div>
        ) : (
          <div className="animate-fade-in space-y-8">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Employer Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Manage payroll and send USDC to your workers
                </p>
              </div>
              <button
                onClick={() => loadBalance(publicKey)}
                disabled={balanceLoading}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                aria-label="Refresh balances"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${balanceLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Balance cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {balanceLoading ? (
                [...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                  />
                ))
              ) : balanceError ? (
                <div className="col-span-full flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {balanceError}
                </div>
              ) : balance ? (
                <>
                  <BalanceCard
                    label="USDC Balance"
                    value={formatAmount(balance.usdc, 'USDC')}
                    subtext="Available to send"
                    icon={TrendingUp}
                    color="bg-brand-gradient"
                  />
                  <BalanceCard
                    label="XLM Balance"
                    value={formatAmount(balance.xlm, 'XLM')}
                    subtext="For transaction fees"
                    icon={ArrowUpRight}
                    color="bg-blue-500/50"
                  />
                  <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-6 sm:col-span-2 lg:col-span-1">
                    <p className="mb-2 text-sm font-medium text-brand-400">Quick Actions</p>
                    <div className="space-y-2">
                      <Link
                        href="/send"
                        className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                      >
                        <Send className="h-4 w-4" />
                        Send Payment
                      </Link>
                      <Link
                        href="/worker"
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition-all hover:bg-white/10"
                      >
                        <Users className="h-4 w-4" />
                        View Worker Portal
                      </Link>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Send payment + history grid */}
            <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
              <SendPaymentForm
                senderPublicKey={publicKey}
                // Note: In production, the secret key is never stored in state.
                // Payments are signed via Freighter. This is a testnet demo.
                senderSecret={undefined}
              />
              <TransactionHistory publicKey={publicKey} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
