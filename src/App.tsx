import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Inbox,
  ExternalLink,
  Search,
  Trash2,
  RotateCcw,
  Settings,
  HelpCircle,
  Zap,
  Copy,
  FolderOpen,
  Mail,
  Plus,
  X,
  Check,
  ArrowLeft,
  Menu,
  Shield,
  User,
  Lock as LockIcon
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
  const [activeTab, setActiveTab] = useState<'emails' | 'integration'>('emails');
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
      const isFirstRun = localStorage.getItem('forgemail_onboarding_complete') !== 'true';
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
        return `MAIL_MAILER=smtp\nMAIL_HOST=127.0.0.1\nMAIL_PORT=1025\nMAIL_USERNAME=${p}\nMAIL_PASSWORD=forgemail-pass\nMAIL_ENCRYPTION=null\nMAIL_FROM_ADDRESS="hello@example.com"\nMAIL_FROM_NAME="\${APP_NAME}"`;
      case 'Flutter':
        return `final smtpServer = SmtpServer('127.0.0.1', \n  port: 1025, \n  username: '${p}', \n  password: 'forgemail-safe', \n  ignoreBadCertificate: true\n);`;
      case 'Express':
        return `const transport = nodemailer.createTransport({\n  host: "127.0.0.1",\n  port: 1025,\n  auth: { user: "${p}", pass: "any" }\n});`;
      case 'Python':
        return `# ForgeMail SMTP Isolation Config\nSMTP_HOST = "127.0.0.1"\nSMTP_PORT = 1025\nSMTP_USER = "${p}"\nSMTP_PASS = "any"`;
      default: return '';
    }
  };

  const isSmallScreen = windowWidth < 1024;
  const isMasterView = !selectedEmail || !isSmallScreen;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-400 font-sans selection:bg-blue-500/30 overflow-hidden select-none">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-slate-950 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-slate-200">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" /> {toast.message}
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

      {/* Primary Sidebar (Fixed Monochrome) */}
      <aside className="w-16 bg-slate-950 border-r border-slate-900 flex flex-col items-center py-8 gap-10 shrink-0 z-20">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-950 font-black text-xl cursor-pointer shadow-2xl shadow-white/5 transition-transform hover:scale-105 active:scale-95" onClick={() => setActiveView('inbox')}>F</div>
        
        <nav className="flex-1 flex flex-col items-center gap-8">
          <button 
            onClick={() => { setActiveView('inbox'); if (isSmallScreen) setIsSidebarOpen(false); }}
            className={`p-2 transition-all ${activeView === 'inbox' ? 'text-white' : 'text-slate-700 hover:text-slate-400'}`}
            title="Inbox"
          ><Inbox size={20} /></button>
          
          <button 
            onClick={() => { setActiveView('webhooks'); if (isSmallScreen) setIsSidebarOpen(false); }}
            className={`p-2 transition-all ${activeView === 'webhooks' ? 'text-white' : 'text-slate-700 hover:text-slate-400'}`}
            title="Webhooks"
          ><ExternalLink size={20} /></button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 transition-all ${isSettingsOpen ? 'text-white' : 'text-slate-700 hover:text-slate-400'}`}
            title="Settings"
          ><Settings size={20} /></button>
        </nav>

        <button 
          onClick={() => setActiveView('help')} 
          className={`p-2 transition-all ${activeView === 'help' ? 'text-white' : 'text-slate-700 hover:text-slate-400'}`}
          title="Guide"
        ><HelpCircle size={20} /></button>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Project/Inbox Sidebar (Collapsible) */}
        {activeView === 'inbox' && isSidebarOpen && (
          <aside className={`w-64 bg-slate-950 border-r border-slate-900 flex flex-col shrink-0 z-10 ${isSmallScreen ? 'absolute inset-y-0 left-16 shadow-2xl z-30' : ''}`}>
            <div className="p-8 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen size={14} className="text-white" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Projects</h2>
              </div>
              <button onClick={() => setIsCreatingProject(!isCreatingProject)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                {isCreatingProject ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 custom-scrollbar">
              {isCreatingProject && (
                <div className="px-3 pb-6 pt-2 flex flex-col gap-3 border-b border-slate-900 mb-4">
                  <input autoFocus type="text" placeholder="Project name..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-white transition-all" />
                  <button onClick={handleCreateProject} className="forge-button-primary py-3 rounded-xl text-[9px] flex items-center justify-center gap-2 shadow-xl shadow-white/5">Create Infrastructure</button>
                </div>
              )}

              {projects.map(p => (
                <button 
                  key={p} 
                  onClick={() => { setSelectedProject(p); if (isSmallScreen) setIsSidebarOpen(false); setSelectedEmail(null); }} 
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all ${selectedProject === p ? 'bg-white/5 text-white border border-white/10 font-bold' : 'text-slate-500 hover:bg-white/[0.02] border border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <Mail size={14} className={selectedProject === p ? 'text-white' : 'text-slate-700'} /> 
                    <span className="truncate max-w-[120px]">{p}</span>
                  </div>
                  {selectedProject === p && <div className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0e14]">
          
          {/* Global App Header / Breadcrumbs */}
          <header className="h-16 border-b border-slate-900 px-8 flex items-center justify-between shrink-0 bg-slate-950 z-10">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] overflow-hidden">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className={`p-2 hover:bg-white/5 rounded-xl text-slate-600 transition-all ${isSidebarOpen ? 'rotate-180' : ''}`}
                title="Toggle Sidebar"
              ><Menu size={18} /></button>
              
              <div className="flex items-center gap-4 truncate">
                <span className="text-white">ForgeMail</span>
                <div className="w-[1px] h-4 bg-slate-800" />
                <div className="flex items-center gap-3">
                  <FolderOpen size={14} className="text-slate-600" />
                  <span className="text-slate-200 truncate max-w-[120px]">{selectedProject || 'DIRECT'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {isSmallScreen && selectedEmail && (
                <button onClick={() => setSelectedEmail(null)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all"><ArrowLeft size={12} /> Back</button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-forge-pulse" />
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">Live Infrastructure</span>
              </div>
            </div>
          </header>

          {activeView === 'inbox' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-12 px-6 border-b border-[#1e293b] flex items-center justify-between shrink-0 bg-[#0b0e14]/50">
                <div className="flex gap-6 h-full">
                  <button onClick={() => setActiveTab('emails')} className={`h-full text-sm font-semibold transition-all px-1 flex items-center ${activeTab === 'emails' ? 'text-slate-100 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Emails <span className="ml-2 bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{emails.length}</span></button>
                  <button onClick={() => setActiveTab('integration')} className={`h-full text-sm font-semibold transition-all px-1 flex items-center ${activeTab === 'integration' ? 'text-slate-100 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Setup Guide</button>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab === 'emails' && (
                    <div className="relative hidden sm:block">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input type="text" placeholder="Search intercepted emails..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-10 pr-4 text-xs w-56 focus:border-blue-500 outline-none" />
                    </div>
                  )}
                  <button onClick={markAllRead} className="p-1.5 hover:bg-white/5 rounded text-[#718096]" title="Mark All Read"><Check size={16} /></button>
                  <button onClick={fetchEmails} className="p-1.5 hover:bg-white/5 rounded text-[#718096]"><RotateCcw size={16} /></button>
                  <button onClick={clearAll} className="p-1.5 hover:bg-white/5 rounded text-[#718096]"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden relative">
                {activeTab === 'emails' ? (
                  <>
                    {/* Email List (Forge Dynamic Master) */}
                    <div className={`border-r border-slate-900 flex flex-col shrink-0 bg-slate-950 transition-all duration-500 ${!isMasterView ? 'hidden' : 'w-full'}`} style={{ width: !isSmallScreen ? listWidth : '100%' }}>
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredEmails.length === 0 ? (
                          <div className="p-20 text-center opacity-20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-800 border border-slate-800"><Mail size={32} /></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Forge Empty</p>
                          </div>
                        ) : (
                          filteredEmails.map((email) => {
                            const initials = email.sender.substring(0, 2).toUpperCase();
                            return (
                              <div key={email.id} onClick={() => handleSelectEmail(email)} className={`px-8 py-8 border-b border-slate-900 cursor-pointer transition-all relative ${selectedEmail?.id === email.id ? 'bg-white/[0.03] border-l-4 border-l-white' : 'hover:bg-white/[0.01] border-l-4 border-l-transparent'}`}>
                                {!email.is_read && <div className="absolute right-8 top-10 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />}
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-white/20">
                                    {initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5 gap-3">
                                      <span className={`text-[11px] font-black uppercase tracking-widest truncate ${!email.is_read ? 'text-white' : 'text-slate-500'}`}>{email.sender}</span>
                                      <span className="text-[9px] text-slate-600 font-bold tracking-widest">{new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <h3 className={`text-xs truncate ${!email.is_read ? 'font-bold text-slate-200' : 'font-medium text-slate-500'}`}>{email.subject || '(No Subject)'}</h3>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-700 truncate font-medium pl-14">To: {email.recipients}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {!isSmallScreen && (
                      <div onMouseDown={() => { isResizing.current = true; }} className="w-1.5 h-full cursor-col-resize absolute z-10 hover:bg-blue-600/50 transition-colors bg-transparent border-x border-[#1e293b]/10" style={{ left: (isSidebarOpen ? 56 + 16 : 16) + listWidth }} />
                    )}

                    {/* Email Content (Forge Document Detail) */}
                    <div className={`flex-1 flex flex-col overflow-hidden bg-slate-950 min-w-0 ${isMasterView && isSmallScreen ? 'hidden' : ''}`}>
                      {selectedEmail ? (
                        <div className="flex-1 flex flex-col overflow-hidden h-full">
                          <header className="px-12 py-10 flex flex-col gap-10 bg-slate-950 border-b border-slate-900">
                            <div className="flex justify-between items-start gap-8">
                               <div className="flex-1 min-w-0">
                                 <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4 leading-tight">{selectedEmail.subject || '(No Subject)'}</h2>
                                 <div className="flex items-center gap-4">
                                     <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                                        {selectedEmail.sender.substring(0, 2).toUpperCase()}
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{selectedEmail.sender}</span>
                                        <span className="text-[10px] text-slate-600 font-medium tracking-wide italic">Route: {selectedEmail.recipients}</span>
                                     </div>
                                 </div>
                               </div>
                               <div className="flex items-center gap-3 shrink-0">
                                  <button onClick={() => copyToClipboard(selectedEmail.html_body || selectedEmail.text_body, "Forge Payload Copied")} className="p-3 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-950 rounded-2xl border border-white/5 transition-all shadow-2xl"><Copy size={20} /></button>
                               </div>
                            </div>
                            <div className="flex gap-10 h-10 -mb-10">
                              {[{ id: 'preview', label: 'Visual' }, { id: 'html', label: 'Payload' }, { id: 'text', label: 'Raw' }, { id: 'headers', label: 'Envelope' }].map(tab => (
                                <button key={tab.id} onClick={() => setInspectorTab(tab.id as any)} className={`h-full text-[10px] font-black uppercase tracking-[0.2em] px-1 transition-all ${inspectorTab === tab.id ? 'text-white border-b-2 border-white' : 'text-slate-700 hover:text-slate-400'}`}>{tab.label}</button>
                              ))}
                            </div>
                          </header>

                          <div className={`flex-1 bg-[#fcfcfc] mx-0 sm:mx-12 my-6 sm:my-12 rounded-none sm:rounded-[2.5rem] overflow-hidden flex flex-col border border-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${isSmallScreen ? 'm-0 rounded-none' : ''}`}>
                            {inspectorTab === 'preview' && (
                              <iframe 
                                title="Forge Preview"
                                className="w-full h-full border-none" 
                                sandbox="allow-same-origin allow-popups"
                                srcDoc={wrapHtmlWithLinkHandler(selectedEmail.html_body || `<pre style="padding:80px;font-family:monospace;color:#0f172a;font-size:14px;line-height:1.8">${selectedEmail.text_body}</pre>`)} 
                              />
                            )}
                            {['html', 'text', 'headers'].includes(inspectorTab) && (
                              <div className="flex-1 bg-slate-950 p-12 overflow-auto font-mono text-[13px] leading-loose select-text custom-scrollbar">
                                <pre className="whitespace-pre-wrap text-slate-300 font-medium">
                                  {inspectorTab === 'html' ? selectedEmail.html_body : inspectorTab === 'text' ? selectedEmail.text_body : selectedEmail.raw_headers}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                          <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-800 shadow-2xl relative group">
                            <Mail size={40} className="text-slate-800 group-hover:scale-110 transition-transform" />
                            <div className="absolute -inset-1 bg-white/5 rounded-[2.8rem] -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.6em]">Forge Isolation Active</h2>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 p-10 md:p-20 overflow-y-auto custom-scrollbar bg-slate-950">
                    <div className="max-w-5xl mx-auto space-y-16">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-900">
                        <div>
                          <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-tight">Infrastructure Hub</h2>
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] leading-none">Virtual Environment: {selectedProject || 'GLOBAL'}</p>
                          </div>
                        </div>
                        <div className="px-6 py-3 bg-white text-slate-950 rounded-2xl flex items-center gap-4 w-fit shadow-2xl shadow-white/10 transition-transform hover:scale-105 active:scale-95 cursor-default">
                          <div className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Active Port: 1025</span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { label: 'SMTP Host', value: '127.0.0.1', icon: <Zap size={14} /> },
                          { label: 'Port', value: '1025', icon: <Settings size={14} /> },
                          { label: 'Username', value: selectedProject || 'any', icon: <User size={14} /> },
                          { label: 'Password', value: 'forgemail', icon: <LockIcon size={14} /> },
                          { label: 'Encryption', value: 'NONE / TLS', icon: <Shield size={14} /> }
                        ].map((c) => (
                          <div key={c.label} className="forge-card p-8 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">{c.icon}</div>
                            <span className="text-[9px] uppercase font-black text-slate-600 tracking-[0.3em]">{c.label}</span>
                            <div className="flex items-center justify-between gap-4">
                               <span className="text-sm text-white font-bold tracking-tight truncate">{c.value}</span>
                               <button onClick={() => copyToClipboard(c.value, `Copied ${c.label}`)} className="p-2 hover:bg-white hover:text-slate-950 rounded-xl transition-all"><Copy size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-10">
                        <div className="flex items-center gap-6 mb-12">
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] shrink-0">Integration Payload</h3>
                          <div className="h-[1px] bg-slate-900 flex-1" />
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mb-10">
                          {['Laravel', 'Flutter', 'Express', 'Python'].map(lang => (
                            <button key={lang} onClick={() => setTechType(lang)} className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${techType === lang ? 'bg-white text-slate-950 border-white shadow-2xl shadow-white/5' : 'bg-transparent text-slate-600 border-slate-900 hover:text-white hover:border-slate-700'}`}>{lang}</button>
                          ))}
                        </div>
                        
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 md:p-14 font-mono text-[13px] text-slate-300 leading-loose group relative shadow-2xl overflow-hidden min-h-[300px]">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                          <button className="absolute top-8 right-8 px-6 py-3 bg-white text-slate-950 rounded-2xl font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-2xl flex items-center gap-3" onClick={() => copyToClipboard(getFullConfigSnippet(techType, selectedProject), "Payload Captured")}><Copy size={14} /> Copy Code</button>
                          <pre className="whitespace-pre-wrap relative z-10 custom-scrollbar">
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
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-12 md:p-24">
              <div className="max-w-5xl mx-auto space-y-20 pb-32">
                <div className="text-center md:text-left">
                  <h2 className="text-5xl font-black text-white tracking-tighter mb-6 leading-tight">Quick Start</h2>
                  <div className="flex items-center gap-4 justify-center md:justify-start text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
                    <Zap size={14} className="text-white animate-pulse" /> Zero-Config Orchestration
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="bg-slate-900 border border-slate-800 p-12 rounded-[2.5rem] shadow-2xl group hover:border-white/10 transition-all">
                    <div className="w-16 h-16 bg-white rounded-[1.8rem] flex items-center justify-center text-slate-950 mb-10 shadow-2xl transition-transform hover:scale-110">
                      <Zap size={32} />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Isolation</h3>
                    <p className="text-[11px] text-slate-500 leading-loose font-medium">Capture all SMTP traffic instantly at <span className="text-white font-black">127.0.0.1:1025</span>. Perfect for local prototyping without external dependencies.</p>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 p-12 rounded-[2.5rem] shadow-2xl group hover:border-white/10 transition-all">
                    <div className="w-16 h-16 bg-white rounded-[1.8rem] flex items-center justify-center text-slate-950 mb-10 shadow-2xl transition-transform hover:scale-110">
                      <FolderOpen size={32} />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Project Silos</h3>
                    <p className="text-[11px] text-slate-500 leading-loose font-medium">Use unique <span className="text-white font-black">Usernames</span> to automatically route intercepted traffic into distinct infrastructure silos.</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-14 rounded-[3rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <HelpCircle size={100} />
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" /> Developer Support
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-loose font-medium mb-10 max-w-2xl">ForgeMail is high-performance infrastructure for professional developers. If you encounter anomalies or require technical escalation, please refer to the official documentation.</p>
                  <button onClick={() => openUrl('https://github.com/khayson/SMTP')} className="forge-button-primary px-10 py-4 rounded-2xl text-[10px] font-black shadow-2xl outline-none">Open Repository</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Precision Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Onboarding Modal (Forge Monochrome) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-6">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-900 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col animate-in zoom-in duration-700">
            <div className="p-16 text-center">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] mx-auto flex items-center justify-center text-slate-950 text-5xl font-black shadow-2xl shadow-white/10 mb-10 border-4 border-white/5 transition-transform hover:scale-110 active:scale-95 cursor-default">F</div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-4">ForgeMail</h1>
              <p className="text-[11px] text-slate-500 mb-12 uppercase tracking-[0.3em] font-black leading-relaxed max-w-[280px] mx-auto opacity-60">High-Performance SMTP Orchestration</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => { localStorage.setItem('forgemail_onboarding_complete', 'true'); setShowOnboarding(false); }}
                  className="w-full py-6 bg-white hover:bg-slate-200 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98]"
                >
                  Initialize Forge
                </button>
              </div>
            </div>
            <div className="bg-slate-900/50 p-6 text-center border-t border-slate-900">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Version 1.2.1 • Stable Infrastructure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
