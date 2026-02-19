import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, Lock, Coins, Zap, CheckCircle2, Layers, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { TerminalCard, TerminalButton, LogEntry } from '../components/ui';
import { SplitCard } from '../components/split/SplitCard';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { microToCredits } from '../utils/format';
import { api } from '../services/api';
import { PageTransition, staggerContainer, fadeInUp } from '../components/PageTransition';
import type { Split } from '../types/split';

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display}</>;
}

function getChartData(splits: Split[]) {
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

function HeroVisual() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
      {/* Radial glow behind */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
      />
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '1px solid rgba(52,211,153,0.15)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute inset-6 rounded-full"
        style={{ border: '1px solid rgba(34,211,238,0.10)' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute inset-12 rounded-full"
        style={{ border: '1px solid rgba(167,139,250,0.08)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      {/* Center shield */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
          }}
        >
          <Shield className="w-12 h-12 text-emerald-400" />
        </div>
      </motion.div>
      {/* Orbiting dots */}
      {[0, 120, 240].map((deg) => (
        <motion.div
          key={deg}
          className="absolute"
          style={{ top: '50%', left: '50%', width: 0, height: 0 }}
          animate={{ rotate: [deg, deg + 360] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: 'rgba(52, 211, 153, 0.5)',
              transform: 'translate(-50%, -50%) translateY(-120px)',
              boxShadow: '0 0 8px rgba(52, 211, 153, 0.3)',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { connected, address } = useWallet();
  const localSplits = useSplitStore((s) => s.splits);
  const logs = useUIStore((s) => s.logs);
  const [recentSplits, setRecentSplits] = useState<Split[]>([]);

  const mySplits = localSplits.filter((s) => s.creator === address);
  const activeSplits = mySplits.filter((s) => s.status === 'active');
  const settledSplits = mySplits.filter((s) => s.status === 'settled');
  const totalVolume = mySplits.reduce((sum, s) => sum + s.total_amount, 0);
  const chartData = getChartData(mySplits);

  useEffect(() => {
    api.getRecentSplits().then(setRecentSplits).catch(() => {});
  }, []);

  /* ===== NOT CONNECTED — HERO LANDING ===== */
  if (!connected) {
    return (
      <PageTransition>
        <div className="space-y-16">
          {/* Hero */}
          <motion.div
            className="glass-card-elevated p-8 md:p-14"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="md:flex md:items-center md:gap-12">
              <div className="flex-1 text-center md:text-left">
                {/* Luxury badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-[9px] font-medium tracking-[0.15em] uppercase text-white/30 mb-8">
                  POWERED BY ALEO ZERO-KNOWLEDGE PROOFS
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                  Split Expenses
                </h1>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                  Without Revealing
                </h1>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Anything.
                </h1>

                <p className="text-base md:text-lg text-white/50 max-w-lg leading-relaxed mt-6">
                  Every amount, every participant, every debt — encrypted end-to-end with zero-knowledge proofs. Not even the blockchain can see your data.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mt-8">
                  <Link to="/connect">
                    <TerminalButton size="lg" className="w-full sm:w-auto px-8">
                      Get Started <ArrowRight className="w-4 h-4 ml-1" />
                    </TerminalButton>
                  </Link>
                  <Link to="/privacy">
                    <TerminalButton size="lg" variant="secondary" className="w-full sm:w-auto px-8">
                      See How It Works
                    </TerminalButton>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block shrink-0">
                <HeroVisual />
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Shield, label: 'Zero-Knowledge Proofs' },
              { icon: Lock, label: 'On-Chain Privacy' },
              { icon: Coins, label: 'Real Credits' },
            ].map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <item.icon className="w-3.5 h-3.5 text-emerald-400/70" />
                <span className="text-[11px] text-white/40 font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* How it works */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              { num: '01', title: 'CREATE A SPLIT', desc: 'Set the total amount and number of participants. Everything stays encrypted in Aleo records.', borderColor: 'rgba(52, 211, 153, 0.3)' },
              { num: '02', title: 'ISSUE DEBTS', desc: 'Send Debt records to participants. Zero on-chain trace \u2014 no finalize block, no public data.', borderColor: 'rgba(34, 211, 238, 0.3)' },
              { num: '03', title: 'PAY & SETTLE', desc: 'Participants pay via private transfer. Both parties get encrypted receipts as proof.', borderColor: 'rgba(167, 139, 250, 0.3)' },
            ].map((step) => (
              <motion.div key={step.num} variants={fadeInUp}>
                <div
                  className="glass-card p-5 relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${step.borderColor}` }}
                >
                  {/* Watermark number */}
                  <span className="absolute top-3 right-4 text-6xl font-bold text-white/[0.03] select-none">{step.num}</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">{step.title}</p>
                  <p className="text-[13px] text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Privacy stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TerminalCard variant="accent">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { label: 'AMOUNTS ON-CHAIN', value: '0' },
                  { label: 'ADDRESSES ON-CHAIN', value: '0' },
                  { label: 'DEBTS VISIBLE', value: '0' },
                  { label: 'PAYMENTS TRACEABLE', value: '0' },
                ].map((item, i) => (
                  <div key={item.label} className={i > 0 ? 'md:border-l md:border-white/[0.05]' : ''}>
                    <p className="text-5xl md:text-6xl font-bold text-emerald-400/80 mb-1">{item.value}</p>
                    <p className="text-[10px] text-white/30 tracking-[0.1em] font-medium uppercase">{item.label}</p>
                  </div>
                ))}
              </div>
            </TerminalCard>
          </motion.div>

          {recentSplits.length > 0 && (
            <div className="space-y-4">
              <p className="label-xs">Recent Network Activity</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentSplits.slice(0, 4).map((split) => (
                  <SplitCard key={split.split_id} split={split} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  /* ===== CONNECTED — OPERATIONAL DASHBOARD ===== */
  const STATS = [
    { label: 'Active Splits', value: activeSplits.length, icon: Zap, accentLine: 'accent-line-cyan', glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]', iconBg: 'rgba(34, 211, 238, 0.10)', iconBorder: 'rgba(34, 211, 238, 0.20)', iconColor: 'text-cyan-400', valueColor: 'text-cyan-400' },
    { label: 'Settled', value: settledSplits.length, icon: CheckCircle2, accentLine: 'accent-line-green', glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.08)]', iconBg: 'rgba(52, 211, 153, 0.10)', iconBorder: 'rgba(52, 211, 153, 0.20)', iconColor: 'text-emerald-400', valueColor: 'text-emerald-400' },
    { label: 'Total Splits', value: mySplits.length, icon: Layers, accentLine: 'accent-line-purple', glow: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.08)]', iconBg: 'rgba(167, 139, 250, 0.10)', iconBorder: 'rgba(167, 139, 250, 0.20)', iconColor: 'text-purple-400', valueColor: 'text-purple-400' },
    { label: 'Volume', value: -1, display: microToCredits(totalVolume), icon: TrendingUp, accentLine: 'accent-line-amber', glow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.08)]', iconBg: 'rgba(251, 191, 36, 0.10)', iconBorder: 'rgba(251, 191, 36, 0.20)', iconColor: 'text-amber-400', valueColor: 'text-amber-400' },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {address && (
              <span className="text-[10px] font-mono text-white/30 px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {address.slice(0, 8)}...{address.slice(-6)}
              </span>
            )}
          </div>
          <Link to="/create">
            <TerminalButton>NEW SPLIT</TerminalButton>
          </Link>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp}>
              <div className={`glass-card p-5 transition-all duration-300 ${stat.accentLine} ${stat.glow}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: stat.iconBg, border: `1px solid ${stat.iconBorder}` }}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${stat.valueColor}`}>
                  {stat.value === -1 ? stat.display : <AnimatedCounter value={stat.value} />}
                </p>
                <p className="text-[10px] text-white/30 tracking-[0.1em] uppercase font-medium mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart */}
        <TerminalCard variant="elevated">
          <p className="text-[10px] text-white/30 tracking-[0.12em] uppercase font-medium mb-4">Activity</p>
          <div className="h-44">
            {chartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13, 13, 20, 0.95)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      borderRadius: 12,
                      fontSize: 11,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      borderLeft: '3px solid rgba(52, 211, 153, 0.5)',
                    }}
                    labelStyle={{ color: '#e8e8f0', fontFamily: 'JetBrains Mono' }}
                    itemStyle={{ color: '#34d399' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.count > 0 ? '#34d399' : 'rgba(255,255,255,0.03)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Layers className="w-10 h-10 text-white/[0.06] mx-auto mb-3" />
                  <p className="text-xs text-white/20">Create your first split to see activity</p>
                </div>
              </div>
            )}
          </div>
        </TerminalCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Splits */}
          <div className="space-y-4">
            <p className="label-xs">Active</p>
            {activeSplits.length === 0 ? (
              <TerminalCard>
                <div className="py-8 text-center">
                  <Layers className="w-12 h-12 text-white/[0.06] mx-auto mb-3" />
                  <p className="text-sm text-white/60 font-medium mb-1">Nothing here yet</p>
                  <p className="text-xs text-white/30 mb-4">
                    Create your first split to start splitting expenses privately.
                  </p>
                  <Link to="/create">
                    <TerminalButton variant="secondary">CREATE SPLIT</TerminalButton>
                  </Link>
                </div>
              </TerminalCard>
            ) : (
              <div className="space-y-3">
                {activeSplits.map((split) => <SplitCard key={split.split_id} split={split} />)}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="space-y-4">
            <p className="label-xs">Log</p>
            <TerminalCard className="max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="py-8 text-center">
                  <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Clock className="w-8 h-8 text-white/[0.08] mx-auto mb-2" />
                  </motion.div>
                  <p className="text-xs text-white/20">Standing by...</p>
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

        {recentSplits.length > 0 && (
          <div className="space-y-4">
            <p className="label-xs">Recent Network Activity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentSplits.slice(0, 4).map((split) => (
                <SplitCard key={split.split_id} split={split} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
