import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TransactionOptions } from '@provablehq/aleo-types';
import { PROGRAM_ID, PROGRAM_ID_V2, PROGRAM_ID_V1 } from '../utils/constants';
import { pollTransaction } from '../utils/aleo-utils';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { isSplitRecord, recordMatchesSplitContext, getRecordInput } from '../utils/record-utils';

export function useIssueDebt() {
  const { address, executeTransaction, requestRecords, decrypt, wallet } = useWallet();
  const updateSplit = useSplitStore((s) => s.updateSplit);
  const addLog = useUIStore((s) => s.addLog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueDebt = useCallback(async (splitId: string, participant: string, salt?: string) => {
    if (!address || !executeTransaction || !requestRecords) {
      setError('Wallet not connected');
      return false;
    }

    setLoading(true);
    setError(null);
    addLog(`Issuing debt to ${participant.slice(0, 12)}...`, 'system');

    try {
      addLog('Requesting Split records from wallet...', 'system');
      let splitRecordInput: any = null;
      let resolvedProgram = PROGRAM_ID;

      // Try both v2 and v1 programs (split may have been created on either)
      const programsToCheck = [PROGRAM_ID, PROGRAM_ID_V2, PROGRAM_ID_V1];

      // Collect all unspent record inputs from both programs
      const candidates: { input: any; program: string }[] = [];

      for (const programId of programsToCheck) {
        // Skip older versions if we already have candidates from newer ones
        if (programId !== PROGRAM_ID && candidates.length > 0) {
          addLog(`Skipping ${programId} — using newer version candidates`, 'info');
          break;
        }

        try {
          const records = (await requestRecords(programId)) as any[];
          addLog(`Found ${records?.length || 0} records from ${programId}`, 'info');

          for (const r of records || []) {
            if (r.spent) continue;

            // Use robust extraction: plaintext → decrypt → reconstruct → ciphertext → raw object
            const { input: recordInput, plaintext } = await getRecordInput(r, decrypt || null);

            // If we can read the record, prefer exact matches
            const isSplit = isSplitRecord(plaintext, r.data);
            const matchesSplit = recordMatchesSplitContext(plaintext, r.data, salt || '', splitId);

            if (matchesSplit && isSplit) {
              splitRecordInput = recordInput;
              resolvedProgram = programId;
              addLog(`Found matching Split record (${programId})`, 'success');
              break;
            }
            if (isSplit) {
              candidates.push({ input: recordInput, program: programId });
              addLog(`Found Split record candidate (${programId})`, 'info');
            } else {
              candidates.push({ input: recordInput, program: programId });
            }
          }
        } catch (err: any) {
          addLog(`Record fetch: ${err.message}`, 'warning');
        }
        if (splitRecordInput) break;
      }

      if (!splitRecordInput && candidates.length === 0) {
        setError('No records found in wallet. The wallet may need a moment to sync — please try again in a few seconds.');
        addLog('No records found — wallet sync may be needed', 'error');
        setLoading(false);
        return false;
      }

      // Build ordered list: exact match first, then candidates
      const toTry: { input: any; program: string }[] = [];
      if (splitRecordInput) {
        toTry.push({ input: splitRecordInput, program: resolvedProgram });
      }
      for (const c of candidates) {
        if (c.input !== splitRecordInput) toTry.push(c);
      }

      // Try each candidate — wallet rejects wrong record types
      let txResult: any = null;
      for (let i = 0; i < toTry.length; i++) {
        const candidate = toTry[i];
        addLog(`Trying issue_debt on ${candidate.program} (candidate ${i + 1}/${toTry.length})...`, 'system');

        const transaction: TransactionOptions = {
          program: candidate.program,
          function: 'issue_debt',
          inputs: [candidate.input, participant],
          fee: 100_000,
          privateFee: false,
        };

        try {
          txResult = await executeTransaction(transaction);
          resolvedProgram = candidate.program;
          addLog(`issue_debt accepted by wallet`, 'success');
          break;
        } catch (txErr: any) {
          addLog(`Candidate ${i + 1} rejected: ${txErr?.message || 'wrong record type'}`, 'warning');
          if (i === toTry.length - 1) throw txErr; // last one, rethrow
        }
      }

      const txId = txResult?.transactionId;
      addLog(`Issue debt submitted: ${txId}`, 'success');

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
                throw new Error('Issue debt transaction rejected');
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
          addLog(`Debt issued to ${participant.slice(0, 12)}...`, 'success');
          const store = useSplitStore.getState();
          const split = store.getSplit(splitId);
          if (split) {
            updateSplit(splitId, { issued_count: (split.issued_count || 0) + 1 });
          }
          return true;
        } else {
          addLog('Polling timed out — TX may still confirm', 'warning');
          return true;
        }
      }
      return false;
    } catch (err: any) {
      const msg = err?.message || 'Failed to issue debt';
      setError(msg);
      addLog(`Error: ${msg}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, executeTransaction, requestRecords, wallet, updateSplit, addLog]);

  return { issueDebt, loading, error };
}
