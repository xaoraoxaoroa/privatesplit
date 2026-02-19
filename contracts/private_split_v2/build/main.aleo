import credits.aleo;
program private_split_v2.aleo;

record Split:
    owner as address.private;
    split_id as field.private;
    total_amount as u64.private;
    per_person as u64.private;
    participant_count as u8.private;
    issued_count as u8.private;
    salt as field.private;
    expiry_height as u32.private;

record Debt:
    owner as address.private;
    split_id as field.private;
    creditor as address.private;
    amount as u64.private;
    salt as field.private;

record PayerReceipt:
    owner as address.private;
    split_id as field.private;
    amount as u64.private;
    creditor as address.private;

record CreatorReceipt:
    owner as address.private;
    split_id as field.private;
    payer as address.private;
    amount as u64.private;

struct SplitKey:
    creator as address;
    salt as field;

struct SplitMeta:
    participant_count as u8;
    payment_count as u8;
    status as u8;
    expiry_height as u32;

mapping splits:
    key as field.public;
    value as SplitMeta.public;

mapping split_salts:
    key as field.public;
    value as field.public;

function create_split:
    input r0 as u64.private;
    input r1 as u8.private;
    input r2 as field.private;
    input r3 as u32.private;
    gt r0 0u64 into r4;
    assert.eq r4 true;
    gte r1 2u8 into r5;
    assert.eq r5 true;
    lte r1 8u8 into r6;
    assert.eq r6 true;
    cast self.caller r2 into r7 as SplitKey;
    hash.bhp256 r7 into r8 as field;
    cast r1 into r9 as u64;
    div r0 r9 into r10;
    mul r3 360u32 into r11;
    cast self.caller r8 r0 r10 r1 0u8 r2 r11 into r12 as Split.record;
    async create_split r8 r1 r2 r11 into r13;
    output r12 as Split.record;
    output r13 as private_split_v2.aleo/create_split.future;

finalize create_split:
    input r0 as field.public;
    input r1 as u8.public;
    input r2 as field.public;
    input r3 as u32.public;
    contains splits[r0] into r4;
    not r4 into r5;
    assert.eq r5 true;
    cast r1 0u8 0u8 r3 into r6 as SplitMeta;
    set r6 into splits[r0];
    set r0 into split_salts[r2];

function issue_debt:
    input r0 as Split.record;
    input r1 as address.private;
    assert.eq r0.owner self.caller;
    sub r0.participant_count 1u8 into r2;
    lt r0.issued_count r2 into r3;
    assert.eq r3 true;
    assert.neq r1 self.caller;
    add r0.issued_count 1u8 into r4;
    cast self.caller r0.split_id r0.total_amount r0.per_person r0.participant_count r4 r0.salt r0.expiry_height into r5 as Split.record;
    cast r1 r0.split_id self.caller r0.per_person r0.salt into r6 as Debt.record;
    output r5 as Split.record;
    output r6 as Debt.record;

function pay_debt:
    input r0 as Debt.record;
    input r1 as credits.aleo/credits.record;
    assert.eq r0.owner self.caller;
    call credits.aleo/transfer_private r1 r0.creditor r0.amount into r2 r3;
    cast self.caller r0.split_id r0.amount r0.creditor into r4 as PayerReceipt.record;
    cast r0.creditor r0.split_id self.caller r0.amount into r5 as CreatorReceipt.record;
    async pay_debt r0.split_id into r6;
    output r2 as credits.aleo/credits.record;
    output r4 as PayerReceipt.record;
    output r5 as CreatorReceipt.record;
    output r6 as private_split_v2.aleo/pay_debt.future;

finalize pay_debt:
    input r0 as field.public;
    get splits[r0] into r1;
    is.eq r1.status 0u8 into r2;
    assert.eq r2 true;
    is.eq r1.expiry_height 0u32 into r3;
    lte block.height r1.expiry_height into r4;
    or r3 r4 into r5;
    assert.eq r5 true;
    add r1.payment_count 1u8 into r6;
    cast r1.participant_count r6 r1.status r1.expiry_height into r7 as SplitMeta;
    set r7 into splits[r0];

function settle_split:
    input r0 as Split.record;
    assert.eq r0.owner self.caller;
    async settle_split r0.split_id into r1;
    output r1 as private_split_v2.aleo/settle_split.future;

finalize settle_split:
    input r0 as field.public;
    get splits[r0] into r1;
    is.eq r1.status 0u8 into r2;
    assert.eq r2 true;
    cast r1.participant_count r1.payment_count 1u8 r1.expiry_height into r3 as SplitMeta;
    set r3 into splits[r0];

function verify_split:
    input r0 as field.public;
    async verify_split r0 into r1;
    output r1 as private_split_v2.aleo/verify_split.future;

finalize verify_split:
    input r0 as field.public;
    get splits[r0] into r1;
    gte r1.participant_count 2u8 into r2;
    assert.eq r2 true;

function expire_split:
    input r0 as field.public;
    async expire_split r0 into r1;
    output r1 as private_split_v2.aleo/expire_split.future;

finalize expire_split:
    input r0 as field.public;
    get splits[r0] into r1;
    is.eq r1.status 0u8 into r2;
    assert.eq r2 true;
    gt r1.expiry_height 0u32 into r3;
    assert.eq r3 true;
    gt block.height r1.expiry_height into r4;
    assert.eq r4 true;
    cast r1.participant_count r1.payment_count 2u8 r1.expiry_height into r5 as SplitMeta;
    set r5 into splits[r0];

constructor:
    assert.eq edition 0u16;
