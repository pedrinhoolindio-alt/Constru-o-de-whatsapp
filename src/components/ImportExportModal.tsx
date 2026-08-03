import React, { useState } from 'react';
import { FlowData } from '../types';
import { X, Download, Upload, Copy, Check, FileJson, AlertTriangle } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  mode: 'export' | 'import';
  flowData: FlowData;
  onClose: () => void;
  onImportFlow: (importedData: FlowData) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  mode,
  flowData,
  onClose,
  onImportFlow,
}) => {
  const [jsonText, setJsonText] = useState(
    mode === 'export' ? JSON.stringify(flowData, null, 2) : ''
  );
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(flowData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(flowData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxo-whatsapp-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    try {
      setErrorMsg('');
      if (!jsonText.trim()) {
        setErrorMsg('Por favor, cole ou carregue o código JSON do fluxo.');
        return;
      }

      const parsed = JSON.parse(jsonText);

      // Simple validation
      if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        throw new Error('O JSON deve conter uma lista válida de "nodes" (nós).');
      }

      if (!parsed.startNodeId) {
        throw new Error('O JSON deve especificar o "startNodeId".');
      }

      onImportFlow(parsed as FlowData);
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro de validação JSON: ' + (err.message || 'Formato inválido.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {mode === 'export' ? 'Exportar Fluxo de Atendimento' : 'Importar Fluxo de Atendimento'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'export'
                  ? 'Baixe ou copie a estrutura completa do fluxo em formato JSON'
                  : 'Cole ou envie um arquivo JSON contendo a estrutura de nós e regras'}
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

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-800">
          {mode === 'import' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Carregar Arquivo JSON (.json):
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {mode === 'export' ? 'Estrutura do Fluxo (JSON)' : 'Cole o Código JSON aqui:'}
              </label>
              {mode === 'export' && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              )}
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              readOnly={mode === 'export'}
              rows={12}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed"
              placeholder={mode === 'import' ? '{\n  "startNodeId": "node_root",\n  "nodes": [...]\n}' : ''}
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {mode === 'export' ? (
            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Baixar Arquivo JSON
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProcessImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Importar e Aplicar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
