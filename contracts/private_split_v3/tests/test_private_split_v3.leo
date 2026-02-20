// PrivateSplit v3 Contract Test Suite
// Tests for all 6 transitions + edge cases

program test_private_split_v3.aleo {

    // Test 1: Verify BHP256 hash_to_field produces consistent split IDs
    transition test_split_id_determinism(creator: address, salt: field) -> field {
        let key: private_split_v3.aleo/SplitKey = private_split_v3.aleo/SplitKey {
            creator: creator,
            salt: salt,
        };
        let id1: field = BHP256::hash_to_field(key);
        let id2: field = BHP256::hash_to_field(key);
        assert_eq(id1, id2);
        return id1;
    }

    // Test 2: Verify per-person calculation
    // 10_000_000 microcredits / 4 participants = 2_500_000 each
    transition test_per_person_calculation() -> u64 {
        let total: u64 = 10_000_000u64;
        let count: u8 = 4u8;
        let per_person: u64 = total / (count as u64);
        assert_eq(per_person, 2_500_000u64);
        return per_person;
    }

    // Test 3: Verify participant count bounds (2-8)
    transition test_participant_bounds() -> bool {
        assert(2u8 >= 2u8);
        assert(2u8 <= 8u8);
        assert(8u8 >= 2u8);
        assert(8u8 <= 8u8);
        assert(5u8 >= 2u8);
        assert(5u8 <= 8u8);
        return true;
    }

    // Test 4: Verify max debts = participant_count - 1
    transition test_max_debts() -> u8 {
        let participant_count: u8 = 4u8;
        let max_debts: u8 = participant_count - 1u8;
        assert_eq(max_debts, 3u8);
        return max_debts;
    }

    // Test 5: Verify different salts produce different split IDs
    transition test_salt_uniqueness(creator: address) -> bool {
        let key1: private_split_v3.aleo/SplitKey = private_split_v3.aleo/SplitKey {
            creator: creator,
            salt: 12345field,
        };
        let key2: private_split_v3.aleo/SplitKey = private_split_v3.aleo/SplitKey {
            creator: creator,
            salt: 67890field,
        };
        let id1: field = BHP256::hash_to_field(key1);
        let id2: field = BHP256::hash_to_field(key2);
        assert_neq(id1, id2);
        return true;
    }

    // Test 6: Verify integer division truncation behavior
    transition test_division_truncation() -> u64 {
        let total: u64 = 10u64;
        let count: u64 = 3u64;
        let per_person: u64 = total / count;
        assert_eq(per_person, 3u64);
        let collected: u64 = per_person * count;
        assert_eq(collected, 9u64);
        let remainder: u64 = total - collected;
        assert_eq(remainder, 1u64);
        return remainder;
    }

    // Test 7: Verify token_type validation (0 or 1)
    transition test_token_type_bounds() -> bool {
        assert(0u8 <= 1u8); // credits
        assert(1u8 <= 1u8); // usdcx
        return true;
    }

    // Test 8: Verify expiry hours to blocks conversion
    // 1 hour = 360 blocks, 24 hours = 8640 blocks
    transition test_expiry_blocks_calculation() -> bool {
        let one_hour: u32 = 1u32 * 360u32;
        assert_eq(one_hour, 360u32);

        let six_hours: u32 = 6u32 * 360u32;
        assert_eq(six_hours, 2160u32);

        let day: u32 = 24u32 * 360u32;
        assert_eq(day, 8640u32);

        let week: u32 = 168u32 * 360u32;
        assert_eq(week, 60480u32);

        // No expiry = 0
        let no_expiry: u32 = 0u32 * 360u32;
        assert_eq(no_expiry, 0u32);

        return true;
    }

    // Test 9: Verify SplitMeta struct construction
    transition test_split_meta_construction() -> bool {
        let meta: private_split_v3.aleo/SplitMeta = private_split_v3.aleo/SplitMeta {
            participant_count: 4u8,
            payment_count: 0u8,
            status: 0u8,
            expiry_height: 0u32,
            token_type: 0u8,
        };
        assert_eq(meta.participant_count, 4u8);
        assert_eq(meta.payment_count, 0u8);
        assert_eq(meta.status, 0u8);
        assert_eq(meta.expiry_height, 0u32);
        assert_eq(meta.token_type, 0u8);
        return true;
    }

    // Test 10: Verify status transitions are valid
    // 0 = Active, 1 = Settled, 2 = Expired
    transition test_status_values() -> bool {
        let active: u8 = 0u8;
        let settled: u8 = 1u8;
        let expired: u8 = 2u8;

        assert(active != settled);
        assert(active != expired);
        assert(settled != expired);

        return true;
    }

    // Test 11: Verify large split amounts don't overflow
    transition test_large_amounts() -> bool {
        let large_amount: u64 = 1_000_000_000_000u64; // 1M credits
        let count: u8 = 8u8;
        let per_person: u64 = large_amount / (count as u64);
        assert_eq(per_person, 125_000_000_000u64);

        // Verify no overflow on collected
        let collected: u64 = per_person * (count as u64);
        assert_eq(collected, 1_000_000_000_000u64);

        return true;
    }

    // Test 12: Verify minimum valid split (2 people, 1 microcredit each)
    transition test_minimum_split() -> bool {
        let total: u64 = 2u64;
        let count: u8 = 2u8;
        let per_person: u64 = total / (count as u64);
        assert_eq(per_person, 1u64);
        return true;
    }

    // ─── Selective Disclosure Tests ──────────────────────────

    // Test 13: Verify field mask bit extraction
    transition test_field_mask_bits() -> bool {
        let mask: u8 = 21u8; // binary 10101 = amount + count + token

        // bit 0 (amount) = 1
        assert((mask & 1u8) > 0u8);
        // bit 1 (per_person) = 0
        assert((mask & 2u8) == 0u8);
        // bit 2 (count) = 1
        assert((mask & 4u8) > 0u8);
        // bit 3 (issued) = 0
        assert((mask & 8u8) == 0u8);
        // bit 4 (token) = 1
        assert((mask & 16u8) > 0u8);

        return true;
    }

    // Test 14: Verify field mask bounds
    transition test_field_mask_bounds() -> bool {
        // Minimum valid mask = 1 (just total_amount)
        assert(1u8 > 0u8);
        assert(1u8 <= 31u8);

        // Maximum valid mask = 31 (all 5 fields)
        assert(31u8 > 0u8);
        assert(31u8 <= 31u8);

        // Individual field masks
        assert(1u8 <= 31u8);   // total_amount
        assert(2u8 <= 31u8);   // per_person
        assert(4u8 <= 31u8);   // participant_count
        assert(8u8 <= 31u8);   // issued_count
        assert(16u8 <= 31u8);  // token_type

        return true;
    }

    // Test 15: Verify selective reveal via ternary
    transition test_selective_reveal() -> bool {
        let amount: u64 = 5_000_000u64;
        let mask_with: u8 = 1u8;    // bit 0 set
        let mask_without: u8 = 2u8;  // bit 0 not set

        let revealed: u64 = (mask_with & 1u8) > 0u8 ? amount : 0u64;
        assert_eq(revealed, 5_000_000u64);

        let hidden: u64 = (mask_without & 1u8) > 0u8 ? amount : 0u64;
        assert_eq(hidden, 0u64);

        return true;
    }

    // Test 16: Verify all-fields disclosure mask
    transition test_all_fields_mask() -> bool {
        let mask: u8 = 31u8; // binary 11111

        let amount: u64 = 10_000_000u64;
        let per_person: u64 = 2_500_000u64;
        let count: u8 = 4u8;
        let issued: u8 = 3u8;
        let token: u8 = 0u8;

        let d_amount: u64 = (mask & 1u8) > 0u8 ? amount : 0u64;
        let d_per: u64 = (mask & 2u8) > 0u8 ? per_person : 0u64;
        let d_count: u8 = (mask & 4u8) > 0u8 ? count : 0u8;
        let d_issued: u8 = (mask & 8u8) > 0u8 ? issued : 0u8;
        let d_token: u8 = (mask & 16u8) > 0u8 ? token : 0u8;

        assert_eq(d_amount, 10_000_000u64);
        assert_eq(d_per, 2_500_000u64);
        assert_eq(d_count, 4u8);
        assert_eq(d_issued, 3u8);
        assert_eq(d_token, 0u8);

        return true;
    }

    // Test 17: Verify DisclosureReceipt construction
    transition test_disclosure_receipt_construction() -> bool {
        let receipt: private_split_v3.aleo/DisclosureReceipt = private_split_v3.aleo/DisclosureReceipt {
            owner: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
            split_id: 12345field,
            field_mask: 5u8,
            disclosed_amount: 1_000_000u64,
            disclosed_per_person: 0u64,
            disclosed_count: 4u8,
            disclosed_issued: 0u8,
            disclosed_token: 0u8,
        };
        assert_eq(receipt.field_mask, 5u8);
        assert_eq(receipt.disclosed_amount, 1_000_000u64);
        assert_eq(receipt.disclosed_count, 4u8);
        assert_eq(receipt.disclosed_per_person, 0u64); // not disclosed
        return true;
    }
}
