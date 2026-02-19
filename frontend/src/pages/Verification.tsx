import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, TerminalBadge } from '../components/ui';
import { PROGRAM_ID } from '../utils/constants';
import { getSplitStatus } from '../utils/aleo-utils';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Shield, CheckCircle2, XCircle, Search, FileCheck, Lock } from 'lucide-react';

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
  const [receipts, setReceipts] = useState<Array<{ plaintext?: string }>>([]);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);

  const handleVerify = async () => {
    if (!address || !requestRecords) return;

    setLoading(true);
    setReceipts([]);
    setVerificationResults([]);

    try {
      const records = (await requestRecords(PROGRAM_ID)) as Array<{ spent?: boolean; plaintext?: string }>;

      const receiptRecords: Array<{ plaintext?: string }> = [];
      for (const r of records || []) {
        if (r.spent) continue;
        const plaintext = r.plaintext || '';
        if (plaintext.includes('split_id') && plaintext.includes('amount')) {
          receiptRecords.push(r);
        }
      }

      setReceipts(receiptRecords);

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
    } catch {
      // Verification scan error — handled silently
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-white/90">Verification</h1>
        <TerminalCard>
          <div className="py-8 text-center">
            <Shield className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
            <p className="text-sm text-white/80 mb-2">Wallet Required</p>
            <p className="text-xs text-white/40 mb-4">Connect wallet to verify payment receipts</p>
            <Link to="/connect">
              <TerminalButton variant="secondary" className="w-full">CONNECT WALLET</TerminalButton>
            </Link>
          </div>
        </TerminalCard>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/90">Verification</h1>
          <p className="text-xs text-white/40 mt-0.5">
            Prove your payments using on-chain receipt records
          </p>
        </div>
      </div>

      {/* How it works */}
      <TerminalCard title="HOW IT WORKS">
        <div className="space-y-3 text-xs">
          <p className="text-white/80">
            When you pay a split, PrivateSplit creates encrypted receipt records:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-card-subtle p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-emerald-400 font-medium">PayerReceipt</p>
              </div>
              <p className="text-white/40">Private to you. Proves you paid.</p>
            </div>
            <div className="glass-card-subtle p-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-emerald-400 font-medium">CreatorReceipt</p>
              </div>
              <p className="text-white/40">Private to the creator. Proves they received.</p>
            </div>
          </div>
          <p className="text-white/40 mt-2">
            These records are encrypted on-chain. Only you can decrypt yours.
          </p>
        </div>
      </TerminalCard>

      {/* Verify Button */}
      <TerminalCard variant="elevated">
        <div className="text-center py-2">
          <TerminalButton onClick={handleVerify} loading={loading} className="w-full" size="lg">
            <Search className="w-4 h-4" /> SCAN WALLET FOR RECEIPTS
          </TerminalButton>
        </div>
      </TerminalCard>

      {/* Results */}
      {receipts.length > 0 && (
        <TerminalCard title={`FOUND ${receipts.length} RECEIPT${receipts.length !== 1 ? 'S' : ''}`}>
          <div className="space-y-2 text-xs">
            {receipts.map((r, i) => (
              <div key={i} className="glass-card-subtle p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-emerald-400 font-medium">Receipt #{i + 1}</p>
                </div>
                <p className="text-white/40 break-all mt-1 font-mono text-[11px]">
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
              <div key={i} className="glass-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/80 font-mono">
                    Split: {result.splitId.slice(0, 20)}...
                  </p>
                  <TerminalBadge status={result.status === 1 ? 'settled' : 'active'} />
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className={`flex items-center gap-2 ${result.onChain ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.onChain ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    {result.onChain ? 'Split verified on-chain' : 'Split NOT found on-chain'}
                  </p>
                  <p className="text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Receipt record found in wallet
                  </p>
                  {result.onChain && (
                    <>
                      <p className="text-white/40">
                        Payments: {result.paymentCount}/{result.participantCount - 1}
                      </p>
                      <p className="text-white/40">
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
          <div className="py-6 text-center">
            <Shield className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
            <p className="text-xs text-white/30">Click "Scan Wallet" to check for payment receipts</p>
          </div>
        </TerminalCard>
      )}
    </div>
    </PageTransition>
  );
}
