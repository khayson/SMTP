import { Inbox, Star, Send, Trash2, Plus, Settings, User, MailCheck, FolderPlus, Layout } from "lucide-react";

interface FolderSidebarProps {
  projects: string[];
  selectedProject: string | null;
  setSelectedProject: (p: string | null) => void;
  selectedFolder: string;
  setSelectedFolder: (f: string) => void;
  favoriteSenders: [string, string][];
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  setIsComposeOpen: (val: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  isSmallScreen: boolean;
  setIsProjectModalOpen: (val: boolean) => void;
}

export default function FolderSidebar({
  projects,
  selectedProject,
  setSelectedProject,
  selectedFolder,
  setSelectedFolder,
  favoriteSenders,
  isSettingsOpen,
  setIsSettingsOpen,
  setIsComposeOpen,
  isSidebarOpen,
  isSmallScreen,
  setIsProjectModalOpen
}: FolderSidebarProps) {
  
  if (!isSidebarOpen && !isSmallScreen) return null;

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={18} /> },
    { id: 'starred', label: 'Starred', icon: <Star size={18} /> },
    { id: 'sent', label: 'Sent', icon: <Send size={18} /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 size={18} /> },
  ];

  return (
    <aside className={`w-[280px] bg-[var(--canvas)] border-r border-[var(--border)] flex flex-col shrink-0 z-20 h-full transition-all duration-300 ${isSmallScreen && !isSidebarOpen ? '-translate-x-full absolute' : 'translate-x-0'}`}>
      <div className="p-4 border-b border-[var(--border)] mb-4">
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="w-full py-3.5 bg-[var(--primary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-[#1877F2]/20 active:scale-95 transition-all text-[14px]"
        >
          <Plus size={18} /> Compose Mail
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {/* Main Folders */}
        <div className="mb-8">
           <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest px-3 mb-2 underline decoration-[var(--primary)]/30 decoration-2 underline-offset-4">Signals Workspace</h3>
           <div className="flex flex-col gap-0.5">
             {folders.map(f => (
               <button 
                key={f.id}
                onClick={() => { setSelectedFolder(f.id); setSelectedProject(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[14px] ${selectedFolder === f.id && !selectedProject ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-sm' : 'text-[#f8fafc] font-semibold hover:bg-[var(--surface)]'}`}
               >
                 <span className={selectedFolder === f.id && !selectedProject ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}>{f.icon}</span>
                 {f.label}
               </button>
             ))}
           </div>
        </div>

        {/* Dynamic Project Categories */}
        <div className="mb-8">
           <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">Isolation Folders</h3>
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="p-1 hover:bg-[var(--surface)] rounded-md text-[var(--primary)] transition-all"
                title="Create Workspace"
              >
                <FolderPlus size={14} />
              </button>
           </div>
           <div className="flex flex-col gap-0.5">
             <button 
                onClick={() => { setSelectedProject(""); setSelectedFolder('all'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[14px] ${selectedProject === "" ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-sm' : 'text-[#f8fafc] font-semibold hover:bg-[var(--surface)]'}`}
             >
                <Layout size={18} className={selectedProject === "" ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                <span>All Signals</span>
             </button>
             
             {projects.map(p => (
               <button 
                key={p}
                onClick={() => { setSelectedProject(p); if (selectedFolder === 'all') setSelectedFolder('inbox'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[14px] ${selectedProject === p ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-sm' : 'text-[#f8fafc] font-semibold hover:bg-[var(--surface)]'}`}
               >
                 <MailCheck size={18} className={selectedProject === p ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} />
                 <span className="truncate">{p}</span>
               </button>
             ))}
           </div>
        </div>

        {/* Favorite Contacts */}
        {favoriteSenders.length > 0 && (
          <div className="mb-8">
             <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest px-3 mb-2">Hotline Contacts</h3>
             <div className="flex flex-col gap-0.5">
               {favoriteSenders.map(([sender, count]) => (
                <button 
                  key={sender}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#f8fafc] font-semibold hover:bg-[var(--surface)] transition-all text-[13px] group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] shadow-sm text-[var(--primary)]">
                       <User size={14} />
                    </div>
                    <span className="truncate">{sender}</span>
                  </div>
                  <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                </button>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[var(--border)]">
         <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isSettingsOpen ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface)]'}`}
         >
           <Settings size={18} />
           <span className="text-[14px] font-bold">Studio Settings</span>
         </button>
         <div className="mt-4 px-3 flex items-center justify-between opacity-40 grayscale pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#f8fafc]">ForgeMail v1.3.1</span>
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
         </div>
      </div>

    </aside>
  );
}
