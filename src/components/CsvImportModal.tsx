import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

const SAMPLE_CSV = `Product Name,Stock Quantity,Cost Price,Selling Price,Expiry Date,Daily Demand
Amul Taaza Milk 1L,20,54,66,18/10/2026,10
Britannia Whole Wheat Bread,15,38,50,19/10/2026,6
Mother Dairy Paneer 200g,12,75,95,20/10/2026,4
Tata Salt 1kg,50,22,28,,15
Daawat Basmati Rice 5kg,20,360,440,,3
Maggi 2-Minute Noodles,60,44,56,15/12/2026,8`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ count: number; warnings: string[] } | null>(null);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setCsvText(text);
      setErrors([]);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('sample_kirana_stock.csv');
    setCsvText(SAMPLE_CSV);
    setErrors([]);
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'kirana_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!csvText.trim()) {
      setErrors(['Please choose a CSV file or paste CSV content.']);
      return;
    }

    const res = StorageService.importCsv(csvText);
    if (!res.success) {
      setErrors(res.errors);
      setImportResult(null);
    } else {
      setErrors([]);
      setImportResult({ count: res.count, warnings: res.errors });
      setTimeout(() => {
        onImportSuccess(res.count);
        onClose();
      }, 900);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 id="csv-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                Import Inventory CSV
              </h2>
              <p className="text-[11px] text-slate-500">
                Load real shop records. Expiry date and prices are optional.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* File Picker & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose CSV File</span>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline transition-colors"
              >
                Load Sample
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Template</span>
              </button>
            </div>
          </div>

          {fileName && (
            <div className="text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-mono">{fileName}</span>
            </div>
          )}

          {/* Text Area for manual paste */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              CSV Content (or paste directly)
            </label>
            <textarea
              id="csv-text-input"
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setErrors([]);
                setImportResult(null);
              }}
              placeholder="Product Name,Stock Quantity,Cost Price,Selling Price,Expiry Date,Daily Demand..."
              className="w-full p-3 font-mono text-xs bg-slate-50/80 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-900 leading-relaxed"
            />
          </div>

          {/* Feedback & Errors */}
          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Issues Found in CSV:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {importResult && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Imported {importResult.count} products successfully!</span>
              </div>
              {importResult.warnings.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-amber-800 mt-1">
                  {importResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-import-csv-btn"
            type="button"
            onClick={handleImport}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            Import Products
          </button>
        </div>
      </div>
    </div>
  );
};
