import React from 'react';
import { Bot, UserCheck, RefreshCw, Download, Upload, RotateCcw, MessageSquareCode, Smartphone, FolderOpen, Plus, Save, Check, FileText } from 'lucide-react';
import { AttendantState } from '../types';

interface HeaderProps {
  attendantState: AttendantState;
  activeFlowName?: string;
  savedFlowsCount?: number;
  onOpenFlowManager?: () => void;
  onResetChat: () => void;
  onResetDefaultFlow: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onOpenPdfExportModal?: () => void;
  onToggleSimulator?: () => void;
  isSimulatorVisible?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  attendantState,
  activeFlowName = 'Atendimento',
  savedFlowsCount = 1,
  onOpenFlowManager,
  onResetChat,
  onResetDefaultFlow,
  onOpenExportModal,
  onOpenImportModal,
  onOpenPdfExportModal,
  onToggleSimulator,
  isSimulatorVisible,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-sm border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Brand, App Title & Active Flow Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <MessageSquareCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Simulador de Fluxo WhatsApp
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                Professional
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
              <span>Status:</span>
              {attendantState.isHumanActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                  <UserCheck className="w-3 h-3 text-amber-400" /> Humano
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  <Bot className="w-3 h-3 text-emerald-400" /> Bot Ativo
                </span>
              )}

              {onOpenFlowManager && (
                <>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={onOpenFlowManager}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-200 text-[11px] font-bold border border-blue-700/60 transition-colors cursor-pointer"
                    title="Clique para gerenciar ou criar novos fluxos do zero"
                  >
                    <FolderOpen className="w-3 h-3 text-blue-400" />
                    <span className="truncate max-w-[140px]">{activeFlowName}</span>
                    <span className="bg-blue-800 text-blue-200 px-1.5 py-0.2 rounded text-[9px]">
                      {savedFlowsCount}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenFlowManager && (
            <button
              onClick={onOpenFlowManager}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-bold shadow-xs active:scale-95 cursor-pointer border border-blue-400/40"
              title="Criar um novo fluxo em branco do zero ou alternar entre fluxos salvos"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-200" />
              <span>📁 Gerenciar / Novo Fluxo</span>
            </button>
          )}

          {onToggleSimulator && (
            <button
              onClick={onToggleSimulator}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer border ${
                isSimulatorVisible
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-[#075e54] hover:bg-[#128c7e] text-white border-emerald-600 shadow-sm animate-pulse'
              }`}
              title="Abrir/Fechar o Simulador do WhatsApp"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isSimulatorVisible ? 'Ocultar Simulador' : '📱 Testar Simulador'}</span>
            </button>
          )}

          <button
            onClick={onResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
            title="Reiniciar a conversa do cliente no simulador do zero"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Resetar Chat</span>
          </button>

          <button
            onClick={onResetDefaultFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
            title="Restaurar o modelo padrão de nós e menus do Bot"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Modelo Padrão</span>
          </button>

          {onOpenPdfExportModal && (
            <button
              onClick={onOpenPdfExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-bold shadow-xs active:scale-95 cursor-pointer border border-blue-400/40"
              title="Baixar a documentação completa e organizada do fluxo em formato PDF"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>📄 Baixar PDF</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-0.5 hidden sm:block" />

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
            title="Exportar fluxo em formato JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Exportar JSON</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
            title="Importar arquivo JSON de fluxo"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Importar JSON</span>
          </button>
        </div>

      </div>
    </header>
  );
};

