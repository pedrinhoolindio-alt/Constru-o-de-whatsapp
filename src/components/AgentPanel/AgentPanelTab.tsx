import React, { useState } from 'react';
import { AttendantState, ChatMessage, FlowNode } from '../../types';
import { parseWhatsAppMarkdown } from '../../utils/formatters';
import {
  UserCheck,
  Bot,
  Send,
  User,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  FileText,
  CheckCheck,
  Tag
} from 'lucide-react';

interface AgentPanelTabProps {
  attendantState: AttendantState;
  messages: ChatMessage[];
  currentNode: FlowNode | undefined;
  onToggleHumanMode: (enableHuman: boolean) => void;
  onSendAgentMessage: (text: string) => void;
  onUpdateNotes: (notes: string) => void;
}

export const AgentPanelTab: React.FC<AgentPanelTabProps> = ({
  attendantState,
  messages,
  currentNode,
  onToggleHumanMode,
  onSendAgentMessage,
  onUpdateNotes,
}) => {
  const [inputText, setInputText] = useState('');

  const cannedResponses = [
    '👋 Olá! Me chamo ' + (attendantState.agentName || 'Atendente') + ', como posso te ajudar?',
    '⏳ Por favor, aguarde um instante enquanto verifico seus dados no sistema.',
    '✅ Perfeito! Seu pedido foi atualizado com sucesso.',
    '🙏 Agradecemos seu contato! Tenha um ótimo dia.',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendAgentMessage(inputText.trim());
    setInputText('');
  };

  const handleApplyMacro = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="space-y-4">
      {/* Top Transition Control Banner */}
      <div className={`rounded-2xl p-4 border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        attendantState.isHumanActive
          ? 'bg-amber-500/10 border-amber-300 text-amber-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
            attendantState.isHumanActive
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-emerald-600 text-white shadow-sm'
          }`}>
            {attendantState.isHumanActive ? (
              <UserCheck className="w-6 h-6" />
            ) : (
              <Bot className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Modo do Sistema
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                attendantState.isHumanActive
                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}>
                {attendantState.isHumanActive ? 'Em Atendimento Humano' : 'Atendido por Bot'}
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base mt-0.5">
              {attendantState.isHumanActive
                ? 'O Bot está PAUSADO. Você está no controle da conversa.'
                : 'O Bot está ATIVO respondendo as opções automaticamente.'}
            </h3>
          </div>
        </div>

        {/* Action Toggle Buttons */}
        <div className="shrink-0 flex items-center gap-2">
          {attendantState.isHumanActive ? (
            <button
              onClick={() => onToggleHumanMode(false)}
              className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Devolver para o Bot</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleHumanMode(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Puxar Atendimento (Pausar Bot)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Chat History & Client Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Live Agent Chat Box */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[520px]">
          
          {/* Chat Header */}
          <div className="p-3 bg-slate-800 text-white rounded-t-2xl flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                {attendantState.clientName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">
                  {attendantState.clientName}
                </h4>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  {attendantState.clientPhone}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-400 block">Nó Atual do Bot:</span>
              <span className="bg-slate-700 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-300">
                {currentNode?.title || 'Menu Principal'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhuma mensagem na conversa ainda.
              </div>
            ) : (
              messages.map((msg) => {
                const isClient = msg.sender === 'client';
                const isSystem = msg.sender === 'system';
                const isBot = msg.sender === 'bot';
                const isAgent = msg.sender === 'human_agent';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="inline-block bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-semibold px-3 py-1 rounded-full">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 px-1">
                      {isClient && <span className="font-bold text-slate-700">Cliente</span>}
                      {isBot && <span className="font-bold text-emerald-700 flex items-center gap-0.5"><Bot className="w-3 h-3" /> Bot</span>}
                      {isAgent && <span className="font-bold text-amber-700 flex items-center gap-0.5"><UserCheck className="w-3 h-3" /> Você (Atendente)</span>}
                      <span>• {msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-2xs font-sans ${
                        isClient
                          ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                          : isAgent
                          ? 'bg-amber-500 text-white rounded-tr-none'
                          : 'bg-emerald-700 text-white rounded-tr-none'
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: parseWhatsAppMarkdown(msg.text),
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Macros / Canned Responses Bar */}
          <div className="bg-slate-100 px-3 py-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Respostas Rápidas:
            </span>
            {cannedResponses.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyMacro(res)}
                className="bg-white hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {res.slice(0, 24)}...
              </button>
            ))}
          </div>

          {/* Operator Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 rounded-b-2xl flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!attendantState.isHumanActive}
              placeholder={
                attendantState.isHumanActive
                  ? 'Digite sua mensagem de humano para o cliente...'
                  : 'Puxe o atendimento (Pausar Bot) para digitar mensagens aqui...'
              }
              className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!attendantState.isHumanActive || !inputText.trim()}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>

        </div>

        {/* Right Column: Customer Info & Operator Notes */}
        <div className="space-y-4">
          
          {/* Customer Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                Ficha do Cliente
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Nome do Contato:</span>
                <span className="font-bold text-slate-800 text-sm">{attendantState.clientName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">WhatsApp:</span>
                <span className="font-mono text-slate-700">{attendantState.clientPhone}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Canal:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  WhatsApp Web API
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Atendente Responsável:</span>
                <span className="font-semibold text-slate-800">{attendantState.agentName}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                  Anotações Internas
                </h3>
              </div>
            </div>
            <textarea
              value={attendantState.notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Digite observações sobre o atendimento (visível apenas para a equipe)..."
              rows={5}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-amber-50/20 text-slate-800"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
