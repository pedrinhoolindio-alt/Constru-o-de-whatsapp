import React, { useState } from 'react';
import { FlowData } from '../types';
import { generateStructuredPdfDoc, generateVisualCanvasPdf } from '../utils/pdfGenerator';
import { X, FileText, Image as ImageIcon, Download, CheckCircle, AlertCircle, Loader2, Sparkles, Layers } from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  flowData: FlowData;
  activeFlowName?: string;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  flowData,
  activeFlowName = 'Atendimento WhatsApp',
  onClose,
}) => {
  const [pdfType, setPdfType] = useState<'structured' | 'visual'>('structured');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalNodes = flowData.nodes.length;
  const totalTriggers = flowData.nodes.reduce((acc, n) => acc + (n.triggers ? n.triggers.length : 0), 0);
  const rootNode = flowData.nodes.find((n) => n.isRoot) || flowData.nodes[0];

  const handleExport = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (pdfType === 'structured') {
        generateStructuredPdfDoc(flowData, activeFlowName);
        setSuccessMsg('PDF com a documentação estruturada gerado e baixado com sucesso!');
      } else {
        await generateVisualCanvasPdf('bizagi-canvas-viewport', activeFlowName);
        setSuccessMsg('PDF com o mapa visual do canvas gerado e baixado com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao gerar o arquivo PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Exportar Modelo em PDF</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-extrabold uppercase border border-blue-400/30">
                  Organizado
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gere um documento profissional para apresentação, documentação ou validação de equipe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          
          {/* Active Flow Brief Summary */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Fluxo Ativo:</div>
              <div className="text-sm font-bold text-white truncate max-w-[240px]">{activeFlowName}</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-center">
                <span className="block font-bold text-blue-400 text-sm">{totalNodes}</span>
                <span className="text-[9px] text-slate-400 uppercase">Telas/Nós</span>
              </div>
              <div className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-center">
                <span className="block font-bold text-emerald-400 text-sm">{totalTriggers}</span>
                <span className="text-[9px] text-slate-400 uppercase">Saídas/Opções</span>
              </div>
            </div>
          </div>

          {/* Export Format Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Escolha o Formato do PDF:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Structured Document */}
              <button
                type="button"
                onClick={() => setPdfType('structured')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  pdfType === 'structured'
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  {pdfType === 'structured' && (
                    <span className="p-1 bg-blue-500 text-white rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Documentação Organizada</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Relatório completo multi-páginas com estatísticas, mapa do menu e telas organizadas em caixas legíveis.
                  </p>
                </div>
              </button>

              {/* Option 2: Visual Canvas Diagram */}
              <button
                type="button"
                onClick={() => setPdfType('visual')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  pdfType === 'visual'
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  {pdfType === 'visual' && (
                    <span className="p-1 bg-blue-500 text-white rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Mapa Visual do Canvas</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Captura gráfica do diagrama/canvas em alta resolução em formato de imagem em PDF no padrão Paisagem.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Detailed Features list */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
            <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>O PDF gerado incluirá:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400 pl-4 list-disc">
              <li>Mapeamento em tabelas dos menus principais e seus desdobramentos</li>
              <li>Texto exato de todas as mensagens configuradas para o bot</li>
              <li>Opções de digitação, saídas, destinos e transferências para atendimento humano</li>
              <li>Informações do fallback de segurança para respostas inválidas</li>
            </ul>
          </div>

          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleExport}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Relatório PDF</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
