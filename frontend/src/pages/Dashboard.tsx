import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalButton, TerminalBadge, LogEntry } from '../components/ui';
import { SplitCard } from '../components/split/SplitCard';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { microToCredits } from '../utils/format';
import { STATUS_SYMBOLS } from '../design-system/tokens';
import { api } from '../services/api';
import type { Split } from '../types/split';

export function Dashboard() {
  const { connected, address } = useWallet();
  const localSplits = useSplitStore((s) => s.splits);
  const logs = useUIStore((s) => s.logs);
  const [recentSplits, setRecentSplits] = useState<Split[]>([]);

  const mySplits = localSplits.filter((s) => s.creator === address);
  const activeSplits = mySplits.filter((s) => s.status === 'active');
  const settledSplits = mySplits.filter((s) => s.status === 'settled');
  const totalVolume = mySplits.reduce((sum, s) => sum + s.total_amount, 0);

  useEffect(() => {
    api.getRecentSplits().then(setRecentSplits).catch(() => {});
  }, []);

  // Hero for unauthenticated users
  if (!connected) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Hero */}
        <div className="border border-terminal-border bg-terminal-surface p-8 md:p-12 text-center glow-green">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient cursor-blink mb-3">
            PRIVATESPLIT
          </h1>
          <p className="text-sm text-terminal-text mb-1">
            Split bills privately on Aleo.
          </p>
          <p className="text-xs text-terminal-dim max-w-md mx-auto mb-6">
            Your share amounts, participants, and payments stay encrypted using zero-knowledge proofs.
            Only you see your records.
          </p>
          <Link to="/connect">
            <TerminalButton className="px-8">CONNECT WALLET TO START</TerminalButton>
          </Link>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TerminalCard variant="stat" className="stagger-1">
            <p className="text-terminal-green text-lg font-bold mb-1">01</p>
            <p className="text-xs text-terminal-text mb-1">CREATE A SPLIT</p>
            <p className="text-[10px] text-terminal-dim">Set the total amount and number of participants. Everything stays encrypted.</p>
          </TerminalCard>
          <TerminalCard variant="stat" className="stagger-2">
            <p className="text-terminal-green text-lg font-bold mb-1">02</p>
            <p className="text-xs text-terminal-text mb-1">ISSUE DEBTS</p>
            <p className="text-[10px] text-terminal-dim">Send Debt records to participants. Zero on-chain trace — no finalize block.</p>
          </TerminalCard>
          <TerminalCard variant="stat" className="stagger-3">
            <p className="text-terminal-green text-lg font-bold mb-1">03</p>
            <p className="text-xs text-terminal-text mb-1">PAY & SETTLE</p>
            <p className="text-[10px] text-terminal-dim">Participants pay via private transfer. Both parties get encrypted receipts.</p>
          </TerminalCard>
        </div>

        {/* Privacy banner */}
        <TerminalCard variant="accent">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-terminal-green">0</p>
              <p className="text-[10px] text-terminal-dim tracking-widest">AMOUNTS ON-CHAIN</p>
            </div>
            <div>
              <p className="text-xl font-bold text-terminal-green">0</p>
              <p className="text-[10px] text-terminal-dim tracking-widest">ADDRESSES ON-CHAIN</p>
            </div>
            <div>
              <p className="text-xl font-bold text-terminal-green">0</p>
              <p className="text-[10px] text-terminal-dim tracking-widest">DEBTS VISIBLE</p>
            </div>
            <div>
              <p className="text-xl font-bold text-terminal-green">0</p>
              <p className="text-[10px] text-terminal-dim tracking-widest">PAYMENTS TRACEABLE</p>
            </div>
          </div>
        </TerminalCard>

        {/* Recent Network Activity */}
        {recentSplits.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs text-terminal-dim tracking-widest uppercase">Recent Network Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentSplits.slice(0, 4).map((split) => (
                <SplitCard key={split.split_id} split={split} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gradient cursor-blink">DASHBOARD</h1>
        <Link to="/create">
          <TerminalButton>NEW SPLIT</TerminalButton>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TerminalCard variant="stat" className="stagger-1">
          <p className="text-[10px] text-terminal-dim tracking-widest">ACTIVE</p>
          <p className="text-2xl text-terminal-green font-bold mt-1">{activeSplits.length}</p>
        </TerminalCard>
        <TerminalCard variant="stat" className="stagger-2">
          <p className="text-[10px] text-terminal-dim tracking-widest">SETTLED</p>
          <p className="text-2xl text-terminal-cyan font-bold mt-1">{settledSplits.length}</p>
        </TerminalCard>
        <TerminalCard variant="stat" className="stagger-3">
          <p className="text-[10px] text-terminal-dim tracking-widest">TOTAL</p>
          <p className="text-2xl text-terminal-text font-bold mt-1">{mySplits.length}</p>
        </TerminalCard>
        <TerminalCard variant="stat" className="stagger-4">
          <p className="text-[10px] text-terminal-dim tracking-widest">VOLUME</p>
          <p className="text-2xl text-terminal-amber font-bold mt-1">{microToCredits(totalVolume)}</p>
        </TerminalCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Splits */}
        <div className="space-y-3">
          <h2 className="text-xs text-terminal-dim tracking-widest uppercase">Active Splits</h2>
          {activeSplits.length === 0 ? (
            <TerminalCard className="border-accent-left">
              <p className="text-sm text-terminal-text mb-2">
                {STATUS_SYMBOLS.prompt} No active splits yet
              </p>
              <p className="text-xs text-terminal-dim mb-3">
                Create your first split to start splitting expenses privately.
              </p>
              <Link to="/create">
                <TerminalButton variant="primary" className="w-full">CREATE YOUR FIRST SPLIT</TerminalButton>
              </Link>
            </TerminalCard>
          ) : (
            activeSplits.map((split) => <SplitCard key={split.split_id} split={split} />)
          )}
        </div>

        {/* Activity Log */}
        <div className="space-y-3">
          <h2 className="text-xs text-terminal-dim tracking-widest uppercase">Activity Log</h2>
          <TerminalCard className="max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-terminal-dim py-4 text-center">
                {STATUS_SYMBOLS.pending} Waiting for activity...
              </p>
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

      {/* Recent Network Activity */}
      {recentSplits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs text-terminal-dim tracking-widest uppercase">Recent Network Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentSplits.slice(0, 4).map((split) => (
              <SplitCard key={split.split_id} split={split} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
