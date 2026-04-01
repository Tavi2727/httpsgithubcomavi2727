import { WorkflowRequest, WorkflowConfig } from '@/lib/engine/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Play, Eye } from 'lucide-react';

interface Props {
  requests: WorkflowRequest[];
  config: WorkflowConfig;
  onProcess: (id: string) => void;
  onView: (id: string) => void;
  processingId?: string;
}

export function RequestList({ requests, onProcess, onView, processingId }: Props) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No requests yet. Submit one above to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workflow Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {requests.map(req => (
            <div key={req.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{req.id.slice(0, 8)}</span>
                  <StatusBadge status={req.status} />
                </div>
                <p className="mt-1 text-sm font-medium truncate">
                  {String(req.data.applicantName || 'Unknown')} — ${Number(req.data.loanAmount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {req.status === 'pending' && (
                  <Button size="sm" onClick={() => onProcess(req.id)} disabled={!!processingId}>
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Process
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onView(req.id)}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
