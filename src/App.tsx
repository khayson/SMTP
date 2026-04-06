import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { openUrl } from "@tauri-apps/plugin-opener";

// Studio Components
import StudioHeader from "./components/studio/StudioHeader";
import FolderSidebar from "./components/studio/FolderSidebar";
import HomeDashboard from "./components/studio/HomeDashboard";
import MessageList from "./components/studio/MessageList";
import EmailInspector from "./components/studio/EmailInspector";
import ComposeModal from "./components/studio/ComposeModal";
import SettingsModal from "./components/SettingsModal";
import { SmtpError } from "./components/studio/Feedback";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  Drawer,
  DrawerContent,
} from "./components/ui/drawer";
import CreateProjectModal from "./components/studio/CreateProjectModal";

import { Email } from "./types";

function App() {
  // --- Core Workspace State ---
  const [emails, setEmails] = useState<Email[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("inbox");
  const [favoriteSenders, setFavoriteSenders] = useState<[string, string][]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // --- UI Module States ---
  const [workbenchTab, setWorkbenchTab] = useState<'welcome' | 'signals'>('signals');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'preview' | 'source' | 'text' | 'headers' | 'info'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- HomeDashboard Module States ---
  const [helpSubTab, setHelpSubTab] = useState<'welcome' | 'integration' | 'whatsnew'>('welcome');
  const [techType, setTechType] = useState<string>('Laravel');

  // --- System States ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [smtpPort, setSmtpPort] = useState<number>(1025);

  // --- Data Synchronization ---
  const fetchEmails = async () => {
    try {
      const data: Email[] = await invoke("get_emails", { 
        projectId: selectedProject,
        folder: selectedFolder === 'all' ? null : selectedFolder 
      });
      setEmails(data);
    } catch (error) { console.error("Fetch Error:", error); }
  };

  const fetchProjects = async () => {
    try {
      const data: string[] = await invoke("get_projects");
      setProjects(data);
    } catch (error) { console.error("Projects Error:", error); }
  };

  const fetchFavoriteSenders = async () => {
    try {
      const data: [string, string][] = await invoke("get_favorite_senders");
      setFavoriteSenders(data);
    } catch (error) { console.error("Hotlines Error:", error); }
  };

  useEffect(() => {
    fetchEmails();
    fetchProjects();
    fetchFavoriteSenders();

    const loadGlobalSettings = async () => {
      try {
        const port = await invoke<string | null>("get_settings", { key: "smtp_port" });
        if (port) setSmtpPort(parseInt(port));
      } catch (e) { console.error("Global Settings Load Error:", e); }
    };
    loadGlobalSettings();
  }, [selectedProject, selectedFolder]);

  useEffect(() => {
    const unlistenError = listen<string>("smtp-error", (event) => {
      setSmtpError(event.payload);
      toast.error(`SMTP: ${event.payload}`);
    });
    const unlistenEmail = listen<Email>("new-email", (event) => {
      console.log("New Signal Inbound:", event.payload);
      fetchEmails();
      fetchProjects();
      fetchFavoriteSenders();
      toast.info("New Signal Detected");
    });
    return () => {
      unlistenError.then(f => f());
      unlistenEmail.then(f => f());
    };
  }, [selectedProject, selectedFolder]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Core Lifecycle ---
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) { setUpdateInfo(update); setShowUpdateModal(true); }
      } catch (e) { console.warn("Update check bypassed"); }
    };
    checkForUpdates();
  }, []);

  // --- Signal Actions ---
  const handleDelete = async (id: number) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;

    try {
      if (email.folder === 'trash') {
        // Permanent delete
        await invoke("delete_email", { id });
        setEmails(prev => prev.filter(e => e.id !== id));
        toast.warning("Signal Permanently Purged");
      } else {
        // Move to trash
        await invoke("move_to_trash", { id });
        setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'trash' } : e));
        toast.info("Moved to Signal Archive");
      }
      if (selectedEmail?.id === id) setSelectedEmail(null);
      fetchEmails();
    } catch (error) { console.error(error); }
  };

  const restoreEmail = async (id: number) => {
    try {
      // In db.rs move_to_trash sets folder='trash'. 
      // We can use a similar command or update_settings/lib.rs function to move back to inbox.
      // For now, let's assume move_to_trash can be reused or we create a move_to_inbox.
      // Since move_to_inbox isn't in lib.rs, I'll add it or use update_settings if appropriate.
      // Wait, I should check if move_to_folder exists. It doesn't.
      // I'll stick to move_to_trash for now and maybe add move_to_inbox to lib.rs?
      // Actually, I'll just use mark_as_unread or something? No.
      // I'll add move_to_folder to lib.rs and db.rs for full flexibility.
      await invoke("restore_email", { id });
      fetchEmails();
      toast.success("Signal Restored to Workspace");
    } catch (error) { console.error(error); }
  };

  const toggleStar = async (id: number) => {
    try {
      await invoke("toggle_star", { id });
      fetchEmails();
      toast.success("Focus Pattern Updated");
    } catch (error) { console.error(error); }
  };

  const markAllRead = async () => {
    try {
      await invoke("mark_all_as_read", { projectId: selectedProject || "" });
      fetchEmails();
      toast.info("Workspace Marked Read");
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    // V1.2.5 "Soft Reset": Immediate execution for faster developer loop
    try {
      await invoke("clear_emails");
      fetchEmails();
      setSelectedEmail(null);
      toast.error("Signal Archive Purged");
    } catch (error) { console.error(error); }
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      try {
        await invoke("mark_as_read", { id: email.id });
        fetchEmails();
      } catch (error) { console.error(error); }
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    if (!text) {
      toast.warning("Nothing to copy!");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast.success(message);
    }).catch(err => {
      console.error("Clipboard Error:", err);
      toast.error("Clipboard access denied");
    });
  };

  const openExternalLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch (error) {
      console.error("Failed to open link:", error);
      toast.error("Unable to open browser");
    }
  };

  const handleRestartServer = async (newPort: number) => {
    try {
      await invoke("restart_smtp_server", { port: newPort });
      setSmtpPort(newPort);
      toast.success(`SMTP Server active on port ${newPort}`);
    } catch (error) {
      console.error("Server Restart Fail:", error);
      toast.error(`Failed to restart on port ${newPort}`);
    }
  };

  const wrapHtmlWithLinkHandler = (html: string) => {
    const cleanedHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "<!-- Script Blocked -->");
    const meta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: *; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;">`;
    const base = `<base target="_blank">`;
    const script = `
      <script>
        document.addEventListener('click', function(e) {
          const target = e.target.closest('a');
          if (target && target.href) {
            e.preventDefault();
            window.parent.postMessage({ type: 'open-link', url: target.href }, '*');
          }
        });
      </script>
    `;
    return meta + base + script + cleanedHtml;
  };

  const getFullConfigSnippet = (tech: string, project: string | null) => {
    const p = project || 'default';
    const t = tech.toLowerCase().trim();
    const port = smtpPort;
    
    switch (t) {
      case 'laravel': return `MAIL_MAILER=smtp\nMAIL_HOST=127.0.0.1\nMAIL_PORT=${port}\nMAIL_USERNAME=${p}\nMAIL_PASSWORD=any`;
      case 'flutter': return `final smtpServer = SmtpServer('127.0.0.1', port: ${port}, username: '${p}', password: 'any');`;
      case 'node.js':
      case 'nodejs': 
        return `const transport = nodemailer.createTransport({ \n  host: "127.0.0.1", \n  port: ${port}, \n  auth: { user: "${p}", pass: "any" } \n});`;
      case 'python': return `SMTP_HOST = "127.0.0.1"\nSMTP_PORT = ${port}\nSMTP_USER = "${p}"\nSMTP_PASS = "any"`;
      case 'go': 
      case 'golang':
        return `// Using net/smtp\nauth := smtp.PlainAuth("", "${p}", "any", "127.0.0.1")\nerr := smtp.SendMail("127.0.0.1:${port}", auth, from, to, msg)`;
      default: return `// Config for ${tech} coming soon...`;
    }
  };

  const filteredEmails = emails.filter(e =>
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSmallScreen = windowWidth < 1024;

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-[#050505] font-sans selection:bg-[#1877F2]/20 overflow-hidden select-none">
      
      {/* Studio Navigation & Headers */}
      <StudioHeader 
        workbenchTab={workbenchTab} 
        setWorkbenchTab={setWorkbenchTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsComposeOpen={setIsComposeOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <FolderSidebar 
          projects={projects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          favoriteSenders={favoriteSenders}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          setIsComposeOpen={setIsComposeOpen}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isSmallScreen={isSmallScreen}
          setIsProjectModalOpen={setIsProjectModalOpen}
        />

        {/* Dynamic Studio Workspace */}
        <main className="flex-1 flex overflow-hidden min-w-0 bg-white">
          {workbenchTab === 'signals' ? (
            <div className="flex-1 flex overflow-hidden">
               {/* 3-Column Layout: List View */}
               <div className="w-full lg:w-[400px] border-r border-[#E4E6EB] flex flex-col h-full shrink-0">
                  <MessageList 
                    selectedProject={selectedProject}
                    filteredEmails={filteredEmails}
                    selectedEmail={selectedEmail}
                    handleSelectEmail={handleSelectEmail}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    markAllRead={markAllRead}
                    fetchEmails={fetchEmails}
                    clearAll={clearAll}
                    toggleStar={toggleStar}
                    handleDelete={handleDelete}
                    selectedFolder={selectedFolder}
                    smtpPort={smtpPort}
                  />
               </div>

               {/* Desktop Fixed Detail View / Mobile Drawer */}
               {isSmallScreen ? (
                 <Drawer 
                    open={!!selectedEmail} 
                    onOpenChange={(open) => !open && setSelectedEmail(null)}
                    direction="right"
                  >
                    <DrawerContent className="w-full border-l border-[#E4E6EB] bg-white">
                      <EmailInspector 
                        selectedEmail={selectedEmail}
                        setSelectedEmail={setSelectedEmail}
                        inspectorTab={inspectorTab}
                        setInspectorTab={setInspectorTab}
                        previewDevice={previewDevice}
                        setPreviewDevice={setPreviewDevice}
                        handleDelete={handleDelete}
                        restoreEmail={restoreEmail}
                        copyToClipboard={copyToClipboard}
                        wrapHtmlWithLinkHandler={wrapHtmlWithLinkHandler}
                        openExternalLink={openExternalLink}
                        isSmallScreen={true}
                      />
                    </DrawerContent>
                  </Drawer>
               ) : (
                 <div className="flex-1 min-w-0 bg-[#F0F2F5] p-6 overflow-auto custom-scrollbar">
                    <EmailInspector 
                      selectedEmail={selectedEmail}
                      setSelectedEmail={setSelectedEmail}
                      inspectorTab={inspectorTab}
                      setInspectorTab={setInspectorTab}
                      previewDevice={previewDevice}
                      setPreviewDevice={setPreviewDevice}
                      handleDelete={handleDelete}
                      restoreEmail={restoreEmail}
                      copyToClipboard={copyToClipboard}
                      wrapHtmlWithLinkHandler={wrapHtmlWithLinkHandler}
                      openExternalLink={openExternalLink}
                      isSmallScreen={false}
                    />
                 </div>
               )}
            </div>
          ) : (
            <HomeDashboard 
              helpSubTab={helpSubTab}
              setHelpSubTab={setHelpSubTab}
              techType={techType}
              setTechType={setTechType}
              projects={projects}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              getFullConfigSnippet={getFullConfigSnippet}
              copyToClipboard={copyToClipboard}
              openExternalLink={openExternalLink}
              smtpPort={smtpPort}
            />
          )}
        </main>
      </div>

      {/* Flagship Studio Utilities */}
      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        fetchEmails={fetchEmails} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        smtpPort={smtpPort}
        onRestartServer={handleRestartServer}
      />

      <CreateProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        fetchProjects={fetchProjects}
      />

      <SmtpError error={smtpError} onClear={() => setSmtpError(null)} />
      <ToastContainer position="bottom-right" autoClose={2500} theme="light" />

      {showUpdateModal && updateInfo && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#050505]/40 backdrop-blur-md p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-lg bg-white border border-[#E4E6EB] rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-extrabold text-[#050505] tracking-tight mb-2">Studio Update</h2>
            <p className="text-[10px] text-[#1877F2] uppercase tracking-[0.2em] font-black mb-8">Version {updateInfo.version}</p>
            <div className="bg-[#F0F2F5] rounded-2xl p-6 border border-transparent mb-8 text-[13px] text-[#65676B] font-semibold leading-relaxed">
              {updateInfo.body || "Performance optimizations and Clean Modern architecture overhaul."}
            </div>
            <div className="flex gap-4">
               <button 
                 disabled={isDownloadingUpdate} 
                 onClick={async () => {
                   setIsDownloadingUpdate(true);
                   try { await updateInfo.downloadAndInstall(); await relaunch(); } 
                   catch (e) { toast.error("Update failed."); setIsDownloadingUpdate(false); }
                 }}
                 className="flex-1 bg-[#1877F2] text-white py-4 rounded-2xl text-[14px] font-extrabold shadow-lg shadow-[#1877F2]/20 active:scale-95 transition-all"
               >
                 {isDownloadingUpdate ? "Installing..." : "Launch Update"}
               </button>
               <button onClick={() => setShowUpdateModal(false)} className="px-10 py-4 bg-[#F0F2F5] text-[#65676B] rounded-2xl text-[14px] font-extrabold hover:bg-[#E4E6EB] transition-all">Later</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
