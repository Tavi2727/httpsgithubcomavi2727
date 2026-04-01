import { WorkflowConfig } from '@/lib/engine/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Settings2, GitBranch } from 'lucide-react';

interface Props {
  config: WorkflowConfig;
}

export function WorkflowConfigView({ config }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Workflow Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{config.name}</span></div>
            <div><span className="text-muted-foreground">Version:</span> <span className="font-medium">v{config.version}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Description:</span> <span>{config.description}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><GitBranch className="h-5 w-5" /> Stages & Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {config.stages.map((stage, i) => (
              <AccordionItem key={stage.id} value={stage.id}>
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                    {stage.name}
                    {stage.retryable && <Badge variant="outline" className="text-[10px]">Retryable ×{stage.maxRetries}</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-9">
                    {config.rules.filter(r => stage.rules.includes(r.id)).map(rule => (
                      <div key={rule.id} className="p-3 rounded-md bg-muted/50 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant={rule.onFail === 'reject' ? 'destructive' : 'secondary'} className="text-[10px]">
                            on fail: {rule.onFail}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">{rule.description}</p>
                        <code className="text-xs font-mono mt-1 block text-primary">
                          {rule.field} {rule.operator} {JSON.stringify(rule.value)}
                        </code>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
