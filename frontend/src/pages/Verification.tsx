import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, TerminalBadge } from '../components/ui';
import { PROGRAM_ID, TESTNET_API } from '../utils/constants';
import { getSplitStatus } from '../utils/aleo-utils';
import { microToCredits, truncateAddress } from '../utils/format';
import { STATUS_SYMBOLS } from '../design-system/tokens';
import { Link } from 'react-router-dom';

interface VerificationResult {
  splitId: string;
  onChain: boolean;
  status: number;
  paymentCount: number;
  participantCount: number;
  receiptFound: boolean;
}

export function Verification() {
  const { connected, address, requestRecords } = useWallet();
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);

  const handleVerify = async () => {
    if (!address || !requestRecords) return;

    setLoading(true);
    setReceipts([]);
    setVerificationResults([]);

    try {
      // Fetch all program records (PayerReceipts and CreatorReceipts)
      const records = (await requestRecords(PROGRAM_ID)) as any[];

      const receiptRecords: any[] = [];
      for (const r of records || []) {
        if (r.spent) continue;
        const plaintext = r.plaintext || '';
        // PayerReceipt and CreatorReceipt both contain split_id and amount
        if (plaintext.includes('split_id') && plaintext.includes('amount')) {
          receiptRecords.push(r);
        }
      }

      setReceipts(receiptRecords);

      // For each receipt, verify the split exists on-chain
      const results: VerificationResult[] = [];
      const checkedSplits = new Set<string>();

      for (const r of receiptRecords) {
        const plaintext = r.plaintext || '';
        const splitIdMatch = plaintext.match(/split_id:\s*(\S+)\.private/);
        if (!splitIdMatch) continue;

        const splitId = splitIdMatch[1];
        if (checkedSplits.has(splitId)) continue;
        checkedSplits.add(splitId);

        const status = await getSplitStatus(splitId);
        results.push({
          splitId,
          onChain: !!status,
          status: status?.status || 0,
          paymentCount: status?.payment_count || 0,
          participantCount: status?.participant_count || 0,
          receiptFound: true,
        });
      }

      setVerificationResults(results);
    } catch (err: any) {
      // Verification scan error — handled silently
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-lg text-terminal-green tracking-wider">VERIFICATION</h1>
        <TerminalCard>
          <p className="text-xs text-terminal-dim text-center py-6">
            {STATUS_SYMBOLS.pending} Connect wallet to verify payment receipts
          </p>
          <Link to="/connect">
            <TerminalButton variant="secondary" className="w-full">CONNECT WALLET</TerminalButton>
          </Link>
        </TerminalCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg text-terminal-green tracking-wider">VERIFICATION</h1>
        <p className="text-xs text-terminal-dim mt-1">
          Prove your payments using on-chain receipt records
        </p>
      </div>

      {/* How it works */}
      <TerminalCard title="HOW IT WORKS">
        <div className="space-y-2 text-xs">
          <p className="text-terminal-text">
            When you pay a split, PrivateSplit creates encrypted receipt records:
          </p>
          <p className="text-terminal-green">
            {STATUS_SYMBOLS.success} <strong>PayerReceipt</strong> — Private to you. Proves you paid.
          </p>
          <p className="text-terminal-green">
            {STATUS_SYMBOLS.success} <strong>CreatorReceipt</strong> — Private to the creator. Proves they received.
          </p>
          <p className="text-terminal-dim mt-2">
            These records are encrypted on-chain. Only you can decrypt yours.
            Click "Verify" to scan your wallet for receipt records and cross-check them against on-chain split data.
          </p>
        </div>
      </TerminalCard>

      {/* Verify Button */}
      <TerminalButton onClick={handleVerify} loading={loading} className="w-full">
        SCAN WALLET FOR RECEIPTS
      </TerminalButton>

      {/* Results */}
      {receipts.length > 0 && (
        <TerminalCard title={`FOUND ${receipts.length} RECEIPT RECORD${receipts.length !== 1 ? 'S' : ''}`}>
          <div className="space-y-2 text-xs">
            {receipts.map((r, i) => (
              <div key={i} className="border border-terminal-border p-2">
                <p className="text-terminal-green">{STATUS_SYMBOLS.success} Receipt #{i + 1}</p>
                <p className="text-terminal-dim break-all mt-1">
                  {r.plaintext?.slice(0, 120) || 'Encrypted record'}...
                </p>
              </div>
            ))}
          </div>
        </TerminalCard>
      )}

      {verificationResults.length > 0 && (
        <TerminalCard title="ON-CHAIN VERIFICATION">
          <div className="space-y-3">
            {verificationResults.map((result, i) => (
              <div key={i} className="border border-terminal-border p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-terminal-text">
                    Split: {result.splitId.slice(0, 20)}...
                  </p>
                  <TerminalBadge status={result.status === 1 ? 'settled' : 'active'} />
                </div>

                <div className="space-y-1 text-xs">
                  <p className={result.onChain ? 'text-terminal-green' : 'text-terminal-red'}>
                    {result.onChain ? STATUS_SYMBOLS.success : STATUS_SYMBOLS.error}{' '}
                    {result.onChain ? 'Split verified on-chain' : 'Split NOT found on-chain'}
                  </p>
                  <p className="text-terminal-green">
                    {STATUS_SYMBOLS.success} Receipt record found in wallet
                  </p>
                  {result.onChain && (
                    <>
                      <p className="text-terminal-dim">
                        Payments: {result.paymentCount}/{result.participantCount - 1}
                      </p>
                      <p className="text-terminal-dim">
                        Status: {result.status === 1 ? 'Settled' : 'Active'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TerminalCard>
      )}

      {!loading && receipts.length === 0 && verificationResults.length === 0 && (
        <TerminalCard>
          <p className="text-xs text-terminal-dim text-center py-4">
            {STATUS_SYMBOLS.pending} Click "Scan Wallet" to check for payment receipts
          </p>
        </TerminalCard>
      )}
    </div>
  );
}
