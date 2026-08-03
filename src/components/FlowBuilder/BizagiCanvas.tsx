import React, { useState, useRef, useEffect } from 'react';
import { FlowData, FlowNode, Trigger } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  CornerDownRight,
  ArrowRight,
  Check,
  Home,
  UserCheck,
  MessageSquareText,
  GitFork,
  X,
  Layers,
  HelpCircle,
  Move,
  PanelRightOpen,
  PanelRightClose,
  Smartphone,
} from 'lucide-react';

interface BizagiCanvasProps {
  flowData: FlowData;
  currentNodeId: string;
  onUpdateFlowData: (newData: FlowData) => void;
  onSelectNodeInSimulator?: (nodeId: string) => void;
  onOpenSimulator?: () => void;
}

export const BizagiCanvas: React.FC<BizagiCanvasProps> = ({
  flowData,
  currentNodeId,
  onUpdateFlowData,
  onSelectNodeInSimulator,
  onOpenSimulator,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    flowData.nodes.find((n) => n.isRoot)?.id || flowData.nodes[0]?.id || null
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [createdSuccessMsg, setCreatedSuccessMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Click vs Drag sensitivity tracking
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // Dragging individual nodes on canvas
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom node positions state
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key for exiting fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Auto layout calculation if custom position isn't set yet
  const getNodePosition = (node: FlowNode, index: number) => {
    if (customPositions[node.id]) {
      return customPositions[node.id];
    }
    // Default Tree layout: Root at (40, 40), Subnodes arranged in columns/rows
    if (node.isRoot) {
      return { x: 40, y: 40 };
    }
    // Calculate grid layout for subnodes
    const rootNodesCount = 1;
    const subIndex = index - rootNodesCount;
    const col = subIndex % 2;
    const row = Math.floor(subIndex / 2);
    return {
      x: 480 + col * 380,
      y: 40 + row * 320,
    };
  };

  // Currently selected node object
  const selectedNode = flowData.nodes.find((n) => n.id === selectedNodeId) || null;

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 30, y: 30 });
  };

  // Pan handlers
  const handleMouseDownCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only pan if clicking direct canvas background (not interactive node cards)
    const target = e.target as HTMLElement;
    if (target.closest('.process-card-node') || target.closest('.inspector-panel')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedNodeId) {
      // Dragging node
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - panOffset.x) / zoomLevel - nodeDragOffset.x;
      const y = (e.clientY - rect.top - panOffset.y) / zoomLevel - nodeDragOffset.y;

      setCustomPositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: Math.max(10, x), y: Math.max(10, y) },
      }));
      return;
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Node Drag Start
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsInspectorOpen(true);

    const pos = customPositions[nodeId] || getNodePosition(
      flowData.nodes.find((n) => n.id === nodeId)!,
      flowData.nodes.findIndex((n) => n.id === nodeId)
    );

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedNodeId(nodeId);
    setNodeDragOffset({
      x: (e.clientX - rect.left - panOffset.x) / zoomLevel - pos.x,
      y: (e.clientY - rect.top - panOffset.y) / zoomLevel - pos.y,
    });
  };

  // --- 1-CLICK SUBMENU CREATION (Bizagi Modeler core feature) ---
  const handleCreateConnectedSubmenu = (parentNodeId: string, triggerId: string, triggerLabel: string) => {
    const parentNode = flowData.nodes.find((n) => n.id === parentNodeId);
    if (!parentNode) return;

    const rootNode = flowData.nodes.find((n) => n.isRoot) || flowData.nodes[0];
    const newSubnodeId = 'node_sub_' + Date.now();
    const cleanLabel = triggerLabel.trim() || 'Nova Opção';
    const title = `Submenu: ${cleanLabel}`;

    // Create the new child process node
    const newSubnode: FlowNode = {
      id: newSubnodeId,
      title,
      message: `*${title}*\n\nVocê selecionou *${cleanLabel}*.\nEscolha uma das opções abaixo para prosseguir:`,
      isRoot: false,
      triggers: [
        {
          id: `tr_${Date.now()}_1`,
          key: '1',
          label: 'Ver Informações Detalhadas',
          action: 'auto_reply',
          autoReplyMessage: 'As informações da sua solicitação foram enviadas!',
        },
        {
          id: `tr_${Date.now()}_2`,
          key: '2',
          label: 'Falar com Atendente Humano',
          action: 'human',
        },
        {
          id: `tr_${Date.now()}_0`,
          key: '0',
          label: 'Voltar ao Menu Principal',
          action: 'node',
          targetNodeId: rootNode ? rootNode.id : '',
        },
      ],
    };

    // Calculate smart position next to parent
    const parentPos = customPositions[parentNodeId] || getNodePosition(
      parentNode,
      flowData.nodes.findIndex((n) => n.id === parentNodeId)
    );

    setCustomPositions((prev) => ({
      ...prev,
      [newSubnodeId]: {
        x: parentPos.x + 360,
        y: parentPos.y + (parentNode.triggers.findIndex((t) => t.id === triggerId) * 110),
      },
    }));

    // Update parent trigger to point to new subnode
    const updatedNodes = flowData.nodes.map((node) => {
      if (node.id === parentNodeId) {
        return {
          ...node,
          triggers: node.triggers.map((t) =>
            t.id === triggerId ? { ...t, action: 'node' as const, targetNodeId: newSubnodeId } : t
          ),
        };
      }
      return node;
    });

    // Save flow data with new node
    onUpdateFlowData({
      ...flowData,
      nodes: [...updatedNodes, newSubnode],
    });

    // Auto-select the newly created submenu in Inspector
    setSelectedNodeId(newSubnodeId);
    setIsInspectorOpen(true);

    // Show confirmation Toast
    setCreatedSuccessMsg(`✨ Submenu "${title}" criado e conectado com sucesso!`);
    setTimeout(() => setCreatedSuccessMsg(null), 3500);
  };

  // Add new standalone process node
  const handleAddNewStandaloneNode = () => {
    const newId = 'node_' + Date.now();
    const newNode: FlowNode = {
      id: newId,
      title: `Novo Processo ${flowData.nodes.length + 1}`,
      message: 'Digite aqui a mensagem que o cliente receberá nesta etapa.',
      isRoot: false,
      triggers: [
        {
          id: `tr_${Date.now()}_1`,
          key: '1',
          label: 'Confirmar / Prosseguir',
          action: 'auto_reply',
          autoReplyMessage: 'Obrigado por confirmar!',
        },
      ],
    };

    setCustomPositions((prev) => ({
      ...prev,
      [newId]: { x: 100, y: 150 + flowData.nodes.length * 80 },
    }));

    onUpdateFlowData({
      ...flowData,
      nodes: [...flowData.nodes, newNode],
    });

    setSelectedNodeId(newId);
    setIsInspectorOpen(true);
  };

  // Inspector Field Updaters
  const handleUpdateSelectedNode = (fields: Partial<FlowNode>) => {
    if (!selectedNodeId) return;

    let updatedNodes = [...flowData.nodes];

    if (fields.isRoot) {
      updatedNodes = updatedNodes.map((n) => ({ ...n, isRoot: false }));
    }

    updatedNodes = updatedNodes.map((node) => {
      if (node.id === selectedNodeId) {
        return { ...node, ...fields };
      }
      return node;
    });

    const newStartNodeId = fields.isRoot ? selectedNodeId : flowData.startNodeId;

    onUpdateFlowData({
      ...flowData,
      nodes: updatedNodes,
      startNodeId: newStartNodeId,
    });
  };

  // Trigger editing inside Inspector
  const handleAddTriggerToSelected = () => {
    if (!selectedNode) return;
    const nextKey = (selectedNode.triggers.length + 1).toString();
    const newTrigger: Trigger = {
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      key: nextKey,
      label: `Nova Opção ${nextKey}`,
      action: 'auto_reply',
      autoReplyMessage: 'Resposta da opção selecionada.',
    };

    handleUpdateSelectedNode({
      triggers: [...selectedNode.triggers, newTrigger],
    });
  };

  const handleUpdateTriggerInSelected = (triggerId: string, fields: Partial<Trigger>) => {
    if (!selectedNode) return;
    const updatedTriggers = selectedNode.triggers.map((t) =>
      t.id === triggerId ? { ...t, ...fields } : t
    );
    handleUpdateSelectedNode({ triggers: updatedTriggers });
  };

  const handleDeleteTriggerFromSelected = (triggerId: string) => {
    if (!selectedNode) return;
    const updatedTriggers = selectedNode.triggers.filter((t) => t.id !== triggerId);
    handleUpdateSelectedNode({ triggers: updatedTriggers });
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    if (flowData.nodes.length <= 1) {
      alert('O fluxo precisa ter pelo menos um nó de atendimento!');
      return;
    }
    const nodeToDelete = flowData.nodes.find((n) => n.id === selectedNodeId);
    if (nodeToDelete?.isRoot) {
      alert('Não é possível excluir o nó inicial do fluxo.');
      return;
    }

    const remainingNodes = flowData.nodes.filter((n) => n.id !== selectedNodeId);
    onUpdateFlowData({
      ...flowData,
      nodes: remainingNodes,
    });

    setSelectedNodeId(remainingNodes[0]?.id || null);
  };

  // Calculate SVG arrow connections between trigger buttons and target nodes
  const renderSvgConnections = () => {
    const connections: { id: string; x1: number; y1: number; x2: number; y2: number; label: string }[] = [];

    flowData.nodes.forEach((sourceNode, srcIdx) => {
      const sourcePos = customPositions[sourceNode.id] || getNodePosition(sourceNode, srcIdx);

      sourceNode.triggers.forEach((trig, trigIdx) => {
        if ((trig.action === 'node' || trig.action === 'ai_agent') && trig.targetNodeId) {
          const targetNode = flowData.nodes.find((n) => n.id === trig.targetNodeId);
          if (targetNode) {
            const targetIdx = flowData.nodes.findIndex((n) => n.id === targetNode.id);
            const targetPos = customPositions[targetNode.id] || getNodePosition(targetNode, targetIdx);

            // Anchor output coordinates (right side of trigger item)
            const x1 = sourcePos.x + 320;
            const y1 = sourcePos.y + 115 + trigIdx * 52;

            // Anchor input coordinates (left side of target process card)
            const x2 = targetPos.x;
            const y2 = targetPos.y + 60;

            connections.push({
              id: `${sourceNode.id}_${trig.id}_${targetNode.id}`,
              x1,
              y1,
              x2,
              y2,
              label: `[${trig.key}] ${trig.label}`,
            });
          }
        }
      });
    });

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
        <defs>
          <marker
            id="bizagi-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>

        {connections.map((conn) => {
          const dx = conn.x2 - conn.x1;
          const controlPointOffset = Math.max(Math.abs(dx) * 0.5, 60);

          const pathD = `M ${conn.x1} ${conn.y1} C ${conn.x1 + controlPointOffset} ${conn.y1}, ${
            conn.x2 - controlPointOffset
          } ${conn.y2}, ${conn.x2} ${conn.y2}`;

          return (
            <g key={conn.id}>
              {/* Outer glow line */}
              <path
                d={pathD}
                fill="none"
                stroke="#93c5fd"
                strokeWidth="4"
                strokeOpacity="0.4"
              />
              {/* Main Directional Connection Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeDasharray="0"
                markerEnd="url(#bizagi-arrow)"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col transition-all relative ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-0 p-0'
          : 'rounded-2xl h-[750px]'
      }`}
    >
      {/* TOOLBAR TOP HEADER */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-2">
              Modelador de Processos BPMN (Estilo Bizagi)
            </h3>
            <p className="text-[11px] text-slate-400">
              Clique em <span className="text-blue-400 font-bold">+ Submenu</span> em qualquer opção para expandir o processo instantaneamente.
            </p>
          </div>
        </div>

        {/* Toolbar Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-slate-300">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 transition-colors cursor-pointer"
              title="Diminuir Zoom (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 font-bold min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 transition-colors cursor-pointer"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Centralizar e Redefinir Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isFullscreen
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isFullscreen ? 'Sair da Tela Cheia (Pressione Esc)' : 'Expandir o Modelador em Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
          </button>

          {/* Open WhatsApp Simulator Button */}
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#075e54] hover:bg-[#128c7e] text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Abrir o Simulador WhatsApp"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulador WhatsApp</span>
            </button>
          )}

          {/* Add New Node Button */}
          <button
            onClick={handleAddNewStandaloneNode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            title="Adicionar um novo nó de processo no canvas"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Criar Novo Nó</span>
          </button>

          {/* Toggle Inspector Panel */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
              isInspectorOpen
                ? 'bg-slate-800 border-slate-700 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Alternar Painel de Propriedades Lateral"
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Propriedades</span>
          </button>
        </div>
      </div>

      {/* TOAST SUCCESS NOTIFICATION */}
      {createdSuccessMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{createdSuccessMsg}</span>
        </div>
      )}

      {/* MAIN CANVAS + SIDE INSPECTOR CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* INFINITE CANVAS AREA */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className={`flex-1 relative overflow-hidden bg-slate-950 cursor-${
            isPanning ? 'grabbing' : 'grab'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          }}
        >
          {/* CANVAS CONTENT SCALED LAYER */}
          <div
            className="absolute inset-0 origin-top-left transition-transform duration-75"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              width: '3500px',
              height: '2500px',
            }}
          >
            {/* SVG Directional Arrow Connections */}
            {renderSvgConnections()}

            {/* BIZAGI PROCESS CARDS (NODES) */}
            {flowData.nodes.map((node, index) => {
              const pos = customPositions[node.id] || getNodePosition(node, index);
              const isSelected = node.id === selectedNodeId;
              const isActiveInSim = node.id === currentNodeId;

              return (
                <div
                  key={node.id}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: '320px',
                  }}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    setIsInspectorOpen(true);
                  }}
                  className={`process-card-node absolute rounded-2xl border-2 shadow-xl bg-slate-900 transition-all z-20 ${
                    isSelected
                      ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-blue-900/40 scale-[1.01]'
                      : isActiveInSim
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* BIZAGI CARD HEADER */}
                  <div
                    onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                    className={`px-3.5 py-2.5 rounded-t-[14px] flex items-center justify-between gap-2 cursor-move select-none ${
                      node.isRoot
                        ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-emerald-100 border-b border-emerald-700/60'
                        : 'bg-gradient-to-r from-blue-900 to-slate-900 text-blue-100 border-b border-blue-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {node.isRoot ? (
                        <span className="bg-emerald-500 text-slate-950 p-1 rounded-md text-[10px] font-extrabold shrink-0 flex items-center gap-1 shadow-xs">
                          <Home className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="bg-blue-500 text-slate-950 p-1 rounded-md text-[10px] font-extrabold shrink-0 flex items-center gap-1 shadow-xs">
                          <Layers className="w-3 h-3" />
                        </span>
                      )}

                      <h4 className="font-bold text-xs truncate text-white" title={node.title}>
                        {node.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActiveInSim && (
                        <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          No Simulador
                        </span>
                      )}
                      <Move className="w-3.5 h-3.5 text-slate-400 opacity-60 hover:opacity-100" />
                    </div>
                  </div>

                  {/* BIZAGI CARD BODY (Bot Message Preview) */}
                  <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 text-xs text-slate-300 italic line-clamp-2 leading-relaxed">
                    "{node.message}"
                  </div>

                  {/* BIZAGI CARD DECISION BRANCHES (Triggers) */}
                  <div className="p-2 space-y-1.5 bg-slate-900/90 rounded-b-2xl">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                      <span>Saídas / Decisões:</span>
                      <span>{node.triggers.length} Opções</span>
                    </div>

                    {node.triggers.map((trig) => {
                      const targetNode = flowData.nodes.find((n) => n.id === trig.targetNodeId);

                      return (
                        <div
                          key={trig.id}
                          className="bg-slate-950 p-2 rounded-xl border border-slate-800/90 flex items-center justify-between gap-1.5 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="bg-slate-800 text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                              [{trig.key}]
                            </span>
                            <span className="font-semibold text-slate-200 text-xs truncate max-w-[110px]" title={trig.label}>
                              {trig.label}
                            </span>
                          </div>

                          {/* Action Outcome Indicator or 1-Click Submenu Expansion Button */}
                          <div className="flex items-center gap-1 shrink-0">
                            {trig.action === 'node' && targetNode ? (
                              <span className="text-[10px] bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-800 flex items-center gap-1">
                                <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                                <span className="max-w-[70px] truncate">{targetNode.title}</span>
                              </span>
                            ) : (
                              /* 1-CLICK BIZAGI SUBMENU CREATION BUTTON */
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateConnectedSubmenu(node.id, trig.id, trig.label);
                                }}
                                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-2 py-1 rounded-lg transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                                title="Clique aqui para criar e conectar um novo Submenu instantaneamente"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Submenu</span>
                              </button>
                            )}

                            {trig.action === 'auto_reply' && (
                              <span className="text-[10px] bg-sky-950 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-800 flex items-center gap-1">
                                <MessageSquareText className="w-2.5 h-2.5" /> Resposta
                              </span>
                            )}

                            {trig.action === 'ai_agent' && (
                              <span className="text-[10px] bg-purple-950 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-800 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-400" /> IA (Gemini)
                              </span>
                            )}

                            {trig.action === 'human' && (
                              <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5" /> Humano
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDE PROPERTY INSPECTOR PANEL (Painel de Propriedades Bizagi) */}
        {isInspectorOpen && (
          <div className="inspector-panel w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-30 shrink-0">
            {/* Inspector Header */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100">
                    Inspeção de Propriedades
                  </h4>
                  <p className="text-[10px] text-slate-400">Edição em tempo real do bloco selecionado</p>
                </div>
              </div>

              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Content */}
            {selectedNode ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-300">
                {/* Node Title Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Título do Bloco / Submenu:
                  </label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => handleUpdateSelectedNode({ title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Submenu de Vendas"
                  />
                </div>

                {/* Bot Message Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mensagem Enviada pelo Bot:
                  </label>
                  <textarea
                    rows={4}
                    value={selectedNode.message}
                    onChange={(e) => handleUpdateSelectedNode({ message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono leading-relaxed"
                    placeholder="Texto que o cliente lerá no WhatsApp ao entrar neste menu..."
                  />
                </div>

                {/* AI Knowledge Base Context Field */}
                <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Base de Conhecimento para IA (Gemini):
                  </label>
                  <p className="text-[10px] text-purple-200/80">
                    Instruções, preços e contexto consultados pelo robô ao responder em texto livre neste nó.
                  </p>
                  <textarea
                    rows={3}
                    value={selectedNode.aiKnowledgeBase || ''}
                    onChange={(e) => handleUpdateSelectedNode({ aiKnowledgeBase: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-purple-700/60 rounded-lg text-xs text-purple-100 font-mono leading-relaxed focus:ring-2 focus:ring-purple-500"
                    placeholder="Cole aqui preços, FAQ e informações do seu negócio..."
                  />
                </div>

                {/* Is Root Switch */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">Menu Raiz Inicial</span>
                    <span className="text-[10px] text-slate-400">Primeiro atendimento do bot</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateSelectedNode({ isRoot: !selectedNode.isRoot })}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      selectedNode.isRoot
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {selectedNode.isRoot ? '🟢 Sim (Raiz)' : 'Não'}
                  </button>
                </div>

                {/* Triggers Section */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-blue-400" /> Options / Saídas ({selectedNode.triggers.length}):
                    </span>
                    <button
                      onClick={handleAddTriggerToSelected}
                      className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Opção
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedNode.triggers.map((trig) => (
                      <div
                        key={trig.id}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 relative group"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={trig.key}
                            onChange={(e) =>
                              handleUpdateTriggerInSelected(trig.id, { key: e.target.value })
                            }
                            className="w-12 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-blue-300 text-xs"
                            placeholder="Key"
                            title="Gatilho/Tecla (ex: 1)"
                          />
                          <input
                            type="text"
                            value={trig.label}
                            onChange={(e) =>
                              handleUpdateTriggerInSelected(trig.id, { label: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg font-bold text-slate-100 text-xs"
                            placeholder="Ex: Falar com Vendas"
                          />
                          <button
                            onClick={() => handleDeleteTriggerFromSelected(trig.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Excluir Opção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Action Selector */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            Qual a ação após selecionar esta opção?
                          </label>
                          <select
                            value={trig.action}
                            onChange={(e) =>
                              handleUpdateTriggerInSelected(trig.id, {
                                action: e.target.value as any,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-semibold"
                          >
                            <option value="node">🔀 Ir para outro Nó / Submenu</option>
                            <option value="auto_reply">💬 Responder Mensagem Direta</option>
                            <option value="ai_agent">🤖 Atendimento com IA (Gemini)</option>
                            <option value="human">👨‍💻 Transferir para Atendente Humano</option>
                          </select>
                        </div>

                        {/* Action Details */}
                        {(trig.action === 'node' || trig.action === 'ai_agent') && (
                          <div className="pt-1">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                                {trig.action === 'ai_agent' ? (
                                  <>
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    <span className="text-purple-300">Nó de IA Conectado:</span>
                                  </>
                                ) : (
                                  'Submenu Conectado:'
                                )}
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCreateConnectedSubmenu(selectedNode.id, trig.id, trig.label)
                                }
                                className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> + Novo Submenu
                              </button>
                            </div>
                            <select
                              value={trig.targetNodeId || ''}
                              onChange={(e) =>
                                handleUpdateTriggerInSelected(trig.id, {
                                  targetNodeId: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-medium"
                            >
                              <option value="">-- Selecione o Submenu de destino --</option>
                              {flowData.nodes.map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.title} {n.isRoot ? '(Raiz)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {trig.action === 'auto_reply' && (
                          <div className="pt-1">
                            <label className="block text-[10px] text-sky-400 font-bold mb-0.5">
                              Texto da Resposta Automática:
                            </label>
                            <input
                              type="text"
                              value={trig.autoReplyMessage || ''}
                              onChange={(e) =>
                                handleUpdateTriggerInSelected(trig.id, {
                                  autoReplyMessage: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                              placeholder="Digite a resposta do bot..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete Node Footer Button */}
                <div className="border-t border-slate-800 pt-4 pb-2">
                  <button
                    onClick={handleDeleteSelectedNode}
                    className="w-full py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold rounded-xl border border-rose-800/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir este Bloco ({selectedNode.title})</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
                <p>Clique em qualquer bloco do canvas para inspecionar e editar suas propriedades aqui.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
