import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TransactionOptions } from '@provablehq/aleo-types';
import { PROGRAM_ID, TESTNET_API, DEFAULT_FEE } from '../utils/constants';
import { creditsToMicro } from '../utils/format';
import { generateSalt, getSplitIdFromMapping } from '../utils/aleo-utils';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { api } from '../services/api';
import type { Split, SplitCategory, TokenType } from '../types/split';

interface CreateSplitParams {
  description: string;
  amount: string;
  participantCount: number;
  participants: string[];
  category?: SplitCategory;
  expiryHours?: number;
  tokenType?: TokenType;
}

export function useCreateSplit() {
  const { address, executeTransaction, transactionStatus, requestTransactionHistory, wallet } = useWallet();
  const addSplit = useSplitStore((s) => s.addSplit);
  const addLog = useUIStore((s) => s.addLog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSplit = useCallback(async (params: CreateSplitParams) => {
    if (!address || !executeTransaction) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);
    addLog('Initiating split creation...', 'system');

    try {
      const microAmount = creditsToMicro(params.amount);
      const salt = generateSalt();
      const category = params.category || 'other';
      const expiryHours = params.expiryHours || 0;
      const tokenType = params.tokenType || 'credits';

      addLog(`Amount: ${params.amount} credits (${microAmount} microcredits)`, 'info');
      addLog(`Participants: ${params.participantCount}`, 'info');
      addLog(`Category: ${category}`, 'info');
      if (expiryHours > 0) addLog(`Expiry: ${expiryHours} hours`, 'info');
      addLog(`Salt: ${salt.slice(0, 20)}...`, 'info');

      // Prepare inputs — matching Leo v2 function signature:
      // create_split(total_amount: u64, participant_count: u8, salt: field, expiry_hours: u32)
      const inputs: string[] = [
        `${microAmount}u64`,
        `${params.participantCount}u8`,
        salt,
        `${expiryHours}u32`,
      ];

      addLog(`Inputs: [${inputs.map(i => i.slice(0, 30)).join(', ')}]`, 'info');

      const transaction: TransactionOptions = {
        program: PROGRAM_ID,
        function: 'create_split',
        inputs: inputs,
        fee: DEFAULT_FEE,
        privateFee: false,
      };

      addLog('Requesting transaction execution...', 'system');

      // Execute — this calls Shield Wallet's executeTransaction
      let txId = '';
      const result = await executeTransaction(transaction);
      if (result && result.transactionId) {
        txId = result.transactionId;
      }

      let finalTxId = txId;
      addLog(`Transaction submitted: ${txId}`, 'success');

      // Poll for confirmation
      let hashFromStatus: string | null = null;

      if (txId) {
        addLog('Waiting for on-chain confirmation...', 'system');
        let confirmed = false;
        let attempts = 0;

        const statusFn = wallet?.adapter?.transactionStatus || transactionStatus;

        if (statusFn) {
          while (!confirmed && attempts < 120) {
            attempts++;
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const statusRes: any = await statusFn(txId);
              const statusStr = (typeof statusRes === 'string'
                ? statusRes
                : statusRes?.status || ''
              ).toLowerCase();

              if (typeof statusRes === 'object' && (statusRes as any)?.transactionId) {
                finalTxId = (statusRes as any).transactionId;
              }

              // Strategy 1: Extract split_id from execution outputs
              const resAny = statusRes as any;
              if (resAny?.execution?.transitions?.[0]?.outputs?.[0]?.value) {
                hashFromStatus = resAny.execution.transitions[0].outputs[0].value;
              }

              if (statusStr === 'completed' || statusStr === 'finalized' || statusStr === 'accepted') {
                confirmed = true;
                addLog('Transaction confirmed on-chain!', 'success');
              } else if (statusStr === 'failed' || statusStr === 'rejected') {
                throw new Error(`Transaction failed: ${statusStr}`);
              }

              if (attempts % 15 === 0) {
                addLog(`Polling... attempt ${attempts}/120`, 'info');
              }
            } catch (pollErr: any) {
              if (pollErr?.message?.includes('failed') || pollErr?.message?.includes('rejected')) {
                throw pollErr;
              }
            }
          }

          if (!confirmed) {
            addLog('Transaction polling timed out. It may still confirm.', 'warning');
          }
        } else {
          // Fallback: poll via API
          for (let i = 0; i < 120; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const res = await fetch(`${TESTNET_API}/transaction/${txId}`);
              if (res.ok) {
                confirmed = true;
                addLog('Transaction confirmed on-chain!', 'success');
                const data = await res.json();
                if (data?.execution?.transitions?.[0]?.outputs?.[0]?.value) {
                  hashFromStatus = data.execution.transitions[0].outputs[0].value;
                }
                break;
              }
            } catch { /* continue */ }
            if (i % 15 === 0 && i > 0) {
              addLog(`Polling... attempt ${i}/120`, 'info');
            }
          }
        }
      }

      // Multi-strategy split_id retrieval (4 strategies)
      let splitId: string | null = null;

      // Strategy 1: From transaction status response
      if (hashFromStatus) {
        splitId = hashFromStatus.replace(/"/g, '').trim();
        addLog('Split ID retrieved from transaction output', 'success');
      }

      // Strategy 2: On-chain mapping lookup
      if (!splitId) {
        addLog('Looking up split ID from on-chain mapping...', 'info');
        for (let i = 0; i < 15; i++) {
          splitId = await getSplitIdFromMapping(salt);
          if (splitId) break;
          await new Promise((r) => setTimeout(r, 3000));
          if (i === 4 || i === 9) addLog(`Still waiting for finalization... (${i + 1}/15)`, 'info');
        }
        if (splitId) addLog('Split ID retrieved from mapping', 'success');
      }

      // Strategy 3: Wallet transaction history
      if (!splitId && requestTransactionHistory) {
        addLog('Checking wallet transaction history...', 'info');
        try {
          const history = await requestTransactionHistory(PROGRAM_ID);
          const foundTx = (history as any)?.transactions?.find(
            (t: any) => t.transactionId === finalTxId || t.id === finalTxId,
          );
          const txAny = foundTx as any;
          if (txAny?.execution?.transitions?.[0]?.outputs?.[0]?.value) {
            splitId = txAny.execution.transitions[0].outputs[0].value.replace(/"/g, '').trim();
            addLog('Split ID retrieved from wallet history', 'success');
          }
        } catch (histErr: any) {
          addLog(`Wallet history: ${histErr.message}`, 'warning');
        }
      }

      // Strategy 4: Public chain API
      if (!splitId && finalTxId) {
        addLog('Checking public chain API...', 'info');
        try {
          await new Promise((r) => setTimeout(r, 2000));
          const res = await fetch(`${TESTNET_API}/transaction/${finalTxId}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.execution?.transitions?.[0]?.outputs?.[0]?.value) {
              splitId = data.execution.transitions[0].outputs[0].value.replace(/"/g, '').trim();
              addLog('Split ID retrieved from public chain', 'success');
            }
          }
        } catch { /* ignore */ }
      }

      // Final fallback
      if (!splitId || splitId === 'null' || splitId === 'undefined') {
        splitId = `pending_${salt.slice(0, 20)}`;
        addLog(
          'Split ID not yet confirmed on-chain. The split is saved locally and will sync once finalized.',
          'warning',
        );
      }

      addLog(`Split ID: ${splitId.slice(0, 24)}...`, 'info');

      // Build split object
      const perPerson = Math.floor(microAmount / params.participantCount);
      const split: Split = {
        split_id: splitId,
        creator: address,
        total_amount: microAmount,
        per_person: perPerson,
        participant_count: params.participantCount,
        issued_count: 0,
        salt,
        description: params.description,
        category,
        expiry_hours: expiryHours,
        token_type: tokenType,
        status: 'active',
        payment_count: 0,
        created_at: new Date().toISOString(),
        transaction_id: finalTxId || undefined,
        participants: params.participants.filter(Boolean).map((addr) => ({
          address: addr,
          paid: false,
        })),
      };

      // Save locally
      addSplit(split);

      // Save to backend (non-blocking)
      api.createSplit({
        split_id: splitId,
        creator: address,
        total_amount: microAmount,
        per_person: perPerson,
        participant_count: params.participantCount,
        salt,
        description: params.description,
        category,
        expiry_hours: expiryHours,
        token_type: tokenType,
        transaction_id: finalTxId || '',
        participants: params.participants.filter(Boolean),
      }).catch((err: any) => addLog(`Backend save failed: ${err.message}`, 'warning'));

      addLog('Split created successfully!', 'success');
      return split;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create split';
      setError(msg);
      addLog(`Error: ${msg}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, executeTransaction, transactionStatus, requestTransactionHistory, wallet, addSplit, addLog]);

  return { createSplit, loading, error };
}
