import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'neutral' | 'amber' | 'rose' | 'emerald';
  description?: string;
  isMonoValue?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'neutral',
  description,
  isMonoValue = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border border-amber-200/70',
          valueColor: 'text-amber-700',
          accentBorder: 'border-l-2 border-l-amber-500',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-700 border border-rose-200/70',
          valueColor: 'text-rose-700',
          accentBorder: 'border-l-2 border-l-rose-500',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
          valueColor: 'text-emerald-800',
          accentBorder: 'border-l-2 border-l-emerald-600',
        };
      case 'neutral':
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 border border-slate-200/80',
          valueColor: 'text-slate-900',
          accentBorder: 'border-l-2 border-l-slate-400',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors ${styles.accentBorder}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2.5">
        <div
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${styles.valueColor} ${
            isMonoValue ? 'font-mono tabular-nums' : ''
          }`}
        >
          {value}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-1 font-normal leading-normal">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

