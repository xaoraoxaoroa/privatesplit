import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, LogEntry } from '../components/ui';
import { SplitForm } from '../components/split/SplitForm';
import { useCreateSplit } from '../hooks/useCreateSplit';
import { useUIStore } from '../store/splitStore';
import { PageTransition } from '../components/PageTransition';
import { Layers, Clock, AlertCircle } from 'lucide-react';

export function CreateSplit() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { createSplit, loading, error } = useCreateSplit();
  const logs = useUIStore((s) => s.logs);

  const handleSubmit = async (data: {
    description: string;
    amount: string;
    participantCount: number;
    participants: string[];
  }) => {
    const split = await createSplit(data);
    if (split && split.split_id && split.split_id !== 'null' && !split.split_id.startsWith('pending_')) {
      setTimeout(() => navigate(`/split/${split.split_id}`), 1500);
    } else if (split) {
      setTimeout(() => navigate('/'), 1500);
    }
  };

  if (!connected) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-xl font-bold text-white/90">Create Split</h1>
          <TerminalCard>
            <div className="py-8 text-center">
              <Layers className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
              <p className="text-sm text-white/80 mb-2">Wallet Required</p>
              <p className="text-xs text-white/40 mb-4">Connect your Shield Wallet to create a private expense split.</p>
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
        <div>
          <h1 className="text-xl font-bold text-white/90">Create Split</h1>
          <p className="text-xs text-white/40 mt-1">All data is encrypted in Aleo records</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <SplitForm onSubmit={handleSubmit} loading={loading} />
            {error && (
              <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            )}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <p className="label-xs">Transaction Log</p>
            <TerminalCard className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock className="w-6 h-6 text-white/[0.06] mx-auto mb-2" />
                  <p className="text-xs text-white/30">Ready to execute...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((entry) => <LogEntry key={entry.id} entry={entry} />)}
                </div>
              )}
            </TerminalCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
