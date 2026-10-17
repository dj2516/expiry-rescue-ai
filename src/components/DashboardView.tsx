import React from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  IndianRupee,
  Plus,
  Upload,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  DashboardMetrics,
  ProductAnalysis,
  formatINR,
  formatIndianDate,
  SIMULATION_DATE,
} from '../types';
import { MetricCard } from './common/MetricCard';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';
import { PageHeader } from './common/PageHeader';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  attentionProducts: ProductAnalysis[];
  onOpenAddModal: () => void;
  onOpenCsvImport?: () => void;
  onNavigateToInventory: () => void;
  onNavigateToRecommendations?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  attentionProducts,
  onOpenAddModal,
  onOpenCsvImport,
  onNavigateToInventory,
  onNavigateToRecommendations,
}) => {
  // Format current date correctly from system simulation date
  const formattedDate = formatIndianDate(SIMULATION_DATE);

  return (
    <div className="space-y-6">
      {/* Page Header with Time-Independent Greeting & System Date */}
      <PageHeader
        title="Good morning"
        subtitle="Here's your inventory health at a glance."
        dateBadge={`System Date: ${formattedDate}`}
        actions={
          <div className="flex items-center gap-2.5">
            {onOpenCsvImport && (
              <button
                onClick={onOpenCsvImport}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 shadow-2xs transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import Inventory</span>
              </button>
            )}
            <button
              id="dashboard-add-product-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        }
      />

      {/* Row of Four Compact Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total batches */}
        <MetricCard
          label="Total Batches"
          value={metrics.totalBatches}
          icon={Package}
          variant="neutral"
          description="Active product batches in store"
        />

        {/* Metric 2: At-risk batches */}
        <MetricCard
          label="At-Risk Batches"
          value={metrics.batchesAtRisk}
          icon={AlertTriangle}
          variant={metrics.batchesAtRisk > 0 ? 'amber' : 'neutral'}
          description="Batches expiring within 7 days"
        />

        {/* Metric 3: Expired batches */}
        <MetricCard
          label="Expired Batches"
          value={metrics.expiredBatches}
          icon={XCircle}
          variant={metrics.expiredBatches > 0 ? 'rose' : 'neutral'}
          description="Must be removed from shelf"
        />

        {/* Metric 4: Estimated at-risk stock cost */}
        <MetricCard
          label="Estimated Risk Cost"
          value={metrics.hasReliableCost ? formatINR(metrics.estimatedCostAtRisk) : '₹—'}
          icon={IndianRupee}
          variant={metrics.hasReliableCost && (metrics.estimatedCostAtRisk ?? 0) > 0 ? 'amber' : 'neutral'}
          isMonoValue={true}
          description={
            metrics.hasReliableCost
              ? 'Based on actual purchase cost'
              : 'Purchase cost data not recorded'
          }
        />
      </div>

      {/* Prioritized Section: Needs Your Attention */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Needs your attention
              </h2>
              {attentionProducts.length > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {attentionProducts.length} {attentionProducts.length === 1 ? 'batch' : 'batches'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Expired, urgent, or at-risk stock requiring your decision today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToRecommendations && attentionProducts.length > 0 && (
              <button
                onClick={onNavigateToRecommendations}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Rescue Center</span>
              </button>
            )}
            <button
              onClick={onNavigateToInventory}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>View All Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content: Empty State or Attention Table */}
        {attentionProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="All inventory batches are safe"
            description="There are currently no expired, urgent, or at-risk batches in your stock. Everything is well within its shelf-life window."
            action={{
              label: 'Add New Product',
              onClick: onOpenAddModal,
              icon: Plus,
            }}
          />
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Product</th>
                    <th scope="col" className="px-5 py-3.5">Quantity</th>
                    <th scope="col" className="px-5 py-3.5">Expiry Date</th>
                    <th scope="col" className="px-5 py-3.5">Days Remaining</th>
                    <th scope="col" className="px-5 py-3.5">Risk Status</th>
                    <th scope="col" className="px-5 py-3.5">Recommended Next Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attentionProducts.map((item) => {
                    const isExpired = item.status === 'EXPIRED';
                    const isUrgent = item.status === 'URGENT';

                    return (
                      <tr
                        key={item.product.id}
                        className={`transition-colors hover:bg-slate-50/90 ${
                          isExpired
                            ? 'bg-rose-50/20'
                            : isUrgent
                            ? 'bg-amber-50/15'
                            : ''
                        }`}
                      >
                        {/* Product */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {item.product.name}
                          </div>
                          {item.product.category && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.product.category}
                            </div>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                          {item.product.quantity} {item.product.unit || 'units'}
                        </td>

                        {/* Expiry Date */}
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-mono tabular-nums">
                          {formatIndianDate(item.product.expiryDate)}
                        </td>

                        {/* Days Remaining */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {item.daysRemaining !== null ? (
                            item.daysRemaining < 0 ? (
                              <span className="font-bold text-rose-600">
                                {Math.abs(item.daysRemaining)}d ago
                              </span>
                            ) : item.daysRemaining === 0 ? (
                              <span className="font-bold text-red-600">
                                Expires today
                              </span>
                            ) : item.daysRemaining <= 3 ? (
                              <span className="font-bold text-red-600">
                                {item.daysRemaining} {item.daysRemaining === 1 ? 'day' : 'days'} left
                              </span>
                            ) : (
                              <span className="font-semibold text-amber-700">
                                {item.daysRemaining} days left
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">No date</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Recommended Next Step */}
                        <td className="px-5 py-3.5 text-slate-700 max-w-sm leading-relaxed">
                          {item.recommendedAction}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (eliminates awkward table horizontal scroll on small screens) */}
            <div className="md:hidden divide-y divide-slate-100">
              {attentionProducts.map((item) => {
                const isExpired = item.status === 'EXPIRED';
                const isUrgent = item.status === 'URGENT';

                return (
                  <div
                    key={item.product.id}
                    className={`p-4 space-y-2.5 ${
                      isExpired ? 'bg-rose-50/20' : isUrgent ? 'bg-amber-50/15' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {item.product.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.product.quantity} {item.product.unit || 'units'}
                        </span>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">Expiry:</span>
                      <span className="font-mono tabular-nums font-medium text-slate-800">
                        {formatIndianDate(item.product.expiryDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="text-[11px] text-slate-400">Runway:</span>
                      <span className="font-semibold text-slate-800">
                        {item.daysRemaining !== null ? (
                          item.daysRemaining < 0 ? (
                            <span className="text-rose-600 font-bold">
                              {Math.abs(item.daysRemaining)}d ago
                            </span>
                          ) : (
                            <span>{item.daysRemaining}d left</span>
                          )
                        ) : (
                          'No date'
                        )}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        Action:
                      </span>
                      {item.recommendedAction}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Quick Actions Footer Banner */}
      <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Operations Tip:</strong> Review urgent items before noon to execute clearance discounts before evening footfall peaks.
          </span>
        </div>
        <button
          onClick={onOpenAddModal}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto shrink-0 transition-colors"
        >
          + Add more products
        </button>
      </div>
    </div>
  );
};
