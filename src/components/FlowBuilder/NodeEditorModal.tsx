import React, { useState, useEffect } from 'react';
import { FlowNode, Trigger, TriggerAction } from '../../types';
import { parseWhatsAppMarkdown } from '../../utils/formatters';
import { X, Plus, Trash2, ArrowRight, CornerDownRight, Check, Sparkles, MessageSquare, GripVertical, ChevronUp, ChevronDown, Hash } from 'lucide-react';

interface NodeEditorModalProps {
  node: FlowNode | null;
  allNodes: FlowNode[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: FlowNode) => void;
  onCreateSubnode?: (label: string) => FlowNode;
}

export const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  node,
  allNodes,
  isOpen,
  onClose,
  onSave,
  onCreateSubnode,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState('');
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isRoot, setIsRoot] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [createdSubnodeSuccess, setCreatedSubnodeSuccess] = useState<string | null>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleMoveTrigger = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= triggers.length) return;
    const newTriggers = [...triggers];
    const [moved] = newTriggers.splice(index, 1);
    newTriggers.splice(targetIndex, 0, moved);
    setTriggers(newTriggers);
  };

  const handleReorderTriggers = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= triggers.length) return;
    const newTriggers = [...triggers];
    const [moved] = newTriggers.splice(fromIndex, 1);
    newTriggers.splice(toIndex, 0, moved);
    setTriggers(newTriggers);
  };

  const handleRenumberTriggers = () => {
    const renumbered = triggers.map((t, idx) => ({
      ...t,
      key: String(idx + 1),
    }));
    setTriggers(renumbered);
  };

  useEffect(() => {
    if (node) {
      setTitle(node.title || '');
      setMessage(node.message || '');
      setAiKnowledgeBase(node.aiKnowledgeBase || '');
      setTriggers(node.triggers ? [...node.triggers] : []);
      setIsRoot(!!node.isRoot);
    } else {
      // New Node default template
      setTitle('Novo Submenu');
      setMessage('Escreva aqui a mensagem que o bot enviará para o cliente...');
      setAiKnowledgeBase('');
      setTriggers([
        {
          id: 'tr_' + Date.now() + '_1',
          key: '1',
          label: 'Opção 1',
          action: 'auto_reply',
          autoReplyMessage: 'Resposta da opção 1',
        },
        {
          id: 'tr_' + Date.now() + '_0',
          key: '0',
          label: 'Voltar ao Menu Principal',
          action: 'node',
          targetNodeId: allNodes.find(n => n.isRoot)?.id || allNodes[0]?.id || '',
        },
      ]);
      setIsRoot(false);
    }
  }, [node, isOpen, allNodes]);

  if (!isOpen) return null;

  const handleAddTrigger = () => {
    const newTrig: Trigger = {
      id: 'tr_' + Date.now(),
      key: String(triggers.length + 1),
      label: `Nova Opção ${triggers.length + 1}`,
      action: 'node',
      targetNodeId: allNodes[0]?.id || '',
    };
    setTriggers([...triggers, newTrig]);
  };

  const handleRemoveTrigger = (id: string) => {
    setTriggers(triggers.filter((t) => t.id !== id));
  };

  const handleUpdateTrigger = (id: string, fields: Partial<Trigger>) => {
    setTriggers(
      triggers.map((t) => (t.id === id ? { ...t, ...fields } : t))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedNode: FlowNode = {
      id: node ? node.id : 'node_' + Date.now(),
      title: title.trim() || 'Nó Sem Título',
      message: message.trim(),
      triggers,
      isRoot,
      aiKnowledgeBase: aiKnowledgeBase.trim() || undefined,
    };
    onSave(updatedNode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800/80 rounded-lg text-emerald-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {node ? 'Editar Nó de Atendimento' : 'Criar Novo Nó do Fluxo'}
              </h3>
              <p className="text-xs text-emerald-200">
                Configure as mensagens e opções de resposta do robô
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm">
          
          {/* Node Title & Root Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título / Identificação do Nó
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Menu Principal, Suporte Técnico"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 border border-slate-200 p-2.5 rounded-lg w-full hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isRoot}
                  onChange={(e) => setIsRoot(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <span className="block font-semibold text-slate-800 text-xs">
                    Nó Inicial (Root)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Primeira mensagem enviada ao cliente
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Message Area & WhatsApp Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mensagem do Bot (Conteúdo enviado)
                </label>
                <span className="text-[11px] text-slate-400">
                  Usa *negrito*, _itálico_
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Digite a mensagem que o bot responderá..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs font-mono transition-all leading-relaxed"
                required
              />
            </div>

            {/* Live WhatsApp Markdown Preview Box */}
            <div className="bg-[#efeae2] p-3 rounded-lg border border-slate-300 flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-amber-900/10 text-emerald-900">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Prévia Visual WhatsApp
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-xs border border-emerald-900/10 text-slate-800 text-xs space-y-1.5 max-h-[180px] overflow-y-auto font-sans leading-relaxed">
                <div
                  dangerouslySetInnerHTML={{
                    __html: parseWhatsAppMarkdown(message || '*(Mensagem vazia)*'),
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI Knowledge Base Textarea Section */}
          <div className="bg-purple-50/90 border border-purple-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Base de Conhecimento para IA (Instruções e Contexto do Gemini)
              </label>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                Usado quando a ação for 'ai_agent'
              </span>
            </div>
            <p className="text-[11px] text-purple-800">
              Cole aqui as informações, produtos, valores, serviços e regras da sua empresa. A IA responderá em linguagem natural às dúvidas do cliente no WhatsApp usando este contexto.
            </p>
            <textarea
              value={aiKnowledgeBase}
              onChange={(e) => setAiKnowledgeBase(e.target.value)}
              rows={5}
              placeholder="Ex: A TecnoSoluções oferece ERP a partir de R$ 299/mês e suporte técnico das 8h às 18h. Para cancelamentos, o prazo é de 7 dias..."
              className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs font-mono bg-white text-slate-800 leading-relaxed transition-all"
            />
          </div>

          {/* Triggers Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <CornerDownRight className="w-4 h-4 text-emerald-600" />
                  Opções e Gatilhos de Resposta ({triggers.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Arraste ou use as setas para reordenar a sequência das opções.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {triggers.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRenumberTriggers}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-300 cursor-pointer"
                    title="Renumerar dígitos dos gatilhos sequencialmente (1, 2, 3...)"
                  >
                    <Hash className="w-3.5 h-3.5 text-slate-600" /> Auto 1..N
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddTrigger}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Opção
                </button>
              </div>
            </div>

            {/* Submenu Guidance Hint */}
            <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
              <span className="font-bold text-blue-700 shrink-0">💡 Estilo Bizagi Modeler:</span>
              <span>
                Selecione a Ação <strong>"🔀 Ir para outro Nó/Submenu"</strong> e clique em <strong>"+ Criar Novo Submenu"</strong> na própria opção para gerar e conectar o próximo passo instantaneamente!
              </span>
            </div>

            {createdSubnodeSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{createdSubnodeSuccess}</span>
              </div>
            )}

            {triggers.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Nenhum gatilho configurado. Clique em "+ Adicionar Opção" para criar caminhos no menu.
              </div>
            ) : (
              <div className="space-y-3">
                {triggers.map((trig, index) => {
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={trig.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', String(index));
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedIndex(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverIndex !== index) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedIndex !== null && draggedIndex !== index) {
                          handleReorderTriggers(draggedIndex, index);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`bg-slate-50 border rounded-xl p-3 space-y-3 transition-all select-none ${
                        isDragging
                          ? 'opacity-30 border-dashed border-emerald-500 bg-emerald-50'
                          : isDragOver
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/50 scale-[1.01]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                            title="Arraste para mudar a ordem"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveTrigger(index, 'up')}
                              className="p-1 text-slate-400 hover:text-emerald-700 disabled:opacity-20 cursor-pointer rounded hover:bg-slate-200"
                              title="Mover para cima"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === triggers.length - 1}
                              onClick={() => handleMoveTrigger(index, 'down')}
                              className="p-1 text-slate-400 hover:text-emerald-700 disabled:opacity-20 cursor-pointer rounded hover:bg-slate-200"
                              title="Mover para baixo"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Opção #{index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTrigger(trig.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                          title="Remover opção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Gatilho / Dígito (Digitar)
                        </label>
                        <input
                          type="text"
                          value={trig.key}
                          onChange={(e) =>
                            handleUpdateTrigger(trig.id, { key: e.target.value })
                          }
                          placeholder="Ex: 1, 2, ajuda"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white text-xs font-mono font-bold text-center"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Descrição / Rótulo
                        </label>
                        <input
                          type="text"
                          value={trig.label}
                          onChange={(e) =>
                            handleUpdateTrigger(trig.id, { label: e.target.value })
                          }
                          placeholder="Ex: Vendas e Orçamentos"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 bg-white text-xs"
                          required
                        />
                      </div>
                    </div>

                    {/* Action Selector */}
                    <div className="pt-1 border-t border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Ação do Gatilho
                          </label>
                          <select
                            value={trig.action}
                            onChange={(e) =>
                              handleUpdateTrigger(trig.id, {
                                action: e.target.value as TriggerAction,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                          >
                            <option value="node">🔀 Ir para outro Nó/Submenu</option>
                            <option value="auto_reply">💬 Enviar Resposta Automática</option>
                            <option value="ai_agent">🤖 Atendimento com IA (Gemini)</option>
                            <option value="human">👨‍💻 Transferir para Atendente Humano</option>
                          </select>
                        </div>

                        {/* Conditional target based on Action */}
                        <div className="sm:col-span-2">
                          {trig.action === 'node' && (
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <label className="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3 text-emerald-600" /> Nó de Destino (Submenu)
                                </label>
                                {onCreateSubnode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSub = onCreateSubnode(trig.label || 'Nova Opção');
                                      handleUpdateTrigger(trig.id, { targetNodeId: newSub.id });
                                      setCreatedSubnodeSuccess(`Submenu "${newSub.title}" criado e conectado!`);
                                      setTimeout(() => setCreatedSubnodeSuccess(null), 3500);
                                    }}
                                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer border border-blue-200"
                                    title="Criar automaticamente um novo submenu para esta opção em 1 clique"
                                  >
                                    <Sparkles className="w-3 h-3 text-blue-600" /> + Criar Novo Submenu
                                  </button>
                                )}
                              </div>
                              <select
                                value={trig.targetNodeId || ''}
                                onChange={(e) =>
                                  handleUpdateTrigger(trig.id, {
                                    targetNodeId: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
                              >
                                {allNodes.map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.title} {n.isRoot ? '(Início)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {trig.action === 'ai_agent' && (
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <label className="block text-[11px] font-bold text-purple-900 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-600" /> Nó de Destino com IA
                                </label>
                                {onCreateSubnode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSub = onCreateSubnode(trig.label || 'Atendimento com IA');
                                      newSub.aiKnowledgeBase = aiKnowledgeBase || 'Base de conhecimento inicial para o robô de IA...';
                                      handleUpdateTrigger(trig.id, { targetNodeId: newSub.id });
                                      setCreatedSubnodeSuccess(`Nó com IA "${newSub.title}" criado e conectado!`);
                                      setTimeout(() => setCreatedSubnodeSuccess(null), 3500);
                                    }}
                                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer border border-purple-200"
                                    title="Criar automaticamente um novo nó de atendimento IA em 1 clique"
                                  >
                                    <Sparkles className="w-3 h-3 text-purple-600" /> + Criar Submenu de IA
                                  </button>
                                )}
                              </div>
                              <select
                                value={trig.targetNodeId || ''}
                                onChange={(e) =>
                                  handleUpdateTrigger(trig.id, {
                                    targetNodeId: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 border border-purple-300 rounded-md bg-purple-50/50 focus:ring-1 focus:ring-purple-500 text-xs font-medium text-purple-900"
                              >
                                {allNodes.map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.title} {n.isRoot ? '(Início)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {trig.action === 'auto_reply' && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                Mensagem de Resposta Direta
                              </label>
                              <input
                                type="text"
                                value={trig.autoReplyMessage || ''}
                                onChange={(e) =>
                                  handleUpdateTrigger(trig.id, {
                                    autoReplyMessage: e.target.value,
                                  })
                                }
                                placeholder="Digite a resposta automática..."
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500 text-xs"
                              />
                            </div>
                          )}

                          {trig.action === 'human' && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5">
                              <span>⚠️ Esta opção desativa o robô e sinaliza o painel do atendente humano.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Salvar Nó
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
