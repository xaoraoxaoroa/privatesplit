import { cn } from '../../design-system/cn';

interface TerminalCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'accent' | 'error' | 'stat';
  hoverable?: boolean;
}

export function TerminalCard({ children, title, className, variant = 'default', hoverable = false }: TerminalCardProps) {
  const styles = {
    default: 'border-terminal-border',
    accent: 'border-terminal-green/40 glow-green',
    error: 'border-terminal-red/60',
    stat: 'border-terminal-border glow-top',
  }[variant];

  return (
    <div
      className={cn(
        'bg-terminal-surface border p-4',
        styles,
        hoverable && 'card-hover cursor-pointer',
        className,
      )}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-terminal-border">
          <span className="text-terminal-dim text-[10px] tracking-[0.2em] uppercase font-medium">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
