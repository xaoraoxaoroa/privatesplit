import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../design-system/cn';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { truncateAddress } from '../../utils/format';
import { Shield, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/create', label: 'Create' },
  { path: '/my-splits', label: 'My Splits' },
  { path: '/explorer', label: 'Explorer' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/verify', label: 'Verify' },
  { path: '/audit', label: 'Audit' },
  { path: '/vision', label: 'Vision' },
  { path: '/docs', label: 'Docs' },
];

export function CommandBar() {
  const location = useLocation();
  const { address, connected } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="border-b border-white/[0.06] bg-[#0d0d14]/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-white/90 font-semibold text-sm tracking-wide">
                PrivateSplit
              </span>
            </Link>
            <nav className="desktop-nav flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all',
                    location.pathname === item.path
                      ? 'text-emerald-400'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
                  )}
                  style={location.pathname === item.path ? { background: 'rgba(52, 211, 153, 0.08)' } : undefined}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {connected && address && (
              <Link to="/connect" className="text-xs font-mono text-emerald-400/70 hidden sm:block hover:text-emerald-400 transition-colors">
                {truncateAddress(address)}
              </Link>
            )}
            <div className="wallet-adapter-wrapper">
              <WalletMultiButton className="!bg-terminal-green/10 !border !border-terminal-green/30 !text-terminal-green !font-sans !text-xs !font-medium !tracking-wide !px-4 !py-2 !rounded-xl !h-auto hover:!bg-terminal-green hover:!text-terminal-bg !transition-all !min-w-0" />
            </div>
            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn items-center justify-center w-8 h-8 text-white/40 hover:text-white/80 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="mobile-nav-overlay fixed inset-0 z-50 bg-[#06060a]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-4 md:hidden">
          <button
            className="absolute top-4 right-4 text-white/40 hover:text-white/80"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'text-lg tracking-wide font-medium transition-colors py-2',
                location.pathname === item.path
                  ? 'text-emerald-400'
                  : 'text-white/40 hover:text-white/80',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
