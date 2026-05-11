'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  MapPin,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DashboardShell, SurfaceCard } from '@/components/dashboard-shell';
import { WalletConnect } from '@/components/WalletConnect';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, getAccount, getTransactions } from '@/lib/api';
import { truncatePublicKey } from '@/lib/stellar-format';
import { formatDate } from '@/lib/utils';
import { SUPPORTED_COUNTRIES } from '@/types';

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

  const accountQuery = useQuery({
    queryKey: ['worker-account', viewingKey],
    queryFn: () => getAccount(viewingKey ?? ''),
    enabled: Boolean(viewingKey),
  });

  const transactionsQuery = useQuery({
    queryKey: ['worker-transactions', viewingKey],
    queryFn: () => getTransactions(viewingKey ?? '', { limit: 10 }),
    enabled: Boolean(viewingKey),
  });

  const transactions = useMemo(
    () => transactionsQuery.data?.transactions ?? [],
    [transactionsQuery.data]
  );
  const isLoadingProfile = accountQuery.isLoading || transactionsQuery.isLoading;
  const isNotFound =
    (accountQuery.error instanceof ApiError && accountQuery.error.status === 404) ||
    (accountQuery.data && !accountQuery.data.exists);

  return (
    <DashboardShell
      title="Professional Passport"
      description="Your on-chain verified payment history and proof of international work."
      actions={<WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />}
    >
      <div className="space-y-6">
        {!viewingKey ? (
          <div className="space-y-6">
            <SurfaceCard>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#dff3e8] p-3 text-[#1f8f55]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-[#102033]">Connect your wallet</h2>
                  <p className="mt-2 text-sm leading-6 text-[#637085]">
                    Connect your Freighter wallet to view your payment passport and on-chain work history.
                  </p>
                  <div className="mt-4">
                    <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Verification Lookup</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#102033]">Look up a worker</h3>
              </div>
              <div className="mt-6">
                <label
                  htmlFor="lookup-address"
                  className="mb-2 block text-sm text-[#637085]"
                >
                  Stellar Public Key
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7760]" />
                    <input
                      id="lookup-address"
                      type="text"
                      placeholder="G... Stellar address"
                      value={lookupKey}
                      onChange={(e) => setLookupKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      className="h-12 w-full rounded-[18px] border border-[#e7dccb] bg-[#fffaf2] pl-11 pr-4 font-mono text-sm text-[#102033] placeholder-[#8c7760]/50 outline-none focus:border-[#1f8f55]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookupKey.trim().length < 56}
                    className="rounded-[18px] bg-[#102033] px-6 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(16,32,51,0.16)] transition-all hover:scale-[1.02] disabled:opacity-40 active:scale-[0.98]"
                  >
                    Verify Key
                  </button>
                </div>
              </div>
            </SurfaceCard>
          </div>
        ) : (
          <div className="space-y-6">
            {isNotFound ? (
              <SurfaceCard className="text-center">
                <p className="font-display text-2xl font-semibold text-red-600">Address not found</p>
                <p className="mt-3 text-sm text-[#637085]">
                  This Stellar testnet account could not be loaded.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViewingKey(null);
                    setLookupKey('');
                  }}
                  className="mt-6 rounded-[18px] border border-[#eadfce] bg-[#fff8ef] px-6 py-3 text-sm font-semibold text-[#102033]"
                >
                  Try another address
                </button>
              </SurfaceCard>
            ) : (
              <>
                <SurfaceCard className="overflow-hidden bg-[linear-gradient(135deg,#102033_0%,#18324c_54%,#1f8f55_160%)] text-white">
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/80">
                          Verified Professional
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                            <Users className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <p className="font-mono text-lg font-semibold leading-none text-white/90">
                              {truncatePublicKey(viewingKey, 16)}
                            </p>
                            {publicKey === viewingKey && (
                              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/50">
                                Owner Identity Connected
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/5 px-4 py-2">
                          <TrendingUp className="h-4 w-4 text-[#8dca62]" />
                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                            Active
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingKey(null);
                            setLookupKey('');
                          }}
                          className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                          XLM Balance
                        </p>
                        {isLoadingProfile ? (
                          <Skeleton className="mt-3 h-5 w-24 bg-white/10" />
                        ) : (
                          <p className="mt-2 font-mono text-sm font-semibold text-white">
                            {accountQuery.data?.balances.xlm ?? '0'} XLM
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                          USDC Balance
                        </p>
                        {isLoadingProfile ? (
                          <Skeleton className="mt-3 h-5 w-24 bg-white/10" />
                        ) : (
                          <p className="mt-2 font-mono text-sm font-semibold text-white">
                            {accountQuery.data?.balances.usdc ?? '0'} USDC
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                          Recent Payments
                        </p>
                        {isLoadingProfile ? (
                          <Skeleton className="mt-3 h-5 w-20 bg-white/10" />
                        ) : (
                          <p className="mt-2 font-mono text-sm font-semibold text-white">
                            {transactions.length}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </SurfaceCard>

                <SurfaceCard>
                  <h2 className="mb-6 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[#1f8f55]" />
                    <span className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Active Off-Ramp Corridors</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {SUPPORTED_COUNTRIES.map((country) => (
                      <div
                        key={country.code}
                        className="flex flex-col items-center gap-3 rounded-[22px] border border-[#efe3d0] bg-[#fff8ef] p-5 text-center transition-all hover:border-[#1f8f55]/20 hover:bg-white"
                      >
                        <span className="text-4xl">{country.flag}</span>
                        <div>
                          <p className="text-xs font-semibold text-[#102033]">{country.name}</p>
                          <p className="mt-1 font-mono text-xs text-[#1f8f55]">
                            {country.currency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-sm italic leading-relaxed text-[#637085]">
                    Automated local currency delivery is live in these regions via Stellar protocol SEP-24 anchors.
                  </p>
                </SurfaceCard>

                <SurfaceCard>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">Activity</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-[#102033]">
                        Payment History
                      </h2>
                      <p className="mt-1 text-sm text-[#637085]">
                        Public proof of recent payouts for this worker wallet.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void accountQuery.refetch();
                        void transactionsQuery.refetch();
                      }}
                      className="rounded-[18px] border border-[#eadfce] px-4 py-2.5 text-xs font-semibold text-[#637085] transition-colors hover:bg-[#fff8ef]"
                    >
                      Refresh
                    </button>
                  </div>

                  {isLoadingProfile ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : transactionsQuery.isError ? (
                    <div className="rounded-[22px] border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                      {transactionsQuery.error instanceof Error
                        ? transactionsQuery.error.message
                        : 'Failed to load payment history'}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="rounded-[22px] border border-[#efe3d0] bg-[#fff8ef] p-8 text-center text-sm text-[#637085]">
                      No transactions yet
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[22px] border border-[#eadfce]">
                      <table className="w-full table-fixed text-left">
                        <thead className="bg-[#fff8ef]">
                          <tr className="text-xs uppercase tracking-[0.18em] text-[#8c7760]">
                            <th className="px-4 py-4 font-semibold">Date</th>
                            <th className="px-4 py-4 font-semibold">Direction</th>
                            <th className="px-4 py-4 font-semibold">Amount</th>
                            <th className="px-4 py-4 font-semibold">Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => {
                            const incoming = tx.to === viewingKey;

                            return (
                              <tr key={tx.id} className="border-t border-[#eadfce] bg-white">
                                <td className="px-4 py-4 text-sm text-[#637085]">
                                  {formatDate(tx.createdAt)}
                                </td>
                                <td className="px-4 py-4 text-sm font-semibold text-[#102033]">
                                  {incoming ? 'Received' : 'Sent'}
                                </td>
                                <td className="px-4 py-4 font-mono text-sm text-[#102033]">
                                  {incoming ? '+' : '-'}
                                  {tx.amount} {tx.asset}
                                </td>
                                <td className="px-4 py-4">
                                  <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 font-mono text-sm text-[#1f8f55]"
                                  >
                                    {truncatePublicKey(tx.hash, 6)}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SurfaceCard>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
