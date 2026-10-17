import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  X,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ProductItem,
  analyzeProduct,
  formatINR,
  formatIndianDate,
  SIMULATION_DATE,
} from '../types';
import { StatusBadge } from './common/StatusBadge';
import { EmptyState } from './common/EmptyState';
import { PageHeader } from './common/PageHeader';

interface InventoryManagementViewProps {
  products: ProductItem[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: ProductItem) => void;
  onOpenDeleteModal: (product: ProductItem) => void;
  onOpenCsvImport: () => void;
}

type FilterStatus = 'ALL' | 'AT_RISK' | 'EXPIRED' | 'SAFE';

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  products,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenCsvImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Analyze each product dynamically using simulation date
  const analyzedProducts = useMemo(() => {
    return products.map((p) => ({
      product: p,
      analysis: analyzeProduct(p, SIMULATION_DATE),
    }));
  }, [products]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: products.length,
      atRisk: analyzedProducts.filter(
        ({ analysis }) => analysis.status === 'URGENT' || analysis.status === 'AT RISK'
      ).length,
      expired: analyzedProducts.filter(({ analysis }) => analysis.status === 'EXPIRED').length,
      safe: analyzedProducts.filter(
        ({ analysis }) => analysis.status === 'SAFE' || analysis.status === 'NO EXPIRY DATE'
      ).length,
    };
  }, [products, analyzedProducts]);

  // Filtered by Search & Status
  const filteredItems = useMemo(() => {
    return analyzedProducts.filter(({ product, analysis }) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'EXPIRED') {
        return analysis.status === 'EXPIRED';
      }
      if (statusFilter === 'AT_RISK') {
        return analysis.status === 'URGENT' || analysis.status === 'AT RISK';
      }
      if (statusFilter === 'SAFE') {
        return analysis.status === 'SAFE' || analysis.status === 'NO EXPIRY DATE';
      }

      return true; // 'ALL'
    });
  }, [analyzedProducts, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Manage product batches, track expiry runways, and configure cost and selling prices."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCsvImport}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 shadow-2xs transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Import CSV</span>
            </button>
            <button
              id="inventory-add-product-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="inventory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or category..."
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
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter('AT_RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              statusFilter === 'AT_RISK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>At Risk ({counts.atRisk})</span>
          </button>

          <button
            onClick={() => setStatusFilter('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              statusFilter === 'EXPIRED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200/80'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Expired ({counts.expired})</span>
          </button>

          <button
            onClick={() => setStatusFilter('SAFE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              statusFilter === 'SAFE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Safe ({counts.safe})</span>
          </button>
        </div>
      </div>

      {/* Clean Inventory Table / Responsive View */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No matching products found"
            description={
              searchQuery
                ? `No products match "${searchQuery}". Try clearing your search query or selecting a different filter.`
                : 'No products in this filter status category.'
            }
            action={{
              label: 'Add Product',
              onClick: onOpenAddModal,
              icon: Plus,
            }}
          />
        ) : (
          <>
            {/* Desktop / Laptop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Product Name</th>
                    <th scope="col" className="px-5 py-3.5">Stock Quantity</th>
                    <th scope="col" className="px-5 py-3.5">Cost Per Unit</th>
                    <th scope="col" className="px-5 py-3.5">Selling Price</th>
                    <th scope="col" className="px-5 py-3.5">Expiry Date</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(({ product, analysis }) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & Category */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {product.category || 'General'} • ID: {product.id}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {product.quantity} {product.unit || 'units'}
                      </td>

                      {/* Cost Price */}
                      <td className="px-5 py-3.5 text-slate-700 font-mono tabular-nums whitespace-nowrap">
                        {product.costPrice !== null && product.costPrice !== undefined ? (
                          formatINR(product.costPrice)
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not set</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-3.5 text-slate-700 font-mono tabular-nums whitespace-nowrap">
                        {product.sellingPrice !== null && product.sellingPrice !== undefined ? (
                          formatINR(product.sellingPrice)
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not set</span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-mono tabular-nums">
                        {formatIndianDate(product.expiryDate)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={analysis.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditModal(product)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDeleteModal(product)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet and Mobile Cards Layout */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredItems.map(({ product, analysis }) => (
                <div key={product.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {product.category || 'General'} • ID: {product.id}
                      </p>
                    </div>
                    <StatusBadge status={analysis.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-200/70">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Stock
                      </span>
                      <span className="font-semibold text-slate-800">
                        {product.quantity} {product.unit || 'units'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Expiry
                      </span>
                      <span className="font-mono tabular-nums font-medium text-slate-800">
                        {formatIndianDate(product.expiryDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Cost Price
                      </span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {product.costPrice !== null && product.costPrice !== undefined
                          ? formatINR(product.costPrice)
                          : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        Selling Price
                      </span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {product.sellingPrice !== null && product.sellingPrice !== undefined
                          ? formatINR(product.sellingPrice)
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onOpenEditModal(product)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onOpenDeleteModal(product)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
