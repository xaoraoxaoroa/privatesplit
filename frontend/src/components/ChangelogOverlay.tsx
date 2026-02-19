import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalButton } from './ui';

const CHANGELOG = [
  {
    version: 'Wave 2',
    date: 'Feb 11 – Feb 25, 2026',
    highlights: [
      { tag: 'CONTRACT', text: '4 private record types + 5 transitions deployed on Aleo Testnet', color: 'text-terminal-green' },
      { tag: 'PRIVACY', text: 'Zero amounts, zero addresses in public mappings — only anonymous counters', color: 'text-terminal-green' },
      { tag: 'PRIVACY', text: 'issue_debt has NO finalize block — zero on-chain trace of debt issuance', color: 'text-terminal-amber' },
      { tag: 'UI', text: 'Complete glassmorphic redesign with Framer Motion page transitions', color: 'text-terminal-cyan' },
      { tag: 'UI', text: 'Activity chart, animated counters, animated search placeholders', color: 'text-terminal-cyan' },
      { tag: 'WALLET', text: 'Shield Wallet integration with 5 wallet adapters', color: 'text-terminal-purple' },
      { tag: 'PAYMENT', text: 'Real credits.aleo/transfer_private payments (not mocked)', color: 'text-terminal-green' },
      { tag: 'QR', text: 'QR code generation for payment link sharing', color: 'text-terminal-cyan' },
      { tag: 'VERIFY', text: 'On-chain verification + encrypted receipt scanning', color: 'text-terminal-green' },
      { tag: 'PAGES', text: '11 pages: Dashboard, Create, Pay, Detail, History, Explorer, Privacy, Verify, Vision, Docs, Connect', color: 'text-terminal-text' },
      { tag: 'BACKEND', text: 'AES-256-GCM encrypted off-chain storage with Vercel serverless API', color: 'text-terminal-amber' },
    ],
  },
];

export function ChangelogOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-lg sm:max-h-[80vh] overflow-y-auto glass-card glass-card-accent p-6 rounded-glass"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gradient">Changelog</h2>
              <button
                onClick={onClose}
                className="text-terminal-dim hover:text-terminal-text text-lg transition-colors"
              >
                {'\u2715'}
              </button>
            </div>

            {CHANGELOG.map((wave) => (
              <div key={wave.version} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-terminal-green">{wave.version}</span>
                  <span className="text-[10px] text-terminal-dim">{wave.date}</span>
                </div>
                <div className="space-y-2">
                  {wave.highlights.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[9px] text-terminal-dim font-mono tracking-wider">
                        {item.tag}
                      </span>
                      <span className={item.color}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <TerminalButton onClick={onClose} variant="secondary" className="w-full">
                CLOSE
              </TerminalButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ChangelogButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 text-[10px] font-medium tracking-wider text-terminal-dim hover:text-terminal-green border border-white/[0.06] hover:border-terminal-green/30 rounded-lg transition-colors"
      >
        CHANGELOG
      </button>
      <ChangelogOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
