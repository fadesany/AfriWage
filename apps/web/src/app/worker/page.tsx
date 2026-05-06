'use client';

import { Clock, Home, MapPin, TrendingUp, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WalletConnect } from '@/components/WalletConnect';
import { truncatePublicKey } from '@/lib/stellar';
import { SUPPORTED_COUNTRIES } from '@/types';

// Worker page — a public payment history passport for a given Stellar address.
// Workers can share their public key to show their payment history to employers.

export default function WorkerPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [lookupKey, setLookupKey] = useState('');
  const [viewingKey, setViewingKey] = useState<string | null>(null);

  const handleConnect = useCallback((pk: string) => {
    setPublicKey(pk);
    setViewingKey(pk);
  }, []);

  const handleDisconnect = useCallback(() => {
    setPublicKey(null);
    setViewingKey(null);
  }, []);

  const handleLookup = useCallback(() => {
    if (lookupKey.trim().length >= 56) {
      setViewingKey(lookupKey.trim());
    }
  }, [lookupKey]);

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-stellar-blue/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
                <span className="text-xs font-bold text-white">RC</span>
              </div>
              <span className="font-semibold text-white">Worker Portal</span>
            </div>
          </div>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-brand-glow">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Worker Payment Passport</h1>
          <p className="mt-2 text-slate-400">
            View on-chain payment history for any Stellar account — your transparent proof of work.
          </p>
        </div>

        {/* Supported countries */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <MapPin className="h-4 w-4" />
            Supported Off-Ramp Countries
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5"
              >
                <span>{country.flag}</span>
                <span className="text-sm text-slate-300">{country.name}</span>
                <span className="text-xs text-slate-500">{country.currency}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Workers in these countries can automatically off-ramp USDC to local bank accounts or
            mobile money via integrated Stellar anchors.
          </p>
        </div>

        {/* Connect or lookup */}
        {!viewingKey ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-brand-400" />
              <h2 className="mb-2 text-lg font-semibold text-white">Connect Your Wallet</h2>
              <p className="mb-4 text-sm text-slate-400">
                Connect Freighter to view your own payment history and passport.
              </p>
              <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
            </div>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-slate-600">or look up any wallet</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <label
                htmlFor="lookup-address"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Stellar Address
              </label>
              <div className="flex gap-3">
                <input
                  id="lookup-address"
                  type="text"
                  placeholder="G... Stellar public key"
                  value={lookupKey}
                  onChange={(e) => setLookupKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  onClick={handleLookup}
                  disabled={lookupKey.trim().length < 56}
                  className="rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Look Up
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Enter any Stellar public key to view their on-chain payment history
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* Passport header */}
            <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Payment Passport
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-300">
                    {truncatePublicKey(viewingKey, 12)}
                  </p>
                  {publicKey === viewingKey && (
                    <p className="mt-1 text-xs text-slate-500">Your connected wallet</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs font-medium text-green-400">On-chain verified</span>
                  </div>
                  <button
                    onClick={() => {
                      setViewingKey(null);
                      setLookupKey('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Passport stats row */}
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Network</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">Stellar Testnet</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Asset</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">USDC</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Settlement</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">~5 seconds</p>
                </div>
              </div>
            </div>

            {/* How off-ramp works */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Clock className="h-4 w-4 text-brand-400" />
                How Your Off-Ramp Works
              </h2>
              <ol className="space-y-3">
                {[
                  'Employer sends USDC to your Stellar public key',
                  'USDC lands in your Stellar wallet within 5 seconds',
                  'Your connected anchor automatically converts USDC to local currency',
                  'Funds arrive in your bank account or mobile money wallet',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Transaction history */}
            <TransactionHistory publicKey={viewingKey} />
          </div>
        )}
      </main>
    </div>
  );
}
