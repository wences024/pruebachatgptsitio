import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { QuickPaymentPage } from '@/pages/QuickPaymentPage';
import { TablesPage } from '@/pages/TablesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { useAuthStore } from '@/store/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import './index.css';

function ProtectedApp() {
  const utente = useAuthStore((state) => state.utente);
  useOnlineStatus();

  if (!utente) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/rapido" element={<QuickPaymentPage />} />
        <Route path="/tavoli" element={<TablesPage />} />
        <Route path="/magazzino" element={<InventoryPage />} />
        <Route path="/impostazioni" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/tavoli" replace />} />
      </Route>
    </Routes>
  );
}

useAuthStore.getState().bootstrap();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="bottom-center" richColors duration={2200} />
  </React.StrictMode>
);
