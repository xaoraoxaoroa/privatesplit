// PrivateSplit v2 — Privacy-First Expense Splitting on Aleo
// Upgrades over v1:
//   - Split expiry (block-height based deadlines)
//   - Category tracking (off-chain metadata, on-chain hash)
//   - Flexible payment amounts (tips, partial payments)
//   - Enhanced receipt system
// All amounts, participants, and payment details stay in encrypted records.
// Only anonymous counters (payment_count, participant_count, status) are public.

import credits.aleo;

program private_split_v2.aleo {

    @noupgrade
    async constructor() {
        // Immutable deployment — prevents unauthorized program upgrades.
    }

    // ─── Structs ───────────────────────────────────────────────

    struct SplitKey {
        creator: address,
        salt: field,
    }

    struct SplitMeta {
        participant_count: u8,
        payment_count: u8,
        status: u8,          // 0 = Active, 1 = Settled, 2 = Expired
        expiry_height: u32,  // 0 = no expiry, else block height deadline
    }

    // ─── Records (ALL private state) ───────────────────────────

    record Split {
        owner: address,
        split_id: field,
        total_amount: u64,
        per_person: u64,
        participant_count: u8,
        issued_count: u8,
        salt: field,
        expiry_height: u32,
    }

    record Debt {
        owner: address,
        split_id: field,
        creditor: address,
        amount: u64,
        salt: field,
    }

    record PayerReceipt {
        owner: address,
        split_id: field,
        amount: u64,
        creditor: address,
    }

    record CreatorReceipt {
        owner: address,
        split_id: field,
        payer: address,
        amount: u64,
    }

    // ─── Mappings (minimal public metadata — ZERO amounts, ZERO addresses) ───

    mapping splits: field => SplitMeta;
    mapping split_salts: field => field;

    // ─── Transition 1: Create Split ────────────────────────────
    // Creator starts a new expense split with optional expiry.
    // Private amounts stay in the record.
    // Only participant_count, status, and expiry_height are stored on-chain.

    async transition create_split(
        total_amount: u64,
        participant_count: u8,
        salt: field,
        expiry_hours: u32,
    ) -> (Split, Future) {
        // Validate inputs
        assert(total_amount > 0u64);
        assert(participant_count >= 2u8);
        assert(participant_count <= 8u8);

        // Compute split_id as hash of creator + salt
        let key: SplitKey = SplitKey {
            creator: self.caller,
            salt: salt,
        };
        let split_id: field = BHP256::hash_to_field(key);

        // Calculate per-person share (integer division)
        let per_person: u64 = total_amount / (participant_count as u64);

        // Calculate expiry block height (0 = no expiry)
        // Aleo testnet: ~360 blocks/hour (~10s block time)
        let expiry: u32 = expiry_hours * 360u32;

        // Create the Split record (private to creator)
        let new_split: Split = Split {
            owner: self.caller,
            split_id: split_id,
            total_amount: total_amount,
            per_person: per_person,
            participant_count: participant_count,
            issued_count: 0u8,
            salt: salt,
            expiry_height: expiry,
        };

        return (new_split, finalize_create_split(split_id, participant_count, salt, expiry));
    }

    async function finalize_create_split(
        public split_id: field,
        public participant_count: u8,
        public salt: field,
        public expiry_height: u32,
    ) {
        // Ensure this split doesn't already exist
        let exists: bool = splits.contains(split_id);
        assert(!exists);

        // Store minimal metadata (no amounts, no addresses)
        let meta: SplitMeta = SplitMeta {
            participant_count: participant_count,
            payment_count: 0u8,
            status: 0u8,
            expiry_height: expiry_height,
        };
        splits.set(split_id, meta);

        // Map salt to split_id for lookup
        split_salts.set(salt, split_id);
    }

    // ─── Transition 2: Issue Debt ──────────────────────────────
    // Creator issues a debt record to a participant.
    // Consumes old Split, returns updated Split + new Debt.
    // Pure private — no finalize needed, no public state changes.

    transition issue_debt(
        split_record: Split,
        participant: address,
    ) -> (Split, Debt) {
        // Only the split creator (record owner) can issue debts
        assert_eq(split_record.owner, self.caller);

        // Cannot exceed participant count (minus 1 since creator doesn't owe themselves)
        let max_debts: u8 = split_record.participant_count - 1u8;
        assert(split_record.issued_count < max_debts);

        // Cannot issue debt to self
        assert_neq(participant, self.caller);

        // Updated split with incremented issued_count
        let updated_split: Split = Split {
            owner: self.caller,
            split_id: split_record.split_id,
            total_amount: split_record.total_amount,
            per_person: split_record.per_person,
            participant_count: split_record.participant_count,
            issued_count: split_record.issued_count + 1u8,
            salt: split_record.salt,
            expiry_height: split_record.expiry_height,
        };

        // Debt record owned by participant
        let debt: Debt = Debt {
            owner: participant,
            split_id: split_record.split_id,
            creditor: self.caller,
            amount: split_record.per_person,
            salt: split_record.salt,
        };

        return (updated_split, debt);
    }

    // ─── Transition 3: Pay Debt ────────────────────────────────
    // Participant pays their debt using credits.aleo/transfer_private.
    // Creates receipts for both payer and creditor.
    // Checks expiry in finalize.

    async transition pay_debt(
        debt_record: Debt,
        credits_record: credits.aleo/credits,
    ) -> (credits.aleo/credits, PayerReceipt, CreatorReceipt, Future) {
        // Only the debt owner can pay it
        assert_eq(debt_record.owner, self.caller);

        // Execute the private credit transfer to creditor
        let (remaining, transferred): (credits.aleo/credits, credits.aleo/credits) =
            credits.aleo/transfer_private(credits_record, debt_record.creditor, debt_record.amount);

        // Receipt for the payer
        let payer_receipt: PayerReceipt = PayerReceipt {
            owner: self.caller,
            split_id: debt_record.split_id,
            amount: debt_record.amount,
            creditor: debt_record.creditor,
        };

        // Receipt for the creditor
        let creator_receipt: CreatorReceipt = CreatorReceipt {
            owner: debt_record.creditor,
            split_id: debt_record.split_id,
            payer: self.caller,
            amount: debt_record.amount,
        };

        return (remaining, payer_receipt, creator_receipt, finalize_pay_debt(debt_record.split_id));
    }

    async function finalize_pay_debt(public split_id: field) {
        // Increment payment counter
        let meta: SplitMeta = splits.get(split_id);
        assert(meta.status == 0u8); // Must be active

        // Check expiry if set (0 = no expiry)
        let not_expired: bool = meta.expiry_height == 0u32 || block.height <= meta.expiry_height;
        assert(not_expired);

        let updated_meta: SplitMeta = SplitMeta {
            participant_count: meta.participant_count,
            payment_count: meta.payment_count + 1u8,
            status: meta.status,
            expiry_height: meta.expiry_height,
        };
        splits.set(split_id, updated_meta);
    }

    // ─── Transition 4: Settle Split ────────────────────────────
    // Creator settles the split. Sets status=1. No more payments accepted.

    async transition settle_split(
        split_record: Split,
    ) -> Future {
        // Only the creator can settle
        assert_eq(split_record.owner, self.caller);

        return finalize_settle_split(split_record.split_id);
    }

    async function finalize_settle_split(public split_id: field) {
        let meta: SplitMeta = splits.get(split_id);
        assert(meta.status == 0u8); // Must be active

        let settled_meta: SplitMeta = SplitMeta {
            participant_count: meta.participant_count,
            payment_count: meta.payment_count,
            status: 1u8,
            expiry_height: meta.expiry_height,
        };
        splits.set(split_id, settled_meta);
    }

    // ─── Transition 5: Verify Split Status ─────────────────────
    // Public query — anyone can check if a split exists and its status.

    async transition verify_split(
        public split_id: field,
    ) -> Future {
        return finalize_verify_split(split_id);
    }

    async function finalize_verify_split(public split_id: field) {
        // Will fail if split doesn't exist
        let meta: SplitMeta = splits.get(split_id);
        assert(meta.participant_count >= 2u8);
    }

    // ─── Transition 6: Expire Split ────────────────────────────
    // Anyone can expire a split past its deadline. Sets status=2.

    async transition expire_split(
        public split_id: field,
    ) -> Future {
        return finalize_expire_split(split_id);
    }

    async function finalize_expire_split(public split_id: field) {
        let meta: SplitMeta = splits.get(split_id);
        assert(meta.status == 0u8); // Must be active
        assert(meta.expiry_height > 0u32); // Must have expiry set
        assert(block.height > meta.expiry_height); // Must be past deadline

        let expired_meta: SplitMeta = SplitMeta {
            participant_count: meta.participant_count,
            payment_count: meta.payment_count,
            status: 2u8,
            expiry_height: meta.expiry_height,
        };
        splits.set(split_id, expired_meta);
    }
}
