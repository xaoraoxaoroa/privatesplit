# PrivateSplit — Progress Changelog

## Wave 2 (Feb 11 – Feb 25, 2026)

### New: Smart Contract v3 (`private_split_v3.aleo`)
- **Fixed expiry system**: v2 stored relative block count (causing immediate expiry); v3 computes absolute block height in finalize scope using `block.height + (expiry_hours * 360)` — matching NullPay's proven approach
- Added `token_type` field to `SplitMeta` (u8: 0=credits, 1=USDCx) for multi-token readiness
- Added `token_type` to Split record for per-split token tracking
- `create_split` now accepts 5 inputs: `total_amount`, `participant_count`, `salt`, `expiry_hours`, `token_type`
- Input validation: `token_type <= 1` enforced at contract level
- Re-enabled expiry options in frontend (1 hour, 6 hours, 24 hours, 3 days, 1 week)

### Selective Disclosure Audit System (New)
- **`disclose_to_auditor` transition** — creator reveals specific fields to an auditor with ZERO on-chain trace
- **No finalize block** — not even the fact of disclosure is visible on-chain
- **Bitmask-based field selection** — 5 disclosable fields (total_amount, per_person, participant_count, issued_count, token_type)
- **DisclosureReceipt record** — encrypted to auditor, only they can decrypt it
- **ZK proof guarantees** — Aleo proof proves disclosed values came from a real Split record
- **Privacy advantage over competitors** — 0 public mappings vs 11+ in traditional approaches
- **Frontend Audit page** (`/audit`) — full UI for selecting splits, fields, and auditor address
- **`useDisclose` hook** — handles wallet record lookup, transaction execution, and confirmation polling
- **5 new Leo contract tests** (tests 13-17): field mask bits, mask bounds, selective reveal, all-fields mask, DisclosureReceipt construction

### Test Suite (New)
- **17 Leo contract tests** covering: hash determinism, per-person calculation, participant bounds, max debts, salt uniqueness, integer division truncation, token type bounds, expiry blocks, SplitMeta construction, status values, large amounts, minimum splits, field mask bits, selective reveal, disclosure receipt
- **53 Vitest frontend tests** across 3 test files:
  - `format.test.ts` — microToCredits, creditsToMicro, truncateAddress, statusLabel, generateId
  - `record-utils.test.ts` — extractField, parseRecordFields, isSplitRecord, isDebtRecord, recordMatchesSplitContext, getMicrocreditsFromRecord, buildCreditsRecordPlaintext, getRecordInput
  - `aleo-utils.test.ts` — generateSalt, formatAleoInput
- All 53 tests passing

### Multi-Version Program Support
- Frontend now searches v3 → v2 → v1 programs for records (backward compatible with all deployed contracts)
- On-chain mapping queries (`getSplitIdFromMapping`, `getSplitStatus`) try all program versions
- Record extraction uses best-available candidate across all program versions

### Previous v2 Improvements (carried forward)

#### Smart Contract v2 (`private_split_v2.aleo`)
- Upgraded from `private_split_v1.aleo` to `private_split_v2.aleo`
- Added `expiry_height` field to Split record for future expiry enforcement
- `create_split` now accepts 4 inputs (added `expiry_hours: u32`)
- Both v1 and v2 deployed on Aleo Testnet; frontend uses v2 by default

