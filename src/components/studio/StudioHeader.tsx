import { Home, Signal, Settings, Search } from "lucide-react";

interface StudioHeaderProps {
  workbenchTab: 'welcome' | 'signals';
  setWorkbenchTab: (tab: 'welcome' | 'signals') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  setIsComposeOpen: (val: boolean) => void;
}

export default function StudioHeader({ 
  workbenchTab, 
  setWorkbenchTab,
  searchQuery,
  setSearchQuery,
  isSettingsOpen,
  setIsSettingsOpen,
  setIsComposeOpen
}: StudioHeaderProps) {
  
  const tabs = [
    { id: 'welcome', label: 'Home', icon: <Home size={16} /> },
    { id: 'signals', label: 'Signals', icon: <Signal size={16} /> },
  ];

  return (
    <header className="h-[60px] bg-[var(--surface)] flex items-center px-6 gap-8 shrink-0 z-50 border-b border-[var(--border)] shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
         <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-black text-[18px] shadow-lg shadow-[#1877F2]/20">F</div>
         <span className="text-[16px] font-bold text-[#f8fafc] tracking-tight hidden md:block select-none">ForgeMail Studio</span>
      </div>

      {/* Tabs */}
      <nav className="flex items-center h-full">
         {tabs.map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setWorkbenchTab(tab.id as any)}
             className={`h-full flex items-center gap-2 px-6 text-[14px] font-bold transition-all relative ${workbenchTab === tab.id ? 'text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[#f8fafc] hover:bg-white/5'}`}
           >
             {tab.icon}
             <span className="hidden sm:inline">{tab.label}</span>
             {workbenchTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] rounded-t-full shadow-[0_-4px_10px_rgba(24,119,242,0.3)]" />
             )}
           </button>
         ))}
      </nav>
      
      {/* Universal Search & Profile */}
      <div className="flex-1 flex justify-end items-center gap-4">
        <div className="relative group hidden lg:block">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
           <input 
            type="text" 
            placeholder="Universal search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-[var(--canvas)] border border-[var(--border)] rounded-full pl-9 pr-4 py-2 text-[13px] text-[#f8fafc] placeholder:text-[var(--muted)] focus:border-[var(--primary)] outline-none transition-all"
           />
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsComposeOpen(true)}
             className="bg-[var(--primary)] hover:brightness-110 text-white px-4 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#1877F2]/20"
           >
             Compose
           </button>
           <div className="h-6 w-[1px] bg-[var(--border)] mx-1" />
           <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 text-[var(--muted)] hover:text-[#f8fafc] hover:bg-white/5 rounded-full transition-all"
           >
              <Settings size={18} />
           </button>
        </div>
      </div>
    </header>
  );
}
