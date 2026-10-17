import React from 'react';
import { LayoutDashboard, Package, Lightbulb, Bot, ShieldCheck } from 'lucide-react';

export type NavTab = 'dashboard' | 'inventory' | 'recommendations' | 'ai_advice';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  batchesAtRiskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  batchesAtRiskCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: batchesAtRiskCount > 0 ? `${batchesAtRiskCount} Alert` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
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
      icon: Lightbulb,
      badge: batchesAtRiskCount > 0 ? `${batchesAtRiskCount} Active` : null,
      badgeColor: 'bg-amber-50 text-amber-700 font-bold border border-amber-300',
    },
    {
      id: 'ai_advice' as NavTab,
      label: 'AI Advice',
      icon: Bot,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-white tracking-tight">Expiry Rescue AI</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block">Kirana Inventory Manager</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[11px] font-medium text-slate-300">Simple Kirana Edition</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">₹ INR Currency • DD/MM/YYYY</p>
      </div>
    </aside>
  );
};