### End-to-End Payment Flow (Fully Working On-Chain)
- **Create Split** → on-chain transaction creates Split record with ZK proof
- **Issue Debt** → creator issues private Debt records to each participant
- **Pay Debt** → participant pays using `credits.aleo/transfer_private`
- **Settle Split** → creator can close the split on-chain
- All transitions confirmed on-chain with real ZK proofs (not mocked)
- Confirmed transactions visible on [Aleo Explorer](https://testnet.explorer.provable.com)

### Shield Wallet Integration (Wave 2 Mandatory)
- Full Shield Wallet support via `@provablehq/aleo-wallet-adaptor-react`
- Robust record extraction: handles opaque/encrypted wallet records via multi-strategy extraction:
  1. Direct plaintext
  2. Decrypt `recordCiphertext`
  3. Reconstruct from `data` + `owner` + `nonce`
  4. Ciphertext passthrough
  5. Raw record object fallback
- Auto `transfer_public_to_private` when payer lacks private credits
- `wallet.adapter.transactionStatus()` polling for reliable TX confirmation
- v2-first program lookup with v1 fallback for backward compatibility
- 4-strategy split_id retrieval: TX output → mapping lookup → wallet history → public chain API

### Privacy Architecture (40% of judging score)
| Data | Where | Visibility |
|------|-------|-----------|
| Split amounts | Records | Only creator |
| Who owes whom | Debt records | Only debtor |
| Payment amounts | Receipt records | Only payer + creator |
| Participant addresses | Records | Only relevant parties |
| Participant count | Mapping | Public (anonymous counter) |
| Payment count | Mapping | Public (anonymous counter) |
| Split status | Mapping | Public (0=active, 1=settled) |

**Key advantage:** `issue_debt` has NO finalize block — zero on-chain trace of debt issuance.

### Frontend — Complete UI (React 18 + TypeScript + Vite)
- **Glassmorphic design system:** Dark fintech aesthetic with transparent cards, backdrop blur
- **Dual typography:** Inter for UI + JetBrains Mono for data
- **9 functional pages:** Dashboard, Create Split, Pay Split, Split Detail, My Splits, History, Explorer, Verification, Privacy
- **QR code generation:** Payment links shareable via QR code
- **Category system:** 8 expense categories (Dinner, Travel, Rent, etc.) with icons
- **Activity charts:** 10-day activity chart + category breakdown on My Splits
- **Real-time TX log:** Live transaction polling status in sidebar
- **Error boundaries, toast notifications, skeleton loading states**
- **Staggered animations via Framer Motion**

### Backend (Vercel Serverless + Supabase)
- Serverless API functions at `/api/` directory
- Supabase (PostgreSQL) for split indexing with in-memory fallback
- REST endpoints: Create, read, update splits; stats; receipts
- CORS headers and proper error handling
- Graceful Supabase error recovery (falls back to in-memory)

### Bug Fixes (Wave 2)
- Fixed record extraction from Shield Wallet (opaque records with empty plaintext)
- Fixed v2 preference — no longer accidentally uses v1 Split records for v2 splits
- Fixed payer Debt record lookup with candidate fallback
- Fixed credits record detection after public-to-private conversion
- Fixed TX ID display — only shows real `at1...` chain IDs, not wallet UUIDs
- Fixed AbortController leak in Dashboard useEffect
- Fixed exponential backoff for wallet sync retries
- Disabled expiry options (v2 contract has relative vs absolute block height bug)

### Confirmed On-Chain Transactions
- `create_split` on v2: Block 14,549,xxx
- `issue_debt` on v2: Block 14,549,308 (`at13hjyjrhutkdkf6juvsnwm4rd96vhfgt2nhvr7ayrwk725puru58s5qp5g0`)
- `pay_debt` on v2: Block 14,550,013 (`at1rc4uj8ju4tzjxd6am2dszk8xqzyy6n6cn90n9c34ff4z4qnewgrskhcjjs`)

### Technical Stats
- 45+ source files
- 0 TypeScript errors
- ~970KB JS bundle (~298KB gzip)
- 9 pages, 8 custom hooks, 7 UI components
- Build time: ~6s

---

## Wave 1 (Jan 20 – Feb 11, 2026)

### Initial Release
- Smart contract `private_split_v1.aleo` deployed on Aleo Testnet
- 4 private record types: Split, Debt, PayerReceipt, CreatorReceipt
- 5 transitions: create_split, issue_debt, pay_debt, settle_split, verify_split
- 2 mappings (minimal public state): splits, split_salts
- Frontend with glassmorphic design, 9 pages
- Shield Wallet integration with 5 wallet adapters
- QR code payment links
- Category-based expense organization
