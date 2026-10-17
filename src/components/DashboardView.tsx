import React from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  IndianRupee,
  Plus,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  DashboardMetrics,
  ProductAnalysis,
  formatINR,
  formatIndianDate,
} from '../types';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  attentionProducts: ProductAnalysis[];
  onOpenAddModal: () => void;
  onNavigateToInventory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  attentionProducts,
  onOpenAddModal,
  onNavigateToInventory,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Title & Add Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Overview of inventory stock and products nearing expiry.
          </p>
        </div>
        <button
          id="dashboard-add-product-btn"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Exactly Four Compact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total product batches */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Product Batches
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics.totalBatches}</div>
            <p className="text-xs text-slate-500 mt-0.5">Active items in stock</p>
          </div>
        </div>

        {/* Card 2: Batches at risk of expiry */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Batches At Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">{metrics.batchesAtRisk}</div>
            <p className="text-xs text-slate-500 mt-0.5">Expires within 7 days</p>
          </div>
        </div>

        {/* Card 3: Already expired batches */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Already Expired
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">{metrics.expiredBatches}</div>
            <p className="text-xs text-slate-500 mt-0.5">Remove from shelf</p>
          </div>
        </div>

        {/* Card 4: Estimated cost of at-risk stock (only when reliable cost data exists) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimated Cost at Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.hasReliableCost ? formatINR(metrics.estimatedCostAtRisk) : '₹—'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {metrics.hasReliableCost ? 'Based on actual purchase cost' : 'Cost data unavailable'}
            </p>
          </div>
        </div>
      </div>

      {/* One Simple Table: Products Needing Attention */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Products Needing Attention</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Expired, urgent, or at-risk stock requiring shopkeeper action.
            </p>
          </div>
          <button
            onClick={onNavigateToInventory}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            <span>View All Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {attentionProducts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">All products are healthy!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no expired or at-risk batches in your stock.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3">Product</th>
                  <th scope="col" className="px-4 py-3">Stock Quantity</th>
                  <th scope="col" className="px-4 py-3">Expiry Date</th>
                  <th scope="col" className="px-4 py-3">Days Remaining</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attentionProducts.map((item) => {
                  const isExpired = item.status === 'EXPIRED';
                  const isUrgent = item.status === 'URGENT';

                  return (
                    <tr
                      key={item.product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired ? 'bg-rose-50/30' : isUrgent ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {item.product.quantity} {item.product.unit || 'units'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatIndianDate(item.product.expiryDate)}
                      </td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                        {item.daysRemaining !== null ? (
                          item.daysRemaining < 0 ? (
                            <span className="text-rose-600 font-bold">
                              {Math.abs(item.daysRemaining)} days ago
                            </span>
                          ) : item.daysRemaining === 0 ? (
                            <span className="text-rose-600 font-bold">Today</span>
                          ) : (
                            <span className={item.daysRemaining <= 3 ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                              {item.daysRemaining} days
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            item.status === 'EXPIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : item.status === 'URGENT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 max-w-md">
                        {item.recommendedAction}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
