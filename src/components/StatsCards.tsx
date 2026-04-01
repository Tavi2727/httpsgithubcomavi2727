import { WorkflowRequest } from '@/lib/engine/types';
import { Card, CardContent } from '@/components/ui/card';
import { FileCheck, FileX, Clock, AlertTriangle } from 'lucide-react';

export function StatsCards({ requests }: { requests: WorkflowRequest[] }) {
  const stats = [
    { label: 'Total', value: requests.length, icon: Clock, color: 'text-primary' },
    { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, icon: FileCheck, color: 'text-success' },
    { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, icon: FileX, color: 'text-destructive' },
    { label: 'Review', value: requests.filter(r => r.status === 'manual_review').length, icon: AlertTriangle, color: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
