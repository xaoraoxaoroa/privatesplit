import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TerminalCard, TerminalInput, TerminalButton, TerminalBadge, CategoryIcon } from '../components/ui';
import { SplitCard } from '../components/split/SplitCard';
import { getSplitStatus, getSplitIdFromMapping } from '../utils/aleo-utils';
import { PROGRAM_ID, TESTNET_API } from '../utils/constants';
import { api } from '../services/api';
import type { NetworkStats } from '../services/api';
import type { Split, SplitCategory } from '../types/split';
import { CATEGORY_META } from '../types/split';
import { microToCredits } from '../utils/format';
import { PageTransition, staggerContainer, fadeInUp } from '../components/PageTransition';
import {
  Search, Database, ExternalLink, AlertCircle, CheckCircle2, Clock, Shield, Hash, ArrowRight,
  TrendingUp, Zap, Users, PieChart as PieChartIcon, Activity, Layers,
} from 'lucide-react';

interface SplitResult {
  split_id: string;
  participant_count: number;
  payment_count: number;
  status: number;
}

interface TxResult {
  id: string;
  type: string;
  status: string;
}

const PLACEHOLDERS = [
  'Search by split ID...',
  'Search by salt value...',
  'Search by transaction hash...',
];

interface SearchHistoryItem {
  id: number;
  type: 'split' | 'tx';
  query: string;
  result: SplitResult | TxResult;
  timestamp: number;
}

const ITEMS_PER_PAGE = 5;

