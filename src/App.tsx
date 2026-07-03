import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  Edit2, 
  Loader, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Inbox,
  Printer,
  ClipboardCopy,
  BookOpen,
  Sun,
  Moon,
  AlertTriangle,
  ExternalLink,
  Eye,
  Clock,
  CheckCircle,
  User2,
  Calendar,
  Tag,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// Components
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import MailTable from './components/MailTable';
import MailDrawer from './components/MailDrawer';
import PdfTools from './components/PdfTools';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import Dashboard from './components/Dashboard';

// Types
import { User, AppConfig, MailRecord, ServerInfo } from './types';

// Helper to generate elegant Markdown summary of the selected mail
const generateMailMarkdown = (mail: MailRecord | null, config: AppConfig | null) => {
  if (!mail) return '';
  
  let md = `# 📄 Rincian Agenda Surat\n\n`;
  md += `| Atribut | Detail Informasi |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **ID Surat** | \`${mail.id}\` |\n`;
  md += `| **Jenis Surat** | **${mail.type}** |\n`;
  
  if (config && config.columns) {
    [...config.columns].forEach((col) => {
      let val = mail.metadata[col.key];
      if (val === undefined || val === null || val === '') {
        val = '-';
      } else if (col.type === 'date') {
        try {
          val = new Date(val).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (e) {}
      }
      md += `| **${col.label}** | ${val} |\n`;
    });
  }

  // Adding creator and updater information
  const createdUser = mail.createdByName ? `${mail.createdByName} (@${mail.createdBy})` : 'Operator';
  md += `| **Penginput** | ${createdUser} |\n`;
  
  if (mail.createdAt) {
    try {
      const createdDate = new Date(mail.createdAt).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      md += `| **Waktu Input** | ${createdDate} |\n`;
    } catch (e) {}
  }

  if (mail.updatedByName && (mail.updatedByName !== mail.createdByName || mail.updatedBy !== mail.createdBy)) {
    const updatedUser = `${mail.updatedByName} (@${mail.updatedBy})`;
    md += `| **Diperbarui Oleh** | ${updatedUser} |\n`;
  }

  if (mail.updatedAt && mail.updatedAt !== mail.createdAt) {
    try {
      const updatedDate = new Date(mail.updatedAt).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      md += `| **Waktu Perbaruan** | ${updatedDate} |\n`;
    } catch (e) {}
  }
  
  md += `\n---\n\n`;
  md += `### 📝 Perihal / Ringkasan Isi\n`;
  md += `${mail.metadata.perihal || '*Tidak ada rincian perihal yang dicatat.*'}\n\n`;
  
  if (mail.metadata.keterangan) {
    md += `### ℹ️ Keterangan / Catatan\n`;
    md += `${mail.metadata.keterangan}\n\n`;
  }
  
  return md;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('agenda');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [mails, setMails] = useState<MailRecord[]>([]);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loadingMails, setLoadingMails] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [connectionError, setConnectionError] = useState(false);

  // SSE Online Users
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<{ username: string; name: string; role: string }[]>([]);

  // Selected row for PDF preview pane
  const [selectedMail, setSelectedMail] = useState<MailRecord | null>(null);
  const [showPreviewPane, setShowPreviewPane] = useState(false);
  const [previewMode, setPreviewMode] = useState<'details' | 'pdf' | 'markdown'>('details');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrintPdf = () => {
    if (selectedMail && selectedMail.pdfPath) {
      const fileUrl = `/api/files/${selectedMail.pdfPath}`;
      // Open the PDF directly in a new tab. This activates the browser's highly optimized,
      // native PDF viewer which features fully-supported print, download, and pagination controls,
      // avoiding all cross-origin sandbox restrictions.
      const win = window.open(fileUrl, '_blank');
      if (win) {
        win.focus();
      }
    }
  };

  // Mail form Drawer states
  const [showMailDrawer, setShowMailDrawer] = useState(false);
  const [mailToEdit, setMailToEdit] = useState<MailRecord | null>(null);

  // Restore session on load (client-side persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user_session');
      }
    }
    fetchServerInfo();
    fetchConfig();
  }, []);

  // Monitor network connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setConnectionError(false);
      fetchMails();
      fetchConfig();
      fetchServerInfo();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial data when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchMails();
      setupSSE();
      // Start heartbeat activity ping every 10s to keep user active on server
      const interval = setInterval(pingActivity, 10000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [currentUser]);

  // Keep preview mail updated if mails list changes
  useEffect(() => {
    if (selectedMail && mails.length > 0) {
      const updated = mails.find((m) => m.id === selectedMail.id);
      if (updated) {
        setSelectedMail(updated);
      } else {
        setSelectedMail(null);
        setShowPreviewPane(false);
      }
    }
  }, [mails]);

  // Helper for all request headers including identity for activity tracking
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentUser) {
      headers['x-username'] = currentUser.username;
      headers['x-user-name'] = currentUser.name;
      headers['x-user-role'] = currentUser.role;
    }
    return headers;
  };

  const pingActivity = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/info', {
        method: 'GET',
        headers: getHeaders(),
      });
    } catch (e) {
      // ignore failures for background pings
    }
  };

  const setupSSE = () => {
    const sse = new EventSource('/api/users/online');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setOnlineCount(data.count);
        setOnlineUsers(data.users);
      } catch (e) {
        // ignore JSON errors
      }
    };
    return () => {
      sse.close();
    };
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } catch (e) {
      setConnectionError(true);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const data = await res.json();
        setServerInfo(data);
        setConnectionError(false);
      } else {
        setConnectionError(true);
      }
    } catch (e) {
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
    } catch (e) {
      setConnectionError(true);
    } finally {
      setLoadingMails(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('user_session', JSON.stringify(user));
    setCurrentUser(user);
    // Refresh configurations
    fetchConfig();
    fetchServerInfo();
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username }),
        });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('user_session');
    setCurrentUser(null);
    setSelectedMail(null);
    setShowPreviewPane(false);
  };

  const handleUpdateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newConfig),
      });
      if (response.ok) {
        await fetchConfig();
      } else {
        throw new Error('Gagal memperbarui konfigurasi.');
      }
    } catch (err) {
      throw err;
    }
  };

  // MAIL CRUD ACTIONS
  const handleOpenAddMail = () => {
    setMailToEdit(null);
    setShowMailDrawer(true);
  };

  const handleOpenEditMail = (mail: MailRecord) => {
    setMailToEdit(mail);
    setShowMailDrawer(true);
  };

  const handleSaveMail = async (mailData: {
    id?: string;
    type: 'Masuk' | 'Keputusan';
    metadata: Record<string, any>;
    pdfData?: string;
    pdfName?: string;
    versionId?: number;
  }) => {
    const isEdit = !!mailData.id;
    const url = isEdit ? `/api/mails/${mailData.id}` : '/api/mails';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(mailData),
    });

    if (response.ok) {
      await fetchMails();
    } else {
      const errorData = await response.json();
      if (response.status === 409 && errorData.collision) {
        throw new Error(errorData.message);
      } else {
        throw new Error(errorData.message || 'Gagal menyimpan surat.');
      }
    }
  };

  const handleDeleteMail = async (id: string) => {
    try {
      const response = await fetch(`/api/mails/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.ok) {
        await fetchMails();
        if (selectedMail?.id === id) {
          setSelectedMail(null);
          setShowPreviewPane(false);
        }
      } else {
        alert('Gagal menghapus surat.');
      }
    } catch (err) {
      alert('Koneksi terputus dengan server.');
    }
  };

  // Action upload PDF directly from preview placeholder
  const handleUploadPdfForMail = async (mailId: string, base64Data: string, fileName: string) => {
    const targetMail = mails.find((m) => m.id === mailId);
    if (!targetMail) return;

    try {
      const response = await fetch(`/api/mails/${mailId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          type: targetMail.type,
          metadata: targetMail.metadata,
          pdfData: base64Data,
          pdfName: fileName,
          versionId: targetMail.versionId,
        }),
      });

      if (response.ok) {
        await fetchMails();
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal mengunggah PDF.');
      }
    } catch (err) {
      alert('Gagal mengunggah PDF.');
    }
  };

  // EXCEL IMPORT ACTION
  const handleImportExcel = async (file: File) => {
    try {
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: file,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchMails();
        return { success: true, count: data.count };
      } else {
        return { success: false, errors: data.errors || [data.message || 'Gagal mengimpor Excel.'] };
      }
    } catch (err) {
      return { success: false, errors: ['Gagal menyambung ke server.'] };
    }
  };

  // BATCH ACTIONS
  const handleBatchReceipt = async (mailIds: string[]) => {
    const selectedMails = mails.filter((m) => mailIds.includes(m.id));
    const inputters = Array.from(new Set(selectedMails.map((m) => m.createdByName || 'Operator'))).filter(Boolean);
    const defaultLeftSigner = inputters.join(', ') || currentUser?.name || 'Operator';

    const leftSigner = prompt('Nama Penyerah / Pengirim (Sisi Kiri):', defaultLeftSigner);
    if (leftSigner === null) return;
    const rightSigner = prompt('Nama Penerima (Sisi Kanan):', 'Administrator');
    if (rightSigner === null) return;

    try {
      const response = await fetch('/api/pdf/receipt', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mailIds, signerLeft: leftSigner, signerRight: rightSigner }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tanda_Terima_Agenda_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mencetak tanda terima PDF.');
      }
    } catch (err) {
      alert('Gagal menghubungkan ke server.');
    }
  };

  const handleBatchZip = async (mailIds: string[]) => {
    try {
      const response = await fetch('/api/pdf/batch-download', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mailIds }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Arsip_Agenda_Batch_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errData = await response.json();
        alert(errData.message || 'Gagal membuat arsip zip massal.');
      }
    } catch (err) {
      alert('Gagal menyambung ke server.');
    }
  };

  const handleSelectForPreview = (mail: MailRecord) => {
    setSelectedMail(mail);
    setShowPreviewPane(true);
  };

  if (!currentUser) {
    return (
      <Login 
        appName={config?.appName || 'Agenda Persuratan'} 
        onLoginSuccess={handleLoginSuccess} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  const appName = config?.appName || 'Agenda Persuratan';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Sidebar navigation panel */}
      <Sidebar
        currentUser={currentUser}
        appName={appName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onlineCount={onlineCount}
        onlineUsers={onlineUsers}
        serverInfo={serverInfo}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Render Tab Workspace */}
        {activeTab === 'agenda' && config && (
          <MailTable
            currentUser={currentUser}
            columns={config.columns}
            mails={mails}
            loading={loadingMails}
            onRefresh={fetchMails}
            onAddMail={handleOpenAddMail}
            onEditMail={handleOpenEditMail}
            onDeleteMail={handleDeleteMail}
            onSelectForPreview={handleSelectForPreview}
            selectedMailForPreview={selectedMail}
            onUploadPdfForMail={handleUploadPdfForMail}
            onBatchReceipt={handleBatchReceipt}
            onBatchZip={handleBatchZip}
            onImportExcel={handleImportExcel}
            showNoColumn={config.showNoColumn !== false}
            startNo={config.startNo || 1}
          />
        )}

        {activeTab === 'pdf-tools' && <PdfTools />}
        {activeTab === 'dashboard' && (
          <Dashboard 
            mails={mails} 
            config={config} 
            onNavigateToTab={setActiveTab} 
            onSelectMail={(mail) => {
              setSelectedMail(mail);
              setShowPreviewPane(true);
            }} 
          />
        )}
        {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
        {activeTab === 'settings' && config && (
          <Settings config={config} onUpdateConfig={handleUpdateConfig} />
        )}

        {/* ==========================================
            SPLIT PREVIEW PANE (Side PDF Panel)
            ========================================== */}
        <AnimatePresence>
          {activeTab === 'agenda' && showPreviewPane && selectedMail && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 200 }}
              className="border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen shrink-0 flex flex-col overflow-hidden relative z-10"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-display truncate">
                    Pratinjau Lampiran
                  </h4>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    ID: {selectedMail.id}
                  </span>
                </div>
                 <div className="flex items-center gap-1">
                  {previewMode === 'markdown' && (
                    <button
                      onClick={() => {
                        const mdText = generateMailMarkdown(selectedMail, config);
                        navigator.clipboard.writeText(mdText);
                        setCopiedMarkdown(true);
                        setTimeout(() => setCopiedMarkdown(false), 2000);
                      }}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                      title={copiedMarkdown ? "Tersalin!" : "Salin Markdown"}
                    >
                      {copiedMarkdown ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                      ) : (
                        <ClipboardCopy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {selectedMail.pdfPath && previewMode === 'pdf' && (
                    <button
                      id="btn-print-preview-pdf"
                      onClick={handlePrintPdf}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-all"
                      title="Cetak PDF Lampiran"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    id="btn-edit-preview-pdf"
                    onClick={() => handleOpenEditMail(selectedMail)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                    title="Ubah Rincian"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-close-preview-pane"
                    onClick={() => {
                      setSelectedMail(null);
                      setShowPreviewPane(false);
                    }}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Tab Selector for PDF / Markdown View */}
              <div className="flex border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-1 shrink-0">
                <button
                  onClick={() => setPreviewMode('details')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    previewMode === 'details'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Rincian</span>
                </button>
                <button
                  onClick={() => setPreviewMode('pdf')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    previewMode === 'pdf'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Berkas PDF</span>
                </button>
                <button
                  onClick={() => setPreviewMode('markdown')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    previewMode === 'markdown'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </button>
              </div>

              {/* Content area: Rincian (Details), PDF, or Markdown Viewer */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
                {previewMode === 'details' ? (
                  <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto p-5 select-text space-y-5">
                    {/* Header Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-150 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                          selectedMail.type === 'Masuk' 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${selectedMail.type === 'Masuk' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
                          {selectedMail.type}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">ID: {selectedMail.id}</span>
                      </div>
                      
                      {/* Surat / Agenda Number */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">No. Agenda / No. Surat</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 select-all break-words leading-snug">
                          {selectedMail.metadata.no_surat || selectedMail.metadata.no_agenda || '-'}
                        </h3>
                      </div>
                    </div>

                    {/* Dynamic Metadata Cards */}
                    <div className="space-y-4">
                      {/* Sender and Receiver Card */}
                      {(selectedMail.metadata.pengirim || selectedMail.metadata.penerima) && (
                        <div className="p-4 bg-slate-50/40 dark:bg-slate-800/10 rounded-2xl border border-slate-150 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/50">
                          {selectedMail.metadata.pengirim && (
                            <div className="pb-3">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pengirim</span>
                              <div className="flex items-center gap-2.5 mt-1.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                  <User2 className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words">{selectedMail.metadata.pengirim}</span>
                              </div>
                            </div>
                          )}
                          {selectedMail.metadata.penerima && (
                            <div className="pt-3">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Penerima</span>
                              <div className="flex items-center gap-2.5 mt-1.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <User2 className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words">{selectedMail.metadata.penerima}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dates Card */}
                      {(selectedMail.metadata.tanggal_surat || selectedMail.metadata.tanggal_terima) && (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedMail.metadata.tanggal_surat && (
                            <div className="p-3 bg-slate-50/20 dark:bg-slate-800/5 rounded-2xl border border-slate-150 dark:border-slate-800/40">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tanggal Surat</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {new Date(selectedMail.metadata.tanggal_surat).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          )}
                          {selectedMail.metadata.tanggal_terima && (
                            <div className="p-3 bg-slate-50/20 dark:bg-slate-800/5 rounded-2xl border border-slate-150 dark:border-slate-800/40">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tanggal Terima</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {new Date(selectedMail.metadata.tanggal_terima).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Subject / Perihal Card */}
                      {selectedMail.metadata.perihal && (
                        <div className="p-4 bg-slate-50/20 dark:bg-slate-800/5 rounded-2xl border border-slate-150 dark:border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Perihal / Hal</span>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 font-semibold leading-relaxed whitespace-pre-wrap select-all">
                            {selectedMail.metadata.perihal}
                          </p>
                        </div>
                      )}

                      {/* Remaining Attributes */}
                      <div className="bg-slate-50/10 dark:bg-slate-800/5 rounded-2xl border border-slate-150 dark:border-slate-800/40 p-4 space-y-3.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Atribut Tambahan</span>
                        <div className="grid grid-cols-1 gap-y-3">
                          {config?.columns
                            .filter(col => !['no_surat', 'no_agenda', 'pengirim', 'penerima', 'tanggal_surat', 'tanggal_terima', 'perihal'].includes(col.key))
                            .map((col) => {
                              const val = selectedMail.metadata[col.key];
                              return (
                                <div key={col.key} className="flex justify-between items-start gap-4 text-xs border-b border-dashed border-slate-150 dark:border-slate-800/50 pb-2.5 last:border-0 last:pb-0">
                                  <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">{col.label}</span>
                                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-right break-words max-w-[70%]">
                                    {col.type === 'date' && val
                                      ? new Date(val).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                                      : val ?? '-'}
                                  </span>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>

                      {/* Riwayat & Jejak Audit */}
                      <div className="bg-slate-50/10 dark:bg-slate-800/5 rounded-2xl border border-slate-150 dark:border-slate-800/40 p-4 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Riwayat & Jejak Audit</span>
                        <div className="space-y-3 text-xs">
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 dark:text-slate-300">Dibuat oleh {selectedMail.createdByName || 'Operator'}</p>
                              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                {selectedMail.createdAt ? new Date(selectedMail.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                              </p>
                            </div>
                          </div>

                          {selectedMail.updatedByName && (
                            <div className="flex items-start gap-2.5 border-t border-slate-100 dark:border-slate-800/50 pt-2.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-700 dark:text-slate-300">Terakhir diperbarui oleh {selectedMail.updatedByName}</p>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                  {selectedMail.updatedAt ? new Date(selectedMail.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Quick Actions */}
                    <div className="pt-2 flex items-center gap-2">
                      {selectedMail.pdfPath ? (
                        <button
                          onClick={() => setPreviewMode('pdf')}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-blue-100 dark:border-blue-900/30"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Lihat PDF Lampiran</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setPreviewMode('pdf')}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-extrabold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-800"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Unggah PDF Lampiran</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditMail(selectedMail)}
                        className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 p-2 rounded-xl transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                        title="Ubah Rincian Agenda"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : previewMode === 'pdf' ? (
                  selectedMail.pdfPath ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {/* Interactive Warning & Direct Open Helper */}
                      <div className="bg-blue-50 dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 px-4 py-3 text-xs text-blue-800 dark:text-blue-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none shrink-0">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">Berkas PDF Tidak Tampil / Kosong?</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Peramban membatasi pemutar PDF di dalam frame sandbox (AI Studio). Silakan klik tombol di samping untuk membukanya secara aman di tab baru.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <a
                            href={`/api/files/${selectedMail.pdfPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka di Tab Baru</span>
                          </a>
                        </div>
                      </div>

                      {/* Actual iframe */}
                      <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
                        <iframe
                          ref={iframeRef}
                          id="pdf-preview-iframe"
                          src={`/api/files/${selectedMail.pdfPath}`}
                          className="w-full h-full border-none relative z-10"
                          title="Dokumen PDF Lampiran"
                          referrerPolicy="no-referrer"
                        />
                        {/* Elegant Fallback card underneath the iframe or as background */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50 dark:bg-slate-950">
                          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Memuat Dokumen PDF...</p>
                          <p className="text-xs text-slate-400 max-w-xs mt-1">
                            Bila dokumen tidak kunjung termuat, gunakan tombol <strong className="text-blue-500">Buka di Tab Baru</strong> di atas atau beralih ke tab <strong className="text-blue-500">Markdown</strong> untuk melihat ringkasan teks.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm shadow-sm transition-all relative flex flex-col items-center justify-center">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type === 'application/pdf') {
                               const reader = new FileReader();
                               reader.onload = async () => {
                                 const base = (reader.result as string).split(',')[1];
                                 await handleUploadPdfForMail(selectedMail.id, base, file.name);
                               };
                               reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tarik & Lepas Berkas PDF</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                          Seret berkas PDF ke sini atau klik untuk mengunggah lampiran fisik surat ini.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto p-5 select-text">
                    <div className="markdown-body">
                      <Markdown>{generateMailMarkdown(selectedMail, config)}</Markdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected mail details panel footer - Only shown in PDF and Markdown views to prevent duplication */}
              {previewMode !== 'details' && (
                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2 max-h-48 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Informasi Singkat Agenda
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {config && [...config.columns].slice(0, 4).map((col) => (
                      <div key={col.key} className="overflow-hidden">
                        <span className="text-slate-400 truncate block font-semibold">{col.label}:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block truncate mt-0.5">
                          {col.type === 'date' && selectedMail.metadata[col.key]
                            ? new Date(selectedMail.metadata[col.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                            : selectedMail.metadata[col.key] ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-over Mail Drawer (Insert & Update form) */}
      {config && (
        <MailDrawer
          isOpen={showMailDrawer}
          onClose={() => {
            setShowMailDrawer(false);
            setMailToEdit(null);
          }}
          columns={config.columns}
          mailToEdit={mailToEdit}
          onSave={handleSaveMail}
        />
      )}

      {/* Network Connection Status Toast */}
      <AnimatePresence>
        {(isOffline || connectionError) && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4"
          >
            <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 shadow-2xl rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isOffline ? 'Koneksi Terputus' : 'Kesalahan Jaringan'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isOffline 
                      ? 'Anda sedang bekerja offline. Periksa koneksi internet Anda.' 
                      : 'Gagal terhubung ke server. Silakan coba lagi.'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchMails();
                  fetchConfig();
                  fetchServerInfo();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Coba Lagi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
