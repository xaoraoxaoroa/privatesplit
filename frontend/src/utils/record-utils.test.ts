import { describe, it, expect } from 'vitest';
import {
  extractField,
  parseRecordFields,
  isSplitRecord,
  isDebtRecord,
  recordMatchesSplitContext,
  getMicrocreditsFromRecord,
  buildCreditsRecordPlaintext,
  getRecordInput,
} from './record-utils';

const SPLIT_PLAINTEXT = `{
  owner: aleo1abc123def456.private,
  split_id: 987654321field.private,
  total_amount: 10000000u64.private,
  per_person: 2500000u64.private,
  participant_count: 4u8.private,
  issued_count: 0u8.private,
  salt: 1234567890field.private,
  expiry_height: 0u32.private,
  _nonce: 123456group.public
}`;

const DEBT_PLAINTEXT = `{
  owner: aleo1xyz789.private,
  split_id: 987654321field.private,
  creditor: aleo1abc123def456.private,
  amount: 2500000u64.private,
  salt: 1234567890field.private,
  _nonce: 654321group.public
}`;

const CREDITS_PLAINTEXT = `{
  owner: aleo1abc123.private,
  microcredits: 5000000u64.private,
  _nonce: 111222group.public
}`;

describe('extractField', () => {
  it('extracts named fields from plaintext', () => {
    expect(extractField(SPLIT_PLAINTEXT, 'owner')).toBe('aleo1abc123def456');
    expect(extractField(SPLIT_PLAINTEXT, 'total_amount')).toBe('10000000u64');
    expect(extractField(SPLIT_PLAINTEXT, 'participant_count')).toBe('4u8');
    expect(extractField(SPLIT_PLAINTEXT, 'salt')).toBe('1234567890field');
  });

  it('extracts creditor from debt record', () => {
    expect(extractField(DEBT_PLAINTEXT, 'creditor')).toBe('aleo1abc123def456');
    expect(extractField(DEBT_PLAINTEXT, 'amount')).toBe('2500000u64');
  });

  it('returns null for missing fields', () => {
    expect(extractField(SPLIT_PLAINTEXT, 'nonexistent')).toBe(null);
  });

  it('returns null for empty plaintext', () => {
    expect(extractField('', 'owner')).toBe(null);
  });
});

describe('parseRecordFields', () => {
  it('parses all fields', () => {
    const fields = parseRecordFields(SPLIT_PLAINTEXT);
    expect(fields.owner).toBe('aleo1abc123def456');
    expect(fields.total_amount).toBe('10000000u64');
    expect(fields.participant_count).toBe('4u8');
    expect(fields.salt).toBe('1234567890field');
  });

  it('returns empty object for empty input', () => {
    expect(parseRecordFields('')).toEqual({});
  });
});

describe('isSplitRecord', () => {
  it('identifies split records', () => {
    expect(isSplitRecord(SPLIT_PLAINTEXT)).toBe(true);
  });

  it('rejects debt records', () => {
    expect(isSplitRecord(DEBT_PLAINTEXT)).toBe(false);
  });

  it('uses data fallback', () => {
    expect(isSplitRecord('', { participant_count: '4u8' })).toBe(true);
    expect(isSplitRecord('', { creditor: 'aleo1xxx' })).toBe(false);
  });
});

describe('isDebtRecord', () => {
  it('identifies debt records', () => {
    expect(isDebtRecord(DEBT_PLAINTEXT)).toBe(true);
  });

  it('rejects split records', () => {
    expect(isDebtRecord(SPLIT_PLAINTEXT)).toBe(false);
  });

  it('uses data fallback', () => {
    expect(isDebtRecord('', { creditor: 'aleo1xxx' })).toBe(true);
    expect(isDebtRecord('', { participant_count: '4u8' })).toBe(false);
  });
});

describe('recordMatchesSplitContext', () => {
  it('matches by salt', () => {
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, '1234567890field')).toBe(true);
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, '1234567890')).toBe(true);
  });

  it('matches by split_id', () => {
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, 'wrong', '987654321field')).toBe(true);
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, 'wrong', '987654321')).toBe(true);
  });

  it('rejects non-matching records', () => {
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, 'wrong_salt')).toBe(false);
  });

  it('handles null/undefined splitId', () => {
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, 'wrong', null)).toBe(false);
    expect(recordMatchesSplitContext(SPLIT_PLAINTEXT, {}, 'wrong', 'null')).toBe(false);
  });
});

describe('getMicrocreditsFromRecord', () => {
  it('extracts from plaintext', () => {
    expect(getMicrocreditsFromRecord({ plaintext: CREDITS_PLAINTEXT })).toBe(5000000);
  });

  it('extracts from data.microcredits', () => {
    expect(getMicrocreditsFromRecord({ data: { microcredits: '5000000u64' } })).toBe(5000000);
  });

  it('extracts from root microcredits', () => {
    expect(getMicrocreditsFromRecord({ microcredits: '3000000u64' })).toBe(3000000);
  });

  it('returns 0 for missing data', () => {
    expect(getMicrocreditsFromRecord({})).toBe(0);
  });
});

describe('buildCreditsRecordPlaintext', () => {
  it('returns existing plaintext', () => {
    const record = { plaintext: CREDITS_PLAINTEXT };
    expect(buildCreditsRecordPlaintext(record)).toBe(CREDITS_PLAINTEXT);
  });

  it('reconstructs from owner + nonce + microcredits', () => {
    const record = {
      owner: 'aleo1abc',
      nonce: '111group',
      data: { microcredits: '5000000u64' },
    };
    const result = buildCreditsRecordPlaintext(record);
    expect(result).toContain('aleo1abc');
    expect(result).toContain('5000000u64');
    expect(result).toContain('111group');
  });

  it('falls back to ciphertext', () => {
    expect(buildCreditsRecordPlaintext({ ciphertext: 'cipher123' })).toBe('cipher123');
    expect(buildCreditsRecordPlaintext({ recordCiphertext: 'cipher456' })).toBe('cipher456');
  });

  it('returns null when nothing works', () => {
    expect(buildCreditsRecordPlaintext({})).toBe(null);
  });
});

describe('getRecordInput', () => {
  it('returns plaintext directly if available', async () => {
    const record = { plaintext: SPLIT_PLAINTEXT };
    const result = await getRecordInput(record);
    expect(result.input).toBe(SPLIT_PLAINTEXT);
    expect(result.plaintext).toBe(SPLIT_PLAINTEXT);
  });

  it('reconstructs from data when no plaintext', async () => {
    const record = {
      owner: 'aleo1abc',
      nonce: '111group',
      data: {
        split_id: '123field.private',
        amount: '500u64.private',
      },
    };
    const result = await getRecordInput(record);
    expect(result.plaintext).toContain('aleo1abc');
    expect(result.plaintext).toContain('split_id');
  });

  it('falls back to ciphertext', async () => {
    const record = { ciphertext: 'encrypted_data' };
    const result = await getRecordInput(record);
    expect(result.input).toBe('encrypted_data');
    expect(result.plaintext).toBe('');
  });

  it('handles string records', async () => {
    const result = await getRecordInput('raw_string_record');
    expect(result.input).toBe('raw_string_record');
    expect(result.plaintext).toBe('raw_string_record');
  });

  it('falls back to raw object', async () => {
    const record = { someField: true };
    const result = await getRecordInput(record);
    expect(result.input).toBe(record);
    expect(result.plaintext).toBe('');
  });
});
