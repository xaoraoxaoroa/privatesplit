import { PROGRAM_ID, PROGRAM_ID_V2, PROGRAM_ID_V1, TESTNET_API, POLL_INTERVAL, POLL_MAX_ATTEMPTS } from './constants';

// All program versions to search (newest first)
const ALL_PROGRAMS = [PROGRAM_ID, PROGRAM_ID_V2, PROGRAM_ID_V1];

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  const bigInt = BigInt('0x' + hex);
  return bigInt.toString() + 'field';
}

export async function getSplitIdFromMapping(salt: string): Promise<string | null> {
  // Try all program versions (split may exist on v1, v2, or v3)
  for (const programId of ALL_PROGRAMS) {
    try {
      const url = `${TESTNET_API}/program/${programId}/mapping/split_salts/${salt}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const val = await res.json();
      if (val) return val.toString().replace(/(['"])/g, '');
    } catch {
      // Mapping query failed — try next program
    }
  }
  return null;
}

function parseSplitMeta(data: any): { participant_count: number; payment_count: number; status: number } | null {
  // Handle both string and object responses from the API
  if (typeof data === 'string') {
    const pcMatch = data.match(/participant_count:\s*(\d+)u8/);
    const pmMatch = data.match(/payment_count:\s*(\d+)u8/);
    const stMatch = data.match(/status:\s*(\d+)u8/);
    if (!pcMatch || !pmMatch || !stMatch) return null;
    return {
      participant_count: parseInt(pcMatch[1]),
      payment_count: parseInt(pmMatch[1]),
      status: parseInt(stMatch[1]),
    };
  } else if (typeof data === 'object') {
    const pc = data.participant_count;
    const pm = data.payment_count;
    const st = data.status;
    return {
      participant_count: typeof pc === 'string' ? parseInt(pc.replace(/u8/g, '').trim()) : (pc || 0),
      payment_count: typeof pm === 'string' ? parseInt(pm.replace(/u8/g, '').trim()) : (pm || 0),
      status: typeof st === 'string' ? parseInt(st.replace(/u8/g, '').trim()) : (st || 0),
    };
  }
  return null;
}

export async function getSplitStatus(splitId: string): Promise<{ participant_count: number; payment_count: number; status: number } | null> {
  if (!splitId || splitId === 'null' || splitId === 'undefined') return null;
  // Try all program versions
  for (const programId of ALL_PROGRAMS) {
    try {
      const url = `${TESTNET_API}/program/${programId}/mapping/splits/${splitId}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data) continue;
      const parsed = parseSplitMeta(data);
      if (parsed) return parsed;
    } catch {
      // Status query failed — try next program
    }
  }
  return null;
}

export async function getTransactionStatus(txId: string): Promise<string | null> {
  try {
    const url = `${TESTNET_API}/transaction/${txId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.status || data?.type || 'confirmed';
  } catch {
    return null;
  }
}

export async function pollTransaction(
  txId: string,
  onStatus?: (msg: string) => void,
): Promise<boolean> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    onStatus?.(`Polling transaction... attempt ${i + 1}/${POLL_MAX_ATTEMPTS}`);
    try {
      const status = await getTransactionStatus(txId);
      if (status) return true;
    } catch {
      // continue polling
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  return false;
}

export function formatAleoInput(value: string | number, type: string): string {
  switch (type) {
    case 'u8': return `${value}u8`;
    case 'u64': return `${value}u64`;
    case 'field': return String(value).endsWith('field') ? String(value) : `${value}field`;
    case 'address': return String(value);
    default: return String(value);
  }
}
