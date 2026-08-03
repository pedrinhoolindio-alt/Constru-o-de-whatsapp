import React, { useState } from 'react';
import { FlowData, FlowNode } from '../../types';
import { Plus, Edit3, Trash2, Search, Home, ArrowRight, Copy, MessageCircle } from 'lucide-react';

interface NodeListProps {
  flowData: FlowData;
  currentNodeId: string;
  onEditNode: (node: FlowNode) => void;
  onAddNewNode: () => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (node: FlowNode) => void;
  onSetRootNode: (nodeId: string) => void;
}

export const NodeList: React.FC<NodeListProps> = ({
  flowData,
  currentNodeId,
  onEditNode,
  onAddNewNode,
  onDeleteNode,
  onDuplicateNode,
  onSetRootNode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = flowData.nodes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.triggers.some(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()) || t.key.includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, mensagem ou opção (ex: 1, vendas)..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs"
          />
        </div>

        <button
          onClick={onAddNewNode}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Nó de Conversa</span>
        </button>
      </div>

      {/* Nodes Cards Grid */}
      {filteredNodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Nenhum nó encontrado</p>
          <p className="text-xs text-slate-500">Tente ajustar a busca ou crie um novo nó de atendimento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNodes.map((node) => {
            const isActive = node.id === currentNodeId;

            return (
              <div
                key={node.id}
                className={`bg-white rounded-xl border p-4 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Node Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {node.title}
                    </h4>
                    {node.isRoot ? (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                        <Home className="w-3 h-3" /> Nó Inicial
                      </span>
                    ) : (
                      <button
                        onClick={() => onSetRootNode(node.id)}
                        className="text-[10px] text-slate-500 hover:text-blue-700 hover:bg-slate-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        title="Definir este nó como ponto de partida da conversa"
                      >
                        Tornar Inicial
                      </button>
                    )}
                    {isActive && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Ativo no Simulador
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{node.message}"
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <span className="font-medium text-slate-700">
                      {node.triggers.length} {node.triggers.length === 1 ? 'Opção' : 'Opções'} de Gatilho
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {node.triggers.slice(0, 4).map((t) => (
                        <span key={t.id} className="bg-slate-100 text-slate-700 font-mono px-1.5 py-0.2 rounded text-[10px]">
                          [{t.key}] {t.label}
                        </span>
                      ))}
                      {node.triggers.length > 4 && (
                        <span className="text-[10px] text-slate-400">
                          +{node.triggers.length - 4} mais
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Node Card Actions */}
                <div className="flex items-center gap-1 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <button
                    onClick={() => onEditNode(node)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    title="Editar Nó"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>

                  <button
                    onClick={() => onDuplicateNode(node)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Duplicar Nó"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {!node.isRoot && (
                    <button
                      onClick={() => onDeleteNode(node.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Nó"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