export function Explorer() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'split_id' | 'salt' | 'tx'>('split_id');
  const [loading, setLoading] = useState(false);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [recentSplits, setRecentSplits] = useState<Split[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch network stats and recent splits
  useEffect(() => {
    setStatsLoading(true);
    Promise.all([
      api.getStats().catch(() => null),
      api.getRecentSplits().catch(() => []),
    ]).then(([stats, recent]) => {
      setNetworkStats(stats);
      setRecentSplits(recent);
    }).finally(() => setStatsLoading(false));
  }, []);

  const categoryChartData = networkStats
    ? Object.entries(networkStats.categories || {}).map(([key, val]) => ({
        name: CATEGORY_META[key as SplitCategory]?.label || key,
        icon: CATEGORY_META[key as SplitCategory]?.icon || 'FileText',
        color: CATEGORY_META[key as SplitCategory]?.color || '#64748b',
        count: val.count,
        volume: val.volume,
      })).sort((a, b) => b.volume - a.volume)
    : [];

  const activityData = networkStats?.daily_activity || [];
  const hasActivity = activityData.some((d) => d.count > 0);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSplitResult(null);
    setTxResult(null);

    try {
      if (searchType === 'salt') {
        const splitId = await getSplitIdFromMapping(query.trim());
        if (!splitId) { setError('No split found for this salt'); return; }
        const status = await getSplitStatus(splitId);
        if (status) {
          const result = { split_id: splitId, ...status };
          setSplitResult(result);
          setSearchHistory((prev) => [{ id: Date.now(), type: 'split', query: query.trim(), result, timestamp: Date.now() }, ...prev]);
        }
        else { setError('Split found but status unavailable'); }
      } else if (searchType === 'split_id') {
        const status = await getSplitStatus(query.trim());
        if (status) {
          const result = { split_id: query.trim(), ...status };
          setSplitResult(result);
          setSearchHistory((prev) => [{ id: Date.now(), type: 'split', query: query.trim(), result, timestamp: Date.now() }, ...prev]);
        }
        else { setError('Split not found on-chain'); }
      } else if (searchType === 'tx') {
        const res = await fetch(`${TESTNET_API}/transaction/${query.trim()}`);
        if (!res.ok) { setError('Transaction not found'); return; }
        const data = await res.json();
        const result = { id: data.id || query.trim(), type: data.type || 'unknown', status: data.status || 'confirmed' };
        setTxResult(result);
        setSearchHistory((prev) => [{ id: Date.now(), type: 'tx', query: query.trim(), result, timestamp: Date.now() }, ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const searchTypes = [
    { key: 'split_id' as const, label: 'Split ID', icon: Database },
    { key: 'salt' as const, label: 'Salt', icon: Hash },
    { key: 'tx' as const, label: 'TX Hash', icon: ArrowRight },
  ];

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)' }}
          >
            <Search className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white/90">Explorer</h1>
            <p className="text-xs text-white/40 mt-0.5">Verify splits and transactions on-chain</p>
          </div>
        </div>

        {/* Network Stats */}
        {networkStats && (
          <>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[
                { label: 'Total Splits', value: networkStats.total_splits, icon: Layers, color: 'text-cyan-400', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.20)' },
                { label: 'Active', value: networkStats.active, icon: Zap, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.20)' },
                { label: 'Total Volume', value: microToCredits(networkStats.total_volume) + ' cr', icon: TrendingUp, color: 'text-amber-400', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)' },
                { label: 'Participants', value: networkStats.total_participants, icon: Users, color: 'text-purple-400', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.20)' },
              ].map((stat) => (
                <motion.div key={stat.label} variants={fadeInUp}>
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
                      >
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-white/30 tracking-[0.1em] uppercase font-medium mt-0.5">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Activity Chart + Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <TerminalCard variant="elevated" className="lg:col-span-3">
                <p className="text-[10px] text-white/30 tracking-[0.12em] uppercase font-medium mb-3">
                  <Activity className="w-3 h-3 inline mr-1" />Network Activity (10 days)
                </p>
                <div className="h-36">
                  {hasActivity ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(13,13,20,0.95)',
                            border: '1px solid rgba(34,211,238,0.2)',
                            borderRadius: 12,
                            fontSize: 11,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          }}
                          labelStyle={{ color: '#e8e8f0', fontFamily: 'JetBrains Mono' }}
                          itemStyle={{ color: '#22d3ee' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={28}>
                          {activityData.map((entry, i) => (
                            <Cell key={i} fill={entry.count > 0 ? '#22d3ee' : 'rgba(255,255,255,0.03)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-white/20">No network activity yet</p>
                    </div>
                  )}
                </div>
              </TerminalCard>

              <TerminalCard variant="elevated" className="lg:col-span-2">
                <p className="text-[10px] text-white/30 tracking-[0.12em] uppercase font-medium mb-3">
                  <PieChartIcon className="w-3 h-3 inline mr-1" />Categories
                </p>
                {categoryChartData.length > 0 ? (
                  <div className="space-y-2">
                    {categoryChartData.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <CategoryIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/70">{cat.name}</span>
                            <span className="text-white/40 font-mono">{cat.count}</span>
                          </div>
                          <div className="w-full h-1 bg-white/[0.04] rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round((cat.volume / Math.max(networkStats.total_volume, 1)) * 100)}%`,
                                background: cat.color,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-white/30 font-mono">{microToCredits(cat.volume)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-white/20">No category data yet</p>
                  </div>
                )}
              </TerminalCard>
            </div>
          </>
        )}

        {/* Recent Splits */}
        {recentSplits.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] text-white/30 tracking-[0.12em] uppercase font-medium">
              <Clock className="w-3 h-3 inline mr-1" />Recent Network Splits
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentSplits.slice(0, 4).map((split) => (
                <SplitCard key={split.split_id} split={split} showCategory />
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <TerminalCard variant="elevated">
          <div className="space-y-4">
            {/* Segmented Type Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {searchTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setSearchType(t.key); setSplitResult(null); setTxResult(null); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium tracking-wide rounded-lg transition-all ${
                    searchType === t.key
                      ? 'text-emerald-400 shadow-sm'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                  style={searchType === t.key ? { background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' } : { border: '1px solid transparent' }}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={placeholderIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TerminalInput
                      placeholder={PLACEHOLDERS[placeholderIdx]}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="!h-14 !text-sm !rounded-xl"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <TerminalButton onClick={handleSearch} loading={loading} size="lg" className="!h-14">
                <Search className="w-4 h-4" /> SEARCH
              </TerminalButton>
            </div>
          </div>
        </TerminalCard>

        {/* Quick Lookup */}
        <AnimatePresence>
          {!splitResult && !txResult && !error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TerminalCard variant="subtle">
                <p className="label-xs mb-3">Quick Lookup</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setQuery('1904758949858929157912240259749859140762221531679669196161601694830550064831field'); setSearchType('split_id'); }}
                    className="px-3 py-1.5 text-[10px] font-mono rounded-lg transition-all inline-flex items-center gap-1.5"
                    style={{ background: 'rgba(34, 211, 238, 0.05)', border: '1px solid rgba(34, 211, 238, 0.2)', color: 'rgb(34, 211, 238)' }}
                  >
                    <Database className="w-3 h-3" />Split ID
                  </button>
                  <button
                    onClick={() => { setQuery('987654321098765field'); setSearchType('salt'); }}
                    className="px-3 py-1.5 text-[10px] font-mono rounded-lg transition-all inline-flex items-center gap-1.5"
                    style={{ background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)', color: 'rgb(167, 139, 250)' }}
                  >
                    <Hash className="w-3 h-3" />Salt
                  </button>
                  <button
                    onClick={() => { setQuery('at1ue3v4t5u9rsmf7h7jnee8dhr6dguda59lrct68j3d4rjhm395vqqhjwcxv'); setSearchType('tx'); }}
                    className="px-3 py-1.5 text-[10px] font-mono rounded-lg transition-all inline-flex items-center gap-1.5"
                    style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', color: 'rgb(251, 191, 36)' }}
                  >
                    <ArrowRight className="w-3 h-3" />TX Hash
                  </button>
                </div>
              </TerminalCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <TerminalCard variant="error">
              <p className="text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            </TerminalCard>
          </motion.div>
        )}

        {/* Split Result */}
        {splitResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <TerminalCard variant="accent">
              <div className="space-y-4">
                {/* Verified badge */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(52, 211, 153, 0.1)' }}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-emerald-400">Verified On-Chain</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Split ID</span>
                    <span className="text-white/90 break-all text-right max-w-[60%] font-mono text-[11px]">{splitResult.split_id}</span>
                  </div>
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-white/40">Status</span>
                    <TerminalBadge status={splitResult.status === 1 ? 'settled' : 'active'} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Participants</span>
                    <span className="text-white/90">{splitResult.participant_count}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Payments</span>
                    <span className="text-emerald-400 font-mono">{splitResult.payment_count} / {splitResult.participant_count - 1}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((splitResult.payment_count / Math.max(splitResult.participant_count - 1, 1)) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4">
                  <p className="label-xs mb-2">Verification Checks</p>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Split exists on-chain</p>
                    <p className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Data from mapping: {PROGRAM_ID}/splits</p>
                    <p className={`flex items-center gap-2 ${splitResult.status === 1 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {splitResult.status === 1 ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
                      {splitResult.status === 1 ? 'Split is settled (final)' : 'Split is active (accepting payments)'}
                    </p>
                  </div>
                </div>
              </div>
            </TerminalCard>
          </motion.div>
        )}

        {/* Transaction Result */}
        {txResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <TerminalCard variant="accent">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(52, 211, 153, 0.1)' }}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-emerald-400">Transaction Found</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Transaction ID</span>
                  <a href={`https://testnet.explorer.provable.com/transaction/${txResult.id}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-emerald-400 break-all text-right max-w-[60%] font-mono transition-colors inline-flex items-center gap-1">
                    {txResult.id} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Type</span>
                  <span className="text-white/90">{txResult.type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Status</span>
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {txResult.status}
                  </span>
                </div>
              </div>
            </TerminalCard>
          </motion.div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="label-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Search History ({searchHistory.length})
              </h2>
              {searchHistory.length > ITEMS_PER_PAGE && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={historyPage === 0}
                    className="px-2 py-1 text-[10px] font-medium rounded border border-white/[0.06] text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    PREV
                  </button>
                  <span className="text-[10px] text-white/40">
                    {historyPage + 1}/{Math.ceil(searchHistory.length / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(Math.ceil(searchHistory.length / ITEMS_PER_PAGE) - 1, p + 1))}
                    disabled={historyPage >= Math.ceil(searchHistory.length / ITEMS_PER_PAGE) - 1}
                    className="px-2 py-1 text-[10px] font-medium rounded border border-white/[0.06] text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    NEXT
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {searchHistory
                .slice(historyPage * ITEMS_PER_PAGE, (historyPage + 1) * ITEMS_PER_PAGE)
                .map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0"
                      style={item.type === 'split'
                        ? { background: 'rgba(52, 211, 153, 0.1)', color: 'rgb(52, 211, 153)', border: '1px solid rgba(52, 211, 153, 0.2)' }
                        : { background: 'rgba(34, 211, 238, 0.1)', color: 'rgb(34, 211, 238)', border: '1px solid rgba(34, 211, 238, 0.2)' }
                      }
                    >
                      {item.type === 'split' ? 'SPLIT' : 'TX'}
                    </span>
                    <span className="text-xs text-white/80 font-mono truncate">
                      {item.query.length > 30 ? item.query.slice(0, 15) + '...' + item.query.slice(-12) : item.query}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.type === 'split' && (
                      <TerminalBadge status={(item.result as SplitResult).status === 1 ? 'settled' : 'active'} />
                    )}
                    <span className="text-[10px] text-white/30">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Program Info */}
        <TerminalCard title="PROGRAM INFO">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Program</span>
              <span className="text-white/80 font-mono text-[11px]">{PROGRAM_ID}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Network</span>
              <span className="text-cyan-400">Aleo Testnet</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Mappings</span>
              <span className="text-white/80 font-mono text-[11px]">splits, split_salts</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Transitions</span>
              <span className="text-white/80">create_split, issue_debt, pay_debt, settle_split, verify_split</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Records</span>
              <span className="text-white/80">Split, Debt, PayerReceipt, CreatorReceipt</span>
            </div>
            <div className="border-t border-white/[0.06] pt-3 mt-3">
              <a href={`https://testnet.explorer.provable.com/program/${PROGRAM_ID}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5">
                View on Provable Explorer <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </TerminalCard>
      </div>
    </PageTransition>
  );
}
