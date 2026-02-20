import { describe, it, expect } from 'vitest';
import { microToCredits, creditsToMicro, truncateAddress, statusLabel, generateId } from './format';

describe('microToCredits', () => {
  it('formats large amounts with 2 decimals', () => {
    expect(microToCredits(10_000_000)).toBe('10.00');
    expect(microToCredits(1_000_000)).toBe('1.00');
    expect(microToCredits(1_500_000)).toBe('1.50');
  });

  it('formats medium amounts with 4 decimals', () => {
    expect(microToCredits(50_000)).toBe('0.0500');
    expect(microToCredits(10_000)).toBe('0.0100');
  });

  it('formats small amounts with 6 decimals', () => {
    expect(microToCredits(1)).toBe('0.000001');
    expect(microToCredits(100)).toBe('0.000100');
    expect(microToCredits(999)).toBe('0.000999');
  });

  it('handles zero', () => {
    expect(microToCredits(0)).toBe('0.000000');
  });
});

describe('creditsToMicro', () => {
  it('converts whole credits', () => {
    expect(creditsToMicro('1')).toBe(1_000_000);
    expect(creditsToMicro('10')).toBe(10_000_000);
  });

  it('converts fractional credits', () => {
    expect(creditsToMicro('0.5')).toBe(500_000);
    expect(creditsToMicro('0.000001')).toBe(1);
  });

  it('floors fractional microcredits', () => {
    expect(creditsToMicro('0.0000015')).toBe(1);
  });

  it('handles zero', () => {
    expect(creditsToMicro('0')).toBe(0);
  });
});

describe('truncateAddress', () => {
  const fullAddr = 'aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc';

  it('truncates long addresses', () => {
    const result = truncateAddress(fullAddr);
    expect(result).toContain('...');
    expect(result.startsWith(fullAddr.slice(0, 6))).toBe(true);
    expect(result.endsWith(fullAddr.slice(-6))).toBe(true);
    expect(result.length).toBeLessThan(fullAddr.length);
  });

  it('respects custom char count', () => {
    const result = truncateAddress(fullAddr, 10);
    expect(result.startsWith('aleo1qqqqq')).toBe(true);
    expect(result.includes('...')).toBe(true);
  });

  it('returns short strings unchanged', () => {
    expect(truncateAddress('abc')).toBe('abc');
    expect(truncateAddress('')).toBe('');
  });
});

describe('statusLabel', () => {
  it('maps known statuses', () => {
    expect(statusLabel('active')).toBe('ACTIVE');
    expect(statusLabel('settled')).toBe('SETTLED');
    expect(statusLabel('pending')).toBe('PENDING');
  });

  it('uppercases unknown statuses', () => {
    expect(statusLabel('expired')).toBe('EXPIRED');
    expect(statusLabel('custom')).toBe('CUSTOM');
  });
});

describe('generateId', () => {
  it('returns an 8-char alphanumeric string', () => {
    const id = generateId();
    expect(id.length).toBe(8);
    expect(/^[a-z0-9]+$/.test(id)).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
