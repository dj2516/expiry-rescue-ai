import React from 'react';
import { Plus, Database, RotateCcw } from 'lucide-react';
import { DataMode } from '../types';

interface HeaderProps {
  dataMode: DataMode;
  onOpenAddModal: () => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataMode,
  onOpenAddModal,
  onResetDemo,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Visible Data Source Label */}
      <div className="flex items-center gap-3">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            dataMode === 'demo'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>
            {dataMode === 'demo' ? 'DEMO DATA — SYNTHETIC' : 'REAL SHOP DATA (CSV)'}
          </span>
        </div>

        {dataMode === 'real_shop' && (
          <button
            onClick={onResetDemo}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            title="Reset to synthetic demo dataset"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Load Demo</span>
          </button>
        )}
      </div>

      {/* Right: Prominent Green Add Product Button */}
      <div className="flex items-center gap-3">
        <button
          id="header-add-product-btn"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>
    </header>
  );
};
