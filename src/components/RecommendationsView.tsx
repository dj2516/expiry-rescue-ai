import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Search,
  RotateCcw,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Info,
  IndianRupee,
  Bot,
  ExternalLink,
} from 'lucide-react';
import {
  ProductItem,
  ProductAnalysis,
  ProductStatus,
  formatINR,
  formatIndianDate,
} from '../types';

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
    }, 400);
  };

  // Filter recommendations based on search and level
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
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
  }, [recommendations, searchQuery, filterLevel]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: recommendations.length,
      urgent: recommendations.filter((r) => r.status === 'URGENT' || r.status === 'EXPIRED').length,
      atRisk: recommendations.filter((r) => r.status === 'AT RISK').length,
      safe: recommendations.filter((r) => r.status === 'SAFE' || r.status === 'NO EXPIRY DATE').length,
    };
  }, [recommendations]);

  const getRiskBadge = (status: ProductStatus) => {
    switch (status) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>EXPIRED</span>
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>URGENT (≤3d)</span>
          </span>
        );
      case 'AT RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>AT RISK (4–7d)</span>
          </span>
        );
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>SAFE (&gt;7d)</span>
          </span>
        );
      case 'NO EXPIRY DATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <Package className="w-3 h-3 text-slate-500" />
            <span>NO EXPIRY DATE</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Recommendations</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Actionable inventory advice calculated deterministically from your actual stock and expiry dates.
          </p>
        </div>

        {/* Refresh Recommendations Button */}
        <button
          id="refresh-recommendations-btn"
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="recommendations-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recommendations by product name..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
          />
        </div>

        {/* Filter Pills: All, Urgent, At Risk, Safe */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterLevel === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setFilterLevel('URGENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterLevel === 'URGENT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Urgent ({counts.urgent})</span>
          </button>

          <button
            onClick={() => setFilterLevel('AT_RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterLevel === 'AT_RISK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>At Risk ({counts.atRisk})</span>
          </button>

          <button
            onClick={() => setFilterLevel('SAFE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterLevel === 'SAFE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Safe ({counts.safe})</span>
          </button>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No recommendations match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try choosing a different filter tab or clearing your search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecommendations.map((rec) => {
            const isUrgent = rec.status === 'URGENT' || rec.status === 'EXPIRED';
            const isAtRisk = rec.status === 'AT RISK';

            return (
              <div
                key={rec.product.id}
                className={`bg-white rounded-xl border shadow-xs p-5 flex flex-col justify-between transition-all ${
                  rec.status === 'EXPIRED'
                    ? 'border-rose-200 bg-rose-50/15'
                    : isUrgent
                    ? 'border-rose-200/80 bg-rose-50/10'
                    : isAtRisk
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top: Product Info & Risk Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {rec.product.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Batch ID: {rec.product.id} {rec.product.category ? `• ${rec.product.category}` : ''}
                      </div>
                    </div>
                    {getRiskBadge(rec.status)}
                  </div>

                  {/* Expiry Date, Days Remaining, Stock */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2.5 my-2 border-y border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Expiry Date:</span>
                      <span className="font-semibold text-slate-800">
                        {formatIndianDate(rec.product.expiryDate)}
                      </span>
                      {rec.daysRemaining !== null && (
                        <span className={`block text-[11px] font-medium ${
                          rec.daysRemaining < 0
                            ? 'text-rose-600 font-bold'
                            : rec.daysRemaining <= 3
                            ? 'text-rose-700 font-bold'
                            : rec.daysRemaining <= 7
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}>
                          {rec.daysRemaining < 0
                            ? `Expired ${Math.abs(rec.daysRemaining)}d ago`
                            : rec.daysRemaining === 0
                            ? 'Expires today'
                            : `${rec.daysRemaining} days left`}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Stock & Financials:</span>
                      <span className="font-semibold text-slate-800">
                        {rec.product.quantity} {rec.product.unit || 'units'}
                      </span>
                      {rec.estimatedWasteCost !== null ? (
                        <span className="block text-[11px] font-mono text-rose-700 font-semibold">
                          Est. Risk: {formatINR(rec.estimatedWasteCost)}
                        </span>
                      ) : (
                        <span className="block text-[11px] text-slate-400 italic">
                          Cost not recorded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className={`p-3 rounded-lg mb-2.5 text-xs font-semibold ${
                    rec.status === 'EXPIRED'
                      ? 'bg-rose-100/70 text-rose-900 border border-rose-200'
                      : isUrgent
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : isAtRisk
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}>
                    <div className="text-[10px] uppercase tracking-wider font-bold opacity-80 mb-0.5">
                      Recommended Action:
                    </div>
                    {rec.recommendedAction}
                  </div>

                  {/* Short Explanation of why the action is recommended */}
                  <div className="text-xs text-slate-700 leading-relaxed mb-3">
                    <span className="font-semibold text-slate-900">Why: </span>
                    {rec.reasonExplanation}
                  </div>

                  {/* Missing Data Notice (if applicable) */}
                  {rec.missingDataNotice && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-1.5 mb-3">
                      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Missing Data Note: </span>
                        {rec.missingDataNotice}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions: View Product & Ask AI */}
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
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
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

      {/* Honest Transparency Footnote */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Grounding Guarantee:</strong> Recommendations are calculated deterministically using active inventory counts, unit purchase costs, and expiry dates. No demand rates or financial savings are fabricated.
        </span>
      </div>
    </div>
  );
};
