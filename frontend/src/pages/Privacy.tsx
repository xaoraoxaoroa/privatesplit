import { TerminalCard } from '../components/ui';
import { STATUS_SYMBOLS } from '../design-system/tokens';
import { PROGRAM_ID } from '../utils/constants';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg text-terminal-green tracking-wider">HOW PRIVACY WORKS</h1>
        <p className="text-xs text-terminal-dim mt-1">
          Every expense amount, every participant, every debt — encrypted using zero-knowledge proofs
        </p>
      </div>

      {/* The Core Insight */}
      <TerminalCard title="THE PRIVACY GUARANTEE">
        <div className="font-mono text-xs space-y-3">
          <p className="text-terminal-green">
            PrivateSplit stores ZERO amounts and ZERO addresses in any public mapping.
          </p>
          <p className="text-terminal-dim">
            When you split a $120 dinner with 3 friends, all an on-chain observer can see is:
          </p>
          <div className="bg-terminal-bg border border-terminal-border p-4 space-y-1 mt-2">
            <p className="text-terminal-dim">// What the Aleo blockchain shows:</p>
            <p className="text-terminal-text">splits[0x4a8f...] = {'{'}</p>
            <p className="text-terminal-text pl-4">participant_count: <span className="text-terminal-green">3</span></p>
            <p className="text-terminal-text pl-4">payment_count: <span className="text-terminal-green">2</span></p>
            <p className="text-terminal-text pl-4">status: <span className="text-terminal-green">0</span> <span className="text-terminal-dim">// active</span></p>
            <p className="text-terminal-text">{'}'}</p>
            <p className="text-terminal-dim mt-3">// That's it. No amounts. No names. No addresses.</p>
          </div>
        </div>
      </TerminalCard>

      {/* What's Visible vs Hidden */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TerminalCard title="WHAT AN OBSERVER SEES">
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-terminal-amber shrink-0">{STATUS_SYMBOLS.pending}</span>
              <span className="text-terminal-dim">A split exists (anonymous field ID)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-terminal-amber shrink-0">{STATUS_SYMBOLS.pending}</span>
              <span className="text-terminal-dim">3 people are involved (just a count)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-terminal-amber shrink-0">{STATUS_SYMBOLS.pending}</span>
              <span className="text-terminal-dim">2 have paid (just a count)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-terminal-amber shrink-0">{STATUS_SYMBOLS.pending}</span>
              <span className="text-terminal-dim">It's still active (0 or 1)</span>
            </div>
            <div className="border-t border-terminal-border pt-2 mt-3">
              <p className="text-terminal-dim">That's ALL. No amounts, no addresses, no names, no history.</p>
            </div>
          </div>
        </TerminalCard>

        <TerminalCard title="WHAT PARTICIPANTS SEE" variant="accent">
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-terminal-green shrink-0">{STATUS_SYMBOLS.success}</span>
              <span className="text-terminal-text">Creator: total $120, each person owes $40</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-terminal-green shrink-0">{STATUS_SYMBOLS.success}</span>
              <span className="text-terminal-text">Debtor: "I owe Alice $40 for dinner"</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-terminal-green shrink-0">{STATUS_SYMBOLS.success}</span>
              <span className="text-terminal-text">Payer: encrypted receipt proving payment</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-terminal-green shrink-0">{STATUS_SYMBOLS.success}</span>
              <span className="text-terminal-text">Creator: encrypted receipt proving receipt</span>
            </div>
            <div className="border-t border-terminal-border pt-2 mt-3">
              <p className="text-terminal-green">All stored in encrypted Aleo records. Only you can decrypt yours.</p>
            </div>
          </div>
        </TerminalCard>
      </div>

      {/* Data Flow Diagram */}
      <TerminalCard title="DATA FLOW">
        <div className="font-mono text-[11px] leading-relaxed overflow-x-auto">
          <pre className="text-terminal-dim whitespace-pre">
{`
  CREATOR                              PARTICIPANT
    │                                       │
    ├─ create_split(amount, 3, salt)         │
    │   ┌──────────────────────────┐         │
    │   │ Split Record (ENCRYPTED) │         │
    │   │ owner: creator           │         │
    │   │ amount: 120 credits      │         │
    │   │ per_person: 40 credits   │         │
    │   └──────────────────────────┘         │
    │                                        │
    │   On-chain: {count:3, paid:0, status:0}│
    │   `}<span className="text-terminal-amber">NO amounts. NO addresses.</span>{`      │
    │                                        │
    ├─ issue_debt(split, participant)         │
    │   `}<span className="text-terminal-green">★ NO FINALIZE — ZERO on-chain trace</span>{`  │
    │                     ┌─────────────────►│
    │                     │ Debt Record      │
    │                     │ (ENCRYPTED)      │
    │                     │ amount: 40       │
    │                     │ creditor: creator │
    │                     └─────────────────►│
    │                                        │
    │                        pay_debt ◄──────┤
    │   `}<span className="text-terminal-cyan">credits.aleo/transfer_private</span>{`       │
    │   (payer identity HIDDEN by protocol)  │
    │                                        │
    │   ┌──────────────┐  ┌─────────────────►│
    │   │CreatorReceipt│  │ PayerReceipt     │
    │   │ (ENCRYPTED)  │  │ (ENCRYPTED)      │
    │   └──────────────┘  └─────────────────►│
    │                                        │
    │   On-chain: {count:3, `}<span className="text-terminal-green">paid:1</span>{`, status:0}│
    │   `}<span className="text-terminal-amber">Still NO amounts. NO addresses.</span>{`    │
    │                                        │
    ├─ settle_split(split)                   │
    │   On-chain: status → 1 (SETTLED)       │
    │   `}<span className="text-terminal-green">Only record owner can settle</span>{`       │
`}
          </pre>
        </div>
      </TerminalCard>

      {/* Privacy Comparison */}
      <TerminalCard title="PRIVACY COMPARISON">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-terminal-dim text-left">
                <th className="pb-2 pr-4">Data Point</th>
                <th className="pb-2 pr-4">Splitwise</th>
                <th className="pb-2 pr-4">Venmo</th>
                <th className="pb-2 pr-4">Other ZK Apps</th>
                <th className="pb-2 text-terminal-green">PrivateSplit</th>
              </tr>
            </thead>
            <tbody className="text-terminal-text">
              <tr className="border-t border-terminal-border">
                <td className="py-2 pr-4 text-terminal-dim">Amounts visible</td>
                <td className="py-2 pr-4 text-terminal-red">Server sees all</td>
                <td className="py-2 pr-4 text-terminal-red">Server sees all</td>
                <td className="py-2 pr-4 text-terminal-amber">Public inputs</td>
                <td className="py-2 text-terminal-green font-bold">NEVER</td>
              </tr>
              <tr className="border-t border-terminal-border">
                <td className="py-2 pr-4 text-terminal-dim">Addresses visible</td>
                <td className="py-2 pr-4 text-terminal-red">Server sees all</td>
                <td className="py-2 pr-4 text-terminal-red">Public by default</td>
                <td className="py-2 pr-4 text-terminal-amber">Public inputs</td>
                <td className="py-2 text-terminal-green font-bold">NEVER</td>
              </tr>
              <tr className="border-t border-terminal-border">
                <td className="py-2 pr-4 text-terminal-dim">Who owes whom</td>
                <td className="py-2 pr-4 text-terminal-red">Server stores</td>
                <td className="py-2 pr-4 text-terminal-red">N/A</td>
                <td className="py-2 pr-4 text-terminal-amber">On-chain hash</td>
                <td className="py-2 text-terminal-green font-bold">NO TRACE</td>
              </tr>
              <tr className="border-t border-terminal-border">
                <td className="py-2 pr-4 text-terminal-dim">Social graph</td>
                <td className="py-2 pr-4 text-terminal-red">Fully mapped</td>
                <td className="py-2 pr-4 text-terminal-red">Fully mapped</td>
                <td className="py-2 pr-4 text-terminal-amber">Partial</td>
                <td className="py-2 text-terminal-green font-bold">HIDDEN</td>
              </tr>
              <tr className="border-t border-terminal-border">
                <td className="py-2 pr-4 text-terminal-dim">Payment proof</td>
                <td className="py-2 pr-4 text-terminal-dim">None</td>
                <td className="py-2 pr-4 text-terminal-dim">None</td>
                <td className="py-2 pr-4 text-terminal-green">Yes</td>
                <td className="py-2 text-terminal-green font-bold">ENCRYPTED RECEIPTS</td>
              </tr>
              <tr className="border-t border-terminal-border">
                <td className="py-2 pr-4 text-terminal-dim">Self-custody</td>
                <td className="py-2 pr-4 text-terminal-dim">No</td>
                <td className="py-2 pr-4 text-terminal-dim">No</td>
                <td className="py-2 pr-4 text-terminal-green">Yes</td>
                <td className="py-2 text-terminal-green font-bold">YES</td>
              </tr>
            </tbody>
          </table>
        </div>
      </TerminalCard>

      {/* Technical Deep Dive */}
      <TerminalCard title="TECHNICAL DETAILS">
        <div className="space-y-4 text-xs">
          <div>
            <p className="text-terminal-green tracking-widest uppercase mb-1">Record Model (UTXO-like)</p>
            <p className="text-terminal-dim">
              Aleo records are consumed and recreated on each transition. Only the owner can spend them.
              Nullifiers prevent double-spending. Encryption is automatic — no application logic needed.
            </p>
          </div>
          <div>
            <p className="text-terminal-green tracking-widest uppercase mb-1">Zero-Knowledge Proofs</p>
            <p className="text-terminal-dim">
              Every transition generates a ZK proof that the computation was correct without revealing
              the inputs. Validators verify the proof, not the data.
            </p>
          </div>
          <div>
            <p className="text-terminal-green tracking-widest uppercase mb-1">credits.aleo/transfer_private</p>
            <p className="text-terminal-dim">
              Payments use Aleo's native private transfer. Sender identity, receiver identity, and
              amount are all hidden. Observers see only that a transfer occurred.
            </p>
          </div>
          <div>
            <p className="text-terminal-green tracking-widest uppercase mb-1">No Finalize on Debt Issuance</p>
            <p className="text-terminal-dim">
              The <code className="text-terminal-text">issue_debt</code> transition has no finalize block.
              This means there is literally zero on-chain evidence that a debt was issued.
              The encrypted Debt record appears only in the participant's wallet.
            </p>
          </div>
        </div>
      </TerminalCard>

      {/* Program Info */}
      <TerminalCard title="ON-CHAIN PROGRAM">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-terminal-dim">Program ID</span>
            <span className="text-terminal-text">{PROGRAM_ID}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-dim">Network</span>
            <span className="text-terminal-cyan">Aleo Testnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-dim">Transitions</span>
            <span className="text-terminal-text">5 (create, issue, pay, settle, verify)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-dim">Records</span>
            <span className="text-terminal-text">4 (Split, Debt, PayerReceipt, CreatorReceipt)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-dim">Public Mappings</span>
            <span className="text-terminal-text">2 (anonymous counters only)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-dim">Amounts in Mappings</span>
            <span className="text-terminal-green font-bold">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-dim">Addresses in Mappings</span>
            <span className="text-terminal-green font-bold">0</span>
          </div>
          <div className="border-t border-terminal-border pt-2 mt-2">
            <a
              href={`https://testnet.explorer.provable.com/program/${PROGRAM_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-cyan hover:underline"
            >
              {STATUS_SYMBOLS.arrow} View contract on Provable Explorer
            </a>
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
