import { useState, useEffect } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TerminalCard, TerminalButton, TerminalBadge, CategoryIcon } from '../components/ui';
import { SplitCard } from '../components/split/SplitCard';
import { useSplitStore } from '../store/splitStore';
import { microToCredits, truncateAddress } from '../utils/format';
import { api } from '../services/api';
import { PageTransition, staggerContainer, fadeInUp } from '../components/PageTransition';
import { CATEGORY_META } from '../types/split';
import type { Split, SplitCategory } from '../types/split';
import {
  Layers, Plus, TrendingUp, CheckCircle2, Zap, Users, PieChart as PieChartIcon,
  Download, ArrowRight, Clock, Wallet, Tag,
} from 'lucide-react';

type Filter = 'all' | 'active' | 'settled';

function getCategoryStats(splits: Split[]) {
  const stats: Record<string, { count: number; volume: number }> = {};
  for (const s of splits) {
    const cat = s.category || 'other';
    if (!stats[cat]) stats[cat] = { count: 0, volume: 0 };
    stats[cat].count++;
    stats[cat].volume += s.total_amount;
  }
  return Object.entries(stats)
    .map(([key, val]) => ({
      name: CATEGORY_META[key as SplitCategory]?.label || key,
      icon: CATEGORY_META[key as SplitCategory]?.icon || 'FileText',
      color: CATEGORY_META[key as SplitCategory]?.color || '#64748b',
      ...val,
    }))
    .sort((a, b) => b.volume - a.volume);
}

function getActivityChart(splits: Split[]) {
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    days[key] = 0;
  }
  for (const s of splits) {
    const d = new Date(s.created_at);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (key in days) days[key]++;
  }
  return Object.entries(days).map(([date, count]) => ({ date, count }));
}

export function MySplits() {
  const { address, connected } = useWallet();
  const localSplits = useSplitStore((s) => s.splits);
  const [backendSplits, setBackendSplits] = useState<Split[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  // Load backend splits for this creator
  useEffect(() => {
    if (address) {
      api.getSplitsByCreator(address)
        .then(setBackendSplits)
        .catch(() => {});
    }
  }, [address]);

  // Merge local + backend splits (deduplicate by split_id)
  const allSplits = (() => {
    const seen = new Set<string>();
    const merged: Split[] = [];
    for (const s of localSplits) {
      if (s.creator === address || s.participants?.some((p) => p.address === address)) {
        if (!seen.has(s.split_id)) {
          seen.add(s.split_id);
          merged.push(s);
        }
      }
    }
    for (const s of backendSplits) {
      if (!seen.has(s.split_id)) {
        seen.add(s.split_id);
        merged.push(s);
      }
    }
    return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  })();

  const filtered = allSplits
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => catFilter === 'all' || (s.category || 'other') === catFilter);

  const activeSplits = allSplits.filter((s) => s.status === 'active');
  const settledSplits = allSplits.filter((s) => s.status === 'settled');
  const totalVolume = allSplits.reduce((sum, s) => sum + s.total_amount, 0);
  const totalPayments = allSplits.reduce((sum, s) => sum + (s.payment_count || 0), 0);
  const categoryStats = getCategoryStats(allSplits);
  const chartData = getActivityChart(allSplits);
  const hasChartActivity = chartData.some((d) => d.count > 0);

  // Unique categories in user's splits for filter
  const userCategories = [...new Set(allSplits.map((s) => s.category || 'other'))];

  if (!connected) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-xl font-bold text-white/90">My Splits</h1>
          <TerminalCard>
            <div className="py-8 text-center">
              <Wallet className="w-8 h-8 text-white/[0.06] mx-auto mb-3" />
              <p className="text-sm text-white/80 mb-2">Wallet Required</p>
              <p className="text-xs text-white/40 mb-4">Connect your Shield Wallet to view your splits</p>
              <Link to="/connect">
                <TerminalButton variant="secondary" className="w-full">CONNECT WALLET</TerminalButton>
              </Link>
            </div>
          </TerminalCard>
        </div>
      </PageTransition>
    );
  }

  const STATS = [
    { label: 'Active', value: activeSplits.length, icon: Zap, color: 'text-cyan-400', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.20)' },
    { label: 'Settled', value: settledSplits.length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.20)' },
    { label: 'Total Volume', value: -1, display: `${microToCredits(totalVolume)} cr`, icon: TrendingUp, color: 'text-amber-400', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)' },
    { label: 'Payments', value: totalPayments, icon: Users, color: 'text-purple-400', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.20)' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white/90">My Splits</h1>
            <p className="text-xs text-white/40 mt-1">
              {allSplits.length} total splits &middot; {truncateAddress(address || '')}
            </p>
          </div>
          <Link to="/create">
            <TerminalButton>
              <Plus className="w-3.5 h-3.5" /> NEW SPLIT
            </TerminalButton>
          </Link>
        </div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {STATS.map((stat) => (
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
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value === -1 ? stat.display : stat.value}
                </p>
                <p className="text-[10px] text-white/30 tracking-[0.1em] uppercase font-medium mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Activity Chart + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Activity Chart */}
          <TerminalCard variant="elevated" className="lg:col-span-3">
            <p className="text-[10px] text-white/30 tracking-[0.12em] uppercase font-medium mb-3">
              <TrendingUp className="w-3 h-3 inline mr-1" />My Activity (10 days)
            </p>
            <div className="h-36">
              {hasChartActivity ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(13,13,20,0.95)',
                        border: '1px solid rgba(52,211,153,0.2)',
                        borderRadius: 12,
                        fontSize: 11,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      }}
                      labelStyle={{ color: '#e8e8f0', fontFamily: 'JetBrains Mono' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={28}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.count > 0 ? '#34d399' : 'rgba(255,255,255,0.03)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-white/20">Create splits to see your activity chart</p>
                </div>
              )}
            </div>
          </TerminalCard>

          {/* Category Breakdown */}
          <TerminalCard variant="elevated" className="lg:col-span-2">
            <p className="text-[10px] text-white/30 tracking-[0.12em] uppercase font-medium mb-3">
              <PieChartIcon className="w-3 h-3 inline mr-1" />Categories
            </p>
            {categoryStats.length > 0 ? (
              <div className="space-y-2">
                {categoryStats.map((cat) => (
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
                            width: `${Math.round((cat.volume / Math.max(totalVolume, 1)) * 100)}%`,
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
                <Tag className="w-6 h-6 text-white/[0.06] mx-auto mb-2" />
                <p className="text-xs text-white/20">No category data yet</p>
              </div>
            )}
          </TerminalCard>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status filter */}
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
                style={filter === f ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' } : { border: '1px solid transparent' }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {userCategories.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCatFilter('all')}
                className={`px-2 py-1 text-[10px] font-medium rounded-lg transition-all ${
                  catFilter === 'all' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-white/40 border border-white/[0.06]'
                }`}
              >
                All
              </button>
              {userCategories.map((cat) => {
                const meta = CATEGORY_META[cat as SplitCategory];
                return (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    className={`px-2 py-1 text-[10px] font-medium rounded-lg transition-all ${
                      catFilter === cat ? 'border' : 'text-white/40 border border-white/[0.06]'
                    }`}
                    style={catFilter === cat ? { color: meta?.color, background: `${meta?.color}15`, borderColor: `${meta?.color}40` } : undefined}
                  >
                    {meta && <CategoryIcon name={meta.icon} className="w-3 h-3 inline" />} {meta?.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Split List */}
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
              <SplitCard key={split.split_id} split={split} showCategory />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
