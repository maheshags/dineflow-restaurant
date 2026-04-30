import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';
}

const variantMap: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  muted: 'bg-muted text-muted-foreground',
};

const statusToVariant: Record<string, string> = {
  // Order status
  pending: 'warning',
  new: 'info',
  accepted: 'default',
  preparing: 'warning',
  ready: 'info',
  assigned: 'default',
  picked: 'info',
  'out-for-delivery': 'warning',
  out_for_delivery: 'warning',
  delivered: 'success',
  completed: 'success',
  cancelled: 'destructive',
  // Payment status
  paid: 'success',
  failed: 'destructive',
  refunded: 'muted',
  // Stock status
  'in-stock': 'success',
  'low-stock': 'warning',
  'out-of-stock': 'destructive',
  // General
  active: 'success',
  inactive: 'muted',
  published: 'success',
  hidden: 'muted',
  flagged: 'destructive',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const v = variant || statusToVariant[status] || 'default';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${variantMap[v]}`}>
      {status.replace(/[-_]/g, ' ')}
    </span>
  );
}
