# QuietPay (PrivateSplit) — Architecture

## System Overview

QuietPay is a privacy-first expense splitting protocol built on the Aleo blockchain. It uses Aleo's zero-knowledge proof system to keep all financial data (amounts, participants, payment details) private, while exposing only minimal anonymous metadata on-chain.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                   │
│  Dashboard · Create · Pay · Audit · Verify · Explorer   │
│  Wallet Adapter · Zustand Store · Framer Motion         │
└────────────────────────┬────────────────────────────────┘
                         │ executeTransaction / requestRecords
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Shield Wallet (Browser)                 │
│  ZK Proof Generation · Record Decryption · Signing      │
└────────────────────────┬────────────────────────────────┘
                         │ Aleo Transactions
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Aleo Blockchain (Testnet)                  │
│                                                          │
│  private_split_v3.aleo                                   │
│  ├── Records: Split, Debt, PayerReceipt,                │
│  │            CreatorReceipt, DisclosureReceipt          │
│  ├── Mappings: splits (SplitMeta), split_salts           │
│  └── Transitions: create_split, issue_debt, pay_debt,    │
│       settle_split, verify_split, expire_split,          │
│       disclose_to_auditor                                │
│                                                          │
│  credits.aleo (native token)                             │
│  └── transfer_private (used by pay_debt)                 │
└─────────────────────────────────────────────────────────┘
```

## Smart Contract: `private_split_v3.aleo`

### Record Types (Private State)

| Record | Owner | Contents | Purpose |
|--------|-------|----------|---------|
| `Split` | Creator | split_id, total_amount, per_person, participant_count, issued_count, salt, expiry_height, token_type | Master record for the split |
| `Debt` | Participant | split_id, creditor, amount, salt | What a participant owes |
| `PayerReceipt` | Payer | split_id, amount, creditor | Proof of payment for payer |
| `CreatorReceipt` | Creator | split_id, payer, amount | Proof of receipt for creator |
| `DisclosureReceipt` | Auditor | split_id, field_mask, disclosed fields | Selective audit proof |

### Mappings (Public State — Minimal)

| Mapping | Key | Value | What's Public |
|---------|-----|-------|---------------|
| `splits` | split_id (field) | SplitMeta | participant_count, payment_count, status, expiry_height, token_type |
| `split_salts` | salt (field) | split_id (field) | Links salt to split_id |

**No amounts, no addresses, no payment details appear in mappings.**

### Transitions

| # | Transition | Inputs | Outputs | Finalize? | Purpose |
|---|-----------|--------|---------|-----------|---------|
| 1 | `create_split` | total_amount, participant_count, salt, expiry_hours, token_type | Split record | Yes | Create new expense split |
| 2 | `issue_debt` | Split record, participant address | Updated Split + Debt record | No | Issue debt to a participant |
| 3 | `pay_debt` | Debt record, credits record | Remaining credits + PayerReceipt + CreatorReceipt | Yes | Pay debt via credits.aleo |
| 4 | `settle_split` | Split record | — | Yes | Mark split as settled |
| 5 | `verify_split` | split_id | — | Yes | Verify split exists on-chain |
| 6 | `expire_split` | split_id | — | Yes | Expire a past-deadline split |
| 7 | `disclose_to_auditor` | Split record, auditor address, field_mask | Split record + DisclosureReceipt | **No** | Selective disclosure (zero trace) |

### Expiry System (v3 Fix)

```
Frontend: expiry_hours (e.g., 24)
    │
    ▼ passed as u32 to transition
Transition: stores expiry_hours in Split record
    │
    ▼ passed to finalize
Finalize: computes block.height + (expiry_hours * 360)
    │
    ▼ absolute block height stored in SplitMeta
Pay Debt Finalize: asserts block.height <= meta.expiry_height
```

v2 bug: computed relative blocks in transition (no access to `block.height`), causing immediate expiry. v3 computes the absolute deadline in finalize where `block.height` is available.

## Frontend Architecture

### Tech Stack
- **Framework:** React 18 + TypeScript
- **Build:** Vite 7
- **State:** Zustand (persistent store for splits, ephemeral store for logs)
- **Styling:** Tailwind CSS + glassmorphism design system
- **Animations:** Framer Motion
- **Wallet:** @provablehq/aleo-wallet-adaptor-react (Shield Wallet)
- **Charts:** Recharts

### Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useCreateSplit` | hooks/useCreateSplit.ts | Create split on-chain |
| `useIssueDebt` | hooks/useIssueDebt.ts | Issue debt records to participants |
| `usePaySplit` | hooks/usePaySplit.ts | Pay debt with credits |
| `useSettleSplit` | hooks/useSettleSplit.ts | Settle/close a split |
| `useDisclose` | hooks/useDisclose.ts | Selective disclosure to auditor |

### Multi-Version Program Support

The frontend searches records across all deployed program versions:

```
v3 (primary) → v2 (fallback) → v1 (legacy)
```

This ensures backward compatibility with splits created on older contract versions.

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview, recent splits, quick actions |
| Create Split | `/create` | Form to create new split |
| Pay Split | `/pay` | Pay a debt via payment link |
| Split Detail | `/split/:hash` | View split details, issue debts, settle |
| My Splits | `/my-splits` | All user's splits with charts |
| Explorer | `/explorer` | On-chain data explorer |
| Verification | `/verify` | Scan wallet for payment receipts |
| Audit | `/audit` | Selective disclosure to auditor |
| Privacy | `/privacy` | Privacy model explanation |
| Vision | `/vision` | Project roadmap |
| Docs | `/docs` | Technical documentation |
| Connect | `/connect` | Wallet connection |

## Data Flow

### Create Split Flow
```
User fills form → useCreateSplit → Shield Wallet signs TX
    → Aleo: create_split transition
        → Split record → Creator's wallet (encrypted)
        → Finalize: SplitMeta stored in mapping
    → Frontend: saves to Zustand store
```

### Payment Flow
```
Payer opens payment link → usePaySplit
    → Finds Debt record in wallet
    → Shield Wallet: pay_debt(Debt, credits)
        → credits.aleo/transfer_private → Creditor gets credits
        → PayerReceipt → Payer's wallet
        → CreatorReceipt → Creator's wallet
        → Finalize: increment payment_count
```

### Selective Disclosure Flow
```
Creator opens /audit → useDisclose
    → Selects Split, fields, auditor address
    → Shield Wallet: disclose_to_auditor(Split, auditor, mask)
        → Split returned to Creator (not consumed)
        → DisclosureReceipt → Auditor's wallet (encrypted)
        → NO finalize block (zero on-chain trace)
    → ZK proof guarantees values came from real Split record
```

## Test Suite

### Contract Tests (Leo)
17 tests in `contracts/private_split_v3/tests/test_private_split_v3.leo`:
- Hash determinism, per-person calculation, participant bounds
- Salt uniqueness, division truncation, token type bounds
- Expiry block calculation, SplitMeta construction, status values
- Large amounts, minimum splits
- Field mask bits, selective reveal, disclosure receipt

### Frontend Tests (Vitest)
53 tests across 3 files:
- `format.test.ts` — formatting utilities
- `record-utils.test.ts` — record parsing and extraction
- `aleo-utils.test.ts` — Aleo utility functions
