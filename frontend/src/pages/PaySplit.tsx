import { useSearchParams, Link } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, TerminalProgress, LogEntry } from '../components/ui';
import { usePaySplit } from '../hooks/usePaySplit';
import { useUIStore } from '../store/splitStore';
import { microToCredits, truncateAddress } from '../utils/format';
import { PageTransition } from '../components/PageTransition';
import { CheckCircle2, AlertCircle, ArrowLeft, Clock, Zap } from 'lucide-react';

export function PaySplit() {
  const [params] = useSearchParams();
  const { connected } = useWallet();
  const { pay, step, loading, error, txId } = usePaySplit();
  const logs = useUIStore((s) => s.logs);

  const creator = params.get('creator') || '';
  const amount = params.get('amount') || '0';
  const salt = params.get('salt') || '';
  const splitId = params.get('split_id') || '';
  const description = params.get('desc') || 'Expense Split';

  const handlePay = () => {
    pay({ creator, amount, salt, splitId: splitId || undefined });
  };

  if (!creator || !amount || !salt) {
    return (
      <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-red-400">Invalid Payment Link</h1>
        <TerminalCard variant="error">
          <div className="py-6 text-center">
            <AlertCircle className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
            <p className="text-xs text-white/40 mb-4">
              Missing required parameters (creator, amount, salt).
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

  return (
    <PageTransition>
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
        >
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/90">Pay Split</h1>
          <p className="text-xs text-white/40 mt-0.5">Send private payment via Aleo</p>
        </div>
      </div>

      {/* Progress */}
      <TerminalProgress currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Payment Info */}
        <div className="lg:col-span-3 space-y-4">
          <TerminalCard title="PAYMENT DETAILS">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Description</span>
                <span className="text-white/80">{description}</span>
              </div>
              <div className="flex justify-between text-xs items-baseline">
                <span className="text-white/40">Amount</span>
                <span className="text-emerald-400 font-semibold font-mono text-lg">{microToCredits(parseInt(amount))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Pay to</span>
                <span className="text-white/80 font-mono">{truncateAddress(creator)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Network</span>
                <span className="text-cyan-400">Aleo Testnet</span>
              </div>
            </div>
          </TerminalCard>

          {!connected ? (
            <Link to="/connect">
              <TerminalButton variant="secondary" className="w-full">CONNECT WALLET FIRST</TerminalButton>
            </Link>
          ) : step === 'success' ? (
            <TerminalCard variant="accent">
              <div className="text-center py-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-medium mb-1">Payment Confirmed</p>
                {txId && (
                  <p className="text-xs text-white/40 mt-1 font-mono">
                    TX: {truncateAddress(txId, 10)}
                  </p>
                )}
                <Link to="/" className="block mt-4">
                  <TerminalButton variant="secondary">
                    <ArrowLeft className="w-3.5 h-3.5" /> BACK TO DASHBOARD
                  </TerminalButton>
                </Link>
              </div>
            </TerminalCard>
          ) : (
            <TerminalButton onClick={handlePay} loading={loading} className="w-full" size="lg">
              <Zap className="w-4 h-4" /> EXECUTE PAYMENT
            </TerminalButton>
          )}

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* Transaction Log */}
        <div className="lg:col-span-2 space-y-4">
          <p className="label-xs">Transaction Log</p>
          <TerminalCard className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="py-6 text-center">
                <Clock className="w-6 h-6 text-white/[0.06] mx-auto mb-2" />
                <p className="text-xs text-white/30">Awaiting execution...</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </TerminalCard>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
