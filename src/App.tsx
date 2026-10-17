import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { StorageService } from './services/storageService';
import {
  ProductItem,
  ProductAnalysis,
  DashboardMetrics,
  DataMode,
} from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryManagementView } from './components/InventoryManagementView';
import { RecommendationsView } from './components/RecommendationsView';
import { AiAdviceView } from './components/AiAdviceView';
import { BatchFormModal } from './components/BatchFormModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CsvImportModal } from './components/CsvImportModal';

export const App: React.FC = () => {
  // Navigation: Dashboard, Inventory, AI Recommendations, AI Advice
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Domain State
  const [dataMode, setDataMode] = useState<DataMode>(StorageService.getDataMode());
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBatches: 0,
    batchesAtRisk: 0,
    expiredBatches: 0,
    estimatedCostAtRisk: null,
    hasReliableCost: false,
  });
  const [attentionProducts, setAttentionProducts] = useState<ProductAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<ProductAnalysis[]>([]);

  // AI Prompt transfer state from recommendation card
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const loadData = () => {
    const loadedProducts = StorageService.getProducts();
    const loadedMetrics = StorageService.getDashboardMetrics();
    const loadedAttention = StorageService.getProductsNeedingAttention();
    const loadedRecs = StorageService.getAllRecommendations();
    const loadedMode = StorageService.getDataMode();

    setProducts(loadedProducts);
    setMetrics(loadedMetrics);
    setAttentionProducts(loadedAttention);
    setRecommendations(loadedRecs);
    setDataMode(loadedMode);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add / Edit Product Submit
  const handleProductSubmit = (productData: Omit<ProductItem, 'id'> | ProductItem) => {
    if ('id' in productData && productData.id) {
      const updated = StorageService.updateProduct(productData.id, productData);
      if (updated) {
        loadData();
        showToast(`Updated "${productData.name}" successfully.`, 'success');
      }
    } else {
      const created = StorageService.addProduct(productData);
      loadData();
      showToast(`Added "${created.name}" to inventory.`, 'success');
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Delete Product Submit
  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    const success = StorageService.deleteProduct(deletingProduct.id);
    if (success) {
      loadData();
      showToast(`Removed "${deletingProduct.name}" from inventory.`, 'info');
    }
    setDeletingProduct(null);
  };

  // Reset to Demo Data
  const handleConfirmReset = () => {
    StorageService.resetToDemo();
    loadData();
    setIsResetConfirmOpen(false);
    showToast('Restored synthetic demo dataset (Amul, Britannia, Paneer, Tata Salt).', 'info');
  };

  // CSV Import Success
  const handleCsvSuccess = (count: number) => {
    loadData();
    showToast(`Imported ${count} products from CSV into real shop mode.`, 'success');
  };

  // View Product from Recommendation Card
  const handleViewProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  // Ask AI about a specific recommendation
  const handleAskAiAboutProduct = (product: ProductItem) => {
    setAiInitialQuery(`Why is ${product.name} at risk, and what action is recommended?`);
    setActiveTab('ai_advice');
  };

  // Refresh Recommendations
  const handleRefreshRecommendations = () => {
    loadData();
    showToast('AI Recommendations updated from live inventory.', 'info');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Sidebar: Dashboard, Inventory, AI Recommendations, AI Advice */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        batchesAtRiskCount={metrics.batchesAtRisk + metrics.expiredBatches}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header: Data Source Label + Add Product Button */}
        <Header
          dataMode={dataMode}
          onOpenAddModal={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onResetDemo={() => setIsResetConfirmOpen(true)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                attentionProducts={attentionProducts}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onNavigateToInventory={() => setActiveTab('inventory')}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManagementView
                products={products}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onOpenEditModal={(product) => {
                  setEditingProduct(product);
                  setIsProductModalOpen(true);
                }}
                onOpenDeleteModal={(product) => setDeletingProduct(product)}
                onOpenCsvImport={() => setIsCsvImportOpen(true)}
              />
            )}

            {activeTab === 'recommendations' && (
              <RecommendationsView
                recommendations={recommendations}
                onRefresh={handleRefreshRecommendations}
                onViewProduct={handleViewProduct}
                onAskAiAboutProduct={handleAskAiAboutProduct}
              />
            )}

            {activeTab === 'ai_advice' && (
              <AiAdviceView
                products={products}
                initialQuery={aiInitialQuery}
                onClearInitialQuery={() => setAiInitialQuery(undefined)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <BatchFormModal
        isOpen={isProductModalOpen}
        initialData={editingProduct}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImportSuccess={handleCsvSuccess}
      />

      <ConfirmModal
        isOpen={Boolean(deletingProduct)}
        title="Delete Product"
        message={`Are you sure you want to remove "${deletingProduct?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduct(null)}
      />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset to Demo Data"
        message="Are you sure you want to restore the synthetic demo dataset? Any custom products will be overwritten with the 20 Kirana demo products."
        confirmLabel="Reset to Demo"
        isDestructive={false}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

export default App;
