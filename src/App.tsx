import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FlowBuilderTab } from './components/FlowBuilder/FlowBuilderTab';
import { AgentPanelTab } from './components/AgentPanel/AgentPanelTab';
import { WhatsAppSimulator } from './components/WhatsAppSimulator/WhatsAppSimulator';
import { ImportExportModal } from './components/ImportExportModal';
import { initialFlowData } from './data/defaultFlow';
import { FlowData, ChatMessage, AttendantState, FlowNode } from './types';
import { getCurrentTimeString } from './utils/formatters';
import { Settings, UserCheck, Bot, Layout, MessageSquareCode, Smartphone } from 'lucide-react';

export default function App() {
  const [flowData, setFlowData] = useState<FlowData>(initialFlowData);
  const [currentNodeId, setCurrentNodeId] = useState<string>(initialFlowData.startNodeId);
  const [activeTab, setActiveTab] = useState<'flow_builder' | 'human_agent'>('flow_builder');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [isSimulatorVisible, setIsSimulatorVisible] = useState<boolean>(false);

  const [attendantState, setAttendantState] = useState<AttendantState>({
    isHumanActive: false,
    agentName: 'Carlos Eduardo',
    clientName: 'Maria Silva',
    clientPhone: '+55 11 98765-4321',
    unreadCount: 0,
    notes: 'Cliente interessado em pacote empresarial de software.',
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'export' | 'import';
  }>({
    isOpen: false,
    mode: 'export',
  });

  // Helper to get root node
  const getRootNode = useCallback((data: FlowData): FlowNode | undefined => {
    return (
      data.nodes.find((n) => n.id === data.startNodeId) ||
      data.nodes.find((n) => n.isRoot) ||
      data.nodes[0]
    );
  }, []);

  // Initialize Chat with Root Node Welcome Message
  const initChat = useCallback((data: FlowData) => {
    const rootNode = getRootNode(data);
    if (!rootNode) return;

    setCurrentNodeId(rootNode.id);
    setAttendantState((prev) => ({ ...prev, isHumanActive: false }));

    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome_' + Date.now(),
      sender: 'bot',
      text: rootNode.message,
      timestamp: getCurrentTimeString(),
      status: 'read',
      quickOptions: rootNode.triggers.map((t) => ({ key: t.key, label: t.label })),
    };

    setMessages([welcomeMsg]);
  }, [getRootNode]);

  // Run initial chat setup on mount
  useEffect(() => {
    initChat(flowData);
  }, []);

  // Current active node object
  const currentNode = flowData.nodes.find((n) => n.id === currentNodeId) || getRootNode(flowData);

  // Handle Client Sending Message in Simulator
  const handleSendClientMessage = async (text: string) => {
    const time = getCurrentTimeString();
    const userMsg: ChatMessage = {
      id: 'msg_client_' + Date.now(),
      sender: 'client',
      text,
      timestamp: time,
      status: 'delivered',
    };

    setMessages((prev) => [...prev, userMsg]);

    // If Human mode is active -> Do not process bot logic
    if (attendantState.isHumanActive) {
      setAttendantState((prev) => ({
        ...prev,
        unreadCount: activeTab === 'human_agent' ? 0 : prev.unreadCount + 1,
      }));
      return;
    }

    setIsBotTyping(true);

    const cleanInput = text.trim().toLowerCase();

    // Check if the customer is currently inside an AI Agent node
    const isCurrentNodeAi =
      !!currentNode?.aiKnowledgeBase ||
      currentNode?.triggers.some((t) => t.action === 'ai_agent');

    // 1. EXIT AI MODE COMMAND: If user types "0", "menu", "voltar", or "sair" -> Return to Root Menu
    if (isCurrentNodeAi && (cleanInput === '0' || cleanInput === 'menu' || cleanInput === 'voltar' || cleanInput === 'sair')) {
      setTimeout(() => {
        setIsBotTyping(false);
        const rootNode = getRootNode(flowData);
        if (rootNode) {
          setCurrentNodeId(rootNode.id);

          const exitReply: ChatMessage = {
            id: 'msg_bot_exit_ai_' + Date.now(),
            sender: 'bot',
            text: `↩️ *Saindo do Atendimento por IA*\n\n${rootNode.message}`,
            timestamp: getCurrentTimeString(),
            quickOptions: rootNode.triggers.map((t) => ({
              key: t.key,
              label: t.label,
            })),
          };

          setMessages((prev) => [...prev, exitReply]);
        }
      }, 500);
      return;
    }

    // 2. AI AGENT FREE-TEXT MODE: Send question to Gemini API via /api/chat-ai
    if (isCurrentNodeAi) {
      try {
        const response = await fetch('/api/chat-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            knowledgeBase: currentNode?.aiKnowledgeBase || '',
            history: messages.slice(-10), // Pass last 10 messages for context
          }),
        });

        const data = await response.json();
        setIsBotTyping(false);

        const replyText =
          data.text ||
          'Desculpe, não consegui compreender totalmente sua dúvida. Pode reformular ou digitar *0* para retornar ao menu principal?';

        const aiBotReply: ChatMessage = {
          id: 'msg_bot_ai_' + Date.now(),
          sender: 'bot',
          text: replyText,
          timestamp: getCurrentTimeString(),
          quickOptions: [
            { key: '0', label: 'Voltar ao Menu Principal' },
          ],
        };

        setMessages((prev) => [...prev, aiBotReply]);
      } catch (err) {
        console.error('Error calling Gemini API:', err);
        setIsBotTyping(false);

        const fallbackReply: ChatMessage = {
          id: 'msg_bot_ai_err_' + Date.now(),
          sender: 'bot',
          text: '⚠️ Tivemos uma instabilidade no momento ao consultar a inteligência artificial. Por favor, tente novamente em instantes ou digite *0* para retornar ao menu principal.',
          timestamp: getCurrentTimeString(),
          quickOptions: [
            { key: '0', label: 'Voltar ao Menu Principal' },
          ],
        };

        setMessages((prev) => [...prev, fallbackReply]);
      }
      return;
    }

    // 3. STANDARD BOT MODE (Numbered Triggers & Navigation)
    setTimeout(() => {
      setIsBotTyping(false);

      if (!currentNode) return;

      // Find trigger by key (exact match or keyword match)
      const matchedTrigger = currentNode.triggers.find(
        (t) =>
          t.key.toLowerCase() === cleanInput ||
          t.label.toLowerCase() === cleanInput ||
          cleanInput.startsWith(t.key.toLowerCase())
      );

      if (matchedTrigger) {
        // Option A: Target Node Navigation
        if (matchedTrigger.action === 'node' && matchedTrigger.targetNodeId) {
          const targetNode = flowData.nodes.find(
            (n) => n.id === matchedTrigger.targetNodeId
          );

          if (targetNode) {
            setCurrentNodeId(targetNode.id);

            const botReply: ChatMessage = {
              id: 'msg_bot_' + Date.now(),
              sender: 'bot',
              text: targetNode.message,
              timestamp: getCurrentTimeString(),
              quickOptions: targetNode.triggers.map((t) => ({
                key: t.key,
                label: t.label,
              })),
            };

            setMessages((prev) => [...prev, botReply]);
          }
        }
        // Option B: AI Agent Action Trigger
        else if (matchedTrigger.action === 'ai_agent') {
          const targetNode = matchedTrigger.targetNodeId
            ? flowData.nodes.find((n) => n.id === matchedTrigger.targetNodeId)
            : currentNode;

          if (targetNode) {
            setCurrentNodeId(targetNode.id);

            const botReply: ChatMessage = {
              id: 'msg_bot_ai_start_' + Date.now(),
              sender: 'bot',
              text: targetNode.message,
              timestamp: getCurrentTimeString(),
              quickOptions: [
                ...(targetNode.triggers?.map((t) => ({ key: t.key, label: t.label })) || []),
                { key: '0', label: 'Voltar ao Menu Principal' },
              ].filter((v, i, a) => a.findIndex((t) => t.key === v.key) === i),
            };

            setMessages((prev) => [...prev, botReply]);
          }
        }
        // Option C: Auto Reply Message
        else if (matchedTrigger.action === 'auto_reply') {
          const botReply: ChatMessage = {
            id: 'msg_bot_' + Date.now(),
            sender: 'bot',
            text: matchedTrigger.autoReplyMessage || 'Obrigado pelo seu contato!',
            timestamp: getCurrentTimeString(),
            quickOptions: currentNode.triggers.map((t) => ({
              key: t.key,
              label: t.label,
            })),
          };

          setMessages((prev) => [...prev, botReply]);
        }
        // Option D: Transfer to Human Agent
        else if (matchedTrigger.action === 'human') {
          const transferReply: ChatMessage = {
            id: 'msg_bot_' + Date.now(),
            sender: 'bot',
            text: '👨‍💻 *Transferindo Atendimento...*\n\nAguarde um instante! Estou encaminhando sua conversa para um de nossos atendentes humanos. Logo você será atendido!',
            timestamp: getCurrentTimeString(),
          };

          const systemNotice: ChatMessage = {
            id: 'msg_sys_' + Date.now(),
            sender: 'system',
            text: '⚠️ O atendimento foi transferido para um atendente humano. O Bot foi pausado.',
            timestamp: getCurrentTimeString(),
          };

          setAttendantState((prev) => ({ ...prev, isHumanActive: true }));
          setMessages((prev) => [...prev, transferReply, systemNotice]);
        }
      } else {
        // Fallback response for unmapped trigger
        const fallbackText =
          currentNode.fallbackMessage || flowData.defaultFallback;

        const fallbackReply: ChatMessage = {
          id: 'msg_bot_fallback_' + Date.now(),
          sender: 'bot',
          text: fallbackText,
          timestamp: getCurrentTimeString(),
          quickOptions: currentNode.triggers.map((t) => ({
            key: t.key,
            label: t.label,
          })),
        };

        setMessages((prev) => [...prev, fallbackReply]);
      }
    }, 600);
  };

  // Handle Agent Sending Message from Tab 2
  const handleSendAgentMessage = (text: string) => {
    const agentMsg: ChatMessage = {
      id: 'msg_agent_' + Date.now(),
      sender: 'human_agent',
      text,
      timestamp: getCurrentTimeString(),
    };

    setMessages((prev) => [...prev, agentMsg]);
  };

  // Toggle Human vs Bot Mode manually
  const handleToggleHumanMode = (enableHuman: boolean) => {
    setAttendantState((prev) => ({ ...prev, isHumanActive: enableHuman }));

    const time = getCurrentTimeString();
    if (enableHuman) {
      const notice: ChatMessage = {
        id: 'msg_sys_' + Date.now(),
        sender: 'system',
        text: '👨‍💻 O atendente ' + attendantState.agentName + ' assumiu o chat. Bot pausado.',
        timestamp: time,
      };
      setMessages((prev) => [...prev, notice]);
    } else {
      const notice: ChatMessage = {
        id: 'msg_sys_' + Date.now(),
        sender: 'system',
        text: '🤖 Atendimento devolvido para o Bot automático.',
        timestamp: time,
      };
      setMessages((prev) => [...prev, notice]);
    }
  };

  // Reset Chat Simulator
  const handleResetChat = () => {
    initChat(flowData);
  };

  // Reset Default Flow
  const handleResetDefaultFlow = () => {
    if (window.confirm('Deseja restaurar o fluxo de atendimento padrão?')) {
      setFlowData(initialFlowData);
      initChat(initialFlowData);
    }
  };

  // Import JSON Flow
  const handleImportFlow = (newFlow: FlowData) => {
    setFlowData(newFlow);
    initChat(newFlow);
  };

  // Update Flow Data & Live Synchronize Simulator Chat
  const handleUpdateFlowData = (newData: FlowData) => {
    setFlowData(newData);

    const rootNode = getRootNode(newData);
    if (!rootNode) return;

    // Auto-update currentNodeId if current one no longer exists
    if (!newData.nodes.some((n) => n.id === currentNodeId)) {
      setCurrentNodeId(rootNode.id);
    }

    // If chat is in initial state (only welcome message or 1 message), update it live!
    setMessages((prevMessages) => {
      if (prevMessages.length <= 1) {
        return [
          {
            id: prevMessages[0]?.id || ('msg_welcome_' + Date.now()),
            sender: 'bot',
            text: rootNode.message,
            timestamp: prevMessages[0]?.timestamp || getCurrentTimeString(),
            status: 'read',
            quickOptions: rootNode.triggers.map((t) => ({ key: t.key, label: t.label })),
          },
        ];
      }
      return prevMessages;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col relative">
      
      {/* Top Header */}
      <Header
        attendantState={attendantState}
        onResetChat={handleResetChat}
        onResetDefaultFlow={handleResetDefaultFlow}
        onOpenExportModal={() => setModalState({ isOpen: true, mode: 'export' })}
        onOpenImportModal={() => setModalState({ isOpen: true, mode: 'import' })}
        onToggleSimulator={() => setIsSimulatorVisible(!isSimulatorVisible)}
        isSimulatorVisible={isSimulatorVisible}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Flow Builder & Live Attendant Panel (Expands to 100% full width when simulator is closed) */}
        <section className={`${isSimulatorVisible ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          
          {/* Main Tab Switcher */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1">
            <button
              onClick={() => setActiveTab('flow_builder')}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'flow_builder'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-blue-200" />
              <span>Aba 1: Construtor do Fluxo (Bot)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('human_agent');
                setAttendantState((prev) => ({ ...prev, unreadCount: 0 }));
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all relative cursor-pointer ${
                activeTab === 'human_agent'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-200" />
              <span>Aba 2: Painel do Atendente</span>
              {attendantState.unreadCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-bounce">
                  {attendantState.unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Tab Component */}
          {activeTab === 'flow_builder' ? (
            <FlowBuilderTab
              flowData={flowData}
              currentNodeId={currentNodeId}
              onUpdateFlowData={handleUpdateFlowData}
              onOpenSimulator={() => setIsSimulatorVisible(true)}
            />
          ) : (
            <AgentPanelTab
              attendantState={attendantState}
              messages={messages}
              currentNode={currentNode}
              onToggleHumanMode={handleToggleHumanMode}
              onSendAgentMessage={handleSendAgentMessage}
              onUpdateNotes={(notes) => setAttendantState((prev) => ({ ...prev, notes }))}
            />
          )}

        </section>

        {/* WhatsApp Simulator (Appears only after user clicks to open!) */}
        {isSimulatorVisible && (
          <section className="lg:col-span-5 sticky top-4 animate-fadeIn">
            <WhatsAppSimulator
              messages={messages}
              attendantState={attendantState}
              currentNode={currentNode}
              isBotTyping={isBotTyping}
              onSendClientMessage={handleSendClientMessage}
              onResetChat={handleResetChat}
              onClose={() => setIsSimulatorVisible(false)}
            />
          </section>
        )}

      </main>

      {/* Floating Action Button when Simulator is Closed */}
      {!isSimulatorVisible && (
        <button
          onClick={() => setIsSimulatorVisible(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-emerald-400 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          title="Clique para abrir o Simulador do WhatsApp e testar seu fluxo"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <Smartphone className="w-5 h-5 text-emerald-200 group-hover:rotate-12 transition-transform" />
          <span>Testar no Simulador WhatsApp</span>
        </button>
      )}

      {/* Export / Import Modal */}
      <ImportExportModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        flowData={flowData}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onImportFlow={handleImportFlow}
      />

    </div>
  );
}
