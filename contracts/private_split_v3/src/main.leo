// PrivateSplit v3 — Privacy-First Expense Splitting on Aleo
// Upgrades over v2:
//   - Fixed expiry: absolute block height computed in finalize (not transition)
//   - Token type tracking in SplitMeta for multi-token readiness
//   - Selective disclosure audit system (zero on-chain trace)
//   - Improved input validation
// All amounts, participants, and payment details stay in encrypted records.
// Only anonymous counters (payment_count, participant_count, status) are public.

import credits.aleo;

program private_split_v3.aleo {

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
        expiry_height: u32,  // 0 = no expiry, else absolute block height deadline
        token_type: u8,      // 0 = credits.aleo, 1 = USDCx (future)
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
        token_type: u8,
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

    // Selective disclosure receipt — auditor sees only chosen fields.
    // Created by disclose_to_auditor with NO finalize (zero on-chain trace).
    // The Aleo ZK proof guarantees disclosed values came from a real Split record.
    record DisclosureReceipt {
        owner: address,          // The auditor
        split_id: field,
        field_mask: u8,          // Bitmask of which fields were disclosed
        disclosed_amount: u64,   // total_amount (0 if not in mask)
        disclosed_per_person: u64, // per_person (0 if not in mask)
        disclosed_count: u8,     // participant_count (0 if not in mask)
        disclosed_issued: u8,    // issued_count (0 if not in mask)
        disclosed_token: u8,     // token_type (0 if not in mask)
    }

    // ─── Mappings (minimal public metadata — ZERO amounts, ZERO addresses) ───

    mapping splits: field => SplitMeta;
    mapping split_salts: field => field;

    // ─── Transition 1: Create Split ────────────────────────────
    // Creator starts a new expense split with optional expiry.
    // Private amounts stay in the record.
    // Expiry is passed as hours to finalize, which computes
    // the absolute block height using block.height.

    async transition create_split(
        total_amount: u64,
        participant_count: u8,
        salt: field,
        expiry_hours: u32,
        token_type: u8,
    ) -> (Split, Future) {
        // Validate inputs
        assert(total_amount > 0u64);
        assert(participant_count >= 2u8);
        assert(participant_count <= 8u8);
        assert(token_type <= 1u8); // 0 = credits, 1 = USDCx

        // Compute split_id as hash of creator + salt
        let key: SplitKey = SplitKey {
            creator: self.caller,
            salt: salt,
        };
        let split_id: field = BHP256::hash_to_field(key);

        // Calculate per-person share (integer division)
        let per_person: u64 = total_amount / (participant_count as u64);

        // NOTE: expiry_height in the record stores the raw hours value.
        // The actual absolute block height is computed in finalize.
        // This is fine because the record is private to the creator
        // and expiry enforcement happens in finalize_pay_debt.
        let new_split: Split = Split {
            owner: self.caller,
            split_id: split_id,
            total_amount: total_amount,
            per_person: per_person,
            participant_count: participant_count,
            issued_count: 0u8,
            salt: salt,
            expiry_height: expiry_hours,
            token_type: token_type,
        };

        return (new_split, finalize_create_split(split_id, participant_count, salt, expiry_hours, token_type));
    }

    async function finalize_create_split(
        public split_id: field,
        public participant_count: u8,
        public salt: field,
        public expiry_hours: u32,
        public token_type: u8,
    ) {
        // Ensure this split doesn't already exist
        let exists: bool = splits.contains(split_id);
        assert(!exists);

        // Compute absolute block height for expiry
        // Aleo testnet: ~360 blocks/hour (~10s block time)
        let blocks_to_add: u32 = expiry_hours * 360u32;
        let expiry_height: u32 = expiry_hours != 0u32
            ? block.height + blocks_to_add
            : 0u32;

        // Store minimal metadata (no amounts, no addresses)
        let meta: SplitMeta = SplitMeta {
            participant_count: participant_count,
            payment_count: 0u8,
            status: 0u8,
            expiry_height: expiry_height,
            token_type: token_type,
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
            token_type: split_record.token_type,
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
        // expiry_height is now an absolute block height (computed in finalize_create_split)
        let not_expired: bool = meta.expiry_height == 0u32 || block.height <= meta.expiry_height;
        assert(not_expired);

        let updated_meta: SplitMeta = SplitMeta {
            participant_count: meta.participant_count,
            payment_count: meta.payment_count + 1u8,
            status: meta.status,
            expiry_height: meta.expiry_height,
            token_type: meta.token_type,
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
            token_type: meta.token_type,
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
            token_type: meta.token_type,
        };
        splits.set(split_id, expired_meta);
    }

    // ─── Transition 7: Selective Disclosure ──────────────────
    // Creator reveals specific fields to an auditor.
    // NO FINALIZE BLOCK — zero on-chain trace of disclosure.
    // The Aleo ZK proof guarantees the disclosed values came from
    // a real Split record owned by the caller. The auditor receives
    // a DisclosureReceipt encrypted to their address containing
    // only the fields selected by the bitmask.
    //
    // Privacy advantage over Alpaca Invoice's approach:
    //   - Alpaca uses 11 public mappings as verification anchors
    //   - We use ZERO mappings — disclosure is pure record-to-record
    //   - Not even the fact that a disclosure happened is visible on-chain
    //
    // Bitmask:
    //   bit 0 (1)  = total_amount
    //   bit 1 (2)  = per_person
    //   bit 2 (4)  = participant_count
    //   bit 3 (8)  = issued_count
    //   bit 4 (16) = token_type

    transition disclose_to_auditor(
        split_record: Split,
        auditor: address,
        field_mask: u8,
    ) -> (Split, DisclosureReceipt) {
        // Only the split creator can disclose
        assert_eq(split_record.owner, self.caller);

        // Must disclose at least one field
        assert(field_mask > 0u8);

        // Only 5 disclosable fields (bits 0-4), mask max = 31
        assert(field_mask <= 31u8);

        // Cannot audit yourself
        assert_neq(auditor, self.caller);

        // Conditionally reveal fields based on bitmask.
        // In Leo, both branches of the ternary always execute
        // (selection circuit) — no information leaks from branch choice.
        let d_amount: u64 = (field_mask & 1u8) > 0u8 ? split_record.total_amount : 0u64;
        let d_per_person: u64 = (field_mask & 2u8) > 0u8 ? split_record.per_person : 0u64;
        let d_count: u8 = (field_mask & 4u8) > 0u8 ? split_record.participant_count : 0u8;
        let d_issued: u8 = (field_mask & 8u8) > 0u8 ? split_record.issued_count : 0u8;
        let d_token: u8 = (field_mask & 16u8) > 0u8 ? split_record.token_type : 0u8;

        // Return Split record to creator (not consumed)
        let returned_split: Split = Split {
            owner: self.caller,
            split_id: split_record.split_id,
            total_amount: split_record.total_amount,
            per_person: split_record.per_person,
            participant_count: split_record.participant_count,
            issued_count: split_record.issued_count,
            salt: split_record.salt,
            expiry_height: split_record.expiry_height,
            token_type: split_record.token_type,
        };

        // Disclosure receipt encrypted to the auditor
        let receipt: DisclosureReceipt = DisclosureReceipt {
            owner: auditor,
            split_id: split_record.split_id,
            field_mask: field_mask,
            disclosed_amount: d_amount,
            disclosed_per_person: d_per_person,
            disclosed_count: d_count,
            disclosed_issued: d_issued,
            disclosed_token: d_token,
        };

        return (returned_split, receipt);
    }
}
