import { cn } from '../../design-system/cn';

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function TerminalButton({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}: TerminalButtonProps) {
  const sizeStyles = {
    sm: 'h-8 px-3 text-[11px] gap-1.5 rounded-lg',
    md: 'h-10 px-5 text-xs gap-2 rounded-xl',
    lg: 'h-12 px-6 text-sm gap-2.5 rounded-xl',
  }[size];

  return (
    <button
      className={cn(
        'border font-medium tracking-wider uppercase inline-flex items-center justify-center',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
        sizeStyles,
        variant === 'primary' &&
          'border-emerald-400/30 text-emerald-400 hover:border-emerald-400/50 hover:text-emerald-300 hover:shadow-[0_0_24px_rgba(52,211,153,0.2)] disabled:hover:bg-transparent',
        variant === 'secondary' &&
          'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 hover:bg-white/[0.06] disabled:hover:bg-transparent',
        variant === 'danger' &&
          'border-red-400/30 text-red-400 hover:border-red-400/50 hover:text-red-300 hover:shadow-[0_0_24px_rgba(248,113,113,0.2)] disabled:hover:bg-transparent',
        className,
      )}
      style={{
        background: variant === 'primary'
          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.08))'
          : variant === 'danger'
          ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.08))'
          : 'rgba(255, 255, 255, 0.04)',
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>PROCESSING</span>
        </>
      ) : children}
    </button>
  );
}
