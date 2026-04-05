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
    <aside className={`w-[280px] bg-[#F0F2F5] border-r border-[#E4E6EB] flex flex-col shrink-0 z-20 h-full transition-all duration-300 ${isSmallScreen && !isSidebarOpen ? '-translate-x-full absolute' : 'translate-x-0'}`}>
      <div className="p-4 border-b border-[#E4E6EB] mb-4">
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="w-full py-3.5 bg-[#1877F2] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-blue-500/10 active:scale-95 transition-all text-[14px]"
        >
          <Plus size={18} /> Compose Mail
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {/* Main Folders */}
        <div className="mb-8">
           <h3 className="text-[11px] font-bold text-[#65676B] uppercase tracking-widest px-3 mb-2 underline decoration-[#1877F2]/30 decoration-2 underline-offset-4">Signals Workspace</h3>
           <div className="flex flex-col gap-0.5">
             {folders.map(f => (
               <button 
                key={f.id}
                onClick={() => { setSelectedFolder(f.id); setSelectedProject(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[14px] ${selectedFolder === f.id && !selectedProject ? 'bg-[#E7F3FF] text-[#1877F2] font-bold shadow-sm' : 'text-[#050505] font-semibold hover:bg-[#E4E6EB]'}`}
               >
                 <span className={selectedFolder === f.id && !selectedProject ? 'text-[#1877F2]' : 'text-[#65676B]'}>{f.icon}</span>
                 {f.label}
               </button>
             ))}
           </div>
        </div>

        {/* Dynamic Project Categories */}
        <div className="mb-8">
           <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[11px] font-bold text-[#65676B] uppercase tracking-widest">Isolation Folders</h3>
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="p-1 hover:bg-[#E4E6EB] rounded-md text-[#1877F2] transition-all"
                title="Create Workspace"
              >
                <FolderPlus size={14} />
              </button>
           </div>
           <div className="flex flex-col gap-0.5">
             <button 
                onClick={() => { setSelectedProject(""); setSelectedFolder('all'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[14px] ${selectedProject === "" ? 'bg-[#E7F3FF] text-[#1877F2] font-bold shadow-sm' : 'text-[#050505] font-semibold hover:bg-[#E4E6EB]'}`}
             >
                <Layout size={18} className={selectedProject === "" ? 'text-[#1877F2]' : 'text-[#65676B]'} />
                <span>All Signals</span>
             </button>
             
             {projects.map(p => (
               <button 
                key={p}
                onClick={() => { setSelectedProject(p); if (selectedFolder === 'all') setSelectedFolder('inbox'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[14px] ${selectedProject === p ? 'bg-[#E7F3FF] text-[#1877F2] font-bold shadow-sm' : 'text-[#050505] font-semibold hover:bg-[#E4E6EB]'}`}
               >
                 <MailCheck size={18} className={selectedProject === p ? 'text-[#1877F2]' : 'text-[#65676B]'} />
                 <span className="truncate">{p}</span>
               </button>
             ))}
           </div>
        </div>

        {/* Favorite Contacts */}
        {favoriteSenders.length > 0 && (
          <div className="mb-8">
             <h3 className="text-[11px] font-bold text-[#65676B] uppercase tracking-widest px-3 mb-2">Hotline Contacts</h3>
             <div className="flex flex-col gap-0.5">
               {favoriteSenders.map(([sender, count]) => (
                <button 
                  key={sender}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#050505] font-semibold hover:bg-[#E4E6EB] transition-all text-[13px] group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#E4E6EB] flex items-center justify-center text-[10px] shadow-sm text-[#1877F2]">
                       <User size={14} />
                    </div>
                    <span className="truncate">{sender}</span>
                  </div>
                  <span className="text-[10px] bg-[#1877F2]/10 text-[#1877F2] px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                </button>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[#E4E6EB]">
         <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isSettingsOpen ? 'bg-[#E7F3FF] text-[#1877F2]' : 'text-[#65676B] hover:bg-[#E4E6EB]'}`}
         >
           <Settings size={18} />
           <span className="text-[14px] font-bold">Studio Settings</span>
         </button>
         <div className="mt-4 px-3 flex items-center justify-between opacity-40 grayscale pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#050505]">ForgeMail v1.3.1</span>
            <div className="w-2 h-2 rounded-full bg-[#1877F2] animate-pulse" />
         </div>
      </div>

    </aside>
  );
}
