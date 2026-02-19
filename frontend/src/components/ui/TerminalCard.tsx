import { cn } from '../../design-system/cn';

interface TerminalCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'accent' | 'error' | 'stat' | 'elevated' | 'subtle';
  hoverable?: boolean;
}

export function TerminalCard({ children, title, className, variant = 'default', hoverable = false }: TerminalCardProps) {
  const variantStyles = {
    default: 'glass-card',
    accent: 'glass-card glass-card-accent',
    error: 'glass-card glass-card-error',
    stat: 'glass-card glass-card-stat',
    elevated: 'glass-card-elevated',
    subtle: 'glass-card-subtle',
  }[variant];

  return (
    <div
      className={cn(
        variantStyles,
        'p-5',
        hoverable && 'glass-card-hover',
        className,
      )}
    >
      {title && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
          <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-white/40">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
