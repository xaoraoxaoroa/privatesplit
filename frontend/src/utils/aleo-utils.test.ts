import { describe, it, expect, vi } from 'vitest';
import { generateSalt, formatAleoInput } from './aleo-utils';

describe('generateSalt', () => {
  it('generates a string ending with "field"', () => {
    const salt = generateSalt();
    expect(salt.endsWith('field')).toBe(true);
  });

  it('generates a numeric value before "field"', () => {
    const salt = generateSalt();
    const numPart = salt.replace(/field$/, '');
    expect(Number.isNaN(Number(numPart))).toBe(false);
    expect(BigInt(numPart) > 0n).toBe(true);
  });

  it('generates unique salts', () => {
    const salts = new Set(Array.from({ length: 50 }, () => generateSalt()));
    expect(salts.size).toBe(50);
  });

  it('uses crypto.getRandomValues for entropy', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    generateSalt();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe('formatAleoInput', () => {
  it('formats u8 values', () => {
    expect(formatAleoInput(4, 'u8')).toBe('4u8');
    expect(formatAleoInput('8', 'u8')).toBe('8u8');
  });

  it('formats u64 values', () => {
    expect(formatAleoInput(1000000, 'u64')).toBe('1000000u64');
  });

  it('formats field values', () => {
    expect(formatAleoInput('12345', 'field')).toBe('12345field');
    expect(formatAleoInput('12345field', 'field')).toBe('12345field');
  });

  it('passes addresses through unchanged', () => {
    const addr = 'aleo1abc123def456';
    expect(formatAleoInput(addr, 'address')).toBe(addr);
  });

  it('stringifies unknown types', () => {
    expect(formatAleoInput(42, 'unknown')).toBe('42');
  });
});
