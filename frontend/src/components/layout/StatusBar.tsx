import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { truncateAddress } from '../../utils/format';
import { ChangelogButton } from '../ChangelogOverlay';

export function StatusBar() {
  const { connected, address } = useWallet();

  return (
    <footer className="border-t border-white/[0.06] bg-[#0d0d14]/60 backdrop-blur-sm px-4 py-1.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
            <span className="text-cyan-400">TESTNET</span>
          </span>
          <span className="text-white/[0.1]">|</span>
          <span className="text-white/30 hidden sm:inline">private_split_v1.aleo</span>
          <span className="text-white/30 sm:hidden">ps_v1.aleo</span>
          <span className="text-white/[0.1]">|</span>
          <ChangelogButton />
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400">CONNECTED</span>
              </span>
              <span className="text-white/[0.1]">|</span>
              <span className="text-white/30">{address ? truncateAddress(address, 8) : ''}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-white/30">DISCONNECTED</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
