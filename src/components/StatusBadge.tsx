import { RequestStatus } from '@/lib/engine/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2, RotateCw, Eye } from 'lucide-react';

const config: Record<RequestStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
  processing: { label: 'Processing', icon: Loader2, className: 'bg-primary/10 text-primary' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  manual_review: { label: 'Manual Review', icon: Eye, className: 'bg-warning/10 text-warning' },
  failed: { label: 'Failed', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  retrying: { label: 'Retrying', icon: RotateCw, className: 'bg-warning/10 text-warning' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { label, icon: Icon, className } = config[status];
  return (
    <Badge variant="secondary" className={`gap-1.5 font-medium ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
  );
}
