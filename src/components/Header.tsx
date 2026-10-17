import React from 'react';
import { Plus, Database, RotateCcw, Upload, Menu, Calendar } from 'lucide-react';
import { DataMode, SIMULATION_DATE, formatIndianDate } from '../types';

interface HeaderProps {
  dataMode: DataMode;
  onOpenAddModal: () => void;
  onOpenCsvImport: () => void;
  onResetDemo: () => void;
  onToggleMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataMode,
  onOpenAddModal,
  onOpenCsvImport,
  onResetDemo,
  onToggleMobileNav,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      {/* Left: Mobile Nav Toggle + Data Source Indicator */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Visible Data Source Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
            dataMode === 'demo'
              ? 'bg-amber-50 text-amber-900 border-amber-300/80'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300/80'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] sm:text-xs">
            {dataMode === 'demo' ? 'DEMO DATA — SYNTHETIC' : 'REAL SHOP DATA (CSV)'}
          </span>
        </div>

        {dataMode === 'real_shop' && (
          <button
            onClick={onResetDemo}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-100"
            title="Reset to synthetic demo dataset"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Restore Demo</span>
          </button>
        )}
      </div>

      {/* Center/Right: Simulation Date & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Baseline Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium">System Date: {formatIndianDate(SIMULATION_DATE)}</span>
        </div>

        {/* Secondary Action: Import CSV */}
        <button
          onClick={onOpenCsvImport}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 shadow-2xs transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Import CSV</span>
        </button>

        {/* Primary Action: Add Product */}
        <button
          id="header-add-product-btn"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>
    </header>
  );
};
