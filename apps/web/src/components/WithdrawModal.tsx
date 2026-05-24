'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signTransaction } from '@/lib/freighter';
import {
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  fetchAnchorToml,
  getAuthChallenge,
  submitAuthChallenge,
  getInteractiveUrl,
  getTransactionStatus,
  buildWithdrawalTransaction,
  submitTransaction,
} from '@/lib/stellar';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  onSuccess?: () => void;
}

type Step = 'config' | 'auth' | 'interactive' | 'transfer' | 'completed';

const ANCHOR_PRESETS = [
  { name: 'SDF Test Anchor (Testnet Demo)', domain: 'testanchor.stellar.org' },
  { name: 'Yellow Card (Nigeria/Ghana)', domain: 'stellar.yellowcard.io' },
];

export function WithdrawModal({ isOpen, onClose, userAddress, onSuccess }: WithdrawModalProps) {
  // Navigation & Step State
  const [step, setStep] = useState<Step>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration State
  const [flowType, setFlowType] = useState<'withdraw' | 'deposit'>('withdraw');
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'GHS'>('NGN');
  const [selectedPreset, setSelectedPreset] = useState<string>('testanchor.stellar.org');
  const [customDomain, setCustomDomain] = useState<string>('');

  // Resolved Endpoints (SEP-1)
  const [endpoints, setEndpoints] = useState<{
    webAuthUrl?: string;
    transferServerUrl?: string;
    domain: string;
  } | null>(null);

  // Auth & Interactive State (SEP-10 & SEP-24)
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [interactiveUrl, setInteractiveUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Transaction details for withdraw transfer
  const [withdrawDetails, setWithdrawDetails] = useState<{
    anchorAccount: string;
    memo: string;
    memoType: 'text' | 'id' | 'hash';
    amount: string;
  } | null>(null);

  const [onChainTxHash, setOnChainTxHash] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string | null>(null);

  // Polling ref to clear on unmount
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeDomain = selectedPreset === 'custom' ? customDomain : selectedPreset;

  // Cleanup polling on close/unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    // Reset state
    setStep('config');
    setLoading(false);
    setError(null);
    setJwtToken(null);
    setInteractiveUrl(null);
    setTransactionId(null);
    setWithdrawDetails(null);
    setOnChainTxHash(null);
    setPayoutAmount(null);
    onClose();
  }, [onClose]);

  // STEP 1 -> STEP 2: Fetch stellar.toml & resolve endpoints
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDomain) {
      setError('Please select or input an anchor domain.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('auth');

    try {
      const toml = await fetchAnchorToml(activeDomain);

      const webAuthUrl = toml.WEB_AUTH_ENDPOINT;
      const transferServerUrl = toml.TRANSFER_SERVER_0024;

      if (!webAuthUrl || !transferServerUrl) {
        throw new Error(
          'Anchor stellar.toml does not support standard SEP-10 Web Auth or SEP-24 Interactive flows.'
        );
      }

      setEndpoints({
        webAuthUrl,
        transferServerUrl,
        domain: activeDomain,
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Failed to retrieve anchor configuration.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Authenticate Wallet (SEP-10)
  const handleAuthenticate = async () => {
    if (!endpoints?.webAuthUrl) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch challenge transaction
      const challengeXdr = await getAuthChallenge(
        endpoints.webAuthUrl,
        userAddress,
        endpoints.domain
      );

      // 2. Sign challenge via Freighter
      const signedXdr = await signTransaction(challengeXdr);

      // 3. Submit signed challenge to anchor
      const token = await submitAuthChallenge(endpoints.webAuthUrl, signedXdr);
      setJwtToken(token);

      // Transition to interactive flow
       await startInteractiveFlow(token);
     } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
       console.error(err);

      setError(err.message || 'Authentication with anchor failed. Try again.');
      setLoading(false);
    }
  };

  // STEP 3: Request Interactive URL (SEP-24)
  const startInteractiveFlow = async (token: string) => {
    if (!endpoints?.transferServerUrl) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        asset_code: 'USDC',
        account: userAddress,
        lang: 'en',
        // Optional fields depending on withdraw vs deposit
        ...(flowType === 'withdraw'
          ? {
              dest_asset: `stellar:USDC:${endpoints.domain}`, // dynamic routing parameter
            }
          : {}),
      };

      const response = await getInteractiveUrl(
        endpoints.transferServerUrl,
        token,
        flowType,
        params
      );

      setInteractiveUrl(response.url);
      setTransactionId(response.id);
      setStep('interactive');

      // Start Polling Anchor for status updates
       startPolling(endpoints.transferServerUrl, token, response.id);
     } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
       setError(err.message || 'Failed to start interactive payout process.');
     } finally {

      setLoading(false);
    }
  };

  // Poll transaction status from anchor
  const startPolling = (transferServerUrl: string, token: string, txId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const tx = await getTransactionStatus(transferServerUrl, token, txId);
        console.log('Polled Tx Status:', tx);

        if (tx.amount_out) {
          setPayoutAmount(tx.amount_out);
        }

        // State Machine transitions based on anchor response status
        if (flowType === 'withdraw') {
          if (tx.status === 'pending_user_transfer_start') {
            // Anchor is waiting for user to transfer USDC on-chain
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setWithdrawDetails({
              anchorAccount: tx.withdraw_anchor_account,
              memo: tx.withdraw_memo,
              memoType: tx.withdraw_memo_type || 'text',
              amount: tx.amount_in,
            });
            setStep('transfer');
          } else if (tx.status === 'completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStep('completed');
            if (onSuccess) onSuccess();
          } else if (tx.status === 'error') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setError(tx.message || 'Anchor reported an error processing this withdrawal.');
          }
        } else {
          // Deposit flow transitions
          if (tx.status === 'completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStep('completed');
            if (onSuccess) onSuccess();
          } else if (tx.status === 'error') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setError(tx.message || 'Anchor reported an error processing this deposit.');
          }
        }
      } catch (err) {
        console.error('Error polling transaction status:', err);
      }
    }, 4000);
  };

  // STEP 4: Submit USDC transfer on-chain (Withdrawal only)
  const handleOnChainTransfer = async () => {
    if (!withdrawDetails || !endpoints?.transferServerUrl || !jwtToken) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Build unsigned transaction
      const unsignedXdr = await buildWithdrawalTransaction(
        HORIZON_URL,
        NETWORK_PASSPHRASE,
        userAddress,
        withdrawDetails.anchorAccount,
        withdrawDetails.amount,
        withdrawDetails.memo,
        withdrawDetails.memoType
      );

      // 2. Sign via Freighter
      const signedXdr = await signTransaction(unsignedXdr);

      // 3. Submit to Horizon network
      const result = await submitTransaction(HORIZON_URL, NETWORK_PASSPHRASE, signedXdr);

      if (!result.successful) {
        throw new Error('Transaction submission to Stellar failed.');
      }

      setOnChainTxHash(result.hash);

      // Resume polling to monitor until the anchor finishes payout
      setLoading(false);
      // Show waiting screen inside this step or poll
       startPolling(endpoints.transferServerUrl, jwtToken, transactionId!);
     } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
       console.error(err);
       setError(err.message || 'Failed to submit USDC transfer on-chain.');

      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#fffaf2] p-8 shadow-[0_24px_60px_rgba(16,32,51,0.12)] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#efe3d0] pb-5">
          <div className="flex items-center gap-2.5">
            {step !== 'config' && step !== 'completed' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  if (step === 'auth') setStep('config');
                  if (step === 'interactive') setStep('auth');
                  if (step === 'transfer') setStep('interactive');
                }}
                className="rounded-full p-1.5 hover:bg-[#f3ecdf] text-[#637085]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-[#102033]">
                {flowType === 'withdraw' ? 'Instant Settlement Payout' : 'Instant Deposit Funding'}
              </h2>
              <p className="text-xs text-[#8c7760] font-medium tracking-wide mt-0.5">
                Stellar SEP-24 Compliant Protocol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 hover:bg-[#f3ecdf] text-[#637085] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Step Tracker */}
        {step !== 'completed' && (
          <div className="mt-5 flex items-center gap-2">
            {(['config', 'auth', 'interactive', 'transfer'] as Step[]).map((s, idx) => {
              const isActive = step === s;
              const isPast = idx < ['config', 'auth', 'interactive', 'transfer'].indexOf(step);
              return (
                <div key={s} className="flex-1">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-300',
                      isActive
                        ? 'bg-[#1f8f55]'
                        : isPast
                          ? 'bg-[#dff3e8] border border-[#1f8f55]/20'
                          : 'bg-[#efe3d0]'
                    )}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        <div className="mt-6 min-h-[300px] flex flex-col justify-between">
          {/* STEP 1: CONFIGURATION */}
          {step === 'config' && (
            <form onSubmit={handleConfigSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Flow Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#102033]">Action Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFlowType('withdraw')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl py-3 border text-sm font-semibold transition-all',
                        flowType === 'withdraw'
                          ? 'bg-[#1f8f55] text-white border-[#1f8f55]'
                          : 'bg-white border-[#eadfce] text-[#637085] hover:bg-[#fffcf7]'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      Instant Payout (Withdraw)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowType('deposit')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl py-3 border text-sm font-semibold transition-all',
                        flowType === 'deposit'
                          ? 'bg-[#1f8f55] text-white border-[#1f8f55]'
                          : 'bg-white border-[#eadfce] text-[#637085] hover:bg-[#fffcf7]'
                      )}
                    >
                      <Globe className="h-4 w-4" />
                      Deposit Funds
                    </button>
                  </div>
                </div>

                {/* Local Currency */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#102033]">
                    Target Local Currency
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('NGN')}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl p-3 border text-sm font-semibold transition-all bg-white hover:bg-[#fffcf7]',
                        selectedCurrency === 'NGN'
                          ? 'border-[#1f8f55] ring-2 ring-[#1f8f55]/20'
                          : 'border-[#eadfce]'
                      )}
                    >
                      <span className="text-xl">🇳🇬</span>
                      <span className="mt-1 text-[#102033] font-bold">Nigerian Naira (NGN)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('GHS')}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl p-3 border text-sm font-semibold transition-all bg-white hover:bg-[#fffcf7]',
                        selectedCurrency === 'GHS'
                          ? 'border-[#1f8f55] ring-2 ring-[#1f8f55]/20'
                          : 'border-[#eadfce]'
                      )}
                    >
                      <span className="text-xl">🇬🇭</span>
                      <span className="mt-1 text-[#102033] font-bold">Ghanaian Cedi (GHS)</span>
                    </button>
                  </div>
                </div>

                {/* Anchor Preset Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#102033]">
                    Stellar Anchor Provider
                  </label>
                  <div className="space-y-2">
                    {ANCHOR_PRESETS.map((preset) => (
                      <button
                        key={preset.domain}
                        type="button"
                        onClick={() => setSelectedPreset(preset.domain)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-xl px-4 py-3 border text-sm font-semibold transition-all bg-white hover:bg-[#fffcf7]',
                          selectedPreset === preset.domain
                            ? 'border-[#1f8f55] ring-2 ring-[#1f8f55]/20'
                            : 'border-[#eadfce]'
                        )}
                      >
                        <div className="text-left">
                          <p className="text-[#102033] font-bold">{preset.name}</p>
                          <p className="text-xs text-[#8c7760] font-normal">{preset.domain}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#fffaf2] text-[#8c7760] border border-[#efe3d0]">
                          Active Presets
                        </span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setSelectedPreset('custom')}
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl px-4 py-3 border text-sm font-semibold transition-all bg-white hover:bg-[#fffcf7]',
                        selectedPreset === 'custom'
                          ? 'border-[#1f8f55] ring-2 ring-[#1f8f55]/20'
                          : 'border-[#eadfce]'
                      )}
                    >
                      <span className="text-[#102033] font-bold">Custom Anchor Domain</span>
                      <span className="text-xs text-[#8c7760]">Enter domain manually</span>
                    </button>

                    {selectedPreset === 'custom' && (
                      <input
                        type="text"
                        placeholder="e.g. testanchor.stellar.org"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="w-full rounded-xl border border-[#eadfce] bg-white px-4 py-3 text-sm text-[#102033] outline-none focus:border-[#1f8f55]"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Step 1 */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1f8f55] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800]"
              >
                Proceed to Authentication
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* STEP 2: AUTHENTICATION */}
          {step === 'auth' && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
              {loading ? (
                <div className="space-y-4">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1f8f55]" />
                  <p className="text-sm text-[#637085] font-medium">
                    Resolving anchor configuration metadata...
                  </p>
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fce8e6]">
                    <AlertCircle className="h-7 w-7 text-[#c45a43]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#102033]">Resolution Failed</h3>
                  <p className="text-sm text-[#637085] max-w-md">{error}</p>
                  <button
                    type="button"
                    onClick={() => setStep('config')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#eadfce] bg-white px-5 py-2.5 text-sm font-semibold text-[#102033] hover:bg-[#fffcf7]"
                  >
                    Go Back
                  </button>
                </div>
              ) : (
                <div className="space-y-6 w-full">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dff3e8]">
                    <ShieldCheck className="h-7 w-7 text-[#1f8f55]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#102033]">
                      Anchor Verification Successful
                    </h3>
                    <p className="text-sm text-[#637085] mt-1">
                      We resolved anchor details from{' '}
                      <span className="font-semibold">{endpoints?.domain}</span>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#eadfce] bg-white p-4 text-left space-y-2.5 font-mono text-xs text-[#637085]">
                    <p>
                      <span className="font-semibold text-[#102033]">Web Auth Endpoint:</span>{' '}
                      {endpoints?.webAuthUrl}
                    </p>
                    <p>
                      <span className="font-semibold text-[#102033]">Transfer Server URL:</span>{' '}
                      {endpoints?.transferServerUrl}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleAuthenticate}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1f8f55] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Authenticating Wallet...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Sign Auth Challenge via Freighter
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-[#8c7760]">
                      Freighter will request you to sign a challenge transaction to verify ownership
                      of your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: INTERACTIVE WEBVIEW */}
          {step === 'interactive' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between bg-[#f3ecdf] rounded-xl px-4 py-3 border border-[#eadfce]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#1f8f55]" />
                  <p className="text-xs text-[#8c7760] font-semibold">
                    Complete anchor form. Monitoring status...
                  </p>
                </div>
                {payoutAmount && (
                  <p className="text-xs text-[#102033] font-bold">
                    Payout Amount: {payoutAmount} {selectedCurrency}
                  </p>
                )}
              </div>

              {interactiveUrl ? (
                <div className="w-full h-[450px] rounded-xl overflow-hidden border border-[#eadfce] bg-white shadow-inner">
                  <iframe
                    src={interactiveUrl}
                    className="w-full h-full"
                    title="Anchor Interactive Flow"
                    sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                  />
                </div>
              ) : (
                <div className="flex h-[350px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1f8f55]" />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ON-CHAIN TRANSFER DETAILS */}
          {step === 'transfer' && (
            <div className="space-y-6 py-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    USDC Payment Authorization Required
                  </p>
                  <p className="text-xs mt-1 text-amber-800">
                    The anchor has verified your bank details and is ready to initiate payout. You
                    must now transfer the off-ramp USDC amount on-chain to the anchor's deposit
                    account.
                  </p>
                </div>
              </div>

              {withdrawDetails && (
                <div className="rounded-2xl border border-[#eadfce] bg-white p-5 space-y-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#8c7760] font-semibold">ASSET TO SEND</p>
                      <p className="text-lg font-bold text-[#102033] mt-0.5">
                        {withdrawDetails.amount} USDC
                      </p>
                    </div>
                    {payoutAmount && (
                      <div>
                        <p className="text-xs text-[#8c7760] font-semibold">
                          LOCAL SETTLEMENT PAYOUT
                        </p>
                        <p className="text-lg font-bold text-[#1f8f55] mt-0.5">
                          {payoutAmount} {selectedCurrency}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#efe3d0] pt-4 space-y-3 font-mono text-xs text-[#637085]">
                    <div>
                      <p className="font-sans font-semibold text-[#102033] mb-1">
                        ANCHOR STELLAR ADDRESS
                      </p>
                      <p className="break-all bg-[#fffaf2] p-2.5 rounded border border-[#efe3d0]">
                        {withdrawDetails.anchorAccount}
                      </p>
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-[#102033] mb-1">
                        REQUIRED MEMO ({withdrawDetails.memoType.toUpperCase()})
                      </p>
                      <p className="bg-[#fffaf2] p-2.5 rounded border border-[#efe3d0] font-bold text-[#102033]">
                        {withdrawDetails.memo}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOnChainTransfer}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1f8f55] py-4 text-sm font-semibold text-white transition-colors hover:bg-[#14A800] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Transaction to Stellar Ledger...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Send USDC Transfer via Freighter
                    </>
                  )}
                </button>
                {onChainTxHash && (
                  <p className="text-xs text-[#1f8f55] text-center font-semibold">
                    On-chain transfer submitted! Transaction Hash: {onChainTxHash.slice(0, 10)}...
                    {onChainTxHash.slice(-10)}
                  </p>
                )}
                {onChainTxHash && !loading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[#637085]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1f8f55]" />
                    <span>Waiting for anchor payout confirmation...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED */}
          {step === 'completed' && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ed]">
                <CheckCircle2 className="h-10 w-10 text-[#1f8f55]" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#102033]">Instant Settlement Complete!</h3>
                <p className="text-sm text-[#637085] mt-2 max-w-md">
                  {flowType === 'withdraw'
                    ? `Your USDC off-ramp is complete. The anchor has initiated a direct bank transfer of ${payoutAmount || ''} ${selectedCurrency} to your local beneficiary.`
                    : 'Your deposit was successful. The anchor has minted/sent USDC to your Stellar wallet.'}
                </p>
              </div>

              {onChainTxHash && (
                <div className="rounded-xl border border-[#eadfce] bg-white p-4 text-left w-full max-w-md">
                  <p className="text-[10px] font-bold text-[#8c7760] tracking-wider uppercase">
                    On-chain transaction hash
                  </p>
                  <p className="font-mono text-xs text-[#102033] mt-1 break-all">{onChainTxHash}</p>

                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${onChainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-[#1f8f55] hover:text-[#14A800]"
                  >
                    View on Stellar.Expert
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-full max-w-sm rounded-xl bg-[#102033] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                Close & Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
