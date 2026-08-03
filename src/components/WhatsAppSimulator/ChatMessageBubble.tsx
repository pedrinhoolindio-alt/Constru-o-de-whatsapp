import React from 'react';
import { ChatMessage } from '../../types';
import { parseWhatsAppMarkdown } from '../../utils/formatters';
import { CheckCheck, Bot, UserCheck } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onQuickOptionClick?: (key: string) => void;
  isBotActive: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onQuickOptionClick,
  isBotActive,
}) => {
  const isClient = message.sender === 'client';
  const isSystem = message.sender === 'system';
  const isBot = message.sender === 'bot';
  const isAgent = message.sender === 'human_agent';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2.5">
        <span className="bg-amber-100/90 text-amber-900 border border-amber-200 text-[11px] font-semibold px-3 py-1 rounded-lg shadow-2xs text-center max-w-[90%]">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col mb-3 ${
        isClient ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender indicator above bubble */}
      {!isClient && (
        <span className="text-[10px] font-bold text-slate-500 mb-0.5 ml-1 flex items-center gap-1">
          {isBot && (
            <span className="text-emerald-700 flex items-center gap-1">
              <Bot className="w-3 h-3" /> Resposta Automática (Bot)
            </span>
          )}
          {isAgent && (
            <span className="text-amber-700 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Atendente Humano
            </span>
          )}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] rounded-2xl p-3 shadow-xs relative text-xs sm:text-sm font-sans leading-relaxed ${
          isClient
            ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-emerald-200/60'
            : isAgent
            ? 'bg-white text-slate-900 rounded-tl-xs border-l-4 border-l-amber-500 border border-slate-200'
            : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200'
        }`}
      >
        <div
          className="whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{
            __html: parseWhatsAppMarkdown(message.text),
          }}
        />

        {/* Timestamp & Read Receipt */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
          <span>{message.timestamp}</span>
          {isClient && (
            <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
          )}
        </div>
      </div>

      {/* Interactive Quick Option Buttons attached to Bot message */}
      {isBot && message.quickOptions && message.quickOptions.length > 0 && isBotActive && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-1 max-w-[88%]">
          {message.quickOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onQuickOptionClick && onQuickOptionClick(opt.key)}
              className="bg-white hover:bg-emerald-60 text-emerald-800 border border-emerald-300 shadow-2xs hover:border-emerald-500 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span className="bg-emerald-600 text-white font-mono px-1.5 py-0.2 rounded-full text-[10px]">
                {opt.key}
              </span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
