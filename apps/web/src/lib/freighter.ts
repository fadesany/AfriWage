'use client';

// Type definitions for the Freighter browser extension API
interface FreighterApi {
  getPublicKey(): Promise<string>;
  signTransaction(
    xdr: string,
    opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<string>;
  isConnected(): Promise<boolean>;
  getNetwork(): Promise<string>;
  getNetworkDetails(): Promise<{
    network: string;
    networkUrl: string;
    networkPassphrase: string;
  }>;
}

declare global {
  interface Window {
    freighter?: FreighterApi;
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
  if (!isFreighterInstalled()) {
    throw new Error(
      'Freighter wallet is not installed. Please install it from https://freighter.app'
    );
  }

  try {
    const publicKey = await window.freighter?.getPublicKey();
    if (!publicKey) {
      throw new Error('No account found in Freighter. Please create or import a Stellar account.');
    }
    return publicKey;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Failed to get public key from Freighter');
  }
}

/**
 * Signs a Stellar transaction XDR string using Freighter.
 *
 * @param xdr - The base64-encoded transaction XDR to sign
 * @returns The signed transaction XDR
 * @throws Error if Freighter is not installed or user rejects
 */
export async function signTransaction(xdr: string): Promise<string> {
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet is not installed.');
  }

  try {
    const signedXdr = await window.freighter?.signTransaction(xdr, {
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
    });
    return signedXdr;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Transaction signing was rejected or failed');
  }
}

/**
 * Checks if the user has already connected Freighter to this app.
 *
 * @returns true if Freighter is installed and connected
 */
export async function isConnected(): Promise<boolean> {
  if (!isFreighterInstalled()) return false;

  try {
    return await window.freighter?.isConnected();
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
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet is not installed.');
  }

  const details = await window.freighter?.getNetworkDetails();
  return {
    network: details.network,
    networkPassphrase: details.networkPassphrase,
  };
}
