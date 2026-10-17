import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Info,
  Bot,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  ProductItem,
  ProductAnalysis,
  formatINR,
  formatIndianDate,
} from '../types';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';
import { PageHeader } from './common/PageHeader';

interface RecommendationsViewProps {
  recommendations: ProductAnalysis[];
  onRefresh: () => void;
  onViewProduct: (product: ProductItem) => void;
  onAskAiAboutProduct: (product: ProductItem) => void;
}

type FilterLevel = 'ALL' | 'URGENT' | 'AT_RISK' | 'SAFE';

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  onRefresh,
  onViewProduct,
  onAskAiAboutProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  // Sort by urgency: EXPIRED (1), URGENT (2), AT RISK (3), SAFE (4), NO EXPIRY DATE (5)
  const sortedRecommendations = useMemo(() => {
    const priorityWeight = (status: string) => {
      switch (status) {
        case 'EXPIRED':
          return 1;
        case 'URGENT':
          return 2;
        case 'AT RISK':
          return 3;
        case 'SAFE':
          return 4;
        case 'NO EXPIRY DATE':
          return 5;
        default:
          return 6;
      }
    };

    return [...recommendations].sort(
      (a, b) => priorityWeight(a.status) - priorityWeight(b.status)
    );
  }, [recommendations]);

  // Filter recommendations based on search and level
  const filteredRecommendations = useMemo(() => {
    return sortedRecommendations.filter((rec) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = rec.product.name.toLowerCase().includes(query);
        const matchesCat = rec.product.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      // 2. Risk Level Filter
      if (filterLevel === 'URGENT') {
        return rec.status === 'URGENT' || rec.status === 'EXPIRED';
      }
      if (filterLevel === 'AT_RISK') {
        return rec.status === 'AT RISK';
      }
      if (filterLevel === 'SAFE') {
        return rec.status === 'SAFE' || rec.status === 'NO EXPIRY DATE';
      }

      return true; // 'ALL'
    });
  }, [sortedRecommendations, searchQuery, filterLevel]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: recommendations.length,
      urgent: recommendations.filter((r) => r.status === 'URGENT' || r.status === 'EXPIRED').length,
      atRisk: recommendations.filter((r) => r.status === 'AT RISK').length,
      safe: recommendations.filter((r) => r.status === 'SAFE' || r.status === 'NO EXPIRY DATE').length,
      actionable: recommendations.filter(
        (r) => r.status === 'EXPIRED' || r.status === 'URGENT' || r.status === 'AT RISK'
      ).length,
    };
  }, [recommendations]);

  return (
    <div className="space-y-6">
      {/* Page Header with Actionable Count & Refresh */}
      <PageHeader
        title="AI Recommendations"
        subtitle="Find inventory at risk and decide what to do next."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rescue Center</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              <strong className="text-slate-900 font-semibold">{counts.actionable}</strong> actionable batches
            </div>
            <button
              id="refresh-recommendations-btn"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 shadow-2xs transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Recommendations</span>
            </button>
          </div>
        }
      />

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="recommendations-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recommendations by product name..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/80 border border-slate-300/80 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterLevel === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setFilterLevel('URGENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              filterLevel === 'URGENT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Urgent ({counts.urgent})</span>
          </button>

          <button
            onClick={() => setFilterLevel('AT_RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              filterLevel === 'AT_RISK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>At Risk ({counts.atRisk})</span>
          </button>

          <button
            onClick={() => setFilterLevel('SAFE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              filterLevel === 'SAFE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Safe ({counts.safe})</span>
          </button>
        </div>
      </div>

      {/* Recommendations Cards Grid (Ordered by Urgency) */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <EmptyState
            icon={Package}
            title="No recommendations match your filter"
            description="Try selecting a different filter pill or clearing your search query to see other recommendations."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecommendations.map((rec) => {
            const isExpired = rec.status === 'EXPIRED';
            const isUrgent = rec.status === 'URGENT';
            const isAtRisk = rec.status === 'AT RISK';

            // Distinctive accents for Rescue Center cards
            let cardAccentBorder = 'border-l-4 border-l-slate-300';
            let actionBoxStyle = 'bg-slate-50 text-slate-800 border-slate-200';

            if (isExpired) {
              cardAccentBorder = 'border-l-4 border-l-rose-600';
              actionBoxStyle = 'bg-rose-50 text-rose-900 border-rose-200/80';
            } else if (isUrgent) {
              cardAccentBorder = 'border-l-4 border-l-red-500';
              actionBoxStyle = 'bg-red-50 text-red-900 border-red-200/80';
            } else if (isAtRisk) {
              cardAccentBorder = 'border-l-4 border-l-amber-500';
              actionBoxStyle = 'bg-amber-50 text-amber-900 border-amber-200/80';
            } else {
              cardAccentBorder = 'border-l-4 border-l-emerald-600';
              actionBoxStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200/80';
            }

            return (
              <div
                key={rec.product.id}
                className={`bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all p-5 flex flex-col justify-between ${cardAccentBorder}`}
              >
                <div>
                  {/* Question 1: Which product needs attention? */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug truncate">
                        {rec.product.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Batch ID: {rec.product.id}
                        {rec.product.category ? ` • ${rec.product.category}` : ''}
                      </div>
                    </div>
                    <StatusBadge status={rec.status} size="md" />
                  </div>

                  {/* Stock & Runway Snapshot */}
                  <div className="grid grid-cols-2 gap-3 py-2.5 my-2.5 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Expiry Runway
                      </span>
                      <div className="font-semibold text-slate-800 font-mono tabular-nums">
                        {formatIndianDate(rec.product.expiryDate)}
                      </div>
                      {rec.daysRemaining !== null ? (
                        <span
                          className={`text-[11px] font-semibold ${
                            rec.daysRemaining < 0
                              ? 'text-rose-600'
                              : rec.daysRemaining <= 3
                              ? 'text-red-600'
                              : rec.daysRemaining <= 7
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {rec.daysRemaining < 0
                            ? `Expired ${Math.abs(rec.daysRemaining)}d ago`
                            : rec.daysRemaining === 0
                            ? 'Expires today'
                            : `${rec.daysRemaining} days remaining`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Staple commodity</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Current Stock & Risk
                      </span>
                      <div className="font-semibold text-slate-800">
                        {rec.product.quantity} {rec.product.unit || 'units'}
                      </div>
                      {rec.estimatedWasteCost !== null ? (
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-rose-700 block">
                          Cost at risk: {formatINR(rec.estimatedWasteCost)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic block">
                          Cost not recorded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question 3: What should the shopkeeper do next? */}
                  <div className={`p-3 rounded-lg border my-3 text-xs ${actionBoxStyle}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1 flex items-center gap-1">
                      <span>Recommended Action:</span>
                    </div>
                    <div className="font-semibold leading-relaxed">
                      {rec.recommendedAction}
                    </div>
                  </div>

                  {/* Question 2: Why does it need attention? */}
                  <div className="text-xs text-slate-700 leading-relaxed space-y-1 mb-3">
                    <p>
                      <strong className="text-slate-900 font-semibold">Why: </strong>
                      {rec.reasonExplanation}
                    </p>
                  </div>

                  {/* Missing Data Notice if any */}
                  {rec.missingDataNotice && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-1.5 mb-2">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Missing Data Note: </span>
                        {rec.missingDataNotice}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions: Ask AI & View Product */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  <button
                    onClick={() => onAskAiAboutProduct(rec.product)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Ask AI follow-up questions about this product"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ask AI About This</span>
                  </button>

                  <button
                    onClick={() => onViewProduct(rec.product)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                  >
                    <span>View Product</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Honest Transparency Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-semibold">Grounding Guarantee: </strong>
          Recommendations are calculated deterministically using active inventory counts, unit purchase costs, and expiry dates. No demand rates or financial savings are fabricated.
        </div>
      </div>
    </div>
  );
};
