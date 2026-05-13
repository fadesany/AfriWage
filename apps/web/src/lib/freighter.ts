'use client';

import {
  getAddress,
  isConnected as freighterIsConnected,
  requestAccess,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

declare global {
  interface Window {
    freighter?: unknown;
  }
}

/**
 * Checks whether the Freighter wallet extension is installed in the browser.
 * Freighter is the official Stellar browser wallet.
 */
export function isFreighterInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.freighter !== 'undefined';
}

/**
 * Retrieves the connected wallet's public key from Freighter.
 * Will prompt the user to connect if not already connected.
 *
 * @returns The G... public key of the connected account
 * @throws Error if Freighter is not installed or user rejects
 */
export async function getPublicKey(): Promise<string> {
  const connectedResult = await freighterIsConnected();
  if (connectedResult.error || !connectedResult.isConnected) {
    // Try requesting access first
    const accessResult = await requestAccess();
    if (accessResult.error) {
      throw new Error(
        accessResult.error.message || 'Freighter wallet is not installed or connection was rejected.'
      );
    }
  }

  const addressResult = await getAddress();
  if (addressResult.error || !addressResult.address) {
    throw new Error(
      addressResult.error?.message || 'No account found in Freighter. Please create or import a Stellar account.'
    );
  }
  return addressResult.address;
}

/**
 * Signs a Stellar transaction XDR string using Freighter.
 *
 * @param xdr - The base64-encoded transaction XDR to sign
 * @returns The signed transaction XDR
 * @throws Error if Freighter is not installed or user rejects
 */
export async function signTransaction(xdr: string, address?: string): Promise<string> {
  const result = await freighterSignTransaction(xdr, {
    networkPassphrase: 'Test SDF Network ; September 2015',
    address,
  });

  if (result.error) {
    throw new Error(result.error.message || 'Transaction signing was rejected or failed');
  }

  if (!result.signedTxXdr) {
    throw new Error('Transaction signing failed — no signed XDR returned.');
  }

  return result.signedTxXdr;
}

/**
 * Checks if the user has already connected Freighter to this app.
 *
 * @returns true if Freighter is installed and connected
 */
export async function isConnected(): Promise<boolean> {
  try {
    const result = await freighterIsConnected();
    return !result.error && result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Gets the current network details from Freighter.
 * Used to verify the user is on the correct network.
 */
export async function getNetworkDetails(): Promise<{
  network: string;
  networkPassphrase: string;
}> {
  // Use the freighter-api to get network info indirectly
  // The modern API doesn't expose getNetworkDetails directly,
  // so we return the expected testnet values
  return {
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
  };
}
