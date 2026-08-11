import React, { useState } from 'react';
import { SavedFlow, createDefaultBlankFlowData } from '../utils/flowStorage';
import { initialFlowData } from '../data/defaultFlow';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  Clock,
  RotateCcw,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';

interface FlowManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedFlows: SavedFlow[];
  activeFlowId: string;
  onSelectFlow: (flowId: string) => void;
  onCreateNewFlow: (name: string, templateType: 'blank' | 'senac_template') => void;
  onRenameFlow: (flowId: string, newName: string) => void;
  onDuplicateFlow: (flowId: string) => void;
  onDeleteFlow: (flowId: string) => void;
}

export const FlowManagerModal: React.FC<FlowManagerModalProps> = ({
  isOpen,
  onClose,
  savedFlows,
  activeFlowId,
  onSelectFlow,
  onCreateNewFlow,
  onRenameFlow,
  onDuplicateFlow,
  onDeleteFlow,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [templateType, setTemplateType] = useState<'blank' | 'senac_template'>('blank');
  
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setNewFlowName('Novo Fluxo ' + (savedFlows.length + 1));
    setTemplateType('blank');
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;
    onCreateNewFlow(newFlowName.trim(), templateType);
    setIsCreatingNew(false);
    onClose();
  };

  const handleStartRename = (flow: SavedFlow) => {
    setEditingFlowId(flow.id);
    setEditingName(flow.name);
  };

  const handleSaveRename = (flowId: string) => {
    if (editingName.trim()) {
      onRenameFlow(flowId, editingName.trim());
    }
    setEditingFlowId(null);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recente';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gerenciador de Fluxos</h2>
              <p className="text-xs text-slate-400">
                Crie novos fluxos do zero, alterne e salve seus modelos no navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Action Bar: Create New Flow Button */}
          {!isCreatingNew && (
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl">
              <div>
                <h3 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  Criar um Novo Fluxo de Atendimento
                </h3>
                <p className="text-[11px] text-blue-800">
                  Inicie um fluxo limpo do zero para personalizar totalmente para sua empresa.
                </p>
              </div>
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar do Zero</span>
              </button>
            </div>
          )}

          {/* Form to Create New Flow */}
          {isCreatingNew && (
            <form onSubmit={handleConfirmCreate} className="bg-slate-50 border-2 border-blue-500/50 p-4 rounded-xl space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  Configurar Novo Fluxo
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Fluxo:
                </label>
                <input
                  type="text"
                  required
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Ex: Atendimento Clínica Médica, Vendas WhatsApp..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modelo Inicial:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setTemplateType('blank')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      templateType === 'blank'
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {templateType === 'blank' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">✨ Do Zero (Em Branco)</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Inicia apenas com menu de boas-vindas e atendimento IA pronto para editar.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setTemplateType('senac_template')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      templateType === 'senac_template'
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {templateType === 'senac_template' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">🏢 Modelo Senac CE</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Carrega a estrutura completa com submenus de cursos, boletos e processo seletivo.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Criar e Abrir Fluxo</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Saved Flows */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fluxos Salvos ({savedFlows.length})
            </h3>

            <div className="space-y-2">
              {savedFlows.map((flow) => {
                const isActive = flow.id === activeFlowId;
                const isEditingThis = editingFlowId === flow.id;
                const nodeCount = flow.data?.nodes?.length || 0;

                return (
                  <div
                    key={flow.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-50/60 border-blue-400/80 shadow-xs ring-1 ring-blue-400/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Info Side */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2 py-1 bg-white border border-blue-400 rounded text-xs font-bold text-slate-900 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(flow.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-xs font-bold cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingFlowId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 text-xs font-bold cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {flow.name}
                            </h4>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                                <CheckCircle2 className="w-3 h-3" /> Em Uso Atual
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {nodeCount} {nodeCount === 1 ? 'nó' : 'nós'} de atendimento
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Atualizado: {formatDate(flow.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Side */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSelectFlow(flow.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                          title="Carregar este fluxo na tela e no simulador"
                        >
                          Carregar
                        </button>
                      )}

                      <button
                        onClick={() => handleStartRename(flow)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Renomear fluxo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDuplicateFlow(flow.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Duplicar este fluxo"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {savedFlows.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja realmente excluir o fluxo "${flow.name}"?`)) {
                              onDeleteFlow(flow.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir fluxo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            💾 Seus fluxos são salvos automaticamente no armazenamento do navegador.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
