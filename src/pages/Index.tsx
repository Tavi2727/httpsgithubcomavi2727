import { useState, useEffect, useCallback } from 'react';
import { executor } from '@/lib/engine/workflow-executor';
import { loanApprovalWorkflow } from '@/lib/engine/loan-workflow';
import { WorkflowRequest } from '@/lib/engine/types';
import { RequestForm } from '@/components/RequestForm';
import { RequestList } from '@/components/RequestList';
import { RequestDetail } from '@/components/RequestDetail';
import { WorkflowConfigView } from '@/components/WorkflowConfigView';
import { StatsCards } from '@/components/StatsCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Workflow, LayoutDashboard, Settings2 } from 'lucide-react';

const Index = () => {
  const [requests, setRequests] = useState<WorkflowRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const config = loanApprovalWorkflow;

  useEffect(() => {
    const unsub = executor.subscribe(() => setRequests([...executor.getRequests()]));
    setRequests([...executor.getRequests()]);
    return () => { unsub(); };
  }, []);

  const handleSubmit = useCallback(async (data: Record<string, unknown>, idempotencyKey: string) => {
    setLoading(true);
    const result = await executor.submitRequest(data, config, idempotencyKey);
    setLoading(false);
    if (result.error && !result.request) {
      toast({ title: 'Validation Error', description: result.error, variant: 'destructive' });
    } else if (result.error && result.request) {
      toast({ title: 'Duplicate Request', description: result.error });
    } else {
      toast({ title: 'Request Submitted', description: `ID: ${result.request!.id.slice(0, 8)}` });
    }
  }, [config, toast]);

  const handleProcess = useCallback(async (id: string) => {
    setProcessingId(id);
    try {
      const result = await executor.processRequest(id, config);
      toast({
        title: `Decision: ${result.status.toUpperCase()}`,
        description: result.status === 'approved' ? 'All stages passed.' : result.status === 'rejected' ? 'Request did not meet criteria.' : 'Requires manual review.',
      });
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    }
    setProcessingId(undefined);
  }, [config, toast]);

  const selectedRequest = selectedId ? executor.getRequest(selectedId) : null;

  if (selectedRequest) {
    return (
      <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
        <RequestDetail request={selectedRequest} config={config} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Workflow className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Decision Engine</h1>
        </div>
        <p className="text-muted-foreground">Configurable workflow decision platform with audit trails and rule evaluation</p>
      </header>

      <StatsCards requests={requests} />

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Settings2 className="h-4 w-4" /> Configuration</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          <RequestForm config={config} onSubmit={handleSubmit} loading={loading} />
          <RequestList requests={requests} config={config} onProcess={handleProcess} onView={setSelectedId} processingId={processingId} />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <WorkflowConfigView config={config} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
