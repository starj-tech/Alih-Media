import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'primary' | 'success' | 'danger';
}

const variantStyles = {
  primary: {
    border: 'border-l-[3px] border-l-[hsl(170,55%,42%)]',
    iconBg: 'bg-[hsl(170,55%,42%)]',
  },
  success: {
    border: 'border-l-[3px] border-l-[hsl(150,50%,45%)]',
    iconBg: 'bg-[hsl(150,50%,45%)]',
  },
  danger: {
    border: 'border-l-[3px] border-l-[hsl(0,65%,51%)]',
    iconBg: 'bg-[hsl(0,65%,51%)]',
  },
};

export default function StatsCard({ title, value, icon: Icon, variant }: StatsCardProps) {
  const style = variantStyles[variant];
  return (
    <div className={`gentelella-panel ${style.border} p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
