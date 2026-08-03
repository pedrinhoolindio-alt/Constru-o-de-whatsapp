export type TriggerAction = 'node' | 'auto_reply' | 'human' | 'ai_agent';

export interface Trigger {
  id: string;
  key: string; // e.g. "1", "2", "vendas"
  label: string; // e.g. "Vendas & Orçamentos"
  action: TriggerAction;
  targetNodeId?: string; // used if action === 'node' or 'ai_agent'
  autoReplyMessage?: string; // used if action === 'auto_reply'
}

export interface FlowNode {
  id: string;
  title: string;
  message: string;
  triggers: Trigger[];
  isRoot?: boolean;
  fallbackMessage?: string;
  aiKnowledgeBase?: string; // Base de conhecimento/contexto para o nó de atendimento IA
}

export interface FlowData {
  nodes: FlowNode[];
  startNodeId: string;
  defaultFallback: string;
}

export type SenderType = 'client' | 'bot' | 'human_agent' | 'system';

export interface ChatMessage {
  id: string;
  sender: SenderType;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  quickOptions?: { key: string; label: string }[];
}

export interface AttendantState {
  isHumanActive: boolean;
  agentName: string;
  clientName: string;
  clientPhone: string;
  unreadCount: number;
  notes: string;
}
