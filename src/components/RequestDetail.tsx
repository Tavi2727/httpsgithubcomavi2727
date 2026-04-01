import { WorkflowRequest, WorkflowConfig } from '@/lib/engine/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, ArrowLeft, FileText, Shield, BarChart3 } from 'lucide-react';

interface Props {
  request: WorkflowRequest;
  config: WorkflowConfig;
  onBack: () => void;
}

export function RequestDetail({ request, config, onBack }: Props) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to list
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{String(request.data.applicantName)}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">ID: {request.id}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {Object.entries(config.schema).map(([key, schema]) => (
              <div key={key}>
                <p className="text-muted-foreground">{schema.label}</p>
                <p className="font-medium">{schema.type === 'number' ? `$${Number(request.data[key]).toLocaleString()}` : String(request.data[key] || '-')}</p>
              </div>
            ))}
            {request.data.creditScore && (
              <div>
                <p className="text-muted-foreground">Credit Score</p>
                <p className="font-medium">{String(request.data.creditScore)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage Results */}
      {request.stageResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Stage Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.stageResults.map((stage, i) => (
              <div key={stage.stageId}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {stage.stageName}
                  </h4>
                  <Badge variant={stage.outcome === 'pass' ? 'default' : 'destructive'} className={stage.outcome === 'pass' ? 'bg-success text-success-foreground' : stage.outcome === 'manual_review' ? 'bg-warning text-warning-foreground' : ''}>
                    {stage.outcome.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {stage.ruleResults.map(rule => (
                    <div key={rule.ruleId} className="flex items-start gap-2 text-sm pl-4">
                      {rule.passed
                        ? <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                      <div>
                        <p className="font-medium">{rule.ruleName}</p>
                        <p className="text-muted-foreground font-mono text-xs">{rule.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 space-y-0">
            {request.auditTrail.map((entry, i) => (
              <div key={entry.id} className="relative pb-4">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                {i < request.auditTrail.length - 1 && <div className="absolute -left-[15px] top-4 bottom-0 w-px bg-border" />}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{entry.action}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm mt-1">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
