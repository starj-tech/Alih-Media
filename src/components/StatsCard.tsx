import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'primary' | 'success' | 'danger';
}

const variantClasses = {
  primary: 'gradient-card',
  success: 'gradient-card-success',
  danger: 'gradient-card-danger',
};

export default function StatsCard({ title, value, icon: Icon, variant }: StatsCardProps) {
  return (
    <div className={`${variantClasses[variant]} rounded-xl p-6 shadow-lg text-on-gradient animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}
