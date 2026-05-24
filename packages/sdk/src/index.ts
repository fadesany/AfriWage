// @AfriWage/sdk — Stellar helpers for instant USDC payroll
// Re-export everything needed by consuming apps

export { accountExists, createKeypair, fundTestnetAccount } from './account';

export {
  establishUsdcTrustline,
  getBalance,
  getTransactionHistory,
  sendPayment,
} from './payment';

export {
  fetchAnchorToml,
  getAuthChallenge,
  submitAuthChallenge,
  getInteractiveUrl,
  getTransactionStatus,
  buildWithdrawalTransaction,
  submitTransaction,
} from './anchor';
export type { InteractiveResponse } from './anchor';

export type {
  Balance,
  PaymentResult,
  SendPaymentParams,
  StellarKeypair,
  TransactionRecord,
} from './types';

export {
  FRIENDBOT_URL,
  HORIZON_TESTNET_URL,
  USDC_ASSET_CODE,
  USDC_ISSUER_TESTNET,
} from './types';
