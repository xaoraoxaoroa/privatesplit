import { cn } from '../../design-system/cn';

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export function TerminalButton({
  children,
  variant = 'primary',
  loading,
  className,
  disabled,
  ...props
}: TerminalButtonProps) {
  const styles = {
    primary: 'border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-terminal-bg btn-glow',
    secondary: 'border-terminal-border text-terminal-dim hover:border-terminal-text hover:text-terminal-text',
    danger: 'border-terminal-red text-terminal-red hover:bg-terminal-red hover:text-terminal-bg',
  }[variant];

  return (
    <button
      className={cn(
        'border px-4 py-2 text-xs font-mono tracking-widest uppercase transition-all duration-200',
        'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none',
        styles,
        loading && 'animate-pulse',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '[ ... ]' : `[ ${children} ]`}
    </button>
  );
}
