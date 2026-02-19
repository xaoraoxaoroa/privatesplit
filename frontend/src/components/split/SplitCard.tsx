import { Link } from 'react-router-dom';
import { TerminalCard, TerminalBadge, CategoryIcon } from '../ui';
import { microToCredits, truncateAddress } from '../../utils/format';
import { CATEGORY_META, TOKEN_META } from '../../types/split';
import type { Split, SplitCategory } from '../../types/split';
import { Clock } from 'lucide-react';

interface SplitCardProps {
  split: Split;
  showCategory?: boolean;
}

export function SplitCard({ split, showCategory }: SplitCardProps) {
  const paidCount = split.payment_count || 0;
  const totalDebts = Math.max(split.participant_count - 1, 1);
  const progress = Math.round((paidCount / totalDebts) * 100);
  const cat = split.category || 'other';
  const catMeta = CATEGORY_META[cat as SplitCategory];
  const tokenSymbol = TOKEN_META[split.token_type || 'credits']?.symbol || 'ALEO';

  return (
    <Link to={`/split/${split.split_id}`}>
      <TerminalCard hoverable>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm text-terminal-text font-medium truncate">{split.description || 'Untitled Split'}</p>
              {showCategory && catMeta && (
                <span
                  className="shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: `${catMeta.color}15`, color: catMeta.color, border: `1px solid ${catMeta.color}30` }}
                >
                  <CategoryIcon name={catMeta.icon} className="w-3 h-3 inline" /> {catMeta.label}
                </span>
              )}
            </div>
            <p className="text-[10px] text-terminal-dim mt-1 font-mono">
              {truncateAddress(split.creator)} &middot; {split.participant_count} participants
              {split.expiry_hours ? (
                <span className="text-amber-400/60 ml-1">
                  <Clock className="w-2.5 h-2.5 inline" /> {split.expiry_hours}h
                </span>
              ) : null}
            </p>
          </div>
          <TerminalBadge status={split.status === 'settled' ? 'settled' : split.status === 'expired' ? 'settled' : paidCount >= totalDebts ? 'success' : 'active'} />
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/[0.04] rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-terminal-green rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-terminal-green font-semibold">{microToCredits(split.total_amount)} {tokenSymbol}</span>
          <span className="text-terminal-dim font-mono">
            {paidCount}/{totalDebts} paid &middot; {microToCredits(split.per_person)} each
          </span>
        </div>
      </TerminalCard>
    </Link>
  );
}
