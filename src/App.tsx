import React, { useState } from 'react';
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
import { ToastNotification, ToastData } from './components/common/ToastNotification';

export const App: React.FC = () => {
  // Navigation: Dashboard, Inventory, AI Recommendations, AI Advice
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Domain State (Lazy initialized directly to prevent cascading render effects)
  const [dataMode, setDataMode] = useState<DataMode>(() => StorageService.getDataMode());
  const [products, setProducts] = useState<ProductItem[]>(() => StorageService.getProducts());
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => StorageService.getDashboardMetrics());
  const [attentionProducts, setAttentionProducts] = useState<ProductAnalysis[]>(() =>
    StorageService.getProductsNeedingAttention()
  );
  const [recommendations, setRecommendations] = useState<ProductAnalysis[]>(() =>
    StorageService.getAllRecommendations()
  );

  // AI Prompt transfer state from recommendation card to AI Advice
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<ToastData | null>(null);

  const loadData = () => {
    setProducts(StorageService.getProducts());
    setMetrics(StorageService.getDashboardMetrics());
    setAttentionProducts(StorageService.getProductsNeedingAttention());
    setRecommendations(StorageService.getAllRecommendations());
    setDataMode(StorageService.getDataMode());
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
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
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Left Sidebar: Dashboard, Inventory, AI Recommendations, AI Advice */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        batchesAtRiskCount={metrics.batchesAtRisk + metrics.expiredBatches}
        dataMode={dataMode}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header: Mobile Nav Toggle + Visible Data Source Label + Add Product Action */}
        <Header
          dataMode={dataMode}
          onOpenAddModal={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onOpenCsvImport={() => setIsCsvImportOpen(true)}
          onResetDemo={() => setIsResetConfirmOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                attentionProducts={attentionProducts}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onOpenCsvImport={() => setIsCsvImportOpen(true)}
                onNavigateToInventory={() => setActiveTab('inventory')}
                onNavigateToRecommendations={() => setActiveTab('recommendations')}
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
        message="Are you sure you want to restore the synthetic demo dataset? Any custom products will be replaced with the 20 Kirana demo products."
        confirmLabel="Restore Demo"
        isDestructive={false}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

export default App;
