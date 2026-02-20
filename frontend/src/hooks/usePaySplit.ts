import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TransactionOptions } from '@provablehq/aleo-types';
import { PROGRAM_ID, PROGRAM_ID_V2, PROGRAM_ID_V1, CREDITS_PROGRAM, DEFAULT_FEE } from '../utils/constants';
import { getSplitStatus, getSplitIdFromMapping, pollTransaction } from '../utils/aleo-utils';
import { useUIStore } from '../store/splitStore';
import { api } from '../services/api';
import {
  isDebtRecord,
  recordMatchesSplitContext,
  extractField,
  getMicrocreditsFromRecord,
  buildCreditsRecordPlaintext,
  getRecordInput,
} from '../utils/record-utils';
import type { PaymentStep } from '../types/split';

interface PayParams {
  creator: string;
  amount: string;
  salt: string;
  splitId?: string;
}

export function usePaySplit() {
  const { address, executeTransaction, requestRecords, decrypt, wallet } = useWallet();
  const addLog = useUIStore((s) => s.addLog);
  const [step, setStep] = useState<PaymentStep>('connect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const pay = useCallback(async (params: PayParams) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Wallet check
      setStep('connect');
      if (!address || !executeTransaction || !requestRecords) {
        setError('Wallet not connected');
        setStep('error');
        return false;
      }
      addLog(`Wallet: ${address.slice(0, 12)}...`, 'success');

      // Step 2: Verify split on-chain
      setStep('verify');
      addLog('Verifying split on-chain...', 'system');

      let splitId = params.splitId;
      if (!splitId || splitId === 'null') {
        splitId = await getSplitIdFromMapping(params.salt) || undefined;
      }

      if (splitId) {
        const status = await getSplitStatus(splitId);
        if (status?.status === 1) {
          setError('This split is already settled');
          addLog('Split is already settled', 'error');
          setStep('error');
          return false;
        }
        addLog(`Split verified: ${splitId.slice(0, 20)}...`, 'success');
      } else {
        addLog('Split ID not found in mapping — proceeding', 'warning');
      }

      // Step 3: Find Debt record in wallet
      setStep('convert');
      addLog('Searching for Debt record in wallet...', 'system');

      let debtRecordInput: any = null;
      let debtAmount = 0;
      let resolvedProgram = PROGRAM_ID;
      const debtCandidates: { input: any; program: string }[] = [];

      // Try both v2 and v1 programs (debt may have been issued on either)
      const programsToCheck = [PROGRAM_ID, PROGRAM_ID_V2, PROGRAM_ID_V1];

      for (const progId of programsToCheck) {
        if (debtRecordInput) break;
        // Skip older versions if we already have candidates from newer ones
        if (progId !== PROGRAM_ID && debtCandidates.length > 0) {
          addLog(`Skipping ${progId} — using newer version candidates`, 'info');
          break;
        }

      // Retry up to 3 times for wallet sync
      for (let attempt = 0; attempt < 3 && !debtRecordInput; attempt++) {
        if (attempt > 0) {
          const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
          addLog(`Retrying record search (attempt ${attempt + 1}/3)...`, 'info');
          await new Promise((r) => setTimeout(r, delay));
        }
        try {
          const programRecords = (await requestRecords(progId)) as any[];
          addLog(`Found ${programRecords?.length || 0} records from ${progId}`, 'info');

          for (const r of programRecords || []) {
            if (r.spent) continue;

            // Use robust extraction: plaintext → decrypt → reconstruct → ciphertext → raw object
            const { input: recordInput, plaintext } = await getRecordInput(r, decrypt || null);

            const matches = recordMatchesSplitContext(
              plaintext,
              r.data,
              params.salt,
              splitId,
            );
            const isDebt = isDebtRecord(plaintext, r.data);

            if (matches && isDebt) {
              debtRecordInput = recordInput;
              resolvedProgram = progId;
              const rawAmount = extractField(plaintext, 'amount') || extractField(plaintext, 'per_person');
              if (rawAmount) {
                debtAmount = parseInt(rawAmount.replace(/u64|u128/g, ''));
              }
              addLog(`Found Debt record from ${progId} (amount: ${debtAmount} microcredits)`, 'success');
              break;
            }
            // Candidate fallback: collect any unspent record even if unidentifiable
            if (isDebt) {
              debtCandidates.unshift({ input: recordInput, program: progId });
              addLog(`Found Debt record candidate (${progId})`, 'info');
            } else {
              debtCandidates.push({ input: recordInput, program: progId });
            }
          }
        } catch (err: any) {
          addLog(`Record fetch: ${err.message}`, 'warning');
        }
      }
      } // end programsToCheck loop

      // Use best candidate if no exact match
      if (!debtRecordInput && debtCandidates.length > 0) {
        debtRecordInput = debtCandidates[0].input;
        resolvedProgram = debtCandidates[0].program;
        addLog(`Using Debt candidate from ${resolvedProgram} (${debtCandidates.length} available)`, 'info');
      }

      if (!debtRecordInput) {
        setError('No Debt record found in your wallet. The split creator must issue a debt to you first. If they just issued it, wait a moment and try again.');
        addLog('Debt record not found — creator must issue debt first', 'error');
        setStep('error');
        return false;
      }

      // Step 4: Find credits record with sufficient balance
      addLog('Searching for private credit records...', 'system');

      const amountNeeded = debtAmount || parseInt(params.amount);
      let records: any[] = [];

      try {
        records = (await requestRecords('credits.aleo')) as any[];
        addLog(`Found ${records?.length || 0} credit records`, 'info');
      } catch (err: any) {
        addLog(`Credit record fetch failed: ${err.message}`, 'error');
        setError('Failed to fetch credit records from wallet');
        setStep('error');
        return false;
      }

      let payRecord: any = null;
      let bestCreditRecord: any = null;  // fallback: any unspent credit record
      for (const r of records || []) {
        if (r.spent) continue;
        let val = getMicrocreditsFromRecord(r);

        // Try decrypting if no readable plaintext
        if (val === 0 && r.recordCiphertext && !r.plaintext && decrypt) {
          try {
            const decrypted = await decrypt(r.recordCiphertext);
            if (decrypted) {
              r.plaintext = decrypted;
              val = getMicrocreditsFromRecord(r);
            }
          } catch { /* continue */ }
        }

        if (val > amountNeeded) {
          payRecord = r;
          addLog(`Found credits record: ${val} microcredits`, 'success');
          break;
        }
        // Track any unspent record as fallback (amount might be unreadable)
        if (!bestCreditRecord) bestCreditRecord = r;
      }

      // One retry after delay
      if (!payRecord) {
        addLog('No suitable credits record found — retrying after 3s...', 'warning');
        await new Promise((r) => setTimeout(r, 3000));
        try {
          records = (await requestRecords('credits.aleo')) as any[];
          for (const r of records || []) {
            if (r.spent) continue;
            const val = getMicrocreditsFromRecord(r);
            if (val > amountNeeded) {
              payRecord = r;
              addLog(`Found credits record on retry: ${val} microcredits`, 'success');
              break;
            }
            if (!bestCreditRecord) bestCreditRecord = r;
          }
        } catch { /* ignore */ }
      }

      // Fallback: transfer_public_to_private if no private credits
      if (!payRecord) {
        addLog('No private credits found — attempting transfer_public_to_private...', 'warning');
        setStep('convert');

        try {
          // Convert enough public credits to private (amount + buffer for fee)
          const convertAmount = amountNeeded + DEFAULT_FEE;
          addLog(`Converting ${(convertAmount / 1_000_000).toFixed(6)} public credits to private...`, 'system');

          const convertTx: TransactionOptions = {
            program: CREDITS_PROGRAM,
            function: 'transfer_public_to_private',
            inputs: [address, `${convertAmount}u64`],
            fee: DEFAULT_FEE,
            privateFee: false,
          };

          const convertResult = await executeTransaction(convertTx);
          const convertTxId = convertResult?.transactionId;
          addLog(`Conversion TX submitted: ${convertTxId}`, 'success');

          // Poll for conversion confirmation
          if (convertTxId) {
            addLog('Waiting for conversion to confirm...', 'system');
            let convertConfirmed = false;

            if (wallet?.adapter?.transactionStatus) {
              for (let i = 0; i < 60; i++) {
                await new Promise((r) => setTimeout(r, 1500));
                try {
                  const sRes: any = await wallet.adapter.transactionStatus(convertTxId);
                  const sStr = (typeof sRes === 'string' ? sRes : sRes?.status || '').toLowerCase();
                  if (sStr === 'completed' || sStr === 'finalized' || sStr === 'accepted') {
                    convertConfirmed = true;
                    break;
                  }
                  if (sStr === 'failed' || sStr === 'rejected') throw new Error('Conversion failed');
                } catch (e: any) {
                  if (e?.message?.includes('failed') || e?.message?.includes('rejected')) throw e;
                }
                if (i % 10 === 0 && i > 0) addLog(`Conversion polling... ${i}/60`, 'info');
              }
            } else {
              convertConfirmed = await pollTransaction(convertTxId, (msg) => addLog(msg, 'info'));
            }

            if (convertConfirmed) {
              addLog('Public-to-private conversion confirmed!', 'success');
              // Wait for record to appear in wallet (longer wait for sync)
              await new Promise((r) => setTimeout(r, 5000));

              // Re-fetch private credit records — try multiple times
              for (let fetchAttempt = 0; fetchAttempt < 3 && !payRecord; fetchAttempt++) {
                if (fetchAttempt > 0) await new Promise((r) => setTimeout(r, 3000));
                try {
                  records = (await requestRecords('credits.aleo')) as any[];
                  addLog(`Post-conversion: found ${records?.length || 0} credit records`, 'info');
                  for (const r of records || []) {
                    if (r.spent) continue;
                    const val = getMicrocreditsFromRecord(r);
                    if (val > amountNeeded) {
                      payRecord = r;
                      addLog(`Found converted credits record: ${val} microcredits`, 'success');
                      break;
                    }
                    // We just converted enough, so any unspent record should work
                    if (!payRecord) {
                      payRecord = r;
                      addLog(`Using converted credits record (amount unreadable, conversion was ${convertAmount} microcredits)`, 'info');
                      break;
                    }
                  }
                } catch { /* ignore */ }
              }
            } else {
              addLog('Conversion timed out — try again in a moment', 'warning');
            }
          }
        } catch (convertErr: any) {
          addLog(`Conversion failed: ${convertErr.message}`, 'error');
        }
      }

      // Last fallback: use any unspent credit record we found
      if (!payRecord && bestCreditRecord) {
        payRecord = bestCreditRecord;
        addLog('Using best available credits record (amount unreadable)', 'warning');
      }

      if (!payRecord) {
        setError(
          `No private credit record found. ` +
          `You need ${(amountNeeded / 1_000_000).toFixed(6)} credits. ` +
          `Ensure you have sufficient public balance and try again.`
        );
        setStep('error');
        return false;
      }

      let creditsInput: any = buildCreditsRecordPlaintext(payRecord);
      if (!creditsInput) {
        // Last resort: pass raw record object (NullPay pattern)
        creditsInput = payRecord;
        addLog('Using raw credits record object as input', 'warning');
      }

      // Step 5: Execute pay_debt(debt_record, credits_record)
      setStep('pay');
      addLog(`Executing pay_debt on ${resolvedProgram}...`, 'system');

      const inputs: any[] = [debtRecordInput, creditsInput];
      const debtStr = typeof debtRecordInput === 'string' ? debtRecordInput.slice(0, 40) : JSON.stringify(debtRecordInput).slice(0, 40);
      const credStr = typeof creditsInput === 'string' ? creditsInput.slice(0, 40) : JSON.stringify(creditsInput).slice(0, 40);
      addLog(`Debt: ${debtStr}...`, 'info');
      addLog(`Credits: ${credStr}...`, 'info');

      const transaction: TransactionOptions = {
        program: resolvedProgram,
        function: 'pay_debt',
        inputs: inputs,
        fee: DEFAULT_FEE,
        privateFee: false,
      };

      // TX payload ready
      const txResult = await executeTransaction(transaction);

      const resultTxId = txResult?.transactionId;
      setTxId(resultTxId || null);
      addLog(`Transaction submitted: ${resultTxId}`, 'success');

      // Poll for confirmation
      if (resultTxId) {
        addLog('Waiting for on-chain confirmation...', 'system');
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

              if ((statusRes as any)?.transactionId) {
                setTxId((statusRes as any).transactionId);
              }

              if (statusStr === 'completed' || statusStr === 'finalized' || statusStr === 'accepted') {
                confirmed = true;
              } else if (statusStr === 'failed' || statusStr === 'rejected') {
                throw new Error('Transaction rejected on-chain');
              }
              if (attempts % 10 === 0) addLog(`Polling... ${attempts}/120`, 'info');
            } catch (pollErr: any) {
              if (pollErr?.message?.includes('rejected')) throw pollErr;
            }
          }
        } else {
          confirmed = await pollTransaction(resultTxId, (msg) => addLog(msg, 'info'));
        }

        if (confirmed) {
          addLog('Payment confirmed on-chain!', 'success');
          setStep('success');
          if (splitId) {
            api.updateSplit(splitId, {
              payment_count: (await getSplitStatus(splitId))?.payment_count || 1,
            }).catch(() => {});
          }
          return true;
        } else {
          addLog('Polling timed out. Check explorer for confirmation.', 'warning');
          setStep('success');
          return true;
        }
      }

      setStep('success');
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Payment failed';
      setError(msg);
      addLog(`Error: ${msg}`, 'error');
      setStep('error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, executeTransaction, requestRecords, decrypt, wallet, addLog]);

  return { pay, step, loading, error, txId };
}
