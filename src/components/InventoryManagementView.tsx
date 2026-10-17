import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import {
  ProductItem,
  ProductStatus,
  analyzeProduct,
  formatINR,
  formatIndianDate,
  SIMULATION_DATE,
} from '../types';

interface InventoryManagementViewProps {
  products: ProductItem[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: ProductItem) => void;
  onOpenDeleteModal: (product: ProductItem) => void;
  onOpenCsvImport: () => void;
}

type FilterStatus = 'ALL' | 'AT_RISK' | 'EXPIRED';

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  products,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenCsvImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Analyze each product to get status dynamically
  const analyzedProducts = useMemo(() => {
    return products.map((p) => ({
      product: p,
      analysis: analyzeProduct(p, SIMULATION_DATE),
    }));
  }, [products]);

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

      return true; // 'ALL'
    });
  }, [analyzedProducts, searchQuery, statusFilter]);

  const atRiskCount = useMemo(() => {
    return analyzedProducts.filter(
      ({ analysis }) => analysis.status === 'URGENT' || analysis.status === 'AT RISK'
    ).length;
  }, [analyzedProducts]);

  const expiredCount = useMemo(() => {
    return analyzedProducts.filter(({ analysis }) => analysis.status === 'EXPIRED').length;
  }, [analyzedProducts]);

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'EXPIRED':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            EXPIRED
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            URGENT (≤3d)
          </span>
        );
      case 'AT RISK':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            AT RISK (4–7d)
          </span>
        );
      case 'SAFE':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            SAFE
          </span>
        );
      case 'NO EXPIRY DATE':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            NO EXPIRY DATE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Inventory</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your store's stock, expiry dates, and unit prices.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCsvImport}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
          </button>
          <button
            id="inventory-add-product-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="inventory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
          />
        </div>

        {/* Filter Pills: All, At Risk, Expired */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({products.length})
          </button>

          <button
            onClick={() => setStatusFilter('AT_RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              statusFilter === 'AT_RISK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>At Risk ({atRiskCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'EXPIRED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            Expired ({expiredCount})
          </button>
        </div>
      </div>

      {/* Clean Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search query or filter selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3">Product Name</th>
                  <th scope="col" className="px-4 py-3">Stock Quantity</th>
                  <th scope="col" className="px-4 py-3">Cost Per Unit</th>
                  <th scope="col" className="px-4 py-3">Selling Price</th>
                  <th scope="col" className="px-4 py-3">Expiry Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(({ product, analysis }) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div>{product.name}</div>
                      {product.category && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {product.category}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {product.quantity} {product.unit || 'units'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">
                      {product.costPrice !== null && product.costPrice !== undefined
                        ? formatINR(product.costPrice)
                        : <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">
                      {product.sellingPrice !== null && product.sellingPrice !== undefined
                        ? formatINR(product.sellingPrice)
                        : <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                      {formatIndianDate(product.expiryDate)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(analysis.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenEditModal(product)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenDeleteModal(product)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Product"
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
        )}
      </div>
    </div>
  );
};
