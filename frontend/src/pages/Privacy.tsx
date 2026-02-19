import { TerminalCard } from '../components/ui';
import { PROGRAM_ID } from '../utils/constants';
import { PageTransition } from '../components/PageTransition';
import { ExternalLink, Shield, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function Privacy() {
  return (
    <PageTransition>
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}
        >
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/90">How Privacy Works</h1>
          <p className="text-xs text-white/40 mt-0.5">
            Every amount, every participant, every debt — encrypted with zero-knowledge proofs
          </p>
        </div>
      </div>

      {/* The Core Insight */}
      <TerminalCard title="THE PRIVACY GUARANTEE">
        <div className="text-xs space-y-3">
          <p className="text-emerald-400 font-medium">
            PrivateSplit stores ZERO amounts and ZERO addresses in any public mapping.
          </p>
          <p className="text-white/40">
            When you split a $120 dinner with 3 friends, all an on-chain observer can see is:
          </p>
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 font-mono space-y-1 mt-2">
            <p className="text-white/30">// What the Aleo blockchain shows:</p>
            <p className="text-white/80">splits[0x4a8f...] = {'{'}</p>
            <p className="text-white/80 pl-4">participant_count: <span className="text-emerald-400">3</span></p>
            <p className="text-white/80 pl-4">payment_count: <span className="text-emerald-400">2</span></p>
            <p className="text-white/80 pl-4">status: <span className="text-emerald-400">0</span> <span className="text-white/30">// active</span></p>
            <p className="text-white/80">{'}'}</p>
            <p className="text-white/30 mt-3">// That's it. No amounts. No names. No addresses.</p>
          </div>
        </div>
      </TerminalCard>

      {/* What's Visible vs Hidden */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TerminalCard>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-white/40">What an Observer Sees</span>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              'A split exists (anonymous field ID)',
              '3 people are involved (just a count)',
              '2 have paid (just a count)',
              'It\'s still active (0 or 1)',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span className="text-white/40">{item}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.06] pt-3 mt-3">
              <p className="text-white/40">That's ALL. No amounts, no addresses, no names, no history.</p>
            </div>
          </div>
        </TerminalCard>

        <TerminalCard variant="accent">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
            <EyeOff className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-white/40">What Participants See</span>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              'Creator: total $120, each person owes $40',
              'Debtor: "I owe Alice $40 for dinner"',
              'Payer: encrypted receipt proving payment',
              'Creator: encrypted receipt proving receipt',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.06] pt-3 mt-3">
              <p className="text-emerald-400">All stored in encrypted Aleo records. Only you can decrypt yours.</p>
            </div>
          </div>
        </TerminalCard>
      </div>

      {/* Data Flow Diagram */}
      <TerminalCard title="DATA FLOW">
        <div className="font-mono text-[11px] leading-relaxed overflow-x-auto">
          <pre className="text-white/40 whitespace-pre">
{`
  CREATOR                              PARTICIPANT
    |                                       |
    +- create_split(amount, 3, salt)        |
    |   +----------------------------+      |
    |   | Split Record (ENCRYPTED)   |      |
    |   | owner: creator             |      |
    |   | amount: 120 credits        |      |
    |   | per_person: 40 credits     |      |
    |   +----------------------------+      |
    |                                       |
    |   On-chain: {count:3, paid:0, status:0}
    |   `}<span className="text-amber-400">NO amounts. NO addresses.</span>{`       |
    |                                       |
    +- issue_debt(split, participant)        |
    |   `}<span className="text-emerald-400">* NO FINALIZE -- ZERO on-chain trace</span>{` |
    |                     +--------------->|
    |                     | Debt Record    |
    |                     | (ENCRYPTED)    |
    |                     | amount: 40     |
    |                     | creditor: creator
    |                     +--------------->|
    |                                       |
    |                        pay_debt <-----+
    |   `}<span className="text-cyan-400">credits.aleo/transfer_private</span>{`       |
    |   (payer identity HIDDEN by protocol) |
    |                                       |
    |   +--------------+  +--------------->|
    |   |CreatorReceipt|  | PayerReceipt   |
    |   | (ENCRYPTED)  |  | (ENCRYPTED)    |
    |   +--------------+  +--------------->|
    |                                       |
    |   On-chain: {count:3, `}<span className="text-emerald-400">paid:1</span>{`, status:0}
    |   `}<span className="text-amber-400">Still NO amounts. NO addresses.</span>{`     |
    |                                       |
    +- settle_split(split)                  |
    |   On-chain: status -> 1 (SETTLED)     |
    |   `}<span className="text-emerald-400">Only record owner can settle</span>{`        |
`}
          </pre>
        </div>
      </TerminalCard>

      {/* Privacy Comparison */}
      <TerminalCard title="PRIVACY COMPARISON">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/40 text-left">
                <th className="pb-3 pr-4 font-medium">Data Point</th>
                <th className="pb-3 pr-4 font-medium">Splitwise</th>
                <th className="pb-3 pr-4 font-medium">Venmo</th>
                <th className="pb-3 pr-4 font-medium">Other ZK</th>
                <th className="pb-3 text-emerald-400 font-medium">PrivateSplit</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {[
                { point: 'Amounts visible', sw: 'Server sees all', venmo: 'Server sees all', zk: 'Public inputs', ps: 'NEVER' },
                { point: 'Addresses visible', sw: 'Server sees all', venmo: 'Public by default', zk: 'Public inputs', ps: 'NEVER' },
                { point: 'Who owes whom', sw: 'Server stores', venmo: 'N/A', zk: 'On-chain hash', ps: 'NO TRACE' },
                { point: 'Social graph', sw: 'Fully mapped', venmo: 'Fully mapped', zk: 'Partial', ps: 'HIDDEN' },
                { point: 'Payment proof', sw: 'None', venmo: 'None', zk: 'Yes', ps: 'ENCRYPTED RECEIPTS' },
                { point: 'Self-custody', sw: 'No', venmo: 'No', zk: 'Yes', ps: 'YES' },
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/[0.06]">
                  <td className="py-2.5 pr-4 text-white/40">{row.point}</td>
                  <td className="py-2.5 pr-4 text-red-400/80">{row.sw}</td>
                  <td className="py-2.5 pr-4 text-red-400/80">{row.venmo}</td>
                  <td className="py-2.5 pr-4 text-amber-400/80">{row.zk}</td>
                  <td className="py-2.5 text-emerald-400 font-semibold">{row.ps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalCard>

      {/* Technical Details */}
      <TerminalCard title="TECHNICAL DETAILS">
        <div className="space-y-5 text-xs">
          {[
            { title: 'Record Model (UTXO-like)', desc: 'Aleo records are consumed and recreated on each transition. Only the owner can spend them. Nullifiers prevent double-spending. Encryption is automatic.', color: 'rgb(52, 211, 153)' },
            { title: 'Zero-Knowledge Proofs', desc: 'Every transition generates a ZK proof that the computation was correct without revealing the inputs. Validators verify the proof, not the data.', color: 'rgb(34, 211, 238)' },
            { title: 'credits.aleo/transfer_private', desc: 'Payments use Aleo\'s native private transfer. Sender identity, receiver identity, and amount are all hidden.', color: 'rgb(167, 139, 250)' },
            { title: 'No Finalize on Debt Issuance', desc: 'The issue_debt transition has no finalize block. There is literally zero on-chain evidence that a debt was issued. The encrypted Debt record appears only in the participant\'s wallet.', color: 'rgb(251, 191, 36)' },
          ].map((item, i) => (
            <div key={i}>
              <p className="tracking-wider uppercase mb-1.5 font-medium" style={{ color: item.color }}>{item.title}</p>
              <p className="text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Program Info */}
      <TerminalCard title="ON-CHAIN PROGRAM">
        <div className="space-y-2 text-xs">
          {[
            { label: 'Program ID', value: PROGRAM_ID, mono: true },
            { label: 'Network', value: 'Aleo Testnet', color: 'text-cyan-400' },
            { label: 'Transitions', value: '5 (create, issue, pay, settle, verify)' },
            { label: 'Records', value: '4 (Split, Debt, PayerReceipt, CreatorReceipt)' },
            { label: 'Public Mappings', value: '2 (anonymous counters only)' },
            { label: 'Amounts in Mappings', value: '0', color: 'text-emerald-400 font-semibold' },
            { label: 'Addresses in Mappings', value: '0', color: 'text-emerald-400 font-semibold' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-white/40">{item.label}</span>
              <span className={item.color || (item.mono ? 'text-white/80 font-mono text-[11px]' : 'text-white/80')}>{item.value}</span>
            </div>
          ))}
          <div className="border-t border-white/[0.06] pt-3 mt-3">
            <a
              href={`https://testnet.explorer.provable.com/program/${PROGRAM_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
            >
              View contract on Provable Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </TerminalCard>
    </div>
    </PageTransition>
  );
}
