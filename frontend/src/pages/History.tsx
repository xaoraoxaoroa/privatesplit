import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton } from '../components/ui';
import { SplitCard } from '../components/split/SplitCard';
import { useSplitStore } from '../store/splitStore';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Layers, Plus } from 'lucide-react';

type Filter = 'all' | 'active' | 'settled';

export function History() {
  const { address, connected } = useWallet();
  const splits = useSplitStore((s) => s.splits);
  const [filter, setFilter] = useState<Filter>('all');

  const mySplits = splits.filter((s) => s.creator === address);
  const filtered = filter === 'all' ? mySplits : mySplits.filter((s) => s.status === filter);

  if (!connected) {
    return (
      <PageTransition>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-white/90">My Splits</h1>
        <TerminalCard>
          <div className="py-8 text-center">
            <Layers className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
            <p className="text-sm text-white/80 mb-2">Wallet Required</p>
            <p className="text-xs text-white/40 mb-4">Connect wallet to view your split history</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/90">My Splits</h1>
          <p className="text-xs text-white/40 mt-1">{mySplits.length} total splits</p>
        </div>
        {/* Segmented filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {(['all', 'active', 'settled'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all ${
                filter === f
                  ? 'text-emerald-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
              style={filter === f ? { background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' } : { border: '1px solid transparent' }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <TerminalCard>
          <div className="py-8 text-center">
            <Layers className="w-12 h-12 text-white/[0.06] mx-auto mb-3" />
            <p className="text-sm text-white/80 mb-2">
              No {filter === 'all' ? '' : filter + ' '}splits found
            </p>
            <p className="text-xs text-white/40 mb-4">
              Create your first split to get started.
            </p>
            <Link to="/create">
              <TerminalButton variant="primary" className="w-full">
                <Plus className="w-3.5 h-3.5" /> CREATE A SPLIT
              </TerminalButton>
            </Link>
          </div>
        </TerminalCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((split) => (
            <SplitCard key={split.split_id} split={split} />
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
}
