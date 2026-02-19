import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Shield, Lock, Coins, Zap, CheckCircle2, Layers, TrendingUp,
  ArrowRight, Clock, ExternalLink, Users,
} from 'lucide-react';
import { TerminalCard, TerminalButton, TerminalBadge, LogEntry } from '../components/ui';
import { SplitCard } from '../components/split/SplitCard';
import { useSplitStore, useUIStore } from '../store/splitStore';
import { microToCredits } from '../utils/format';
import { api } from '../services/api';
import { PageTransition, staggerContainer, fadeInUp } from '../components/PageTransition';
import type { Split } from '../types/split';

function AnimatedCounter({ value, duration = 1.5, format }: { value: number; duration?: number; format?: (n: number) => string }) {
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

  return <>{format ? format(display) : display}</>;
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
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '1px solid rgba(52,211,153,0.15)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-6 rounded-full"
        style={{ border: '1px solid rgba(34,211,238,0.10)' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-12 rounded-full"
        style={{ border: '1px solid rgba(167,139,250,0.08)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
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

const activityRowVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.2 } },
};

export function Dashboard() {
  const { connected, address } = useWallet();
  const localSplits = useSplitStore((s) => s.splits);
  const logs = useUIStore((s) => s.logs);
  const [recentSplits, setRecentSplits] = useState<Split[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const mySplits = localSplits.filter((s) => s.creator === address);
  const activeSplits = mySplits.filter((s) => s.status === 'active');
  const settledSplits = mySplits.filter((s) => s.status === 'settled');
  const totalVolume = mySplits.reduce((sum, s) => sum + s.total_amount, 0);
  const chartData = getChartData(mySplits);

  useEffect(() => {
    const controller = new AbortController();
    api.getRecentSplits()
      .then((data) => { if (!controller.signal.aborted) setRecentSplits(data); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoadingRecent(false); });
    return () => controller.abort();
  }, []);

  // Network stats for landing page
  const networkSplitCount = recentSplits.length;
  const networkVolume = recentSplits.reduce((sum, s) => sum + s.total_amount, 0);
  const networkPayments = recentSplits.reduce((sum, s) => sum + (s.payment_count || 0), 0);
  const landingChartData = getChartData(recentSplits);
  const hasLandingChartActivity = landingChartData.some((d) => d.count > 0);

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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-[9px] font-medium tracking-[0.15em] uppercase text-white/30 mb-8">
                  BUILT ON ALEO · ZERO-KNOWLEDGE PROOFS
                </div>

                {/* Mobile hero icon */}
                <div className="md:hidden flex justify-center mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
                  >
                    <Shield className="w-8 h-8 text-emerald-400" />
                  </div>
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
                  Every amount, every participant, every debt — encrypted end-to-end with zero-knowledge proofs. The blockchain verifies your transactions without seeing your data.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mt-8">
                  <Link to="/connect">
                    <TerminalButton size="lg" className="w-full sm:w-auto px-8 btn-shimmer">
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
              { icon: Zap, label: 'Aleo Testnet' },
            ].map((item) => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/[0.06] transition-transform duration-150 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
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
              {
                num: '01',
                title: 'CREATE A SPLIT',
                desc: 'Set the total amount and number of participants. Everything stays encrypted in Aleo records.',
                borderColor: 'rgba(52, 211, 153, 0.3)',
                hoverBorderColor: 'rgba(52, 211, 153, 0.5)',
              },
              {
                num: '02',
                title: 'ISSUE DEBTS',
                desc: 'No finalize block means zero on-chain trace. Even blockchain observers see nothing.',
                borderColor: 'rgba(34, 211, 238, 0.3)',
                hoverBorderColor: 'rgba(34, 211, 238, 0.5)',
              },
              {
                num: '03',
                title: 'PAY & SETTLE',
                desc: 'Participants pay via private transfer. Both parties get encrypted receipts as proof.',
                borderColor: 'rgba(167, 139, 250, 0.3)',
                hoverBorderColor: 'rgba(167, 139, 250, 0.5)',
              },
            ].map((step) => (
              <motion.div key={step.num} variants={fadeInUp}>
                <motion.div
                  className="glass-card p-5 relative overflow-hidden"
                  style={{ borderLeft: '4px solid', borderLeftColor: step.borderColor }}
                  whileHover={{ borderLeftColor: step.hoverBorderColor }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="absolute top-3 right-4 text-6xl font-bold text-white/[0.03] select-none">{step.num}</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">{step.title}</p>
                  <p className="text-[13px] text-white/50 leading-relaxed">{step.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Verified Deployment */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="glass-card py-3 px-5 flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ borderColor: 'rgba(52, 211, 153, 0.15)' }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-emerald-400/80">
                  VERIFIED ON ALEO TESTNET
                </span>
              </div>
              <span className="text-xs font-mono text-white/50">private_split_v2.aleo</span>
              <a
                href="https://testnet.explorer.provable.com/transaction/at1cvwkh4slx2rcx306kuvdw40nz7czkng3kp8yhx3nt2ghdnwxa5zs5n9u5l"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
              >
                View TX <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>

          {/* Protocol Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {/* Row 1: Real protocol numbers */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Splits Created',
                  value: networkSplitCount,
                  formatFn: undefined,
                  suffix: '',
                  icon: Layers,
                  iconBg: 'rgba(34, 211, 238, 0.10)',
                  iconBorder: 'rgba(34, 211, 238, 0.20)',
                  iconColor: 'text-cyan-400',
                  valueColor: 'text-cyan-400',
                },
                {
                  label: 'Total Volume',
                  value: networkVolume,
                  formatFn: microToCredits,
                  suffix: ' credits',
                  icon: TrendingUp,
                  iconBg: 'rgba(52, 211, 153, 0.10)',
                  iconBorder: 'rgba(52, 211, 153, 0.20)',
                  iconColor: 'text-emerald-400',
                  valueColor: 'text-emerald-400',
                },
                {
                  label: 'Payments Made',
                  value: networkPayments,
                  formatFn: undefined,
                  suffix: '',
                  icon: CheckCircle2,
                  iconBg: 'rgba(167, 139, 250, 0.10)',
                  iconBorder: 'rgba(167, 139, 250, 0.20)',
                  iconColor: 'text-purple-400',
                  valueColor: 'text-purple-400',
                },
              ].map((stat) => (
                <div key={stat.label} className="glass-card-elevated p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: stat.iconBg, border: `1px solid ${stat.iconBorder}` }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </motion.div>
                  </div>
                  <p className={`text-lg md:text-2xl font-bold ${stat.valueColor}`}>
                    {stat.formatFn
                      ? <AnimatedCounter value={stat.value} format={stat.formatFn} />
                      : <AnimatedCounter value={stat.value} />
                    }
                    {stat.suffix && <span className="text-xs text-white/30 ml-1">{stat.suffix}</span>}
                  </p>
                  <p className="text-[10px] text-white/30 tracking-[0.1em] uppercase font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Row 2: Privacy guarantee */}
            <div className="glass-card py-3 px-5 flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400/50" />
              <span className="label-xs">
                Zero amounts, addresses, or private data stored on-chain
              </span>
            </div>
          </motion.div>

          {/* Mini Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TerminalCard variant="elevated">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-3.5 h-3.5 text-white/30" />
                <span className="label-xs">Protocol Activity</span>
              </div>
              <div className="h-32">
                {hasLandingChartActivity ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={landingChartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                      />
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
                        {landingChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.count > 0 ? '#34d399' : 'rgba(255,255,255,0.03)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <motion.p
                      className="text-xs text-white/20"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Waiting for on-chain activity...
                    </motion.p>
                  </div>
                )}
              </div>
            </TerminalCard>
          </motion.div>

          {/* Network Activity Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-[10px] text-emerald-400 font-medium tracking-[0.1em] uppercase">
                Live on Aleo Testnet
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">Network Activity</h2>

            {loadingRecent ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card-subtle p-4 flex items-center gap-4">
                    <div className="skeleton h-4 flex-1" />
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-4 w-16 hidden md:block" />
                    <div className="skeleton h-5 w-16 rounded-full" />
                    <div className="skeleton h-4 w-14 hidden md:block" />
                  </div>
                ))}
              </div>
            ) : recentSplits.length > 0 ? (
              <motion.div
                className="space-y-2"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2">
                  <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase font-medium">Description</span>
                  <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase font-medium text-right">Amount</span>
                  <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase font-medium text-center hidden md:block">Participants</span>
                  <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase font-medium text-center">Status</span>
                  <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase font-medium text-right hidden md:block">Date</span>
                </div>

                {/* Table rows */}
                {recentSplits.slice(0, 6).map((split) => (
                  <motion.div
                    key={split.split_id}
                    variants={activityRowVariants}
                    className="glass-card-subtle p-4 grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="text-sm text-white/70 truncate">{split.description || 'Private Split'}</span>
                    <span className="text-sm font-mono text-emerald-400 text-right whitespace-nowrap">
                      {microToCredits(split.total_amount)}
                      <span className="text-[10px] text-white/30 ml-1">credits</span>
                    </span>
                    <span className="text-sm text-white/40 text-center hidden md:block">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" /> {split.participant_count}
                      </span>
                    </span>
                    <span className="flex justify-center">
                      <TerminalBadge status={split.status === 'settled' ? 'settled' : 'active'} />
                    </span>
                    <span className="text-xs font-mono text-white/30 text-right hidden md:block">
                      {new Date(split.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="glass-card-subtle p-8 text-center">
                <Layers className="w-8 h-8 text-white/[0.06] mx-auto mb-2" />
                <p className="text-xs text-white/20">No network activity yet</p>
              </div>
            )}

            {recentSplits.length > 0 && (
              <div className="flex justify-center pt-2">
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  View in Explorer <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </motion.div>
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
                  <p className="text-xs text-white/20">Your private splits will appear here. Create one to get started.</p>
                  <ArrowRight className="w-4 h-4 text-white/10 mx-auto mt-2 -rotate-45" />
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
                  <div className="flex flex-col items-center gap-1.5 mb-4">
                    <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.02)' }} />
                  </div>
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
                  <p className="text-xs text-white/20">Your transaction log will appear here</p>
                  <p className="text-[10px] text-white/10 mt-1">All entries encrypted end-to-end</p>
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
