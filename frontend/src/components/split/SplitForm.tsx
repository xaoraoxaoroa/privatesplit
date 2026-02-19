import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalInput, TerminalButton, TerminalSelect, CategoryIcon } from '../ui';
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS, EXPIRY_OPTIONS } from '../../utils/constants';
import { CATEGORY_META, TOKEN_META } from '../../types/split';
import type { SplitCategory, TokenType } from '../../types/split';
import { CheckCircle2, AlertCircle, Users, Coins, FileText, Tag, Clock, Wallet } from 'lucide-react';

const ALEO_ADDRESS_REGEX = /^aleo1[a-z0-9]{58}$/;

const CATEGORIES = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

interface SplitFormProps {
  onSubmit: (data: {
    description: string;
    amount: string;
    participantCount: number;
    participants: string[];
    category: SplitCategory;
    expiryHours: number;
    tokenType: TokenType;
  }) => void;
  loading?: boolean;
}

export function SplitForm({ onSubmit, loading }: SplitFormProps) {
  const { address } = useWallet();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [participants, setParticipants] = useState<string[]>(['']);
  const [category, setCategory] = useState<SplitCategory>('dinner');
  const [expiryHours, setExpiryHours] = useState(0);
  const [tokenType, setTokenType] = useState<TokenType>('credits');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCountChange = (count: number) => {
    setParticipantCount(count);
    const debtCount = count - 1;
    const current = [...participants];
    while (current.length < debtCount) current.push('');
    setParticipants(current.slice(0, debtCount));
  };

  const handleParticipantChange = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
    const newErrors = { ...errors };
    delete newErrors[`participant_${index}`];
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim() || description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }
    if (description.length > 100) {
      newErrors.description = 'Description must be under 100 characters';
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amountNum > 1000000) {
      newErrors.amount = 'Amount exceeds maximum (1,000,000 credits)';
    }

    const seen = new Set<string>();
    const filledParticipants = participants.filter(Boolean);

    if (filledParticipants.length === 0) {
      newErrors.participants = 'At least one participant address required';
    }

    participants.forEach((addr, i) => {
      if (!addr) return;
      if (!ALEO_ADDRESS_REGEX.test(addr)) {
        newErrors[`participant_${i}`] = 'Invalid Aleo address format (aleo1...)';
      } else if (addr === address) {
        newErrors[`participant_${i}`] = 'Cannot add yourself as a participant';
      } else if (seen.has(addr)) {
        newErrors[`participant_${i}`] = 'Duplicate address';
      }
      seen.add(addr);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ description, amount, participantCount, participants, category, expiryHours, tokenType });
  };

  const countOptions = Array.from(
    { length: MAX_PARTICIPANTS - MIN_PARTICIPANTS + 1 },
    (_, i) => ({ value: i + MIN_PARTICIPANTS, label: `${i + MIN_PARTICIPANTS} people` }),
  );

  const expiryOptions = EXPIRY_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  const isValid = description.trim().length >= 3 && parseFloat(amount) > 0 && participants.some(Boolean);

  // Step tracking
  const step1Done = description.trim().length >= 3;
  const step2Done = parseFloat(amount) > 0;
  const step3Done = participants.some((a) => a && ALEO_ADDRESS_REGEX.test(a) && a !== address);

  const steps = [
    { label: 'Details', done: step1Done, icon: FileText },
    { label: 'Amount', done: step2Done, icon: Coins },
    { label: 'People', done: step3Done, icon: Users },
  ];

  const catMeta = CATEGORY_META[category];
  const tokenMeta = TOKEN_META[tokenType];

  return (
    <form onSubmit={handleSubmit}>
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              s.done
                ? 'bg-terminal-green/10 border border-terminal-green/30 text-terminal-green'
                : 'bg-white/[0.03] border border-white/[0.06] text-terminal-dim'
            }`}>
              {s.done ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${s.done ? 'text-terminal-green' : 'text-terminal-dim'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${s.done ? 'bg-terminal-green/30' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        ))}
      </div>

      <TerminalCard variant="elevated">
        <div className="space-y-5">
          {/* Row 1: Description + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <TerminalInput
                label="Description"
                placeholder="Dinner, groceries, rent..."
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
                error={errors.description}
                required
              />
              {!errors.description && step1Done && (
                <p className="text-terminal-green text-[10px] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] text-white/40 tracking-[0.12em] uppercase font-medium mb-1.5">
                <Tag className="w-3 h-3 inline mr-1" />Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SplitCategory)}
                className="w-full px-3 py-2.5 rounded-xl text-xs text-white/90 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} style={{ background: '#0d0d14' }}>{c.label}</option>
                ))}
              </select>
              <div
                className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium"
                style={{ background: `${catMeta.color}15`, color: catMeta.color, border: `1px solid ${catMeta.color}30` }}
              >
                <CategoryIcon name={catMeta.icon} className="w-3 h-3 inline" /> {catMeta.label}
              </div>
            </div>
          </div>

          {/* Row 2: Amount + Token Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <TerminalInput
                label={`Total Amount (${tokenMeta.symbol})`}
                placeholder="10.0"
                type="number"
                step="0.000001"
                min="0.000001"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
                error={errors.amount}
                required
              />
              {!errors.amount && step2Done && (
                <p className="text-terminal-green text-[10px] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] text-white/40 tracking-[0.12em] uppercase font-medium mb-1.5">
                <Wallet className="w-3 h-3 inline mr-1" />Token
              </label>
              <div className="flex gap-1.5">
                {(['credits', 'usdcx'] as TokenType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTokenType(t)}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium tracking-wide rounded-xl transition-all ${
                      tokenType === t
                        ? 'text-emerald-400'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                    style={
                      tokenType === t
                        ? { background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {TOKEN_META[t].symbol}
                  </button>
                ))}
              </div>
              {tokenType === 'usdcx' && (
                <p className="text-amber-400/60 text-[9px] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> USDCx coming in v2 deployment
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Participants + Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <TerminalSelect
                label="Participants"
                options={countOptions}
                value={participantCount}
                onChange={(e) => handleCountChange(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 tracking-[0.12em] uppercase font-medium mb-1.5">
                <Clock className="w-3 h-3 inline mr-1" />Expiry
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-xs text-white/90 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {expiryOptions.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: '#0d0d14' }}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Per person summary */}
          {amount && participantCount > 0 && (
            <div className="glass-card-subtle p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-terminal-dim tracking-wide uppercase">Per Person</span>
                {category && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${catMeta.color}15`, color: catMeta.color, border: `1px solid ${catMeta.color}30` }}
                  >
                    <CategoryIcon name={catMeta.icon} className="w-2.5 h-2.5 inline" /> {catMeta.label}
                  </span>
                )}
                {expiryHours > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20">
                    <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                    {EXPIRY_OPTIONS.find((o) => o.value === expiryHours)?.label}
                  </span>
                )}
              </div>
              <span className="text-terminal-green font-semibold font-mono text-sm">
                {(parseFloat(amount || '0') / participantCount).toFixed(6)}
                <span className="text-terminal-dim text-[10px] ml-1 font-normal">{tokenMeta.symbol}</span>
              </span>
            </div>
          )}

          {/* Participant Addresses */}
          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <p className="text-[10px] text-terminal-dim tracking-[0.15em] uppercase font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Participant Addresses
            </p>
            {errors.participants && (
              <p className="text-terminal-red text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.participants}
              </p>
            )}
            {participants.map((addr, i) => (
              <div key={i}>
                <TerminalInput
                  placeholder={`aleo1... (participant ${i + 1})`}
                  value={addr}
                  onChange={(e) => handleParticipantChange(i, e.target.value)}
                  error={errors[`participant_${i}`]}
                />
                {!errors[`participant_${i}`] && addr && ALEO_ADDRESS_REGEX.test(addr) && addr !== address && (
                  <p className="text-terminal-green text-[10px] mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid address
                  </p>
                )}
              </div>
            ))}
          </div>

          <TerminalButton type="submit" loading={loading} className="w-full" size="lg" disabled={!isValid && !loading}>
            {isValid ? 'CREATE SPLIT' : 'COMPLETE ALL FIELDS'}
          </TerminalButton>
        </div>
      </TerminalCard>
    </form>
  );
}
