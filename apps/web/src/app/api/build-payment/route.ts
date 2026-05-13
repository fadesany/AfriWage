import { NextResponse } from 'next/server';
import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { USDC_ASSET_CODE, USDC_ISSUER_TESTNET } from '@AfriWage/sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const USDC_ASSET = new Asset(USDC_ASSET_CODE, USDC_ISSUER_TESTNET);

/**
 * Builds an unsigned payment transaction XDR.
 * The client (Freighter) will sign it, then submit via /api/submit-tx.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderPublicKey, recipientPublicKey, amount, asset, memo } = body;

    if (!senderPublicKey || !recipientPublicKey || !amount) {
      return NextResponse.json(
        { message: 'senderPublicKey, recipientPublicKey, and amount are required' },
        { status: 400 }
      );
    }

    // Load the sender account to get the sequence number
    const account = await server.loadAccount(senderPublicKey);

    const paymentAsset = asset === 'XLM' ? Asset.native() : USDC_ASSET;

    const txBuilder = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    });

    txBuilder.addOperation(
      Operation.payment({
        destination: recipientPublicKey,
        asset: paymentAsset,
        amount,
      })
    );

    if (memo) {
      txBuilder.addMemo(Memo.text(memo));
    }

    txBuilder.setTimeout(120);

    const transaction = txBuilder.build();
    const xdr = transaction.toXDR();

    return NextResponse.json({ xdr });
  } catch (error) {
    console.error('Error building payment transaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to build transaction';
    return NextResponse.json({ message }, { status: 502 });
  }
}
