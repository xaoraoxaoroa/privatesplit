import { cn } from '../../design-system/cn';

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TerminalInput({ label, error, className, ...props }: TerminalInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full h-11 rounded-xl px-4 text-sm font-mono text-white/90',
          'outline-none placeholder:text-white/25',
          error
            ? 'border border-red-400/50 shadow-[0_0_0_3px_rgba(248,113,113,0.08)]'
            : 'border border-white/[0.08] focus:border-emerald-400/40 focus:shadow-[0_0_0_3px_rgba(52,211,153,0.08)]',
          className,
        )}
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        {...props}
      />
      {error && (
        <p className="text-[11px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
