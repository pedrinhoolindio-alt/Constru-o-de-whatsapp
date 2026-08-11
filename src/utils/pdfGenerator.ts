import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FlowData, FlowNode, Trigger } from '../types';

/**
 * Clean helper to strip or format whatsapp markdown formatting for clean text rendering in PDF
 */
function cleanWhatsAppText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*([^*]+)\*/g, '$1') // Bold *text*
    .replace(/_([^_]+)_/g, '$1') // Italic _text_
    .replace(/~([^~]+)~/g, '$1') // Strikethrough ~text~
    .replace(/```([^`]+)```/g, '$1'); // Code block
}

/**
 * Formats trigger destination in human readable format
 */
function getTriggerDestinationLabel(trig: Trigger, nodes: FlowNode[]): string {
  if (trig.action === 'node' && trig.targetNodeId) {
    const target = nodes.find((n) => n.id === trig.targetNodeId);
    return target ? `➔ Submenu: ${target.title}` : '➔ Submenu Desconhecido';
  }
  if (trig.action === 'human') {
    return '➔ Transfere para Atendente Humano';
  }
  if (trig.action === 'ai_agent') {
    return '➔ Encaminha para Agente Virtual IA';
  }
  if (trig.action === 'auto_reply' && trig.autoReplyMessage) {
    return `➔ Resposta Direta: "${cleanWhatsAppText(trig.autoReplyMessage).substring(0, 45)}${trig.autoReplyMessage.length > 45 ? '...' : ''}"`;
  }
  return '➔ Resposta Direta em Texto';
}

/**
 * Generates an organized, multi-page structured PDF documentation of the entire flow.
 */
export function generateStructuredPdfDoc(flowData: FlowData, flowName: string = 'Atendimento WhatsApp') {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let yPos = margin;
  let pageNumber = 1;

  // Helper for adding Page Header & Footer
  const addHeaderAndFooter = () => {
    // Header line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Documentação de Fluxo: ${flowName}`, margin, 9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 9, { align: 'right' });

    // Footer
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text('Simulador de Fluxos de Atendimento WhatsApp', margin, pageHeight - 7);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      pageNumber++;
      yPos = margin + 8;
      addHeaderAndFooter();
    }
  };

  // Initial Header
  addHeaderAndFooter();
  yPos += 5;

  // ==================== COVER / SUMMARY BLOCK ====================
  // Title Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Relatório Estruturado do Fluxo de Atendimento', margin + 8, yPos + 11);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Modelo / Nome do Fluxo: ${flowName}`, margin + 8, yPos + 20);

  yPos += 34;

  // Stats Grid (4 Boxes)
  const totalNodes = flowData.nodes.length;
  const rootNode = flowData.nodes.find((n) => n.isRoot) || flowData.nodes[0];
  const totalTriggers = flowData.nodes.reduce((acc, n) => acc + (n.triggers ? n.triggers.length : 0), 0);
  const humanTransferNodes = flowData.nodes.filter((n) => n.triggers.some((t) => t.action === 'human')).length;

  const boxWidth = (contentWidth - 9) / 4; // ~42mm each
  const stats = [
    { label: 'Total de Nós', val: String(totalNodes), color: [37, 99, 235] }, // blue
    { label: 'Opções / Saídas', val: String(totalTriggers), color: [16, 185, 129] }, // emerald
    { label: 'Menu Principal', val: `${rootNode?.triggers.length || 0} Opções`, color: [139, 92, 246] }, // purple
    { label: 'Atend. Humano', val: `${humanTransferNodes} Pontos`, color: [245, 158, 11] }, // amber
  ];

  stats.forEach((stat, idx) => {
    const x = margin + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yPos, boxWidth, 18, 2, 2, 'FD');

    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.rect(x, yPos, 2, 18, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.val, x + 6, yPos + 8);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, x + 6, yPos + 14);
  });

  yPos += 24;

  // Fallback Rule Note Box
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('💡 Mensagem de Opção Inválida (Fallback Padrão):', margin + 4, yPos + 5.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  const fallbackClean = cleanWhatsAppText(flowData.defaultFallback || 'Opção inválida, por favor digite novamente.');
  doc.text(`"${fallbackClean}"`, margin + 4, yPos + 10.5);

  yPos += 20;

  // ==================== SECTION 1: MAIN MENU MAP ====================
  checkPageBreak(35);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Estrutura do Menu Principal (Nó de Boas-Vindas)', margin, yPos);
  yPos += 6;

  if (rootNode && rootNode.triggers && rootNode.triggers.length > 0) {
    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, yPos, contentWidth, 7, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Dígito', margin + 3, yPos + 4.8);
    doc.text('Opção do Menu', margin + 20, yPos + 4.8);
    doc.text('Ação e Destino do Bot', margin + 95, yPos + 4.8);

    yPos += 7;

    rootNode.triggers.forEach((trig, idx) => {
      checkPageBreak(8);

      const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, contentWidth, 7.5, 'FD');

      // Key Badge
      doc.setFillColor(37, 99, 235); // blue-600
      doc.roundedRect(margin + 3, yPos + 1.5, 12, 4.5, 1, 1, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`[ ${trig.key} ]`, margin + 9, yPos + 4.8, { align: 'center' });

      // Label
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(trig.label.length > 40 ? `${trig.label.substring(0, 38)}...` : trig.label, margin + 20, yPos + 4.8);

      // Destination
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const destLabel = getTriggerDestinationLabel(trig, flowData.nodes);
      doc.text(destLabel.length > 50 ? `${destLabel.substring(0, 48)}...` : destLabel, margin + 95, yPos + 4.8);

      yPos += 7.5;
    });
  }

  yPos += 12;

  // ==================== SECTION 2: DETAILED NODES BREAKDOWN ====================
  checkPageBreak(25);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Detalhamento Organizado de Todos os Nós e Telas', margin, yPos);
  yPos += 7;

  // Order nodes: Root first, then others
  const sortedNodes = [
    ...flowData.nodes.filter((n) => n.isRoot),
    ...flowData.nodes.filter((n) => !n.isRoot),
  ];

  sortedNodes.forEach((node, nodeIdx) => {
    // Estimate node block size
    const messageLines = doc.splitTextToSize(cleanWhatsAppText(node.message), contentWidth - 16);
    const triggerCount = node.triggers ? node.triggers.length : 0;
    const estimatedHeight = 30 + messageLines.length * 4.5 + triggerCount * 8;

    checkPageBreak(Math.min(estimatedHeight, 80));

    // Card Outer Box
    const cardStartY = yPos;

    // Node Header Bar
    const isRoot = node.isRoot;
    const headerBg = isRoot ? [15, 23, 42] : [30, 41, 59]; // slate-900 / slate-800
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.roundedRect(margin, yPos, contentWidth, 9, 2, 2, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`#${nodeIdx + 1}. ${node.title}`, margin + 5, yPos + 6);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const badgeText = isRoot ? 'NÓ INICIAL (MENU)' : `ID: ${node.id}`;
    doc.text(badgeText, pageWidth - margin - 5, yPos + 6, { align: 'right' });

    yPos += 12;

    // Message Content Box (WhatsApp Style Box)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    const msgBoxHeight = messageLines.length * 4.5 + 8;
    doc.roundedRect(margin + 3, yPos, contentWidth - 6, msgBoxHeight, 2, 2, 'FD');

    // Green whatsapp accent line on left
    doc.setFillColor(37, 99, 235); // blue accent
    doc.rect(margin + 3, yPos, 2, msgBoxHeight, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('💬 MENSAGEM DO BOT ENVIADA AO CLIENTE:', margin + 8, yPos + 5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    let msgLineY = yPos + 10;
    messageLines.forEach((line: string) => {
      doc.text(line, margin + 8, msgLineY);
      msgLineY += 4.5;
    });

    yPos += msgBoxHeight + 5;

    // Triggers / Decisões Table
    if (node.triggers && node.triggers.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`SAÍDAS / DECISÕES DESSA TELA (${node.triggers.length} OPÇÕES):`, margin + 3, yPos);
      yPos += 4;

      node.triggers.forEach((trig) => {
        checkPageBreak(8);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin + 3, yPos, contentWidth - 6, 7, 1.5, 1.5, 'FD');

        // Key
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(margin + 5, yPos + 1.2, 10, 4.5, 1, 1, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(trig.key, margin + 10, yPos + 4.5, { align: 'center' });

        // Label
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(trig.label.length > 35 ? `${trig.label.substring(0, 33)}...` : trig.label, margin + 18, yPos + 4.5);

        // Destination
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const destText = getTriggerDestinationLabel(trig, flowData.nodes);
        doc.text(destText.length > 50 ? `${destText.substring(0, 48)}...` : destText, margin + 90, yPos + 4.5);

        yPos += 8;
      });
    } else {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Nenhuma opção configurada nesta tela (Nó Final/Resposta Estática).', margin + 3, yPos);
      yPos += 6;
    }

    // Outer card border
    const cardEndY = yPos;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, cardStartY, contentWidth, cardEndY - cardStartY + 2, 2, 2, 'D');

    yPos += 10;
  });

  // Save the PDF
  const filename = `${flowName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-fluxo-${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Captures the Visual Flow Canvas or Visualizer element and converts it into a PDF image document.
 */
export async function generateVisualCanvasPdf(elementId: string, flowName: string = 'Atendimento WhatsApp') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do canvas não foi encontrado para captura.');
  }

  // Resolve QUALQUER cor CSS (oklab, oklch, color-mix, etc. — usadas pelo Tailwind v4) para
  // rgba real, usando o canvas 2D como parser de cor confiável do próprio navegador.
  // Isso substitui o truque antigo baseado em getComputedStyle, que o Chrome pode devolver
  // ainda em oklab/oklch e por isso não resolvia nada.
  const resolverCanvas = document.createElement('canvas');
  resolverCanvas.width = 1;
  resolverCanvas.height = 1;
  const resolverCtx = resolverCanvas.getContext('2d')!;
  const colorCache = new Map<string, string>();

  const resolveColorToRgba = (colorStr: string): string => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'none') return colorStr;
    if (colorCache.has(colorStr)) return colorCache.get(colorStr)!;
    let result = colorStr;
    try {
      resolverCtx.clearRect(0, 0, 1, 1);
      resolverCtx.fillStyle = '#000';
      resolverCtx.fillStyle = colorStr;
      resolverCtx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = resolverCtx.getImageData(0, 0, 1, 1).data;
      result = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    } catch {
      result = 'rgb(100, 116, 139)'; // fallback neutro se a cor não puder ser parseada
    }
    colorCache.set(colorStr, result);
    return result;
  };

  const MODERN_COLOR_FN_REGEX = /(oklch|oklab|lab|lch|color-mix)\((?:[^()]|\([^()]*\))*\)/gi;
  const hasModernColor = (value: string) => /(oklch|oklab|lab|lch|color-mix)/i.test(value);

  // Para strings compostas (gradientes, sombras múltiplas) que podem conter várias
  // funções de cor moderna misturadas com outros valores — resolve cada ocorrência
  // individualmente e recompõe a string original.
  const resolveColorFunctionsInString = (value: string): string =>
    value.replace(MODERN_COLOR_FN_REGEX, (match) => resolveColorToRgba(match));

  // Propriedades de cor "simples" (um único valor de cor)
  const SOLID_COLOR_PROPS = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor',
    'caretColor',
  ] as const;

  // Propriedades "compostas" que podem embutir cores dentro de gradientes/sombras
  // (ex.: bg-gradient-to-r do Tailwind v4 gera backgroundImage com oklch nos stops)
  const COMPOSITE_COLOR_PROPS = ['backgroundImage', 'boxShadow', 'textShadow'] as const;

  // IMPORTANTE: o html2canvas clona e processa o DOCUMENTO INTEIRO (não só o elemento alvo)
  // para montar corretamente contexto de stacking/overflow, e só depois recorta a imagem
  // final na área do elemento. Por isso precisamos sanitizar TODOS os elementos da página,
  // não apenas os descendentes de `element` — senão qualquer cor oklch/oklab fora do canvas
  // (ex.: o fundo da página, o header, o modal por trás) também derruba o parser.
  const allOriginalEls = Array.from(document.querySelectorAll<HTMLElement>('*'));
  const resolvedStyles = new Map<string, Record<string, string>>();

  allOriginalEls.forEach((el, idx) => {
    const markerId = `h2c-fix-${idx}`;
    el.setAttribute('data-h2c-fix', markerId);
    const computed = window.getComputedStyle(el);
    const entry: Record<string, string> = {};

    SOLID_COLOR_PROPS.forEach((prop) => {
      const val = computed[prop as any];
      if (val && hasModernColor(val)) {
        entry[prop] = resolveColorToRgba(val);
      }
    });

    COMPOSITE_COLOR_PROPS.forEach((prop) => {
      const val = computed[prop as any];
      if (val && val !== 'none' && hasModernColor(val)) {
        entry[prop] = resolveColorFunctionsInString(val);
      }
    });

    if (Object.keys(entry).length > 0) {
      resolvedStyles.set(markerId, entry);
    }
  });

  try {
    // Use html2canvas to capture image with onclone handler aplicando as cores já resolvidas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#0f172a', // dark slate background
      onclone: (clonedDoc) => {
        const clonedEls = Array.from(clonedDoc.querySelectorAll<HTMLElement>('[data-h2c-fix]'));
        clonedEls.forEach((clonedEl) => {
          const markerId = clonedEl.getAttribute('data-h2c-fix')!;
          const fixes = resolvedStyles.get(markerId);
          if (!fixes) return;
          Object.entries(fixes).forEach(([prop, value]) => {
            (clonedEl.style as any)[prop] = value;
          });
        });
      },
    });

    const imgData = canvas.toDataURL('image/png');

    // Landscape A4 PDF
    const pdf = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;

    // Header bar
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 16, 'F');

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Mapa Visual do Fluxo: ${flowName}`, margin, 11);

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 11, { align: 'right' });

    // Compute scale
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let renderHeight = imgHeight;
    let renderWidth = imgWidth;

    // If image height exceeds page usable height
    const maxUsableHeight = pageHeight - 22 - margin;
    if (renderHeight > maxUsableHeight) {
      renderHeight = maxUsableHeight;
      renderWidth = (canvas.width * renderHeight) / canvas.height;
    }

    const xOffset = (pageWidth - renderWidth) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, 18, renderWidth, renderHeight);

    const filename = `${flowName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-mapa-visual-${Date.now()}.pdf`;
    pdf.save(filename);
  } finally {
    allOriginalEls.forEach((el) => el.removeAttribute('data-h2c-fix'));
  }
}
