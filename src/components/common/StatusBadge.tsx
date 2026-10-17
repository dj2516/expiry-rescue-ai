import React from 'react';
import { AlertTriangle, XCircle, Clock, CheckCircle2, Package } from 'lucide-react';
import { ProductStatus } from '../../types';

interface StatusBadgeProps {
  status: ProductStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  switch (status) {
    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 tracking-wide ${sizeClasses} ${className}`}
        >
          {showIcon && <XCircle className={`${iconSize} text-rose-600 shrink-0`} />}
          <span>Expired</span>
        </span>
      );

    case 'URGENT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-red-50 text-red-700 border border-red-200/80 tracking-wide ${sizeClasses} ${className}`}
        >
          {showIcon && <AlertTriangle className={`${iconSize} text-red-600 shrink-0`} />}
          <span>Urgent (≤3d)</span>
        </span>
      );

    case 'AT RISK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide ${sizeClasses} ${className}`}
        >
          {showIcon && <Clock className={`${iconSize} text-amber-600 shrink-0`} />}
          <span>At Risk (4–7d)</span>
        </span>
      );

    case 'SAFE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 tracking-wide ${sizeClasses} ${className}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSize} text-emerald-600 shrink-0`} />}
          <span>Safe (&gt;7d)</span>
        </span>
      );

    case 'NO EXPIRY DATE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 tracking-wide ${sizeClasses} ${className}`}
        >
          {showIcon && <Package className={`${iconSize} text-slate-500 shrink-0`} />}
          <span>No Expiry</span>
        </span>
      );

    default:
      return null;
  }
};

