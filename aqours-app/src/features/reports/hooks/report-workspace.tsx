import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Message, ReportDetail } from '@aqours/contracts';
import { useCommand } from '@/hooks/use-command';
import { useResource } from '@/hooks/use-resource';

function useWorkspace(id: string) {
  const resource = useResource<ReportDetail>(`/reports/${id}`, true);
  const [text, setText] = useState('');
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);
  const message = useCommand<Message>();
  async function send() {
    if (!text.trim() || message.busy) return;
    const result = await message.execute(`/reports/${id}/messages`, { text: text.trim() });
    if (result) { setText(''); setSentMessageId(result.id); await resource.reload(); }
  }
  return { resource, text, setText, message, sentMessageId, send };
}
type Workspace = ReturnType<typeof useWorkspace>;
const Context = createContext<Workspace | null>(null);

export function ReportWorkspaceProvider({ id, children }: { id: string; children: ReactNode }) {
  return <Context.Provider value={useWorkspace(id)}>{children}</Context.Provider>;
}
export function useReportWorkspace() {
  const workspace = useContext(Context);
  if (!workspace) throw new Error('Report workspace is missing.');
  return workspace;
}
