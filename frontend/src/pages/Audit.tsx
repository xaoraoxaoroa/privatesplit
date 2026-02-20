import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, TerminalInput } from '../components/ui';
import { PageTransition } from '../components/PageTransition';
import { useDisclose, DISCLOSURE_FIELDS } from '../hooks/useDisclose';
import { useSplitStore } from '../store/splitStore';
import { microToCredits, truncateAddress } from '../utils/format';
import { Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, FileCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function Audit() {
  const { connected, address } = useWallet();
  const { disclose, loading, error, txId } = useDisclose();
  const splits = useSplitStore((s) => s.splits);

  const [selectedSplitId, setSelectedSplitId] = useState('');
  const [auditorAddress, setAuditorAddress] = useState('');
  const [fieldMask, setFieldMask] = useState(0);
  const [success, setSuccess] = useState(false);

  // Only show splits created by this user
  const mySplits = splits.filter((s) => s.creator === address);

  const selectedSplit = mySplits.find((s) => s.split_id === selectedSplitId);

  const toggleField = (mask: number) => {
    setFieldMask((prev) => prev ^ mask);
  };

  const handleDisclose = async () => {
    if (!selectedSplitId || !auditorAddress || fieldMask === 0) return;
    setSuccess(false);
    const salt = selectedSplit?.salt || '';
    const result = await disclose(selectedSplitId, auditorAddress, fieldMask, salt);
    if (result) setSuccess(true);
  };

  if (!connected) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-xl font-bold text-white/90">Selective Disclosure</h1>
          <TerminalCard>
            <div className="py-8 text-center">
              <Shield className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
              <p className="text-sm text-white/80 mb-2">Wallet Required</p>
              <p className="text-xs text-white/40 mb-4">Connect wallet to disclose split data to an auditor</p>
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <Eye className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white/90">Selective Disclosure</h1>
            <p className="text-xs text-white/40 mt-0.5">
              Prove split details to an auditor — zero on-chain trace
            </p>
          </div>
        </div>

        {/* How It Works */}
        <TerminalCard title="HOW IT WORKS">
          <div className="space-y-3 text-xs">
            <p className="text-white/80">
              Selectively reveal specific fields from your Split record to an auditor,
              without exposing anything else. The disclosure leaves <span className="text-emerald-400 font-semibold">zero trace on-chain</span>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card-subtle p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-indigo-400 font-medium">ZK Proof</p>
                </div>
                <p className="text-white/40">Aleo's ZK proof guarantees disclosed values are from a real Split record.</p>
              </div>
              <div className="glass-card-subtle p-3">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-indigo-400 font-medium">No Finalize</p>
                </div>
                <p className="text-white/40">No on-chain finalize block — not even the fact of disclosure is visible.</p>
              </div>
              <div className="glass-card-subtle p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-indigo-400 font-medium">Encrypted Receipt</p>
                </div>
                <p className="text-white/40">Auditor receives an encrypted DisclosureReceipt — only they can read it.</p>
              </div>
            </div>
          </div>
        </TerminalCard>

        {/* Disclosure Form */}
        <TerminalCard title="DISCLOSE TO AUDITOR" variant="elevated">
          <div className="space-y-5">
            {/* Split selector */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Select Split</label>
              {mySplits.length === 0 ? (
                <div className="glass-card-subtle p-3 text-center">
                  <p className="text-xs text-white/30">No splits found. Create a split first.</p>
                  <Link to="/create" className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block">
                    Create Split
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedSplitId}
                  onChange={(e) => setSelectedSplitId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs text-white/80 focus:outline-none focus:border-indigo-400/50 transition-colors"
                >
                  <option value="">Choose a split...</option>
                  {mySplits.map((s) => (
                    <option key={s.split_id} value={s.split_id}>
                      {s.description || 'Untitled'} — {microToCredits(s.total_amount)} credits ({s.participant_count} people)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected split preview */}
            {selectedSplit && (
              <div className="glass-card-subtle p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Split ID</span>
                  <span className="text-white/70 font-mono text-[10px]">{truncateAddress(selectedSplit.split_id, 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Total Amount</span>
                  <span className="text-emerald-400 font-mono">{microToCredits(selectedSplit.total_amount)} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Per Person</span>
                  <span className="text-white/70 font-mono">{microToCredits(selectedSplit.per_person)} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Participants</span>
                  <span className="text-white/70">{selectedSplit.participant_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Debts Issued</span>
                  <span className="text-white/70">{selectedSplit.issued_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Status</span>
                  <span className={selectedSplit.status === 'active' ? 'text-emerald-400' : 'text-white/50'}>
                    {selectedSplit.status}
                  </span>
                </div>
              </div>
            )}

            {/* Auditor address */}
            <TerminalInput
              label="Auditor Address"
              placeholder="aleo1..."
              value={auditorAddress}
              onChange={(e) => setAuditorAddress(e.target.value)}
              error={auditorAddress && !auditorAddress.startsWith('aleo1') ? 'Must be a valid Aleo address' : undefined}
            />

            {/* Field selector */}
            <div>
              <label className="block text-xs text-white/50 mb-2">Fields to Disclose</label>
              <div className="space-y-2">
                {DISCLOSURE_FIELDS.map((field) => {
                  const isSelected = (fieldMask & field.mask) > 0;
                  return (
                    <button
                      key={field.bit}
                      onClick={() => toggleField(field.mask)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-400/30 text-indigo-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span className="font-medium">{field.label}</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-50">
                        bit {field.bit} (mask {field.mask})
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/30 mt-2">
                Field mask: {fieldMask} (binary: {fieldMask.toString(2).padStart(5, '0')})
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Success display */}
            {success && txId && (
              <div className="space-y-2 bg-emerald-400/5 border border-emerald-400/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Disclosure sent! The auditor now has the encrypted receipt.
                </div>
                <p className="text-[10px] text-white/30">TX: {txId}</p>
                <p className="text-[10px] text-emerald-400/60">
                  This disclosure left ZERO trace on-chain.
                </p>
              </div>
            )}

            {/* Submit */}
            <TerminalButton
              onClick={handleDisclose}
              loading={loading}
              disabled={!selectedSplitId || !auditorAddress || fieldMask === 0 || loading}
              className="w-full"
              size="lg"
            >
              <Eye className="w-4 h-4" />
              {fieldMask === 0
                ? 'SELECT FIELDS TO DISCLOSE'
                : `DISCLOSE ${DISCLOSURE_FIELDS.filter((f) => (fieldMask & f.mask) > 0).length} FIELD${DISCLOSURE_FIELDS.filter((f) => (fieldMask & f.mask) > 0).length !== 1 ? 'S' : ''} TO AUDITOR`}
            </TerminalButton>
          </div>
        </TerminalCard>

        {/* Privacy comparison */}
        <TerminalCard title="PRIVACY ADVANTAGE">
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="glass-card-subtle p-3 border-l-2 border-emerald-400/50">
                <p className="text-emerald-400 font-medium mb-1">QuietPay (Our Approach)</p>
                <ul className="space-y-1 text-white/50">
                  <li>0 public mappings for disclosure</li>
                  <li>No finalize block (zero trace)</li>
                  <li>Pure record-to-record transfer</li>
                  <li>ZK proof guarantees authenticity</li>
                </ul>
              </div>
              <div className="glass-card-subtle p-3 border-l-2 border-white/10">
                <p className="text-white/40 font-medium mb-1">Traditional Approach</p>
                <ul className="space-y-1 text-white/30">
                  <li>11+ public mappings as anchors</li>
                  <li>On-chain verification trail</li>
                  <li>Mapping-based proof system</li>
                  <li>Disclosure fact visible publicly</li>
                </ul>
              </div>
            </div>
          </div>
        </TerminalCard>
      </div>
    </PageTransition>
  );
}
