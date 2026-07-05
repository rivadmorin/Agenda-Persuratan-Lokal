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
  }, [darkMode]);

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
        if (data.themeColor) generateM3Theme(data.themeColor);
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
          />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'dashboard' && (
                <Dashboard
                  mails={mails}
                  config={config}
                  onNavigateToTab={setActiveTab}
                  onSelectMail={(m) => { setMailToEdit(m); setDrawerMode('view'); setIsDrawerOpen(true); }}
                />
              )}

              {activeTab === 'mails' && (
                <MailTable
                  mails={mails}
                  config={config}
                  isBatchLoading={isBatchLoading}
                  onAdd={() => { setMailToEdit(null); setDrawerMode('edit'); setIsDrawerOpen(true); }}
                  onEdit={(m) => { setMailToEdit(m); setDrawerMode('edit'); setIsDrawerOpen(true); }}
                  onDelete={handleDeleteMail}
                  onViewMail={(m) => { setMailToEdit(m); setDrawerMode('view'); setIsDrawerOpen(true); }}
                  onExportExcel={() => window.open('/api/excel/export', '_blank')}
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
            mailToEdit={mailToEdit}
            onSave={handleSaveMail}
            mode={drawerMode}
            onError={(title, message) => setConfirmModal({ isOpen: true, title, message, onConfirm: () => {} })}
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
    </>
  );
}
