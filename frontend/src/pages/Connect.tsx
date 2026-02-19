import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { TerminalCard, TerminalButton, TerminalBadge } from '../components/ui';
import { truncateAddress } from '../utils/format';
import { PageTransition } from '../components/PageTransition';
import { Shield, Wallet, ExternalLink, Lock, Eye, Zap } from 'lucide-react';

export function Connect() {
  const { connected, address, disconnect, wallet } = useWallet();
  const walletName = wallet?.adapter?.name || 'Unknown';

  return (
    <PageTransition>
    <div className="max-w-md mx-auto space-y-6">

      {connected && address ? (
        <TerminalCard variant="accent">
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
              >
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">Connected</p>
                <p className="text-[10px] text-white/40">{walletName} on Aleo Testnet</p>
              </div>
              <TerminalBadge status="active" label="LIVE" />
            </div>

            <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 font-mono text-xs text-white/50 break-all">
              {address}
            </div>

            <TerminalButton onClick={disconnect} variant="danger" className="w-full">
              DISCONNECT
            </TerminalButton>
          </div>
        </TerminalCard>
      ) : (
        <div className="flex flex-col items-center text-center pt-8 space-y-8">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
          >
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white/90">Connect Wallet</h1>
            <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
              All expense data is encrypted and private by default using Aleo zero-knowledge proofs.
            </p>
          </div>

          {/* CTA */}
          <div className="w-full max-w-xs">
            <div className="wallet-adapter-wrapper">
              <WalletMultiButton className="!w-full !bg-terminal-green/10 !border !border-terminal-green/30 !text-terminal-green !font-sans !text-xs !font-medium !tracking-wider !px-6 !py-3.5 !rounded-xl hover:!bg-terminal-green hover:!text-terminal-bg !transition-all" />
            </div>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Lock, label: 'End-to-end encrypted' },
              { icon: Eye, label: 'Zero data leaks' },
              { icon: Zap, label: 'Instant proofs' },
            ].map((pill) => (
              <div key={pill.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white/40" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <pill.icon className="w-3 h-3 text-emerald-400/60" />
                {pill.label}
              </div>
            ))}
          </div>

          {/* Supported wallets */}
          <div className="space-y-3 w-full max-w-xs">
            <p className="label-xs">Supported Wallets</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Shield', 'Leo', 'Puzzle', 'Fox', 'Soter'].map((w) => (
                <span key={w} className="px-2.5 py-1 text-[10px] rounded-lg border border-white/[0.06] text-white/40" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {w}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-5">
            <a
              href="https://www.leo.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              Get Shield Wallet <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://puzzle.online/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              Get Puzzle <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
