import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalInput, TerminalButton, TerminalSelect } from '../ui';
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from '../../utils/constants';
import { CheckCircle2, AlertCircle, Users, Coins, FileText } from 'lucide-react';

const ALEO_ADDRESS_REGEX = /^aleo1[a-z0-9]{58}$/;

interface SplitFormProps {
  onSubmit: (data: { description: string; amount: string; participantCount: number; participants: string[] }) => void;
  loading?: boolean;
}

export function SplitForm({ onSubmit, loading }: SplitFormProps) {
  const { address } = useWallet();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [participants, setParticipants] = useState<string[]>(['']);
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
    onSubmit({ description, amount, participantCount, participants });
  };

  const countOptions = Array.from(
    { length: MAX_PARTICIPANTS - MIN_PARTICIPANTS + 1 },
    (_, i) => ({ value: i + MIN_PARTICIPANTS, label: `${i + MIN_PARTICIPANTS} people` }),
  );

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
          <div>
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
            <TerminalInput
              label="Total Amount (credits)"
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

          <TerminalSelect
            label="Participants"
            options={countOptions}
            value={participantCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value))}
          />

          {amount && participantCount > 0 && (
            <div className="glass-card-subtle p-3.5 flex items-center justify-between">
              <span className="text-[10px] text-terminal-dim tracking-wide uppercase">Per Person</span>
              <span className="text-terminal-green font-semibold font-mono text-sm">
                {(parseFloat(amount || '0') / participantCount).toFixed(6)}
                <span className="text-terminal-dim text-[10px] ml-1 font-normal">credits</span>
              </span>
            </div>
          )}

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
