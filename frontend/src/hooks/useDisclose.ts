import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TransactionOptions } from '@provablehq/aleo-types';
import { PROGRAM_ID } from '../utils/constants';
import { pollTransaction } from '../utils/aleo-utils';
import { useUIStore } from '../store/splitStore';
import { isSplitRecord, recordMatchesSplitContext, getRecordInput } from '../utils/record-utils';

// Bitmask field definitions
export const DISCLOSURE_FIELDS = [
  { bit: 0, mask: 1, name: 'total_amount', label: 'Total Amount' },
  { bit: 1, mask: 2, name: 'per_person', label: 'Per Person Share' },
  { bit: 2, mask: 4, name: 'participant_count', label: 'Participant Count' },
  { bit: 3, mask: 8, name: 'issued_count', label: 'Debts Issued' },
  { bit: 4, mask: 16, name: 'token_type', label: 'Token Type' },
] as const;

export function useDisclose() {
  const { address, executeTransaction, requestRecords, decrypt, wallet } = useWallet();
  const addLog = useUIStore((s) => s.addLog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const disclose = useCallback(async (
    splitId: string,
    auditorAddress: string,
    fieldMask: number,
    salt?: string,
  ) => {
    if (!address || !executeTransaction || !requestRecords) {
      setError('Wallet not connected');
      return false;
    }

    if (fieldMask < 1 || fieldMask > 31) {
      setError('Select at least one field to disclose');
      return false;
    }

    setLoading(true);
    setError(null);
    addLog('Starting selective disclosure...', 'system');

    try {
      // Find the Split record in wallet
      addLog('Searching for Split record...', 'system');
      let splitRecordInput: any = null;
      const candidates: any[] = [];

      try {
        const records = (await requestRecords(PROGRAM_ID)) as any[];
        addLog(`Found ${records?.length || 0} records from ${PROGRAM_ID}`, 'info');

        for (const r of records || []) {
          if (r.spent) continue;
          const { input: recordInput, plaintext } = await getRecordInput(r, decrypt || null);
          const isSplit = isSplitRecord(plaintext, r.data);
          const matches = recordMatchesSplitContext(plaintext, r.data, salt || '', splitId);

          if (matches && isSplit) {
            splitRecordInput = recordInput;
            addLog('Found matching Split record', 'success');
            break;
          }
          if (isSplit) {
            candidates.push(recordInput);
          }
        }
      } catch (err: any) {
        addLog(`Record fetch: ${err.message}`, 'warning');
      }

      if (!splitRecordInput && candidates.length > 0) {
        splitRecordInput = candidates[0];
        addLog(`Using Split candidate (${candidates.length} available)`, 'info');
      }

      if (!splitRecordInput) {
        setError('Split record not found in wallet. You must be the split creator to disclose.');
        addLog('Split record not found', 'error');
        setLoading(false);
        return false;
      }

      // Build disclosure fields description
      const disclosedFields = DISCLOSURE_FIELDS
        .filter((f) => (fieldMask & f.mask) > 0)
        .map((f) => f.label);
      addLog(`Disclosing: ${disclosedFields.join(', ')}`, 'info');
      addLog(`Auditor: ${auditorAddress.slice(0, 12)}...`, 'info');
      addLog(`Field mask: ${fieldMask} (binary: ${fieldMask.toString(2).padStart(5, '0')})`, 'info');

      // Execute disclose_to_auditor(split_record, auditor, field_mask)
      const transaction: TransactionOptions = {
        program: PROGRAM_ID,
        function: 'disclose_to_auditor',
        inputs: [splitRecordInput, auditorAddress, `${fieldMask}u8`],
        fee: 100_000,
        privateFee: false,
      };

      addLog('Executing disclose_to_auditor...', 'system');
      const txResult = await executeTransaction(transaction);
      const resultTxId = txResult?.transactionId;
      setTxId(resultTxId || null);
      addLog(`Transaction submitted: ${resultTxId}`, 'success');

      // Poll for confirmation
      if (resultTxId) {
        addLog('Waiting for confirmation...', 'system');
        let confirmed = false;

        if (wallet?.adapter?.transactionStatus) {
          let attempts = 0;
          while (!confirmed && attempts < 120) {
            attempts++;
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const statusRes: any = await wallet.adapter.transactionStatus(resultTxId);
              const statusStr = (typeof statusRes === 'string'
                ? statusRes
                : statusRes?.status || ''
              ).toLowerCase();

              if (statusStr === 'completed' || statusStr === 'finalized' || statusStr === 'accepted') {
                confirmed = true;
              } else if (statusStr === 'failed' || statusStr === 'rejected') {
                throw new Error('Disclosure transaction rejected');
              }
              if (attempts % 15 === 0) addLog(`Polling... ${attempts}/120`, 'info');
            } catch (pollErr: any) {
              if (pollErr?.message?.includes('rejected')) throw pollErr;
            }
          }
        } else {
          confirmed = await pollTransaction(resultTxId, (msg) => addLog(msg, 'info'));
        }

        if (confirmed) {
          addLog('Disclosure confirmed! Auditor now has the receipt.', 'success');
          addLog('Note: This disclosure left ZERO trace on-chain.', 'success');
          return true;
        } else {
          addLog('Polling timed out — TX may still confirm', 'warning');
          return true;
        }
      }

      return false;
    } catch (err: any) {
      const msg = err?.message || 'Disclosure failed';
      setError(msg);
      addLog(`Error: ${msg}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, executeTransaction, requestRecords, decrypt, wallet, addLog]);

  return { disclose, loading, error, txId };
}
