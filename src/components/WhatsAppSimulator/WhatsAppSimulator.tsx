import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AttendantState, FlowNode } from '../../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  Phone,
  Video,
  Bot,
  UserCheck,
  RefreshCw,
  Sparkles,
  Info,
  X
} from 'lucide-react';

interface WhatsAppSimulatorProps {
  messages: ChatMessage[];
  attendantState: AttendantState;
  currentNode: FlowNode | undefined;
  isBotTyping: boolean;
  onSendClientMessage: (text: string) => void;
  onResetChat: () => void;
  onClose?: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  messages,
  attendantState,
  currentNode,
  isBotTyping,
  onSendClientMessage,
  onResetChat,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on message change or typing status change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendClientMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickSend = (key: string) => {
    onSendClientMessage(key);
  };

  return (
    <div className="bg-slate-900 p-2 sm:p-2.5 rounded-[2.5rem] shadow-2xl border-4 border-slate-800">
      
      {/* Phone Ear Speaker Notch */}
      <div className="w-16 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 mt-1"></div>

      <div className="bg-white rounded-[1.8rem] overflow-hidden flex flex-col h-[680px] max-h-[80vh] border border-slate-200">
        
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-[#075e54] flex items-center justify-center font-extrabold text-sm shadow-inner">
                TS
              </div>
              <span className="w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full absolute bottom-0 right-0" />
            </div>

            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                TecnoSoluções Atendimento
              </h3>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1.5">
                {isBotTyping ? (
                  <span className="font-semibold animate-pulse text-amber-200">
                    digitando...
                  </span>
                ) : (
                  <>
                    <span>Online</span>
                    <span>•</span>
                    {attendantState.isHumanActive ? (
                      <span className="bg-amber-500/20 text-amber-200 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                        👨‍💻 Humano
                      </span>
                    ) : (
                      <span className="bg-emerald-900/40 text-emerald-100 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                        🤖 Bot
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Header Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetChat}
              className="p-1.5 hover:bg-emerald-800/60 rounded-full text-emerald-100 transition-colors cursor-pointer"
              title="Limpar e reiniciar conversa no simulador"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-emerald-800/60 rounded-full text-emerald-100 transition-colors hidden sm:block"
              title="Chamada simulada"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-emerald-800/60 rounded-full text-emerald-100 transition-colors hidden sm:block"
              title="Videochamada simulada"
            >
              <Video className="w-4 h-4" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full transition-all cursor-pointer ml-1 shadow-sm"
                title="Fechar Simulador"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      {/* Simulator Info Banner */}
      <div className={`px-4 py-1.5 text-[11px] font-semibold border-b flex items-center justify-between ${
        attendantState.isHumanActive
          ? 'bg-amber-100 border-amber-200 text-amber-900'
          : 'bg-emerald-100/70 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-1.5">
          {attendantState.isHumanActive ? (
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-emerald-700" />
          )}
          <span>
            {attendantState.isHumanActive
              ? 'Conectado a: Atendente Humano (Bot desativado)'
              : 'Conectado a: Bot de Atendimento Automático'}
          </span>
        </div>

        {!attendantState.isHumanActive && currentNode && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono text-emerald-800">
              Menu: {currentNode.title}
            </span>
            <button
              onClick={onResetChat}
              className="text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
              title="Reiniciar a simulação para aplicar do início as últimas alterações"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Reiniciar Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Test Triggers Toolbar (Simulator Top Helper) */}
      {!attendantState.isHumanActive && currentNode && currentNode.triggers.length > 0 && (
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
          <span className="font-bold text-slate-600 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Teste Rápido:
          </span>
          {currentNode.triggers.map((t) => (
            <button
              key={t.id}
              onClick={() => handleQuickSend(t.key)}
              className="bg-white hover:bg-emerald-50 text-emerald-900 border border-slate-300 hover:border-emerald-500 font-semibold px-2 py-0.5 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              Digitar <span className="font-mono font-bold text-emerald-700">[{t.key}]</span>
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp Body wallpaper pattern */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#efeae2] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
        
        {/* Security Encryption Notice */}
        <div className="flex justify-center my-2">
          <div className="bg-[#ffeebd] border border-amber-200 text-amber-900 text-[10px] font-medium px-3 py-1 rounded-md text-center max-w-[85%] shadow-2xs flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-700 shrink-0" />
            <span>As mensagens nesta simulação são criptografadas ponta a ponta.</span>
          </div>
        </div>

        {/* Messages List */}
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            onQuickOptionClick={handleQuickSend}
            isBotActive={!attendantState.isHumanActive}
          />
        ))}

        {/* Typing indicator bubble */}
        {isBotTyping && (
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 text-slate-500 text-xs font-semibold">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>O atendente está digitando</span>
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* WhatsApp Footer Input Bar */}
      <form onSubmit={handleSend} className="bg-[#f0f2f5] p-2.5 sm:p-3 border-t border-slate-300 flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="p-2 text-slate-600 hover:text-slate-800 transition-colors hidden sm:block"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 text-slate-600 hover:text-slate-800 transition-colors hidden sm:block"
          title="Anexo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            attendantState.isHumanActive
              ? 'Digite sua mensagem para o atendente humano...'
              : 'Digite o número ou opção do menu...'
          }
          className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]/40 focus:border-[#00a884] text-slate-900 placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-[#00a884] hover:bg-[#008f70] disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          title="Enviar mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      </div>
    </div>
  );
};
