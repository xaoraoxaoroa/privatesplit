# QuietPay — Privacy Model

## Core Principle

**All financial data stays in encrypted records. Only anonymous counters appear on-chain.**

QuietPay uses Aleo's native privacy primitives — records, ZK proofs, and encrypted state — to ensure that expense splitting reveals the absolute minimum to the public blockchain.

## What's Private vs Public

| Data | Storage | Who Can See |
|------|---------|-------------|
| Split amounts (total, per-person) | Split record | Creator only |
| Participant addresses | Debt records | Individual debtor only |
| Who owes whom | Debt records | Debtor + creator |
| Payment amounts | Receipt records | Payer + creator |
| Payment links | Records + off-chain | Link holder only |
| Disclosure details | DisclosureReceipt | Auditor only |
| **Participant count** | **Mapping** | **Public** (anonymous counter) |
| **Payment count** | **Mapping** | **Public** (anonymous counter) |
| **Split status** | **Mapping** | **Public** (0/1/2) |
| **Expiry height** | **Mapping** | **Public** (block number) |
| **Token type** | **Mapping** | **Public** (0 or 1) |

## Privacy Guarantees by Transition

### 1. `create_split` — Private
- Total amount, per-person share: **encrypted in Split record** (creator only)
- Salt: **private** (used for split_id derivation)
- split_id: **public** (hash of creator + salt — cannot reverse to extract creator)
- Finalize stores only: participant_count, status, expiry_height, token_type

### 2. `issue_debt` — Fully Private (No Finalize)
- **Zero on-chain trace** of who received a debt
- Participant address: encrypted in Debt record (only debtor sees it)
- Creditor address: encrypted in Debt record (only debtor sees it)
- Amount: encrypted in Debt record
- No mapping writes, no public state changes

### 3. `pay_debt` — Private Payment
- Uses `credits.aleo/transfer_private` — payer identity hidden
- Payment amount: encrypted in receipt records
- Creditor gets credits via private transfer (not visible on-chain)
- Finalize only increments payment_count (anonymous counter)

### 4. `settle_split` — Minimal Public
- Only changes status from 0 → 1 in mapping
- No amounts or addresses revealed

### 5. `verify_split` — Public Query
- Read-only check that a split exists
- No private data exposed

### 6. `expire_split` — Minimal Public
- Only changes status from 0 → 2 in mapping
- Checks block.height > expiry_height

### 7. `disclose_to_auditor` — Zero On-Chain Trace
- **No finalize block** — the disclosure itself is invisible on-chain
- Creator selects which fields to reveal via bitmask
- Auditor receives encrypted DisclosureReceipt
- ZK proof guarantees disclosed values came from a real Split record
- Not even the fact that a disclosure happened is visible publicly

## Selective Disclosure System

### How It Works

```
Creator's Wallet                          Auditor's Wallet
┌─────────────────┐                      ┌─────────────────┐
│  Split Record    │                      │                 │
│  ├ total: 10M   │                      │                 │
│  ├ per_person: 2.5M                    │                 │
│  ├ count: 4     │  disclose_to_auditor │                 │
│  ├ issued: 3    │ ─────────────────────>│ DisclosureReceipt│
│  └ token: 0     │   field_mask = 5     │  ├ amount: 10M  │
│                  │   (bits 0,2 set)     │  ├ per_person: 0│
│  Split returned  │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  ├ count: 4     │
│  (not consumed)  │                      │  ├ issued: 0    │
└─────────────────┘                      │  └ token: 0     │
                                          └─────────────────┘
                    Zero on-chain trace
                    (no finalize block)
```

### Bitmask Fields

| Bit | Mask | Field | Type |
|-----|------|-------|------|
| 0 | 1 | total_amount | u64 |
| 1 | 2 | per_person | u64 |
| 2 | 4 | participant_count | u8 |
| 3 | 8 | issued_count | u8 |
| 4 | 16 | token_type | u8 |

Example masks:
- `1` (00001) = disclose only total amount
- `5` (00101) = disclose total amount + participant count
- `31` (11111) = disclose all fields

### Privacy Advantage vs Competitors

| Aspect | QuietPay | Traditional Approach |
|--------|----------|---------------------|
| Public mappings for disclosure | **0** | 11+ |
| On-chain verification trail | **None** | Yes |
| Disclosure mechanism | Pure record-to-record | Mapping-based proofs |
| Disclosure visibility | **Invisible** on-chain | Publicly visible |
| ZK proof of authenticity | Yes (native Aleo) | Yes (with mapping anchors) |

## Security Properties

### Record Ownership
- Only the record owner can spend/consume a record (enforced by Aleo protocol)
- Records are encrypted with the owner's view key
- Nullifiers prevent double-spending (handled automatically by Aleo)

### Transition Constraints
- `create_split`: validates total > 0, 2 <= participants <= 8, token_type <= 1
- `issue_debt`: only creator can issue, cannot exceed max debts, cannot self-issue
- `pay_debt`: only debtor can pay, checks split is active and not expired
- `settle_split`: only creator can settle
- `disclose_to_auditor`: only creator can disclose, cannot audit self, mask 1-31

### What an Observer Can See

An observer watching the blockchain can see:
1. That a split was created (split_id appears in mapping)
2. How many participants are in the split
3. How many payments have been made
4. Whether the split is active, settled, or expired
5. The expiry block height (if set)
6. The token type (credits or USDCx)

An observer **cannot** see:
- Who created the split
- How much the split is for
- Who the participants are
- Who paid whom
- How much was paid
- Whether any disclosure has happened
- Who the auditor is
- What was disclosed

## Comparison with Other Privacy Models

### vs Traditional Expense Splitting (Splitwise, Venmo)
- Splitwise/Venmo: all data visible to the platform, often visible to other users
- QuietPay: all financial data encrypted, only anonymous counters public

### vs Other Aleo Payment Apps (NullPay)
- Similar privacy model for core payments
- QuietPay adds: selective disclosure with zero on-chain trace
- QuietPay adds: multi-token type tracking
- QuietPay adds: fixed expiry system (absolute block height)

### vs Mapping-Heavy Approaches (Alpaca Invoice)
- Alpaca uses 11 public mappings as verification anchors for their proof system
- QuietPay uses 2 mappings total (splits + split_salts)
- Disclosure is pure record-to-record with no finalize — invisible on-chain
