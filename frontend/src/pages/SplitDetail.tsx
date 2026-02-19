import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, TerminalBadge, LogEntry } from '../components/ui';
import { SplitParticipants } from '../components/split/SplitParticipants';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { useSplitStatus } from '../hooks/useSplitStatus';
import { useSettleSplit } from '../hooks/useSettleSplit';
import { useIssueDebt } from '../hooks/useIssueDebt';
import { microToCredits, truncateAddress } from '../utils/format';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PageTransition } from '../components/PageTransition';
import { Copy, QrCode, ExternalLink, Send, AlertTriangle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

export function SplitDetail() {
  const { hash } = useParams<{ hash: string }>();
  const { address } = useWallet();
  const split = useSplitStore((s) => s.getSplit(hash || ''));
  const { data: onChainStatus, refresh, loading: statusLoading } = useSplitStatus(hash);
  const { settleSplit, loading: settleLoading } = useSettleSplit();
  const { issueDebt, loading: issueLoading } = useIssueDebt();
  const logs = useUIStore((s) => s.logs);
  const [copied, setCopied] = useState(false);
  const [issuingTo, setIssuingTo] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  if (!split) {
    return (
      <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-amber-400">Split Not Found</h1>
        <TerminalCard>
          <div className="py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
            <p className="text-xs text-white/40 mb-4">
              Split {hash?.slice(0, 20)}... not found locally.
            </p>
            <Link to="/">
              <TerminalButton variant="secondary" className="w-full">
                <ArrowLeft className="w-3.5 h-3.5" /> BACK TO DASHBOARD
              </TerminalButton>
            </Link>
          </div>
        </TerminalCard>
      </div>
      </PageTransition>
    );
  }

  const isCreator = address === split.creator;
  const shareUrl = `${window.location.origin}/pay?creator=${split.creator}&amount=${split.per_person}&salt=${split.salt}&split_id=${split.split_id}&desc=${encodeURIComponent(split.description || '')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettle = () => {
    settleSplit(split.split_id);
  };

  return (
    <PageTransition>
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">
            {split.description || 'Split Detail'}
          </h1>
          <p className="text-xs text-white/30 mt-1 font-mono">
            ID: {split.split_id.slice(0, 24)}...
          </p>
        </div>
        <TerminalBadge
          status={split.status === 'settled' ? 'settled' : 'active'}
        />
      </div>

      {/* Split Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TerminalCard title="SPLIT INFO">
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Total</span>
              <span className="text-emerald-400 font-semibold font-mono">{microToCredits(split.total_amount)} credits</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Per Person</span>
              <span className="text-white/80 font-mono">{microToCredits(split.per_person)} credits</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Participants</span>
              <span className="text-white/80">{split.participant_count}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Creator</span>
              <span className="text-white/80 font-mono">{truncateAddress(split.creator)}</span>
            </div>
            {split.transaction_id && (
              <div className="flex justify-between text-xs">
                <span className="text-white/40">TX</span>
                <a
                  href={`https://testnet.explorer.provable.com/transaction/${split.transaction_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-emerald-400 transition-colors font-mono inline-flex items-center gap-1"
                >
                  {truncateAddress(split.transaction_id, 8)} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>
        </TerminalCard>

        <TerminalCard title="ON-CHAIN STATUS">
          {onChainStatus ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs items-center">
                <span className="text-white/40">Status</span>
                <TerminalBadge status={onChainStatus.status === 1 ? 'settled' : 'active'} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Payments</span>
                <span className="text-emerald-400 font-mono">
                  {onChainStatus.payment_count}/{onChainStatus.participant_count - 1}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${Math.round((onChainStatus.payment_count / Math.max(onChainStatus.participant_count - 1, 1)) * 100)}%` }}
                />
              </div>
              <TerminalButton variant="secondary" onClick={refresh} loading={statusLoading} className="w-full mt-2">
                <RefreshCw className="w-3.5 h-3.5" /> REFRESH
              </TerminalButton>
            </div>
          ) : (
            <div className="py-4 text-center">
              <Clock className="w-6 h-6 text-white/[0.08] mx-auto mb-2" />
              <p className="text-xs text-white/40 mb-3">Checking on-chain status...</p>
              <TerminalButton variant="secondary" onClick={refresh} loading={statusLoading} className="w-full">
                <RefreshCw className="w-3.5 h-3.5" /> CHECK STATUS
              </TerminalButton>
            </div>
          )}
        </TerminalCard>
      </div>

      {/* Participants */}
      {split.participants && split.participants.length > 0 && (
        <SplitParticipants
          participants={split.participants}
          perPerson={split.per_person}
          creator={split.creator}
        />
      )}

      {/* Share / QR */}
      <TerminalCard title="PAYMENT LINK">
        <div className="space-y-4">
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 text-xs text-white/40 font-mono break-all">
            {shareUrl}
          </div>
          <div className="flex gap-2">
            <TerminalButton onClick={handleCopy} variant="secondary" className="flex-1">
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'COPIED!' : 'COPY LINK'}
            </TerminalButton>
            <TerminalButton onClick={() => setShowQR(!showQR)} variant="secondary" className="flex-1">
              <QrCode className="w-3.5 h-3.5" />
              {showQR ? 'HIDE QR' : 'SHOW QR'}
            </TerminalButton>
          </div>
          {showQR && (
            <div className="flex justify-center p-5 bg-white rounded-xl">
              <QRCodeSVG value={shareUrl} size={200} />
            </div>
          )}
        </div>
      </TerminalCard>

      {/* Issue Debts */}
      {isCreator && split.status === 'active' && split.participants && split.participants.length > 0 && (
        <TerminalCard title="ISSUE DEBTS">
          <p className="text-xs text-white/40 mb-4">
            Issue on-chain debt records to each participant. They'll see the debt in their wallet and can pay it.
          </p>
          <div className="space-y-2">
            {split.participants.filter((p) => p.address !== address).map((p) => (
              <div key={p.address} className="flex items-center justify-between gap-3 glass-card p-3">
                <span className="text-xs text-white/80 truncate flex-1 font-mono">
                  {truncateAddress(p.address, 10)}
                </span>
                <span className="text-xs text-white/40 font-mono">
                  {microToCredits(split.per_person)} cr
                </span>
                <TerminalButton
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    setIssuingTo(p.address);
                    await issueDebt(split.split_id, p.address);
                    setIssuingTo(null);
                  }}
                  loading={issueLoading && issuingTo === p.address}
                >
                  <Send className="w-3 h-3" /> ISSUE
                </TerminalButton>
              </div>
            ))}
          </div>
        </TerminalCard>
      )}

      {/* Settle */}
      {isCreator && split.status === 'active' && (
        <TerminalButton onClick={handleSettle} loading={settleLoading} variant="danger" className="w-full" size="lg">
          <AlertTriangle className="w-4 h-4" /> SETTLE SPLIT
        </TerminalButton>
      )}

      {/* Activity Log */}
      {logs.length > 0 && (
        <TerminalCard title="ACTIVITY LOG" className="max-h-48 overflow-y-auto">
          <div className="space-y-1">
            {logs.slice(-10).map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </TerminalCard>
      )}
    </div>
    </PageTransition>
  );
}
