import { useState } from 'react';
import { TerminalCard } from '../components/ui';
import { PROGRAM_ID, TESTNET_API } from '../utils/constants';
import { PageTransition } from '../components/PageTransition';
import { CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react';

type Tab = 'overview' | 'contract' | 'privacy' | 'frontend' | 'api' | 'architecture';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'contract', label: 'Smart Contract' },
  { key: 'privacy', label: 'Privacy System' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'api', label: 'Backend API' },
  { key: 'architecture', label: 'Architecture' },
];

function OverviewTab() {
  return (
    <div className="space-y-4">
      <TerminalCard title="WHAT IS PRIVATESPLIT?">
        <div className="text-xs space-y-3">
          <p className="text-white/80">
            PrivateSplit is a privacy-first expense splitting protocol built on the Aleo blockchain.
            It lets groups split bills, manage shared expenses, and settle debts &mdash; all while keeping
            amounts, participants, and payment details completely private.
          </p>
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 space-y-2">
            <p className="text-emerald-400 font-medium">Key Differentiators:</p>
            {[
              'Zero amounts stored in public mappings',
              'Zero addresses stored in public mappings',
              'Debt issuance has NO finalize block (zero trace)',
              'Payments via credits.aleo/transfer_private',
              'Encrypted receipt records for both parties',
            ].map((item) => (
              <p key={item} className="text-white/40 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item}
              </p>
            ))}
          </div>
        </div>
      </TerminalCard>

      <TerminalCard title="QUICK START">
        <div className="text-xs space-y-3">
          <div className="space-y-2">
            {[
              { step: '1', text: 'Install Shield Wallet browser extension', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)', color: 'rgb(52, 211, 153)' },
              { step: '2', text: 'Connect wallet on PrivateSplit', bg: 'rgba(34, 211, 238, 0.1)', border: 'rgba(34, 211, 238, 0.2)', color: 'rgb(34, 211, 238)' },
              { step: '3', text: 'Create a split with amount and participant count', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.2)', color: 'rgb(167, 139, 250)' },
              { step: '4', text: 'Share payment link / QR code with participants', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)', color: 'rgb(251, 191, 36)' },
              { step: '5', text: 'Participants pay via private transfer', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)', color: 'rgb(52, 211, 153)' },
              { step: '6', text: 'Settle the split when all debts are paid', bg: 'rgba(34, 211, 238, 0.1)', border: 'rgba(34, 211, 238, 0.2)', color: 'rgb(34, 211, 238)' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                >
                  {s.step}
                </div>
                <p className="text-white/40 pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

function ContractTab() {
  return (
    <div className="space-y-4">
      <TerminalCard title="PROGRAM INFO">
        <div className="text-xs space-y-2">
          {[
            { label: 'Program ID', value: PROGRAM_ID, mono: true },
            { label: 'Language', value: 'Leo (Aleo)' },
            { label: 'Network', value: 'Aleo Testnet' },
            { label: 'Imports', value: 'credits.aleo' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-white/40">{row.label}</span>
              <span className={row.mono ? 'text-white/80 font-mono text-[11px]' : 'text-white/80'}>{row.value}</span>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="RECORDS (PRIVATE STATE)">
        <div className="text-xs space-y-3">
          {[
            { name: 'Split', fields: 'owner, split_id, total_amount, per_person, participant_count, salt', desc: 'Created by the split creator. Contains all private details.' },
            { name: 'Debt', fields: 'owner, split_id, creditor, amount', desc: 'Issued to each participant. No finalize = zero on-chain trace.' },
            { name: 'PayerReceipt', fields: 'owner, split_id, amount, paid_to', desc: 'Proof of payment for the payer. Encrypted in their wallet.' },
            { name: 'CreatorReceipt', fields: 'owner, split_id, amount, paid_by', desc: 'Proof of receipt for the creator. Encrypted in their wallet.' },
          ].map((r) => (
            <div key={r.name} className="glass-card-subtle p-3 space-y-1.5">
              <p className="text-emerald-400 font-medium font-mono">{r.name}</p>
              <p className="text-white/30 font-mono text-[10px]">{r.fields}</p>
              <p className="text-white/40">{r.desc}</p>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="TRANSITIONS (FUNCTIONS)">
        <div className="text-xs space-y-3">
          {[
            { name: 'create_split', inputs: 'amount, participant_count, salt', finalize: 'Yes (stores anonymous counters)', privacy: 'Record created privately; only counters public' },
            { name: 'issue_debt', inputs: 'split_record, participant_address', finalize: 'NO — zero on-chain trace', privacy: 'Debt record encrypted; no observer can see it' },
            { name: 'pay_debt', inputs: 'debt_record, payment_record', finalize: 'Yes (increments payment counter)', privacy: 'Payment via transfer_private; identity hidden' },
            { name: 'settle_split', inputs: 'split_record', finalize: 'Yes (sets status to 1)', privacy: 'Only split owner can settle' },
            { name: 'verify_split', inputs: 'split_id', finalize: 'Read-only', privacy: 'Public verification of anonymous status' },
          ].map((t) => (
            <div key={t.name} className="glass-card-subtle p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="text-cyan-400 font-mono font-medium">{t.name}()</p>
                {t.finalize.startsWith('NO') && (
                  <span
                    className="px-1.5 py-0.5 text-[9px] rounded font-medium"
                    style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'rgb(251, 191, 36)', border: '1px solid rgba(251, 191, 36, 0.2)' }}
                  >
                    NO FINALIZE
                  </span>
                )}
              </div>
              <p className="text-white/40"><span className="text-white/30">Inputs:</span> {t.inputs}</p>
              <p className="text-white/40"><span className="text-white/30">Finalize:</span> {t.finalize}</p>
              <p className="text-white/40"><span className="text-white/30">Privacy:</span> {t.privacy}</p>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="MAPPINGS (PUBLIC STATE)">
        <div className="text-xs space-y-3">
          <div className="glass-card-subtle p-3">
            <p className="text-amber-400 font-mono font-medium">splits: field =&gt; SplitStatus</p>
            <p className="text-white/40 mt-1">Stores participant_count, payment_count, status (0/1). NO amounts. NO addresses.</p>
          </div>
          <div className="glass-card-subtle p-3">
            <p className="text-amber-400 font-mono font-medium">split_salts: field =&gt; field</p>
            <p className="text-white/40 mt-1">Maps salt to split_id for lookup convenience. Salt is random, reveals nothing.</p>
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="space-y-4">
      <TerminalCard title="PRIVACY MODEL">
        <div className="text-xs space-y-3">
          <p className="text-white/80">
            PrivateSplit achieves privacy through Aleo's native record model and zero-knowledge proofs.
            Here's what each party can and cannot see:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="glass-card-subtle p-3">
              <p className="text-emerald-400 font-medium mb-2">Split Creator</p>
              {['Total amount', 'Per-person share', 'Participant list', 'Payment receipts'].map((item) => (
                <p key={item} className="text-white/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> {item}
                </p>
              ))}
            </div>
            <div className="glass-card-subtle p-3">
              <p className="text-cyan-400 font-medium mb-2">Participant</p>
              {['Their debt amount', 'Who to pay', 'Payment receipt'].map((item) => (
                <p key={item} className="text-white/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> {item}
                </p>
              ))}
              <p className="text-white/40 flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-red-400 shrink-0" /> Other participants
              </p>
            </div>
            <div className="glass-card-subtle p-3">
              <p className="text-amber-400 font-medium mb-2">On-Chain Observer</p>
              {['Amounts', 'Addresses', 'Who owes whom'].map((item) => (
                <p key={item} className="text-white/40 flex items-center gap-1.5">
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" /> {item}
                </p>
              ))}
              <p className="text-white/40 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" /> Participant count
              </p>
            </div>
          </div>
        </div>
      </TerminalCard>

      <TerminalCard title="ZERO-FINALIZE DEBT ISSUANCE">
        <div className="text-xs space-y-3">
          <p className="text-white/80">
            The <span className="text-cyan-400 font-mono">issue_debt</span> transition is our strongest
            privacy feature. It has <span className="text-emerald-400 font-semibold">no finalize block</span>,
            meaning there is literally zero on-chain evidence that a debt was ever issued.
          </p>
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4 font-mono text-[11px] space-y-1">
            <p className="text-white/30">// issue_debt transition</p>
            <p className="text-white/80">transition issue_debt(</p>
            <p className="text-white/80 pl-4">split: Split,</p>
            <p className="text-white/80 pl-4">participant: address</p>
            <p className="text-white/80">) -&gt; (Split, Debt) {'{'}</p>
            <p className="text-white/80 pl-4"><span className="text-white/30">// Creates Debt record privately</span></p>
            <p className="text-white/80 pl-4"><span className="text-white/30">// NO finalize block</span></p>
            <p className="text-white/80 pl-4"><span className="text-white/30">// ZERO on-chain trace</span></p>
            <p className="text-white/80">{'}'}</p>
            <p className="text-emerald-400 mt-2">// The Debt record appears ONLY in the participant's wallet</p>
          </div>
        </div>
      </TerminalCard>

      <TerminalCard title="PAYMENT PRIVACY">
        <div className="text-xs space-y-3">
          <p className="text-white/80">
            Payments use <span className="text-cyan-400 font-mono">credits.aleo/transfer_private</span>.
            This is Aleo's native private credit transfer — the sender, receiver, and amount are all hidden
            by the protocol itself.
          </p>
          <div className="space-y-2">
            {[
              'Sender identity: hidden by ZK proof',
              'Receiver identity: hidden by ZK proof',
              'Amount: hidden by ZK proof',
              'Only the two parties know the transaction happened',
              'Receipt records encrypted separately for each party',
            ].map((item) => (
              <p key={item} className="text-emerald-400 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {item}
              </p>
            ))}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

function FrontendTab() {
  return (
    <div className="space-y-4">
      <TerminalCard title="TECH STACK">
        <div className="text-xs space-y-2">
          {[
            { label: 'Framework', value: 'React 18 + TypeScript' },
            { label: 'Build Tool', value: 'Vite' },
            { label: 'Styling', value: 'Tailwind CSS 4 + glassmorphic design' },
            { label: 'Animations', value: 'Framer Motion' },
            { label: 'Charts', value: 'Recharts' },
            { label: 'QR Codes', value: 'qrcode.react' },
            { label: 'State', value: 'Zustand (persisted)' },
            { label: 'Wallet', value: '@provablehq/aleo-wallet-adaptor-react' },
            { label: 'Routing', value: 'React Router v7' },
            { label: 'Deployment', value: 'Vercel' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-white/40">{row.label}</span>
              <span className="text-white/80">{row.value}</span>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="PAGES">
        <div className="text-xs space-y-2">
          {[
            { path: '/', name: 'Dashboard', desc: 'Landing + stats + activity chart' },
            { path: '/create', name: 'Create Split', desc: 'New split form with validation' },
            { path: '/pay', name: 'Pay Split', desc: 'Payment flow with progress steps' },
            { path: '/split/:hash', name: 'Split Detail', desc: 'Full split info + QR + debt issuance' },
            { path: '/history', name: 'My Splits', desc: 'Filterable split history' },
            { path: '/explorer', name: 'Explorer', desc: 'On-chain lookup by ID, salt, or TX hash' },
            { path: '/privacy', name: 'Privacy', desc: 'How the privacy system works' },
            { path: '/verify', name: 'Verification', desc: 'Scan wallet for receipt records' },
            { path: '/vision', name: 'Vision', desc: 'Roadmap and planned features' },
            { path: '/docs', name: 'Docs', desc: 'Technical documentation' },
            { path: '/connect', name: 'Wallet', desc: 'Wallet connection page' },
          ].map((p) => (
            <div key={p.path} className="flex items-start gap-3 glass-card-subtle p-2.5">
              <span className="text-cyan-400 font-mono text-[10px] shrink-0 w-24">{p.path}</span>
              <span className="text-white/80 font-medium shrink-0 w-24">{p.name}</span>
              <span className="text-white/40">{p.desc}</span>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="DESIGN SYSTEM">
        <div className="text-xs space-y-3">
          <p className="text-white/80">
            Glassmorphic design language with transparent cards, backdrop-blur, and subtle animations.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { color: 'bg-emerald-400', label: 'Green — success, primary actions' },
              { color: 'bg-cyan-400', label: 'Cyan — info, links, active states' },
              { color: 'bg-purple-400', label: 'Purple — accents, creative' },
              { color: 'bg-amber-400', label: 'Amber — warnings, pending' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${c.color}`} />
                <span className="text-white/40 text-[10px]">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

function ApiTab() {
  return (
    <div className="space-y-4">
      <TerminalCard title="BACKEND API">
        <div className="text-xs space-y-3">
          <p className="text-white/80">
            Lightweight REST API for indexing and fast lookups. Deployed as Vercel serverless functions.
          </p>
          <div className="space-y-2">
            {[
              { method: 'GET', path: '/api/splits', desc: 'List recent splits (demo data)' },
              { method: 'GET', path: '/api/splits/:id', desc: 'Get split details by ID' },
              { method: 'POST', path: '/api/splits', desc: 'Index a new split (after on-chain creation)' },
            ].map((endpoint) => (
              <div key={endpoint.path} className="glass-card-subtle p-3 flex items-start gap-3">
                <span className={`font-mono font-medium shrink-0 ${
                  endpoint.method === 'GET' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {endpoint.method}
                </span>
                <span className="text-cyan-400 font-mono">{endpoint.path}</span>
                <span className="text-white/40 ml-auto">{endpoint.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </TerminalCard>

      <TerminalCard title="ALEO TESTNET API">
        <div className="text-xs space-y-2">
          {[
            { label: 'Base URL', value: TESTNET_API },
            { label: 'Mapping Read', value: `${TESTNET_API}/program/${PROGRAM_ID}/mapping/splits/{key}` },
            { label: 'Transaction', value: `${TESTNET_API}/transaction/{tx_id}` },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <span className="text-white/40">{row.label}</span>
              <span className="text-white/80 font-mono text-[10px] break-all bg-black/30 border border-white/[0.06] rounded-lg px-2 py-1">{row.value}</span>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="DATA STORAGE">
        <div className="text-xs space-y-3">
          <p className="text-white/80 font-medium mb-1">Where data lives:</p>
          <div className="space-y-2">
            <div className="glass-card-subtle p-3">
              <p className="text-emerald-400 font-medium">On-Chain (Aleo Testnet)</p>
              <p className="text-white/40 mt-1">Split status mappings (anonymous counters only). All records (Split, Debt, Receipts) encrypted.</p>
            </div>
            <div className="glass-card-subtle p-3">
              <p className="text-cyan-400 font-medium">Client-Side (Zustand + localStorage)</p>
              <p className="text-white/40 mt-1">Split metadata, participant lists, transaction IDs. Persisted locally for fast access.</p>
            </div>
            <div className="glass-card-subtle p-3">
              <p className="text-amber-400 font-medium">Backend API (Vercel Serverless)</p>
              <p className="text-white/40 mt-1">Recent splits index for network activity display. No private data stored.</p>
            </div>
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

function ArchitectureTab() {
  return (
    <div className="space-y-4">
      <TerminalCard title="SYSTEM ARCHITECTURE">
        <div className="font-mono text-[11px] leading-relaxed overflow-x-auto">
          <pre className="text-white/40 whitespace-pre">
{`
  +-----------------------------------------------------+
  |                    FRONTEND                          |
  |  React 18 + TypeScript + Vite + Tailwind            |
  |  +----------+ +----------+ +-------------------+    |
  |  | Zustand   | | React    | | Wallet Adapter    |   |
  |  | Store     | | Router   | | (Shield/Leo/etc)  |   |
  |  +-----+----+ +----------+ +--------+----------+   |
  |        |                             |               |
  |        v                             v               |
  |  +----------------------------------------------+   |
  |  |              Aleo SDK / Wallet API            |   |
  |  |  ProgramManager - RecordProvider - execute()  |   |
  |  +---------------------+------------------------+   |
  +-----------------------+--------------------------+
                          |
                          v
  +-----------------------------------------------------+
  |               ALEO TESTNET                           |
  |  +-----------------------------------------+        |
  |  |          `}<span className="text-emerald-400">{PROGRAM_ID}</span>{`       |        |
  |  |                                         |        |
  |  |  Transitions:                           |        |
  |  |    create_split() --> Split record       |        |
  |  |    issue_debt()   --> Debt record        |        |
  |  |    pay_debt()     --> Receipt records    |        |
  |  |    settle_split() --> Status update      |        |
  |  |                                         |        |
  |  |  Mappings (PUBLIC):                     |        |
  |  |    splits: {count, paid, status}        |        |
  |  |    split_salts: {salt -> split_id}      |        |
  |  |                                         |        |
  |  |  Records (ENCRYPTED):                   |        |
  |  |    Split, Debt, PayerReceipt,           |        |
  |  |    CreatorReceipt                       |        |
  |  +-----------------------------------------+        |
  |                                                      |
  |  +-----------------------------------------+        |
  |  |              credits.aleo                |        |
  |  |  transfer_private() for all payments     |        |
  |  +-----------------------------------------+        |
  +-----------------------------------------------------+
`}
          </pre>
        </div>
      </TerminalCard>

      <TerminalCard title="PRIVACY LAYERS">
        <div className="text-xs space-y-3">
          {[
            { layer: 'L1 — Record Encryption', desc: 'All Aleo records are encrypted by the protocol. Only the record owner can decrypt.', color: 'rgb(52, 211, 153)' },
            { layer: 'L2 — Zero-Knowledge Proofs', desc: 'Every transition generates a ZK proof. Validators verify correctness without seeing inputs.', color: 'rgb(34, 211, 238)' },
            { layer: 'L3 — Nullifiers', desc: 'Spent records are nullified automatically. No double-spending possible. Handled by protocol.', color: 'rgb(167, 139, 250)' },
            { layer: 'L4 — Application Design', desc: 'PrivateSplit stores only anonymous counters in mappings. No amounts, no addresses, no social graph.', color: 'rgb(251, 191, 36)' },
          ].map((l) => (
            <div key={l.layer} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: l.color }} />
              <div>
                <p className="font-medium" style={{ color: l.color }}>{l.layer}</p>
                <p className="text-white/40 mt-0.5">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </TerminalCard>
    </div>
  );
}

const TAB_CONTENT: Record<Tab, () => JSX.Element> = {
  overview: OverviewTab,
  contract: ContractTab,
  privacy: PrivacyTab,
  frontend: FrontendTab,
  api: ApiTab,
  architecture: ArchitectureTab,
};

export function Docs() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const TabComponent = TAB_CONTENT[activeTab];

  return (
    <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)' }}
        >
          <BookOpen className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/90">Documentation</h1>
          <p className="text-xs text-white/40 mt-0.5">Technical reference for PrivateSplit protocol</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium tracking-wide rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-emerald-400'
                : 'text-white/40 hover:text-white/60'
            }`}
            style={activeTab === tab.key ? { background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' } : { border: '1px solid transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <TabComponent />
    </div>
    </PageTransition>
  );
}
