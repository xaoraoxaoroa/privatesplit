import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { TerminalCard, TerminalButton, TerminalBadge } from '../components/ui';
import { truncateAddress } from '../utils/format';
import { STATUS_SYMBOLS } from '../design-system/tokens';

export function Connect() {
  const { connected, address, disconnect, wallet } = useWallet();

  const walletName = wallet?.adapter?.name || 'Unknown';

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <h1 className="text-lg text-terminal-green tracking-wider">WALLET</h1>

      {connected && address ? (
        <TerminalCard variant="accent" title="CONNECTED">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-terminal-dim">Status</span>
                <TerminalBadge status="active" label="CONNECTED" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-terminal-dim">Address</span>
                <span className="text-terminal-text">{truncateAddress(address, 10)}</span>
              </div>
              <div className="text-xs text-terminal-dim break-all bg-terminal-bg border border-terminal-border p-2 mt-2">
                {address}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-terminal-dim border-t border-terminal-border pt-3">
              <span>Network: <span className="text-terminal-cyan">Aleo Testnet</span></span>
              <span>Wallet: <span className="text-terminal-text">{walletName}</span></span>
            </div>

            <TerminalButton onClick={disconnect} variant="danger" className="w-full">
              DISCONNECT
            </TerminalButton>
          </div>
        </TerminalCard>
      ) : (
        <TerminalCard title="CONNECT WALLET">
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-terminal-text">
                {STATUS_SYMBOLS.pending} Choose Your Wallet
              </p>
              <p className="text-xs text-terminal-dim max-w-sm mx-auto">
                PrivateSplit supports Shield Wallet, Leo Wallet, Puzzle, Fox, and Soter.
                All expense data is encrypted and private by default.
              </p>
            </div>

            <div className="flex justify-center wallet-adapter-wrapper">
              <WalletMultiButton className="!bg-terminal-surface !border !border-terminal-green !text-terminal-green !font-mono !text-xs !tracking-widest !uppercase !px-6 !py-3 !rounded-none hover:!bg-terminal-green hover:!text-terminal-bg !transition-colors" />
            </div>

            <div className="border-t border-terminal-border pt-3 space-y-2">
              <p className="text-xs text-terminal-dim tracking-widest uppercase text-center">
                Supported Wallets
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-terminal-green">{STATUS_SYMBOLS.success} Shield Wallet</div>
                <div className="text-terminal-green">{STATUS_SYMBOLS.success} Leo Wallet</div>
                <div className="text-terminal-green">{STATUS_SYMBOLS.success} Puzzle Wallet</div>
                <div className="text-terminal-green">{STATUS_SYMBOLS.success} Fox Wallet</div>
                <div className="text-terminal-green">{STATUS_SYMBOLS.success} Soter Wallet</div>
              </div>
            </div>

            <div className="border-t border-terminal-border pt-3 space-y-2">
              <p className="text-xs text-terminal-dim tracking-widest uppercase text-center">
                Privacy Guarantees
              </p>
              <div className="space-y-1.5 text-xs">
                <p className="text-terminal-green">{STATUS_SYMBOLS.success} Split amounts encrypted in records</p>
                <p className="text-terminal-green">{STATUS_SYMBOLS.success} Participant identities hidden</p>
                <p className="text-terminal-green">{STATUS_SYMBOLS.success} Zero-knowledge proof verification</p>
                <p className="text-terminal-green">{STATUS_SYMBOLS.success} Only counters visible on-chain</p>
              </div>
            </div>

            <div className="border-t border-terminal-border pt-3 flex gap-4 justify-center">
              <a
                href="https://www.leo.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-terminal-cyan hover:underline"
              >
                {STATUS_SYMBOLS.arrow} Shield Wallet
              </a>
              <a
                href="https://puzzle.online/wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-terminal-cyan hover:underline"
              >
                {STATUS_SYMBOLS.arrow} Puzzle Wallet
              </a>
            </div>
          </div>
        </TerminalCard>
      )}
    </div>
  );
}
