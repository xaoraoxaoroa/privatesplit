import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TransactionOptions } from '@provablehq/aleo-types';
import { PROGRAM_ID } from '../utils/constants';
import { pollTransaction } from '../utils/aleo-utils';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { api } from '../services/api';
import { isSplitRecord, recordMatchesSplitContext } from '../utils/record-utils';

export function useSettleSplit() {
  const { address, executeTransaction, requestRecords, wallet } = useWallet();
  const updateSplit = useSplitStore((s) => s.updateSplit);
  const addLog = useUIStore((s) => s.addLog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settleSplit = useCallback(async (splitId: string) => {
    if (!address || !executeTransaction || !requestRecords) {
      setError('Wallet not connected');
      return false;
    }

    setLoading(true);
    setError(null);
    addLog('Settling split...', 'system');

    try {
      addLog('Requesting Split records from wallet...', 'system');
      let splitRecordInput: string | null = null;

      // Retry fetch up to 3 times
      for (let attempt = 0; attempt < 3 && !splitRecordInput; attempt++) {
        if (attempt > 0) {
          addLog(`Retrying record fetch (attempt ${attempt + 1}/3)...`, 'info');
          await new Promise((r) => setTimeout(r, 2000));
        }
        try {
          const records = (await requestRecords(PROGRAM_ID)) as any[];
          addLog(`Found ${records?.length || 0} program records`, 'info');

          for (const r of records || []) {
            if (r.spent) continue;
            const plaintext = r.plaintext || '';

            // Must match this split AND be a Split record (not Debt/Receipt)
            const matchesSplit = recordMatchesSplitContext(plaintext, r.data, '', splitId);
            const isSplit = isSplitRecord(plaintext, r.data);

            if (matchesSplit && isSplit) {
              splitRecordInput = r.plaintext || r.ciphertext;
              addLog('Found matching Split record', 'success');
              break;
            }
          }
        } catch (err: any) {
          addLog(`Record fetch: ${err.message}`, 'warning');
        }
      }

      if (!splitRecordInput) {
        setError('Split record not found in wallet. The wallet may need a moment to sync — please try again shortly.');
        addLog('Split record not found — wallet sync may be needed', 'error');
        setLoading(false);
        return false;
      }

      // settle_split takes exactly 1 input: the Split record
      const inputs: string[] = [splitRecordInput];

      const transaction: TransactionOptions = {
        program: PROGRAM_ID,
        function: 'settle_split',
        inputs: inputs,
        fee: 100_000,
        privateFee: false,
      };

      // TX payload ready
      const txResult = await executeTransaction(transaction);

      const txId = txResult?.transactionId;
      addLog(`Settle transaction submitted: ${txId}`, 'success');

      if (txId) {
        let confirmed = false;

        if (wallet?.adapter?.transactionStatus) {
          let attempts = 0;
          while (!confirmed && attempts < 120) {
            attempts++;
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const statusRes: any = await wallet.adapter.transactionStatus(txId);
              const statusStr = (typeof statusRes === 'string'
                ? statusRes
                : statusRes?.status || ''
              ).toLowerCase();

              if (statusStr === 'completed' || statusStr === 'finalized' || statusStr === 'accepted') {
                confirmed = true;
              } else if (statusStr === 'failed' || statusStr === 'rejected') {
                throw new Error('Settle transaction rejected');
              }
              if (attempts % 15 === 0) addLog(`Polling... ${attempts}/120`, 'info');
            } catch (pollErr: any) {
              if (pollErr?.message?.includes('rejected')) throw pollErr;
            }
          }
        } else {
          confirmed = await pollTransaction(txId, (msg) => addLog(msg, 'info'));
        }

        if (confirmed) {
          addLog('Split settled on-chain!', 'success');
          updateSplit(splitId, { status: 'settled' });
          api.updateSplit(splitId, { status: 'settled' }).catch(() => {});
          return true;
        } else {
          addLog('Polling timed out. Check explorer.', 'warning');
          return false;
        }
      }
      return false;
    } catch (err: any) {
      const msg = err?.message || 'Failed to settle';
      setError(msg);
      addLog(`Error: ${msg}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, executeTransaction, requestRecords, wallet, updateSplit, addLog]);

  return { settleSplit, loading, error };
}
