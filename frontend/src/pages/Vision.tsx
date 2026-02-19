import { motion } from 'framer-motion';
import { TerminalCard } from '../components/ui';
import { PageTransition, staggerContainer, fadeInUp } from '../components/PageTransition';
import { Lock, Smartphone, Users, Landmark, Wrench, Building2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

const ROADMAP = [
  {
    phase: 'WAVE 2',
    status: 'live' as const,
    title: 'Core Protocol',
    items: [
      'Private expense splitting with encrypted records',
      'Debt issuance with zero on-chain trace',
      'credits.aleo private payments',
      'On-chain verification & receipt proofs',
      'QR code payment links',
    ],
  },
  {
    phase: 'WAVE 3',
    status: 'next' as const,
    title: 'Multi-Token & Groups',
    items: [
      'USDCx / USAD stablecoin support',
      'Group templates (roommates, trips, events)',
      'Recurring splits (monthly rent, subscriptions)',
      'Batch debt issuance (one TX for all participants)',
    ],
  },
  {
    phase: 'WAVE 4-5',
    status: 'planned' as const,
    title: 'Mobile & SDK',
    items: [
      'React Native mobile app (iOS + Android)',
      'TypeScript SDK for third-party integrations',
      'Deep link payment flows',
      'Push notifications for debt & settlement',
    ],
  },
  {
    phase: 'WAVE 6-8',
    status: 'planned' as const,
    title: 'Treasury & Enterprise',
    items: [
      'Multi-sig treasury management',
      'DAO expense splitting',
      'Role-based access (admin, member, viewer)',
      'Audit trails with selective disclosure',
      'Enterprise SSO integration',
    ],
  },
];

const FEATURES: { icon: typeof Lock; title: string; desc: string; bg: string; border: string; text: string }[] = [
  {
    icon: Lock,
    title: 'Multi-Token Payments',
    desc: 'Support for credits.aleo, USDCx, USAD, and future Aleo tokens. Pay debts in any supported asset.',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.2)',
    text: 'rgb(52, 211, 153)',
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    desc: 'Full React Native app with deep link payment flows. Scan QR codes to pay splits instantly.',
    bg: 'rgba(34, 211, 238, 0.08)',
    border: 'rgba(34, 211, 238, 0.2)',
    text: 'rgb(34, 211, 238)',
  },
  {
    icon: Users,
    title: 'Group Templates',
    desc: 'Pre-configured templates for roommates, trips, dinners, and events. One-tap recurring splits.',
    bg: 'rgba(167, 139, 250, 0.08)',
    border: 'rgba(167, 139, 250, 0.2)',
    text: 'rgb(167, 139, 250)',
  },
  {
    icon: Landmark,
    title: 'Treasury Management',
    desc: 'Multi-sig wallets for DAOs and organizations. Manage group funds with privacy-preserving accounting.',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.2)',
    text: 'rgb(251, 191, 36)',
  },
  {
    icon: Wrench,
    title: 'Developer SDK',
    desc: 'TypeScript SDK for building on PrivateSplit. Create custom split logic, integrate into existing apps.',
    bg: 'rgba(34, 211, 238, 0.08)',
    border: 'rgba(34, 211, 238, 0.2)',
    text: 'rgb(34, 211, 238)',
  },
  {
    icon: Building2,
    title: 'Enterprise Features',
    desc: 'Role-based access, audit trails with selective disclosure, SSO integration, and compliance tooling.',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.2)',
    text: 'rgb(52, 211, 153)',
  },
];

export function Vision() {
  return (
    <PageTransition>
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white/90">Vision & Roadmap</h1>
        <p className="text-xs text-white/40 mt-1">
          Building the privacy-first expense splitting standard on Aleo
        </p>
      </div>

      {/* Mission */}
      <TerminalCard variant="accent">
        <div className="text-center py-4">
          <p className="text-sm text-white/90 font-medium mb-2">Our Mission</p>
          <p className="text-xs text-white/50 max-w-lg mx-auto leading-relaxed">
            Financial relationships are deeply personal. Who you owe, what you owe, and who you pay
            should remain between you and the other party &mdash; not visible to the entire blockchain.
            PrivateSplit makes this possible using Aleo's zero-knowledge proof system.
          </p>
        </div>
      </TerminalCard>

      {/* Feature Grid */}
      <div>
        <p className="label-xs mb-4">Planned Features</p>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeInUp}>
              <TerminalCard variant="stat">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: f.bg, border: `1px solid ${f.border}` }}
                    >
                      <f.icon className="w-5 h-5" style={{ color: f.text }} />
                    </div>
                    <p className="text-xs font-medium" style={{ color: f.text }}>{f.title}</p>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </TerminalCard>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Roadmap */}
      <div>
        <p className="label-xs mb-4">Development Roadmap</p>
        <div className="space-y-4">
          {ROADMAP.map((phase, i) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <TerminalCard variant={phase.status === 'live' ? 'accent' : undefined}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={
                        phase.status === 'live'
                          ? { background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: 'rgb(52, 211, 153)' }
                          : phase.status === 'next'
                          ? { background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.3)', color: 'rgb(34, 211, 238)' }
                          : { background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.4)' }
                      }
                    >
                      {phase.phase.split(' ')[1]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium text-white/90">{phase.title}</p>
                      {phase.status === 'live' && (
                        <span
                          className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                          style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'rgb(52, 211, 153)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
                        >
                          LIVE
                        </span>
                      )}
                      {phase.status === 'next' && (
                        <span
                          className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                          style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'rgb(34, 211, 238)', border: '1px solid rgba(34, 211, 238, 0.2)' }}
                        >
                          NEXT
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {phase.items.map((item) => (
                        <p key={item} className="text-[11px] text-white/40 flex items-start gap-1.5">
                          {phase.status === 'live'
                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                            : phase.status === 'next'
                            ? <ArrowRight className="w-3.5 h-3.5 shrink-0 text-cyan-400 mt-0.5" />
                            : <Clock className="w-3.5 h-3.5 shrink-0 text-white/30 mt-0.5" />
                          }
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </TerminalCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why Privacy */}
      <TerminalCard title="WHY PRIVACY MATTERS FOR EXPENSES">
        <div className="space-y-4 text-xs">
          {[
            { q: 'Why can\'t I just use Splitwise?', a: 'Splitwise stores your entire financial social graph on their servers. Who you eat with, how much you spend, your roommate arrangements — all visible to their company and anyone who breaches them.' },
            { q: 'What about Venmo / Cash App?', a: 'Public by default. Your payment history is a social feed. Even "private" payments leak metadata — timestamps, frequency, social connections.' },
            { q: 'Why not just use Ethereum?', a: 'Every transaction, amount, and address is permanently public on Ethereum. Your entire expense-splitting history would be visible to anyone with a block explorer.' },
            { q: 'How is PrivateSplit different?', a: 'Zero amounts, zero addresses, zero social graph stored anywhere public. Only anonymous counters on-chain. All sensitive data encrypted in Aleo records that only you can decrypt.' },
          ].map((faq) => (
            <div key={faq.q}>
              <p className="text-white/90 font-medium mb-1">{faq.q}</p>
              <p className="text-white/40 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </TerminalCard>
    </div>
    </PageTransition>
  );
}
