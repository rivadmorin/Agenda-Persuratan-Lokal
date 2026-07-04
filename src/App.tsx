import "./material-web.d.ts";
import React, { useState, useEffect, useMemo } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import MailTable from './components/MailTable';
import MailDrawer from './components/MailDrawer';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import PdfTools from './components/PdfTools';
import UserManagement from './components/UserManagement';
import { User, AppConfig, MailRecord } from './types';
import { generateM3Theme } from './utils/theme';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [mails, setMails] = useState<MailRecord[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mailToEdit, setMailToEdit] = useState<MailRecord | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);

  // Initial Load
  useEffect(() => {
    fetchConfig();
    fetchMails();
    setupSSE();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    setConfig(data);
    if (data.themeColor) generateM3Theme(data.themeColor);
  };

  const fetchMails = async () => {
    const res = await fetch('/api/mails');
    const data = await res.json();
    setMails(data);
  };

  const setupSSE = () => {
    const eventSource = new EventSource('/api/sse/online');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOnlineCount(data.onlineCount || 1);
    };
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Store user session if needed
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser?.username })
    });
    setCurrentUser(null);
  };

  const handleSaveMail = async (data: any) => {
    const url = mailToEdit ? `/api/mails/${mailToEdit.id}` : '/api/mails';
    const method = mailToEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-username': currentUser?.username || '',
        'x-user-name': currentUser?.name || ''
      },
      body: JSON.stringify({ ...data, type: 'Masuk' })
    });

    if (res.ok) {
      setIsDrawerOpen(false);
      fetchMails();
    } else {
      const err = await res.json();
      alert(err.message || 'Gagal menyimpan surat');
    }
  };

  const handleDeleteMail = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda surat ini?')) {
      await fetch(`/api/mails/${id}`, { method: 'DELETE' });
      fetchMails();
    }
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (res.ok) setConfig(newConfig);
  };

  if (!currentUser || !config) {
    return <Login appName={config?.appName || 'Agenda Persuratan'} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--md-sys-color-surface)]">
      <Sidebar
        currentUser={currentUser}
        appName={config.appName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onlineCount={onlineCount}
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              mails={mails}
              config={config}
              onNavigateToTab={setActiveTab}
              onSelectMail={(m) => { setMailToEdit(m); setIsDrawerOpen(true); }}
            />
          )}

          {activeTab === 'mails' && (
            <MailTable
              mails={mails}
              config={config}
              onAdd={() => { setMailToEdit(null); setIsDrawerOpen(true); }}
              onEdit={(m) => { setMailToEdit(m); setIsDrawerOpen(true); }}
              onDelete={handleDeleteMail}
              onViewPdf={(path) => window.open(`/api/files/${path}`, '_blank')}
              onExportExcel={() => window.open('/api/excel/export', '_blank')}
              onBatchDownload={(ids) => {
                fetch('/api/pdf/batch-download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mailIds: ids })
                }).then(res => res.blob()).then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Arsip_Surat.zip';
                  a.click();
                });
              }}
              onPrintReceipt={(ids) => {
                 fetch('/api/pdf/receipt', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ mailIds: ids })
                 }).then(res => res.blob()).then(blob => {
                   const url = window.URL.createObjectURL(blob);
                   window.open(url, '_blank');
                 });
              }}
            />
          )}

          {activeTab === 'pdf-tools' && <PdfTools />}

          {activeTab === 'users' && <UserManagement />}

          {activeTab === 'settings' && (
            <Settings config={config} onSaveConfig={handleSaveConfig} />
          )}
        </div>
      </main>

      <MailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        columns={config.columns}
        mailToEdit={mailToEdit}
        onSave={handleSaveMail}
      />
    </div>
  );
}
