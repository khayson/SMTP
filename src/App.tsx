import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Inbox,
  ExternalLink,
  Search,
  Trash2,
  RotateCcw,
  FileText,
  Settings,
  HelpCircle,
  ChevronRight,
  Zap,
  Copy,
  FolderOpen,
  Mail,
  Plus,
  X,
  Check,
  ArrowLeft,
  Menu
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { listen } from "@tauri-apps/api/event";
import WebhooksView from "./components/WebhooksView";
import SettingsModal from "./components/SettingsModal";

interface Email {
  id: number;
  subject: string;
  sender: string;
  recipients: string;
  html_body: string;
  text_body: string;
  created_at: string;
  raw_headers: string;
  project_id: string;
  is_read: boolean;
}


function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeView, setActiveView] = useState<'inbox' | 'webhooks' | 'help'>('inbox');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'signals' | 'integration'>('signals');
  const [inspectorTab, setInspectorTab] = useState<'preview' | 'html' | 'text' | 'headers'>('preview');
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });
  const [techType, setTechType] = useState('Laravel');
  const [listWidth, setListWidth] = useState(380);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isResizing = useRef(false);

  const fetchEmails = async () => {
    try {
      const data: Email[] = await invoke("get_emails", { projectId: selectedProject });
      setEmails(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const data: string[] = await invoke("get_projects");
      setProjects(data);
      if (!selectedProject && data.length > 0) {
        setSelectedProject(data[0]);
      } else if (data.length === 0) {
        await invoke("create_project", { id: 'default', name: 'Main Sandbox' });
        fetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchProjects();
    const interval = setInterval(() => {
      fetchEmails();
      fetchProjects();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resize Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const sidebarOffset = isSidebarOpen ? (windowWidth < 1024 ? 64 : 64 + 224) : 64;
      const newWidth = Math.max(280, Math.min(600, e.clientX - sidebarOffset));
      setListWidth(newWidth);
    };
    const handleMouseUp = () => { isResizing.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSidebarOpen, windowWidth]);

  // Auto-Update Logic
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          notify(`New version ${update.version} detected. Downloading in background...`);
          await update.downloadAndInstall();
          notify("Update ready to install! Restarting in 3 seconds...");
          setTimeout(async () => {
            await relaunch();
          }, 3000);
        }
      } catch (e) {
        console.error("Update error:", e);
      }
    };
    checkForUpdates();

    // Check for onboarding
    const checkFirstRun = async () => {
      const isFirstRun = localStorage.getItem('postmaster_onboarding_complete') !== 'true';
      if (isFirstRun) setShowOnboarding(true);
    };
    checkFirstRun();
  }, []);

  // Listen for SMTP Errors
  useEffect(() => {
    const unlisten = listen<string>("smtp-error", (event) => {
      setSmtpError(event.payload);
      console.error("SMTP Error received:", event.payload);
    });
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  // External Link Interceptor for Iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'open-external-link' && event.data.url) {
        openUrl(event.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const wrapHtmlWithLinkHandler = (html: string) => {
    // Audit-aligned Security Hardening:
    // Move from active JS click interception to standard <base target="_blank">
    // and a restrictive CSP Meta tag.
    const meta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline';">`;
    const base = `<base target="_blank">`;
    return meta + base + html;
  };

  const notify = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 2000);
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    notify(message);
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      try {
        await invoke("mark_as_read", { id: email.id });
        fetchEmails(); // Refresh to update unread counts/dots
      } catch (error) {
        console.error(error);
      }
    }
  };

  const markAllRead = async () => {
    if (!selectedProject) return;
    try {
      await invoke("mark_all_as_read", { projectId: selectedProject });
      fetchEmails();
      notify("Inbox marked read.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const sanitizedId = newProjectName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      await invoke("create_project", { id: sanitizedId, name: newProjectName.trim() });
      setNewProjectName("");
      setIsCreatingProject(false);
      fetchProjects();
      setSelectedProject(sanitizedId);
      notify(`Inbox '${sanitizedId}' established.`);
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    if (!confirm("Discard all captured messages?")) return;
    try {
      await invoke("clear_emails");
      fetchEmails();
      setSelectedEmail(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredEmails = emails.filter(e =>
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFullConfigSnippet = (tech: string, project: string | null) => {
    const p = project || 'app_unique_id';
    switch (tech) {
      case 'Laravel':
        return `MAIL_MAILER=smtp\nMAIL_HOST=127.0.0.1\nMAIL_PORT=1025\nMAIL_USERNAME=${p}\nMAIL_PASSWORD=postmaster-pass\nMAIL_ENCRYPTION=null\nMAIL_FROM_ADDRESS="hello@example.com"\nMAIL_FROM_NAME="\${APP_NAME}"`;
      case 'Flutter':
        return `final smtpServer = SmtpServer('127.0.0.1', \n  port: 1025, \n  username: '${p}', \n  password: 'postmaster-safe', \n  ignoreBadCertificate: true\n);`;
      case 'Express':
        return `const transport = nodemailer.createTransport({\n  host: "127.0.0.1",\n  port: 1025,\n  auth: { user: "${p}", pass: "any" }\n});`;
      case 'Python':
        return `# Postmaster SMTP Isolation Config\nSMTP_HOST = "127.0.0.1"\nSMTP_PORT = 1025\nSMTP_USER = "${p}"\nSMTP_PASS = "any"`;
      default: return '';
    }
  };

  const isSmallScreen = windowWidth < 1024;
  const isMasterView = !selectedEmail || !isSmallScreen;

  return (
    <div className="flex h-screen w-screen bg-[#0b0e14] text-[#a0aec0] font-sans selection:bg-blue-500/30 overflow-hidden select-none">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 bg-[#2563eb] text-white px-4 py-2 rounded shadow-2xl animate-in fade-in duration-300 text-xs font-semibold border border-white/10 uppercase tracking-widest italic leading-none flex items-center gap-2">
          <Zap size={12} fill="currentColor" /> {toast.message}
        </div>
      )}

      {/* SMTP Error Banner */}
      {smtpError && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <X size={18} className="p-1 bg-white/20 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Critical Conflict</span>
              <p className="text-xs font-bold leading-none opacity-90">{smtpError}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-black uppercase tracking-widest transition-all border border-white/20"
            >
              Change Port
            </button>
            <button 
              onClick={() => setSmtpError(null)}
              className="p-1 hover:bg-white/10 rounded transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Primary Sidebar (Fixed) */}
      <aside className="w-16 bg-[#0b0e14] border-r border-[#1e293b] flex flex-col items-center py-6 gap-8 shrink-0 z-20">
        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg cursor-pointer shadow-lg shadow-blue-900/40" onClick={() => setActiveView('inbox')}>P</div>
        
        <nav className="flex-1 flex flex-col items-center gap-6">
          <button 
            onClick={() => { setActiveView('inbox'); if (isSmallScreen) setIsSidebarOpen(false); }}
            className={`p-2 rounded transition-colors ${activeView === 'inbox' ? 'text-blue-500 bg-blue-500/10' : 'text-[#718096] hover:text-[#a0aec0]'}`}
          ><Inbox size={24} /></button>
          
          <button 
            onClick={() => { setActiveView('webhooks'); if (isSmallScreen) setIsSidebarOpen(false); }}
            className={`p-2 rounded transition-colors ${activeView === 'webhooks' ? 'text-blue-500 bg-blue-500/10' : 'text-[#718096] hover:text-[#a0aec0]'}`}
          ><ExternalLink size={24} /></button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded transition-colors ${isSettingsOpen ? 'text-blue-500 bg-blue-500/10' : 'text-[#718096] hover:text-[#a0aec0]'}`}
          ><Settings size={24} /></button>
        </nav>

        <button onClick={() => setActiveView('help')} className={`p-2 rounded transition-colors ${activeView === 'help' ? 'text-blue-500 bg-blue-500/10' : 'text-[#718096] hover:text-[#a0aec0]'}`}><HelpCircle size={24} /></button>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Project/Inbox Sidebar (Collapsible) */}
        {activeView === 'inbox' && isSidebarOpen && (
          <aside className={`w-56 bg-[#0b0e14] border-r border-[#1e293b] flex flex-col shrink-0 z-10 ${isSmallScreen ? 'absolute inset-y-0 left-16 shadow-2xl z-30' : ''}`}>
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-blue-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#e2e8f0]">Isolated Inboxes</h2>
              </div>
              <button onClick={() => setIsCreatingProject(!isCreatingProject)} className="p-1 hover:bg-white/5 rounded text-blue-500 transition-colors">
                {isCreatingProject ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
              {isCreatingProject && (
                <div className="px-2 pb-4 pt-1 flex flex-col gap-2 border-b border-[#1e293b]/50 mb-2">
                  <input autoFocus type="text" placeholder="Username..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} className="bg-[#11141b] border border-blue-500/30 rounded px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-blue-500" />
                  <button onClick={handleCreateProject} className="bg-blue-600/20 text-blue-500 py-1 rounded text-[10px] font-black uppercase border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1"><Check size={10} /> Create</button>
                </div>
              )}

              {projects.map(p => (
                <button key={p} onClick={() => { setSelectedProject(p); if (isSmallScreen) setIsSidebarOpen(false); setSelectedEmail(null); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all ${selectedProject === p ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 font-bold' : 'text-[#718096] hover:bg-white/5 border border-transparent'}`}>
                  <Mail size={14} /> {p}
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0e14]">
          
          {/* Dashboard Header / Breadcrumbs */}
          <header className="h-14 border-b border-[#1e293b] px-6 flex items-center justify-between shrink-0 bg-[#0b0e14] z-10">
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-tighter italic overflow-hidden">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 hover:bg-white/5 rounded text-[#718096] transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}><Menu size={16} /></button>
              
              <div className="flex items-center gap-2 truncate">
                <span className="text-blue-500 hidden sm:inline">Postmaster</span>
                <ChevronRight size={14} className="text-[#4a5568]" />
                <span className="text-[#e2e8f0] px-2 py-0.5 bg-[#1e293b] rounded truncate max-w-[120px]">{selectedProject || 'INBOX'}</span>
                {selectedEmail && (
                  <>
                    <ChevronRight size={14} className="text-[#4a5568]" />
                    <span className="text-[#718096] truncate max-w-[150px]">{selectedEmail.subject}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isSmallScreen && selectedEmail && (
                <button onClick={() => setSelectedEmail(null)} className="flex items-center gap-2 px-3 py-1 bg-[#1e293b] hover:bg-[#2d3748] text-[#e2e8f0] rounded text-[10px] font-black uppercase border border-[#2d3748] transition-all"><ArrowLeft size={12} /> Back</button>
              )}
              <div className="text-[9px] font-bold text-[#4a5568] uppercase tracking-[0.2em] hidden md:block">Isolated Node</div>
            </div>
          </header>

          {activeView === 'inbox' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-12 px-6 border-b border-[#1e293b] flex items-center justify-between shrink-0 bg-[#0b0e14]/50">
                <div className="flex gap-8 h-full">
                  <button onClick={() => setActiveTab('signals')} className={`h-full text-sm font-semibold transition-all px-1 flex items-center ${activeTab === 'signals' ? 'text-[#e2e8f0] border-b-2 border-blue-500' : 'text-[#718096] hover:text-[#a0aec0]'}`}>Signals <span className="ml-2 bg-[#1e293b] text-[#718096] px-1.5 py-0.5 rounded-full text-[10px]">{emails.length}</span></button>
                  <button onClick={() => setActiveTab('integration')} className={`h-full text-sm font-semibold transition-all px-1 flex items-center ${activeTab === 'integration' ? 'text-[#e2e8f0] border-b-2 border-blue-500' : 'text-[#718096] hover:text-[#a0aec0]'}`}>Credentials</button>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab === 'signals' && (
                    <div className="relative hidden sm:block">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                      <input type="text" placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#11141b] border border-[#1e293b] rounded py-1 pl-10 pr-4 text-xs w-48 focus:border-blue-500 outline-none" />
                    </div>
                  )}
                  <button onClick={markAllRead} className="p-1.5 hover:bg-white/5 rounded text-[#718096]" title="Mark All Read"><Check size={16} /></button>
                  <button onClick={fetchEmails} className="p-1.5 hover:bg-white/5 rounded text-[#718096]"><RotateCcw size={16} /></button>
                  <button onClick={clearAll} className="p-1.5 hover:bg-white/5 rounded text-[#718096]"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden relative">
                {activeTab === 'signals' ? (
                  <>
                    {/* Signal List (Responsive Master) */}
                    <div className={`border-r border-[#1e293b] flex flex-col shrink-0 bg-[#0b0e14] transition-all duration-300 ${!isMasterView ? 'hidden' : 'w-full'}`} style={{ width: !isSmallScreen ? listWidth : '100%' }}>
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredEmails.length === 0 ? (
                          <div className="p-12 text-center opacity-40"><Mail size={48} className="mx-auto text-[#1e293b] mb-4" /><p className="text-[10px] font-black uppercase tracking-widest italic">Zero Interceptions</p></div>
                        ) : (
                          filteredEmails.map((email) => (
                            <div key={email.id} onClick={() => handleSelectEmail(email)} className={`p-4 border-b border-[#1e293b] cursor-pointer transition-all relative ${selectedEmail?.id === email.id ? 'bg-[#11141b] border-l-2 border-l-blue-600 shadow-inner' : 'hover:bg-[#11141b]/50 border-l-2 border-l-transparent'}`}>
                              {!email.is_read && <div className="absolute right-4 top-5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-tighter truncate max-w-[70%] italic ${!email.is_read ? 'text-white' : 'text-[#718096]'}`}>{email.sender}</span>
                                <span className="text-[9px] text-[#4a5568] font-mono">{new Date(email.created_at).toLocaleTimeString()}</span>
                              </div>
                              <h3 className={`text-xs truncate ${!email.is_read ? 'font-black text-white' : 'font-bold text-[#e2e8f0]'}`}>{email.subject || '(No Subject)'}</h3>
                              <p className="text-[10px] text-[#4a5568] mt-1 truncate font-mono opacity-60">RECV: {email.recipients}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {!isSmallScreen && (
                      <div onMouseDown={() => { isResizing.current = true; }} className="w-1.5 h-full cursor-col-resize absolute z-10 hover:bg-blue-600/50 transition-colors bg-transparent border-x border-[#1e293b]/10" style={{ left: (isSidebarOpen ? 56 + 16 : 16) + listWidth }} />
                    )}

                    {/* Signal Content (Responsive Detail) */}
                    <div className={`flex-1 flex flex-col overflow-hidden bg-[#0b0e14] min-w-0 ${isMasterView && isSmallScreen ? 'hidden' : ''}`}>
                      {selectedEmail ? (
                        <div className="flex-1 flex flex-col overflow-hidden h-full">
                          <header className="px-8 py-6 flex flex-col gap-4 bg-[#0b0e14]/50 border-b border-[#1e293b]">
                            <div className="flex justify-between items-start gap-4">
                              <h2 className="text-xl md:text-2xl font-black text-[#e2e8f0] tracking-tight italic uppercase truncate">{selectedEmail.subject}</h2>
                              <button onClick={() => copyToClipboard(selectedEmail.html_body || selectedEmail.text_body, "Captured!")} className="p-2 hover:bg-white/5 rounded-lg text-[#718096] border border-[#1e293b] shrink-0"><Copy size={16} /></button>
                            </div>
                            <div className="flex gap-6 h-8 -mb-6">
                              {[{ id: 'preview', label: 'Visual' }, { id: 'html', label: 'Source' }, { id: 'text', label: 'Text' }, { id: 'headers', label: 'Trace' }].map(tab => (
                                <button key={tab.id} onClick={() => setInspectorTab(tab.id as any)} className={`h-full text-[10px] font-black uppercase tracking-[0.2em] px-1 transition-all ${inspectorTab === tab.id ? 'text-blue-500 border-b-2 border-blue-500' : 'text-[#718096] hover:text-[#e2e8f0]'}`}>{tab.label}</button>
                              ))}
                            </div>
                          </header>

                          <div className={`flex-1 bg-white mx-0 sm:mx-8 my-4 sm:my-8 rounded-none sm:rounded-xl overflow-hidden flex flex-col border border-[#1e293b] shadow-2xl ${isSmallScreen ? 'm-0 rounded-none' : ''}`}>
                            {inspectorTab === 'preview' && (
                              <iframe 
                                className="w-full h-full border-none" 
                                sandbox="allow-same-origin allow-popups"
                                srcDoc={wrapHtmlWithLinkHandler(selectedEmail.html_body || `<pre style="padding:20px;font-family:monospace">${selectedEmail.text_body}</pre>`)} 
                              />
                            )}
                            {['html', 'text', 'headers'].includes(inspectorTab) && (
                              <div className="flex-1 bg-[#0b0e14] p-8 overflow-auto font-mono text-[11px] leading-relaxed select-text">
                                <pre className="whitespace-pre-wrap text-blue-400">
                                  {inspectorTab === 'html' ? selectedEmail.html_body : inspectorTab === 'text' ? selectedEmail.text_body : selectedEmail.raw_headers}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                          <FileText size={80} className="mb-6 opacity-5 text-blue-500" />
                          <h2 className="text-[10px] font-black text-[#e2e8f0] uppercase tracking-[0.5em] opacity-20">Awaiting Selection</h2>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[rgba(11,14,20,0.5)]">
                    <div className="max-w-4xl mx-auto space-y-12">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                          <h2 className="text-3xl font-black text-[#e2e8f0] mb-3 uppercase tracking-tighter italic">Isolation Credentials</h2>
                          <p className="text-xs text-[#718096] uppercase font-bold tracking-widest italic opacity-60">Tunnel: {selectedProject || 'Standalone'}</p>
                        </div>
                        <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center gap-3 w-fit">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Listener: 1025</span>
                        </div>
                      </div>

                      <div className="bg-[#11141b] border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
                        {[
                          { label: 'Tunnel Host', value: '127.0.0.1' },
                          { label: 'Tunnel Port', value: '1025' },
                          { label: 'Inbox User', value: selectedProject || 'any-unique-id' },
                          { label: 'Inbox Pass', value: 'postmaster-safe' },
                          { label: 'Auth Method', value: 'LOGIN / PLAIN' }
                        ].map((c, i) => (
                          <div key={c.label} className={`flex items-center px-8 py-5 border-b border-[#1e293b] last:border-0 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                            <span className="w-32 md:w-40 text-[9px] uppercase font-black text-[#4a5568] tracking-widest shrink-0 italic">{c.label}</span>
                            <span className="text-xs text-blue-400 font-mono font-bold truncate">{c.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-16 pb-12">
                        <h3 className="text-[11px] font-black text-[#e2e8f0] mb-6 uppercase tracking-widest italic border-l-4 border-blue-500 pl-4">Precision Handlers</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {['Laravel', 'Flutter', 'Express', 'Python'].map(lang => (
                            <button key={lang} onClick={() => setTechType(lang)} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${techType === lang ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-[#11141b] text-[#718096] border-[#1e293b] hover:border-[#334155]'}`}>{lang}</button>
                          ))}
                        </div>
                        <div className="bg-[#0b0e14] border border-[#1e293b] rounded-xl p-6 md:p-8 font-mono text-[11px] text-blue-500/80 leading-relaxed group relative shadow-inner overflow-x-auto">
                          <button className="absolute top-4 right-4 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all border border-blue-400/30 flex items-center gap-2 shadow-lg" onClick={() => copyToClipboard(getFullConfigSnippet(techType, selectedProject), "Handlers copied!")}><Copy size={14} /><span className="text-[10px] font-black uppercase">Copy All</span></button>
                          <pre className="whitespace-pre-wrap italic">
                            {getFullConfigSnippet(techType, selectedProject)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeView === 'webhooks' ? (
            <WebhooksView onNotify={notify} />
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0e14] p-12">
              <div className="max-w-4xl mx-auto space-y-12 pb-24">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-4xl font-black text-[#e2e8f0] uppercase tracking-tighter italic mb-2">Quick Start Guide</h2>
                  <p className="text-sm text-[#718096] uppercase font-bold tracking-[0.2em] opacity-60">Mastering the SMTP Studio</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-[#11141b] border border-[#1e293b] p-8 rounded-2xl shadow-2xl group hover:border-blue-500/30 transition-all">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Zap size={24} />
                    </div>
                    <h3 className="text-lg font-black text-[#e2e8f0] uppercase tracking-widest mb-4">Interception</h3>
                    <p className="text-xs text-[#718096] leading-relaxed">Point your application to <span className="text-blue-400 font-mono">127.0.0.1:1025</span>. Any signal sent to this port will be captured instantly, regardless of the recipient.</p>
                  </div>
                  
                  <div className="bg-[#11141b] border border-[#1e293b] p-8 rounded-2xl shadow-2xl group hover:border-blue-500/30 transition-all">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Inbox size={24} />
                    </div>
                    <h3 className="text-lg font-black text-[#e2e8f0] uppercase tracking-widest mb-4">Isolated Inboxes</h3>
                    <p className="text-xs text-[#718096] leading-relaxed">Use different SMTP <span className="text-blue-400 font-mono">Usernames</span> to automatically route signals into separate project silos.</p>
                  </div>
                </div>

                <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-2xl">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Support & Issues</h3>
                  <p className="text-xs text-[#718096] leading-relaxed mb-6">Encountering an issue or have a feature request for KH STUDIOS? Visit the official repository to collaborate.</p>
                  <button 
                    onClick={() => openUrl('https://github.com/khayson/SMTP')}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                  >
                    <ExternalLink size={14} /> Open Repository
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Precision Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="w-full max-w-lg bg-[#0b0e14] border border-[#1e293b] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col animate-in zoom-in duration-500">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-600/40 mb-10 rotate-3">P</div>
              <h1 className="text-4xl font-black text-[#e2e8f0] uppercase tracking-tighter italic mb-4">Postmaster Studio</h1>
              <p className="text-sm text-[#718096] mb-12 leading-relaxed italic">The premium, local-first SMTP catch-all engine for modern studio development.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => { localStorage.setItem('postmaster_onboarding_complete', 'true'); setShowOnboarding(false); }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20"
                >
                  Enter Studio
                </button>
              </div>
            </div>
            <div className="bg-[#11141b] p-4 text-center border-t border-[#1e293b]">
              <span className="text-[9px] font-black text-[#4a5568] uppercase tracking-widest italic opacity-50">Studio v1.2.0 • KH STUDIOS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
