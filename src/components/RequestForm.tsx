import { useState } from 'react';
import { WorkflowConfig } from '@/lib/engine/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 } from '@/lib/engine/utils';
import { Send } from 'lucide-react';

interface Props {
  config: WorkflowConfig;
  onSubmit: (data: Record<string, unknown>, idempotencyKey: string) => void;
  loading?: boolean;
}

export function RequestForm({ config, onSubmit, loading }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [idempotencyKey] = useState(v4());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processed: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(config.schema)) {
      processed[key] = schema.type === 'number' ? Number(formData[key] || 0) : formData[key] || '';
    }
    onSubmit(processed, idempotencyKey);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Submit New Request</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {Object.entries(config.schema).map(([key, schema]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{schema.label} {schema.required && <span className="text-destructive">*</span>}</Label>
              {key === 'employmentStatus' ? (
                <Select value={formData[key] || ''} onValueChange={v => setFormData(p => ({ ...p, [key]: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={key}
                  type={schema.type === 'number' ? 'number' : 'text'}
                  value={formData[key] || ''}
                  onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={schema.label}
                />
              )}
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
