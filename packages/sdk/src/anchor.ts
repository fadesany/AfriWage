import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  StellarToml,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from './types';

/**
 * Resolves the stellar.toml file for a given home domain (SEP-0001).
 *
 * @param domain - The home domain of the anchor (e.g. "testanchor.stellar.org")
 * @returns Parsed TOML object
 */
// biome-ignore lint/suspicious/noExplicitAny: TOML object can contain any arbitrary shape from the anchor
export async function fetchAnchorToml(domain: string): Promise<any> {
  try {
    const toml = await StellarToml.Resolver.resolve(domain);
    return toml;
  } catch (error) {
    console.error(`Failed to resolve stellar.toml for domain ${domain}:`, error);
    throw new Error(`Failed to resolve anchor metadata for domain: ${domain}`);
  }
}

/**
 * Requests a Web Authentication (SEP-0010) challenge transaction from the anchor's web auth endpoint.
 *
 * @param webAuthUrl - The anchor's WEB_AUTH_ENDPOINT
 * @param publicKey - The G... public key of the user's account
 * @param homeDomain - Optional home domain of the anchor
 * @returns Base64 encoded transaction envelope (XDR) containing the challenge
 */
export async function getAuthChallenge(
  webAuthUrl: string,
  publicKey: string,
  homeDomain?: string
): Promise<string> {
  const url = new URL(webAuthUrl);
  url.searchParams.set('account', publicKey);
  if (homeDomain) {
    url.searchParams.set('home_domain', homeDomain);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get authentication challenge: ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  return data.transaction;
}

/**
 * Submits a signed challenge transaction to the anchor's WEB_AUTH_ENDPOINT to obtain a JWT token.
 *
 * @param webAuthUrl - The anchor's WEB_AUTH_ENDPOINT
 * @param signedXdr - The signed base64-encoded challenge transaction
 * @returns JWT token string for authenticating subsequent requests
 */
export async function submitAuthChallenge(webAuthUrl: string, signedXdr: string): Promise<string> {
  const response = await fetch(webAuthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transaction: signedXdr }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to authenticate with anchor: ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  return data.token;
}

export interface InteractiveResponse {
  type: string;
  url: string;
  id: string;
}

/**
 * Requests an interactive deposit or withdrawal flow URL from the anchor (SEP-0024).
 *
 * @param transferServerUrl - The anchor's TRANSFER_SERVER_0024 endpoint
 * @param token - The SEP-0010 JWT token
 * @param type - Flow type: "deposit" or "withdraw"
 * @param params - Query parameters (asset_code, account, etc.)
 * @returns InteractiveResponse object containing the iframe URL and tx ID
 */
export async function getInteractiveUrl(
  transferServerUrl: string,
  token: string,
  type: 'deposit' | 'withdraw',
  params: {
    asset_code: string;
    account: string;
    // biome-ignore lint/suspicious/noExplicitAny: allowing arbitrary query parameters for interactive flows
    [key: string]: any;
  }
): Promise<InteractiveResponse> {
  const endpoint = `${transferServerUrl.replace(/\/$/, '')}/transactions/${type}/interactive`;

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to request interactive flow: ${response.statusText} - ${text}`);
  }

  return await response.json();
}

/**
 * Queries the anchor for the status of a specific transaction (SEP-0024).
 *
 * @param transferServerUrl - The anchor's TRANSFER_SERVER_0024 endpoint
 * @param token - The SEP-0010 JWT token
 * @param txId - The unique transaction ID returned by the anchor
 * @returns The transaction detail object from the anchor
 */
export async function getTransactionStatus(
  transferServerUrl: string,
  token: string,
  txId: string
): Promise<// biome-ignore lint/suspicious/noExplicitAny: anchor transaction status object structure can vary
any> {
  const url = new URL(`${transferServerUrl.replace(/\/$/, '')}/transactions/transaction`);
  url.searchParams.set('id', txId);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch transaction status: ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  return data.transaction;
}

/**
 * Builds the on-chain payment transaction for a withdrawal off-ramp (USDC transfer to Anchor).
 *
 * @param horizonUrl - The URL of the Horizon server
 * @param networkPassphrase - Stellar network passphrase (e.g. Networks.TESTNET)
 * @param userPublicKey - The public key of the sending user account
 * @param anchorPublicKey - The destination public key where USDC should be sent
 * @param amount - The USDC amount to transfer (decimal string)
 * @param memoValue - The memo value provided by the anchor (string/ID)
 * @param memoType - The type of memo: "text", "id", or "hash"
 * @param assetCode - Asset code, defaults to "USDC"
 * @param assetIssuer - Asset issuer public key, defaults to USDC issuer on testnet
 * @returns Base64 XDR string of the built, unsigned transaction
 */
export async function buildWithdrawalTransaction(
  horizonUrl: string,
  networkPassphrase: string,
  userPublicKey: string,
  anchorPublicKey: string,
  amount: string,
  memoValue: string,
  memoType: 'text' | 'id' | 'hash',
  assetCode: string = USDC_ASSET_CODE,
  assetIssuer: string = USDC_ISSUER_TESTNET
): Promise<string> {
  const server = new Horizon.Server(horizonUrl);
  const account = await server.loadAccount(userPublicKey);
  const asset = new Asset(assetCode, assetIssuer);

  const txBuilder = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase,
  });

  txBuilder.addOperation(
    Operation.payment({
      destination: anchorPublicKey,
      asset,
      amount,
    })
  );

  if (memoValue) {
    if (memoType === 'text') {
      txBuilder.addMemo(Memo.text(memoValue));
    } else if (memoType === 'id') {
      txBuilder.addMemo(Memo.id(memoValue));
    } else if (memoType === 'hash') {
      txBuilder.addMemo(Memo.hash(memoValue));
    }
  }

  // 10 minutes timeout to give the user plenty of time to review and sign via Freighter
  txBuilder.setTimeout(600);

  const tx = txBuilder.build();
  return tx.toXDR();
}

/**
 * Submits a signed transaction envelope (XDR) to Horizon.
 *
 * @param horizonUrl - The URL of the Horizon server
 * @param networkPassphrase - Stellar network passphrase (e.g. Networks.TESTNET)
 * @param signedXdr - The signed base64-encoded transaction XDR
 * @returns Transaction result with hash, ledger, and success status
 */
export async function submitTransaction(
  horizonUrl: string,
  networkPassphrase: string,
  signedXdr: string
): Promise<{ hash: string; ledger: number; successful: boolean }> {
  const server = new Horizon.Server(horizonUrl);
  const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const result = await server.submitTransaction(transaction);
  return {
    hash: result.hash,
    ledger: result.ledger,
    successful: result.successful,
  };
}
