import { FlowData } from '../types';
import { initialFlowData } from '../data/defaultFlow';

export interface SavedFlow {
  id: string;
  name: string;
  updatedAt: string;
  data: FlowData;
}

const STORAGE_KEY_FLOWS = 'whatsapp_simulator_saved_flows_v1';
const STORAGE_KEY_ACTIVE = 'whatsapp_simulator_active_flow_id_v1';

export const createDefaultBlankFlowData = (flowName: string): FlowData => {
  const rootId = 'node_root_' + Date.now();
  return {
    startNodeId: rootId,
    defaultFallback: 'Opção inválida. Por favor, digite o número correspondente a uma das opções do menu.',
    nodes: [
      {
        id: rootId,
        title: '🏠 Menu Inicial',
        isRoot: true,
        message: `👋 Olá! Seja bem-vindo(a) ao *${flowName || 'Novo Atendimento'}*.\n\nComo podemos te ajudar hoje? Digite o número da opção desejada:\n\n1️⃣ *Atendimento e Informações*\n2️⃣ *Atendimento com IA (Gemini)*\n3️⃣ *Falar com Atendente Humano*`,
        triggers: [
          {
            id: 'tr_' + Date.now() + '_1',
            key: '1',
            label: 'Atendimento e Informações',
            action: 'auto_reply',
            autoReplyMessage: 'Obrigado por entrar em contato! Digite *0* para retornar ao menu principal.',
          },
          {
            id: 'tr_' + Date.now() + '_2',
            key: '2',
            label: 'Atendimento com IA',
            action: 'ai_agent',
            targetNodeId: 'node_ai_' + Date.now(),
          },
          {
            id: 'tr_' + Date.now() + '_3',
            key: '3',
            label: 'Falar com Atendente Humano',
            action: 'human',
          },
        ],
      },
      {
        id: 'node_ai_' + Date.now(),
        title: '🤖 Atendimento com IA',
        message: '🤖 *Assistente Virtual com Inteligência Artificial*\n\nComo posso te ajudar hoje? Pode me perguntar qualquer dúvida em texto livre!\n\n*(Digite *0* para retornar ao menu principal)*',
        aiKnowledgeBase: `Base de conhecimento inicial para ${flowName}.\nDescreva aqui os produtos, preços, horários de funcionamento e regras da empresa.`,
        triggers: [
          {
            id: 'tr_ai_exit_' + Date.now(),
            key: '0',
            label: 'Voltar ao Menu Principal',
            action: 'node',
            targetNodeId: rootId,
          },
        ],
      },
    ],
  };
};

export const loadSavedFlowsFromStorage = (): SavedFlow[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FLOWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler fluxos do localStorage:', err);
  }

  // Seed with default initial flow
  const defaultSavedFlow: SavedFlow = {
    id: 'flow_senac_default',
    name: 'Atendimento Senac CE',
    updatedAt: new Date().toISOString(),
    data: initialFlowData,
  };

  saveFlowsToStorage([defaultSavedFlow]);
  return [defaultSavedFlow];
};

export const saveFlowsToStorage = (flows: SavedFlow[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_FLOWS, JSON.stringify(flows));
  } catch (err) {
    console.error('Erro ao salvar fluxos no localStorage:', err);
  }
};

export const loadActiveFlowIdFromStorage = (flows: SavedFlow[]): string => {
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (activeId && flows.some((f) => f.id === activeId)) {
      return activeId;
    }
  } catch (err) {
    console.error('Erro ao ler activeFlowId:', err);
  }

  return flows[0]?.id || 'flow_senac_default';
};

export const saveActiveFlowIdToStorage = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } catch (err) {
    console.error('Erro ao salvar activeFlowId:', err);
  }
};
