import {
  UtensilsCrossed, ShoppingCart, Home, Plane, Zap, Film, ShoppingBag, FileText,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Plane,
  Zap,
  Film,
  ShoppingBag,
  FileText,
};

interface CategoryIconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = ICON_MAP[name] || FileText;
  return <Icon {...props} />;
}
