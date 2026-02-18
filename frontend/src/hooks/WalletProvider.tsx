import { useMemo } from 'react';
import { AleoWalletProvider, useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletModalProvider } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';
import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';
import { PuzzleWalletAdapter } from '@provablehq/aleo-wallet-adaptor-puzzle';
import { FoxWalletAdapter } from '@provablehq/aleo-wallet-adaptor-fox';
import { SoterWalletAdapter } from '@provablehq/aleo-wallet-adaptor-soter';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';
import { Network } from '@provablehq/aleo-types';
import { PROGRAM_ID, CREDITS_PROGRAM } from '../utils/constants';

import '@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      new ShieldWalletAdapter({ appName: 'PrivateSplit' }),
      new LeoWalletAdapter({ appName: 'PrivateSplit' }),
      new PuzzleWalletAdapter({ appName: 'PrivateSplit' }),
      new FoxWalletAdapter({ appName: 'PrivateSplit' }),
      new SoterWalletAdapter({ appName: 'PrivateSplit' }),
    ],
    [],
  );

  return (
    <AleoWalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.AutoDecrypt}
      network={Network.TESTNET}
      autoConnect
      programs={[PROGRAM_ID, CREDITS_PROGRAM]}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </AleoWalletProvider>
  );
}

export { useWallet };
