import { getBalance, getTransactionHistory } from './stellar';

export async function getAccount(address: string) {
  // We wrap the stellar balance getter to return an object matching the expected UI
  const balance = await getBalance(address);
  return {
    usdcBalance: balance.usdc,
    xlmBalance: balance.xlm,
    isActive: balance.xlm !== '0' && balance.xlm !== '0.0000000',
  };
}

export async function getTransactions(address: string, options?: { limit?: number }) {
  // Wrap the stellar transaction history getter
  const txs = await getTransactionHistory(address);
  if (options?.limit) {
    return txs.slice(0, options.limit);
  }
  return txs;
}
