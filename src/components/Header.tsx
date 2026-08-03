import React from 'react';
import { Bot, UserCheck, RefreshCw, Download, Upload, RotateCcw, MessageSquareCode, Smartphone } from 'lucide-react';
import { AttendantState } from '../types';

interface HeaderProps {
  attendantState: AttendantState;
  onResetChat: () => void;
  onResetDefaultFlow: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onToggleSimulator?: () => void;
  isSimulatorVisible?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  attendantState,
  onResetChat,
  onResetDefaultFlow,
  onOpenExportModal,
  onOpenImportModal,
  onToggleSimulator,
  isSimulatorVisible,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-sm border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <MessageSquareCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Simulador de Fluxo WhatsApp
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                Professional
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Status Atual:</span>
              {attendantState.isHumanActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                  <UserCheck className="w-3 h-3 text-amber-400" /> Em Atendimento Humano
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  <Bot className="w-3 h-3 text-emerald-400" /> Atendido por Bot
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
              <span>{isSimulatorVisible ? 'Ocultar Simulador' : '📱 Testar no Simulador'}</span>
            </button>
          )}

          <button
            onClick={onResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
            title="Reiniciar a conversa do cliente no simulador do zero"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Resetar Conversa</span>
          </button>

          <button
            onClick={onResetDefaultFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
            title="Restaurar o modelo padrão de nós e menus do Bot"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Fluxo Padrão</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 hidden sm:block" />

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importar JSON</span>
          </button>
        </div>

      </div>
    </header>
  );
};
