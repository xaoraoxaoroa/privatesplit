import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TerminalCard, TerminalInput, TerminalButton, TerminalSelect } from '../ui';
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from '../../utils/constants';
import { STATUS_SYMBOLS } from '../../design-system/tokens';

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
    // Clear error on change
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

  return (
    <form onSubmit={handleSubmit}>
      <TerminalCard title="NEW SPLIT">
        <div className="space-y-4">
          <div>
            <TerminalInput
              label="Description"
              placeholder="dinner, groceries, rent..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
              error={errors.description}
              required
            />
            {!errors.description && description.trim().length >= 3 && (
              <p className="text-terminal-green text-[10px] mt-1">{STATUS_SYMBOLS.success} Valid</p>
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
            {!errors.amount && parseFloat(amount) > 0 && (
              <p className="text-terminal-green text-[10px] mt-1">{STATUS_SYMBOLS.success} Valid</p>
            )}
          </div>

          <TerminalSelect
            label="Participants"
            options={countOptions}
            value={participantCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value))}
          />

          {amount && participantCount > 0 && (
            <div className="text-xs text-terminal-dim border-t border-terminal-border pt-3">
              {STATUS_SYMBOLS.arrow} Each person pays:{' '}
              <span className="text-terminal-green font-bold">
                {(parseFloat(amount || '0') / participantCount).toFixed(6)} credits
              </span>
            </div>
          )}

          <div className="space-y-2 border-t border-terminal-border pt-3">
            <p className="text-[10px] text-terminal-dim tracking-widest uppercase">Participant Addresses</p>
            {errors.participants && (
              <p className="text-terminal-red text-[10px]">{STATUS_SYMBOLS.error} {errors.participants}</p>
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
                  <p className="text-terminal-green text-[10px] mt-1">{STATUS_SYMBOLS.success} Valid address</p>
                )}
              </div>
            ))}
          </div>

          <TerminalButton type="submit" loading={loading} className="w-full" disabled={!isValid && !loading}>
            CREATE SPLIT
          </TerminalButton>
        </div>
      </TerminalCard>
    </form>
  );
}
