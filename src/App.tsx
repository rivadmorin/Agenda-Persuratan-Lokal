import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MailTable from './components/MailTable';
import MailDrawer from './components/MailDrawer';
import PdfTools from './components/PdfTools';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';
import ReceiptModal from './components/ReceiptModal';
import ImportModal from './components/ImportModal';
import CursorInteraction from './components/CursorInteraction';
import PwaUpdateToast from './components/PwaUpdateToast';
import { MailRecord, AppConfig, User } from './types';
import { generateM3Theme } from './utils/theme';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [mails, setMails] = useState<MailRecord[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
    if (config?.themeColor) {
      generateM3Theme(config.themeColor, config.themeBgColor, config.themeDarkBgColor, config.themeColorScheme);
    }
  }, [darkMode, config?.themeColor, config?.themeBgColor, config?.themeDarkBgColor]);

  // Server connectivity state
  const [isServerOffline, setIsServerOffline] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch('/api/network-info', { signal: controller.signal });
        clearTimeout(id);
        setIsServerOffline(!res.ok);
      } catch (err) {
        clearTimeout(id);
        setIsServerOffline(true);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'edit' | 'view'>('edit');
  const [mailToEdit, setMailToEdit] = useState<MailRecord | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [connectionError, setConnectionError] = useState(false);
  const [loadingMails, setLoadingMails] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    mailIds: string[];
  }>({
    isOpen: false,
    mailIds: [],
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportExcel = async (file: File, conflictMode: 'insert' | 'skip' | 'merge') => {
    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch(`/api/excel/import?conflictMode=${conflictMode}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: buffer
      });
      
      if (res.ok) {
        const data = await res.json();
        fetchMails();
        return { success: true, summary: data.summary };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Gagal mengimpor data dari Excel.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi kesalahan sistem saat menghubungi server.' };
    } finally {
      setIsImporting(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchConfig();
    fetchMails();
    setupSSE();
  }, []);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentUser) {
      headers['x-username'] = currentUser.username;
      headers['x-user-name'] = currentUser.name;
    }
    return headers;
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.themeColor) generateM3Theme(data.themeColor, data.themeBgColor, data.themeDarkBgColor, data.themeColorScheme);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
      setConnectionError(true);
    }
  };

  const fetchMails = async () => {
    setLoadingMails(true);
    try {
      const res = await fetch('/api/mails', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMails(data);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } catch (err) {
      console.error('Failed to fetch mails', err);
      setConnectionError(true);
    } finally {
      setLoadingMails(false);
    }
  };

  const setupSSE = () => {
    const eventSource = new EventSource('/api/sse/online');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setOnlineCount(data.onlineCount || 1);
      } catch (err) {
        console.error('SSE Error', err);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(setupSSE, 5000); // Retry connection
    };
  };

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser?.username })
    });
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const handleSaveMail = async (data: any) => {
    if (data.isSwitchToEdit) {
      setDrawerMode('edit');
      return;
    }
    const url = mailToEdit ? `/api/mails/${mailToEdit.id}` : '/api/mails';
    const method = mailToEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-username': currentUser?.username || '',
          'x-user-name': currentUser?.name || ''
        },
        body: JSON.stringify({ ...data, type: data.type || 'Masuk', versionId: mailToEdit?.versionId })
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        fetchMails();
      } else {
        const err = await res.json();
        if (res.status === 409 && err.collision) {
          setConfirmModal({
            isOpen: true,
            title: 'Konflik Data (Optimistic Lock)',
            message: 'Surat ini telah diperbarui oleh operator lain saat Anda sedang melakukan pengeditan. Mohon tutup formulir ini dan buka kembali untuk melihat perubahan terbaru.',
            onConfirm: () => {
              setIsDrawerOpen(false);
              fetchMails();
            }
          });
        } else {
          setConfirmModal({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Gagal menyimpan surat',
            onConfirm: () => {}
          });
        }
      }
    } catch (err: any) {
       setConfirmModal({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Terjadi kesalahan saat menghubungi server.',
          onConfirm: () => {}
        });
    }
  };

  const handleDeleteMail = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Agenda Surat',
      message: 'Apakah Anda yakin ingin menghapus agenda surat ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/mails/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchMails();
          } else {
            const err = await res.json();
            setConfirmModal({
              isOpen: true,
              title: 'Gagal Hapus',
              message: err.message || 'Gagal menghapus surat dari server.',
              onConfirm: () => {}
            });
          }
        } catch (err: any) {
           setConfirmModal({
            isOpen: true,
            title: 'Kesalahan Sistem',
            message: err.message || 'Gagal menghapus data.',
            onConfirm: () => {}
          });
        }
      }
    });
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        setConfig(newConfig);
      } else {
        const err = await res.json();
        setConfirmModal({
          isOpen: true,
          title: 'Gagal Simpan Pengaturan',
          message: err.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
          onConfirm: () => {}
        });
      }
    } catch (err: any) {
       setConfirmModal({
          isOpen: true,
          title: 'Kesalahan Sistem',
          message: err.message || 'Gagal menyimpan pengaturan.',
          onConfirm: () => {}
        });
    }
  };

  const handleConfirmReceipt = async (signerLeft: string, signerRight: string) => {
    setIsBatchLoading(true);
    try {
      const res = await fetch('/api/pdf/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailIds: receiptModal.mailIds,
          signerLeft,
          signerRight
        })
      });
      if (!res.ok) throw new Error('Gagal membuat tanda terima PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setReceiptModal(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      console.error('Print receipt failed', err);
      setConfirmModal({
        isOpen: true,
        title: 'Gagal Membuat PDF',
        message: err.message || 'Terjadi kesalahan saat memproses tanda terima.',
        onConfirm: () => {}
      });
    } finally {
      setIsBatchLoading(false);
    }
  };

  const onBatchDownload = async (ids: string[]) => {
    setIsBatchLoading(true);
    try {
      const res = await fetch('/api/pdf/batch-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailIds: ids })
      });
      if (!res.ok) throw new Error('Gagal mengunduh berkas ZIP');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Arsip_Surat.zip';
      a.click();
    } catch (err: any) {
      setConfirmModal({
        isOpen: true,
        title: 'Gagal Unduh',
        message: err.message || 'Terjadi kesalahan saat membuat arsip ZIP.',
        onConfirm: () => {}
      });
    } finally {
      setIsBatchLoading(false);
    }
  };

  return (
    <>
      {!currentUser || !config ? (
        <Login appName={config?.appName || 'Agenda Persuratan'} onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex h-screen overflow-hidden bg-[var(--md-sys-color-surface)]">
          <Sidebar
            currentUser={currentUser}
            appName={config.appName}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            onlineCount={onlineCount}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 relative ${sidebarCollapsed ? 'pl-20' : ''}`}>
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="fixed top-6 left-6 z-[45] w-10 h-10 rounded-full flex items-center justify-center bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                title="Tampilkan Sidebar"
                aria-label="Tampilkan Sidebar"
              >
                <span className="material-symbols-outlined text-lg">menu</span>
              </button>
            )}
            <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8">
              {activeTab === 'dashboard' && (
                <Dashboard
                  mails={mails}
                  config={config}
                  onNavigateToTab={setActiveTab}
                  onSelectMail={(m) => { setMailToEdit(m); setDrawerMode('view'); setIsDrawerOpen(true); }}
                  isOffline={isServerOffline}
                />
              )}

              {activeTab === 'mails' && (
                <MailTable
                  mails={mails}
                  config={config}
                  isBatchLoading={isBatchLoading}
                  isImporting={isImporting}
                  onAdd={() => { setMailToEdit(null); setDrawerMode('edit'); setIsDrawerOpen(true); }}
                  onEdit={(m) => { setMailToEdit(m); setDrawerMode('edit'); setIsDrawerOpen(true); }}
                  onDelete={handleDeleteMail}
                  onViewMail={(m) => { setMailToEdit(m); setDrawerMode('view'); setIsDrawerOpen(true); }}
                  onExportExcel={() => window.open('/api/excel/export', '_blank')}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onRefresh={fetchMails}
                  onError={(title, message) => setConfirmModal({ isOpen: true, title, message, onConfirm: () => {} })}
                  onBatchDownload={onBatchDownload}
                  onPrintReceipt={(ids) => {
                    setReceiptModal({
                      isOpen: true,
                      mailIds: ids
                    });
                  }}
                />
              )}

              {activeTab === 'pdf-tools' && <PdfTools />}
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'settings' && (
                <Settings
                  config={config}
                  onSaveConfig={handleSaveConfig}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              )}
            </div>
          </main>

          <MailDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            columns={config.columns}
            mails={mails}
            penomoranSuggestions={config?.penomoranSuggestions}
            mailToEdit={mailToEdit}
            onSave={handleSaveMail}
            mode={drawerMode}
            onError={(title, message) => setConfirmModal({ isOpen: true, title, message, onConfirm: () => {} })}
            isOffline={isServerOffline}
          />

          <ReceiptModal
            isOpen={receiptModal.isOpen}
            isProcessing={isBatchLoading}
            onClose={() => setReceiptModal({ ...receiptModal, isOpen: false })}
            onConfirm={handleConfirmReceipt}
            defaultSignerLeft={currentUser?.name || ''}
            defaultSignerRight=""
          />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
      />

      <ConfirmModal
        isOpen={connectionError}
        title="Kesalahan Koneksi"
        message="Gagal menghubungkan ke server. Silakan periksa koneksi Anda atau coba lagi nanti."
        confirmText="Coba Lagi"
        cancelText="Tutup"
        onClose={() => setConnectionError(false)}
        onConfirm={() => {
          setConnectionError(false);
          fetchConfig();
          fetchMails();
        }}
      />

      {config && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          config={config}
          onImport={handleImportExcel}
        />
      )}

      <CursorInteraction />
      <PwaUpdateToast />
    </>
  );
}
