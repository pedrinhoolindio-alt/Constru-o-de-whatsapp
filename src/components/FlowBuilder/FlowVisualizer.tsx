import React, { useState } from 'react';
import { FlowData, FlowNode } from '../../types';
import {
  GitFork,
  ArrowRight,
  CornerDownRight,
  Home,
  Edit3,
  UserCheck,
  MessageSquareText,
  Plus,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface FlowVisualizerProps {
  flowData: FlowData;
  visibleNodes?: FlowNode[];
  selectedBranchId?: string;
  onSelectBranchId?: (branchId: string) => void;
  currentNodeId: string;
  onEditNode: (node: FlowNode) => void;
  onCreateSubnode?: (label: string) => FlowNode;
}

export const FlowVisualizer: React.FC<FlowVisualizerProps> = ({
  flowData,
  visibleNodes,
  selectedBranchId = 'ALL',
  onSelectBranchId,
  currentNodeId,
  onEditNode,
  onCreateSubnode,
}) => {
  const [viewMode, setViewMode] = useState<'bpmn' | 'grid'>('bpmn');

  const nodesToUse = visibleNodes || flowData.nodes;
  const rootNode = nodesToUse.find((n) => n.isRoot) || nodesToUse[0];
  const subNodes = nodesToUse.filter((n) => !n.isRoot);

  return (
    <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-600" />
            Diagrama de Fluxo & Processo (Estilo Bizagi Modeler)
          </h3>
          <p className="text-xs text-slate-500">
            Visualize o caminho do cliente, submenus e decisões como em um fluxograma de processos BPMN
          </p>
        </div>

        {/* Layout Mode Switcher */}
        <div className="bg-white p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('bpmn')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'bpmn'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Diagrama BPMN Processo
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" /> Visão em Grade
          </button>
        </div>
      </div>

      {/* BPMN Legend Banner */}
      {viewMode === 'bpmn' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-blue-600" /> Legenda de Elementos de Processo (BPMN Bizagi):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-900 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-700 inline-block shrink-0" />
              <span>🟢 Início do Processo (Gatilho)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg border border-blue-200 text-blue-900 font-medium">
              <span className="w-3 h-3 rotate-45 bg-blue-500 inline-block shrink-0" />
              <span>🔷 Submenu (Gateway Decisão)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-sky-50 p-2 rounded-lg border border-sky-200 text-sky-900 font-medium">
              <MessageSquareText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>💬 Resposta Direta</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>👨‍💻 Atendimento Humano</span>
            </div>
          </div>
        </div>
      )}

      {/* BPMN BIZAGI DIAGRAM VIEW */}
      {viewMode === 'bpmn' ? (
        <div className="space-y-6 pt-2">
          {/* STAGE 1: START NODE (ROOT MENU) */}
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Etapa 1: Ponto de Entrada / Menu Principal (Start Event)
            </div>

            {rootNode && (
              <div
                className={`bg-white rounded-2xl border-2 p-4 sm:p-5 shadow-sm space-y-3 relative transition-all ${
                  rootNode.id === currentNodeId
                    ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                    : 'border-slate-300'
                }`}
              >
                {/* Node Top Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                      <Home className="w-3.5 h-3.5" /> 🟢 Início do Fluxo
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {rootNode.title}
                    </h4>
                    {rootNode.id === currentNodeId && (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        Simulador Aqui
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onEditNode(rootNode)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>

                {/* Message snippet */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                  "{rootNode.message}"
                </div>

                {/* Gateway Decision Options */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-600" /> Decisões / Ramificações do Menu ({rootNode.triggers.length}):
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {rootNode.triggers.map((trig) => {
                      const targetNode = flowData.nodes.find((n) => n.id === trig.targetNodeId);

                      return (
                        <div
                          key={trig.id}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-800 text-white font-mono font-bold px-2 py-0.5 rounded text-xs shadow-2xs">
                                [{trig.key}]
                              </span>
                              <span className="font-bold text-slate-800 text-xs">{trig.label}</span>
                            </div>
                          </div>

                          {/* Action outcome */}
                          <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 font-medium">Ação:</span>

                            {trig.action === 'node' && (
                              <div className="flex items-center gap-1.5">
                                {targetNode ? (
                                  <span className="bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded-md text-[11px] flex items-center gap-1 border border-blue-200">
                                    <ArrowRight className="w-3 h-3 text-blue-600" /> 🔷 {targetNode.title}
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-bold text-[11px]">Nó não conectado</span>
                                )}
                              </div>
                            )}

                            {trig.action === 'auto_reply' && (
                              <span className="bg-sky-100 text-sky-900 font-bold px-2 py-1 rounded-md text-[11px] flex items-center gap-1 border border-sky-200">
                                <MessageSquareText className="w-3 h-3 text-sky-600" /> 💬 Resposta Automática
                              </span>
                            )}

                            {trig.action === 'human' && (
                              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded-md text-[11px] flex items-center gap-1 border border-amber-200">
                                <UserCheck className="w-3 h-3 text-amber-600" /> 👨‍💻 Transfere p/ Humano
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONNECTOR DIVIDER */}
          {subNodes.length > 0 && (
            <div className="flex items-center justify-center my-4">
              <div className="flex flex-col items-center text-slate-400">
                <div className="w-0.5 h-6 bg-blue-400/60" />
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90" /> Fluxos Secundários / Submenus
                </span>
                <div className="w-0.5 h-6 bg-blue-400/60" />
              </div>
            </div>
          )}

          {/* STAGE 2: SUBMENUS (GATEWAYS) */}
          {subNodes.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Etapa 2: Submenus & Decisões Conectadas ({subNodes.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subNodes.map((node) => {
                  const isActiveInSim = node.id === currentNodeId;

                  return (
                    <div
                      key={node.id}
                      className={`bg-white rounded-2xl border-2 p-4 shadow-2xs space-y-3 relative transition-all ${
                        isActiveInSim
                          ? 'border-blue-500 ring-4 ring-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                            🔷 Submenu
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                        </div>

                        <button
                          onClick={() => onEditNode(node)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar este Submenu"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 italic line-clamp-2">
                        "{node.message}"
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Opções deste Submenu ({node.triggers.length}):
                        </span>

                        {node.triggers.map((trig) => {
                          const targetNode = flowData.nodes.find((n) => n.id === trig.targetNodeId);

                          return (
                            <div
                              key={trig.id}
                              className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-700 text-white font-mono font-bold px-1.5 py-0.2 rounded text-[10px]">
                                  [{trig.key}]
                                </span>
                                <span className="font-semibold text-slate-800">{trig.label}</span>
                              </div>

                              {trig.action === 'node' && (
                                <span className="text-blue-700 font-bold text-[10px] flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  <ArrowRight className="w-3 h-3" />
                                  {targetNode ? targetNode.title : 'Nó'}
                                </span>
                              )}

                              {trig.action === 'auto_reply' && (
                                <span className="text-sky-700 font-bold text-[10px] flex items-center gap-1 bg-sky-50 px-1.5 py-0.5 rounded">
                                  <MessageSquareText className="w-3 h-3" /> Resposta
                                </span>
                              )}

                              {trig.action === 'human' && (
                                <span className="text-amber-800 font-bold text-[10px] flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
                                  <UserCheck className="w-3 h-3 text-amber-600" /> Humano
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {flowData.nodes.map((node) => {
            const isActiveInSim = node.id === currentNodeId;

            return (
              <div
                key={node.id}
                className={`rounded-xl border transition-all p-4 flex flex-col justify-between relative bg-white shadow-xs ${
                  isActiveInSim
                    ? 'border-blue-500 ring-2 ring-blue-400/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                      {node.isRoot && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Home className="w-3 h-3" /> Início
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onEditNode(node)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 line-clamp-3 mb-3 italic">
                  "{node.message}"
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Saídas ({node.triggers.length})
                  </span>
                  {node.triggers.map((trig) => {
                    const targetNode = flowData.nodes.find((n) => n.id === trig.targetNodeId);
                    return (
                      <div
                        key={trig.id}
                        className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 text-[11px]"
                      >
                        <span className="font-medium text-slate-700">
                          [{trig.key}] {trig.label}
                        </span>
                        {trig.action === 'node' && (
                          <span className="text-blue-700 font-semibold text-[11px] shrink-0 bg-blue-50 px-1.5 py-0.5 rounded">
                            ➔ {targetNode ? targetNode.title : 'Nó'}
                          </span>
                        )}
                        {trig.action === 'auto_reply' && (
                          <span className="text-sky-700 font-semibold text-[11px] shrink-0 bg-sky-50 px-1.5 py-0.5 rounded">
                            💬 Resposta
                          </span>
                        )}
                        {trig.action === 'human' && (
                          <span className="text-amber-800 font-semibold text-[11px] shrink-0 bg-amber-50 px-1.5 py-0.5 rounded">
                            👨‍💻 Humano
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
