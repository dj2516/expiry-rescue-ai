import React from 'react';
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Bot,
  Database,
  X,
} from 'lucide-react';
import { DataMode } from '../types';

export type NavTab = 'dashboard' | 'inventory' | 'recommendations' | 'ai_advice';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  batchesAtRiskCount: number;
  dataMode: DataMode;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  batchesAtRiskCount,
  dataMode,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: batchesAtRiskCount > 0 ? `${batchesAtRiskCount}` : null,
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-400/30',
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory',
      icon: Package,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'recommendations' as NavTab,
      label: 'AI Recommendations',
      icon: Sparkles,
      badge: batchesAtRiskCount > 0 ? `${batchesAtRiskCount} Actionable` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-semibold',
    },
    {
      id: 'ai_advice' as NavTab,
      label: 'AI Advice',
      icon: Bot,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
    },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="w-64 bg-[#090e17] text-slate-100 flex flex-col h-full border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#070b13]">
        <div className="flex items-center gap-3">
          {/* Custom SVG Brand Mark */}
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-500/30 shrink-0">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.5 5.25-1.35 9-6.25 9-11.5V7l-9-5z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">Expiry Rescue AI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Kirana Operations
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Data Source Indicator in Sidebar */}
      <div className="px-4 py-3 bg-[#0d1422] border-b border-slate-800/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-slate-400" />
            <span>Data Source</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
              dataMode === 'demo'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dataMode === 'demo' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            {dataMode === 'demo' ? 'Synthetic Demo' : 'Real CSV Shop'}
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="truncate text-[13px]">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070b13] text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">System Ready</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.2</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between font-medium">
          <span>₹ INR Standard</span>
          <span>DD/MM/YYYY</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative flex-1 max-w-xs w-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
