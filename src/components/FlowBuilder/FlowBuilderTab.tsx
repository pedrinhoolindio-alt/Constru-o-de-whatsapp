import React, { useState } from 'react';
import { FlowData, FlowNode } from '../../types';
import { NodeList } from './NodeList';
import { FlowVisualizer } from './FlowVisualizer';
import { BizagiCanvas } from './BizagiCanvas';
import { NodeEditorModal } from './NodeEditorModal';
import { List, GitFork, AlertCircle, Save, Settings2, Layers } from 'lucide-react';

interface FlowBuilderTabProps {
  flowData: FlowData;
  currentNodeId: string;
  onUpdateFlowData: (newData: FlowData) => void;
  onOpenSimulator?: () => void;
}

export const FlowBuilderTab: React.FC<FlowBuilderTabProps> = ({
  flowData,
  currentNodeId,
  onUpdateFlowData,
  onOpenSimulator,
}) => {
  const [viewMode, setViewMode] = useState<'canvas' | 'list' | 'visual'>('canvas');
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState(flowData.defaultFallback);
  const [isSavedFallback, setIsSavedFallback] = useState(false);

  const handleOpenAddModal = () => {
    setEditingNode(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (node: FlowNode) => {
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const handleSaveNode = (updatedNode: FlowNode) => {
    let newNodes = [...flowData.nodes];

    // If node is marked as root, unmark other nodes
    if (updatedNode.isRoot) {
      newNodes = newNodes.map((n) => ({ ...n, isRoot: false }));
    }

    const existingIndex = newNodes.findIndex((n) => n.id === updatedNode.id);

    if (existingIndex >= 0) {
      newNodes[existingIndex] = updatedNode;
    } else {
      newNodes.push(updatedNode);
    }

    const newStartNodeId = updatedNode.isRoot
      ? updatedNode.id
      : flowData.startNodeId;

    onUpdateFlowData({
      ...flowData,
      nodes: newNodes,
      startNodeId: newStartNodeId,
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    if (flowData.nodes.length <= 1) {
      alert('O fluxo precisa ter pelo menos um nó de atendimento!');
      return;
    }

    const nodeToDelete = flowData.nodes.find((n) => n.id === nodeId);
    if (nodeToDelete?.isRoot) {
      alert('Não é possível excluir o nó inicial do fluxo.');
      return;
    }

    const newNodes = flowData.nodes.filter((n) => n.id !== nodeId);
    onUpdateFlowData({
      ...flowData,
      nodes: newNodes,
    });
  };

  const handleDuplicateNode = (node: FlowNode) => {
    const duplicated: FlowNode = {
      ...node,
      id: 'node_' + Date.now(),
      title: `${node.title} (Cópia)`,
      isRoot: false,
      triggers: node.triggers.map((t) => ({
        ...t,
        id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      })),
    };

    onUpdateFlowData({
      ...flowData,
      nodes: [...flowData.nodes, duplicated],
    });
  };

  const handleSetRootNode = (nodeId: string) => {
    const newNodes = flowData.nodes.map((n) => ({
      ...n,
      isRoot: n.id === nodeId,
    }));

    onUpdateFlowData({
      ...flowData,
      nodes: newNodes,
      startNodeId: nodeId,
    });
  };

  const handleQuickCreateSubnode = (parentTriggerLabel: string): FlowNode => {
    const rootNode = flowData.nodes.find((n) => n.isRoot) || flowData.nodes[0];
    const newSubnodeId = 'node_sub_' + Date.now();
    const title = `Submenu: ${parentTriggerLabel || 'Nova Opção'}`;

    const newSubnode: FlowNode = {
      id: newSubnodeId,
      title,
      message: `*${title}*\n\nVocê selecionou a opção *${parentTriggerLabel}*.\nComo podemos te ajudar especificamente nesta etapa?\n\n1️⃣ Ver Detalhes\n2️⃣ Falar com Atendente\n0️⃣ Voltar ao Menu Principal`,
      isRoot: false,
      triggers: [
        {
          id: `tr_${Date.now()}_1`,
          key: '1',
          label: 'Ver Detalhes do Serviço',
          action: 'auto_reply',
          autoReplyMessage: 'Informações enviadas com sucesso!',
        },
        {
          id: `tr_${Date.now()}_2`,
          key: '2',
          label: 'Falar com Atendente Humano',
          action: 'human',
        },
        {
          id: `tr_${Date.now()}_0`,
          key: '0',
          label: 'Voltar ao Menu Principal',
          action: 'node',
          targetNodeId: rootNode ? rootNode.id : '',
        },
      ],
    };

    const updatedNodes = [...flowData.nodes, newSubnode];
    onUpdateFlowData({
      ...flowData,
      nodes: updatedNodes,
    });

    return newSubnode;
  };

  const handleSaveFallback = () => {
    onUpdateFlowData({
      ...flowData,
      defaultFallback: fallbackMessage,
    });
    setIsSavedFallback(true);
    setTimeout(() => setIsSavedFallback(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* View Mode Switch & Info Banner */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            Construtor de Fluxo (Bot de WhatsApp)
          </h2>
          <p className="text-xs text-slate-500">
            Crie, edite e conecte opções de menu e respostas do atendente robô
          </p>
        </div>

        {/* View Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'canvas'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Modelador Bizagi (Canvas)
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Lista de Nós ({flowData.nodes.length})
          </button>
          <button
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'visual'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" /> Visão Árvore
          </button>
        </div>
      </div>

      {/* Main Mode Content */}
      {viewMode === 'canvas' ? (
        <BizagiCanvas
          flowData={flowData}
          currentNodeId={currentNodeId}
          onUpdateFlowData={onUpdateFlowData}
          onOpenSimulator={onOpenSimulator}
        />
      ) : viewMode === 'list' ? (
        <NodeList
          flowData={flowData}
          currentNodeId={currentNodeId}
          onEditNode={handleOpenEditModal}
          onAddNewNode={handleOpenAddModal}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onSetRootNode={handleSetRootNode}
        />
      ) : (
        <FlowVisualizer
          flowData={flowData}
          currentNodeId={currentNodeId}
          onEditNode={handleOpenEditModal}
          onCreateSubnode={handleQuickCreateSubnode}
        />
      )}

      {/* Fallback Message Setting Card */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <h3 className="font-bold text-xs sm:text-sm">
            Mensagem Padrão de Erro / Opção Inválida (Fallback)
          </h3>
        </div>
        <p className="text-xs text-amber-800">
          Enviada automaticamente pelo Bot quando o cliente digita algo que não corresponde a nenhum gatilho válido no menu.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={fallbackMessage}
            onChange={(e) => setFallbackMessage(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium text-slate-800"
            placeholder="Digite a mensagem de erro padrão..."
          />
          <button
            onClick={handleSaveFallback}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavedFallback ? 'Salvo!' : 'Salvar Erro Padrão'}</span>
          </button>
        </div>
      </div>

      {/* Node Modal */}
      <NodeEditorModal
        node={editingNode}
        allNodes={flowData.nodes}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNode}
        onCreateSubnode={handleQuickCreateSubnode}
      />
    </div>
  );
};
