import { useState } from "react";
import { 
  Zap, 
  Copy, 
  Sparkles, 
  PlayCircle, 
  Terminal,
  ShieldCheck,
  RefreshCw,
  Layout,
  Layers,
  ArrowRight,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";

interface HomeDashboardProps {
  helpSubTab: 'welcome' | 'integration' | 'whatsnew';
  setHelpSubTab: (tab: 'welcome' | 'integration' | 'whatsnew') => void;
  techType: string;
  setTechType: (type: string) => void;
  projects: string[];
  selectedProject: string | null;
  setSelectedProject: (p: string | null) => void;
  getFullConfigSnippet: (tech: string, project: string | null) => string;
  copyToClipboard: (text: string, msg: string) => void;
  openExternalLink: (url: string) => void;
  smtpPort: number;
}

export default function HomeDashboard({
  helpSubTab,
  setHelpSubTab,
  techType,
  setTechType,
  projects,
  selectedProject,
  setSelectedProject,
  getFullConfigSnippet,
  copyToClipboard,
  openExternalLink,
  smtpPort
}: HomeDashboardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const p = selectedProject || 'default';

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, `Copied ${label}`);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };
  
  const studioTabs = [
    { id: 'welcome', label: 'Welcome', icon: <Layout size={14} /> },
    { id: 'integration', label: 'Setup Guide', icon: <Terminal size={14} /> },
    { id: 'whatsnew', label: 'What\'s New', icon: <Sparkles size={14} /> }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white select-none">
      {/* Sub-navigation */}
      <div className="h-[50px] px-8 border-b border-[#E4E6EB] flex items-center gap-6 shrink-0 bg-white">
         {studioTabs.map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setHelpSubTab(tab.id as any)}
             className={`h-full flex items-center gap-2 text-[13px] font-bold transition-all relative ${helpSubTab === tab.id ? 'text-[#1877F2]' : 'text-[#65676B] hover:text-[#050505]'}`}
           >
             {tab.icon}
             <span>{tab.label}</span>
             {helpSubTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2] rounded-t-full" />
             )}
           </button>
         ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F0F2F5]">
        {helpSubTab === 'welcome' && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="mb-12 text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-extrabold text-[#050505] mb-4 tracking-tight">Focus on your code.</h1>
                <p className="text-[16px] text-[#65676B] font-medium leading-relaxed">ForgeMail Studio intercepts all outgoing signals from your development environment, isolation patterns guaranteed.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {[
                  { title: 'Project Isolation', desc: 'Separate mail flows between multiple apps using folders.', icon: <Layers className="text-[#1877F2]" size={24} />, color: 'bg-blue-50' },
                  { title: 'Smart Inspection', desc: 'Verify HTML, Source, and plain text within standard layouts.', icon: <Search className="text-purple-600" size={24} />, color: 'bg-purple-50' },
                  { title: 'Local Relay', desc: 'Zero external latency. Fast, secure, and always isolated.', icon: <Zap className="text-orange-500" size={24} />, color: 'bg-orange-50' }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-white border border-[#E4E6EB] rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                     <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                     <h4 className="text-[18px] font-bold text-[#050505] mb-2">{item.title}</h4>
                     <p className="text-[13px] text-[#65676B] leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
             </div>

             <div className="bg-white border border-[#E4E6EB] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group hover:border-[#1877F2]/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1877F2]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="w-full md:w-48 h-32 bg-gradient-to-br from-[#1877F2] to-[#00a3bf] rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-2 transition-transform">
                   <PlayCircle size={48} className="text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h4 className="text-[20px] font-bold text-[#050505] mb-2">Explore the Setup Guide</h4>
                   <p className="text-[14px] text-[#65676B] font-medium leading-relaxed mb-6">Learn how to connect your Laravel, Flutter, or Node.js applications in less than 30 seconds.</p>
                   <button 
                    onClick={() => setHelpSubTab('integration')}
                    className="px-8 py-3.5 bg-[#F0F2F5] text-[#050505] rounded-full font-bold text-[13px] hover:bg-[#1877F2] hover:text-white transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-sm"
                   >
                     Get Started <ArrowRight size={16} />
                   </button>
                </div>
             </div>
          </div>
        )}

        {helpSubTab === 'integration' && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-10">
                <h1 className="text-3xl font-extrabold text-[#050505] tracking-tight">Signal Configuration</h1>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 text-[13px] text-[#1877F2] hover:underline font-bold px-4 py-2 bg-white rounded-full border border-[#E4E6EB] shadow-sm"
                >
                  <RefreshCw size={14} /> Refresh Credentials
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10">
                <div className="space-y-6">
                   {/* SMTP Card - Premium Blue Theme */}
                   <div className="bg-[#1877F2] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                         <Terminal size={180} />
                      </div>
                      
                      <div className="flex items-center justify-between mb-10">
                         <div>
                            <h2 className="text-4xl font-black tracking-tight">SMTP</h2>
                            <p className="text-[13px] font-bold opacity-80 mt-1 uppercase tracking-widest">Local Signal Relay</p>
                         </div>
                         <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20"><Zap size={24} /></div>
                      </div>

                      <div className="space-y-4 font-bold border-t border-white/10 pt-8 mt-2">
                         {[
                           { label: 'Host', value: '127.0.0.1' },
                           { label: 'Port', value: smtpPort.toString() },
                           { label: 'User', value: p },
                           { label: 'Pass', value: 'any' },
                           { label: 'Auth', value: 'Standard' },
                           { label: 'Encryption', value: 'STARTTLS' }
                         ].map(row => (
                           <div key={row.label} className="grid grid-cols-[110px_1fr] items-center text-[14px]">
                              <span className="opacity-70 font-medium">{row.label}:</span>
                              <div className="flex items-center gap-2 group/copy">
                                 <span className="text-white truncate max-w-[200px]">{row.value}</span>
                                 {row.label !== 'Auth' && row.label !== 'Encryption' && (
                                   <button 
                                     onClick={() => handleCopy(row.value, row.label)}
                                     className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                                   >
                                     {copiedField === row.label ? <Check size={14} className="text-green-300" /> : <Copy size={13} className="opacity-40 group-hover/copy:opacity-100" />}
                                   </button>
                                 )}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center gap-4">
                      <ShieldCheck className="text-[#1877F2] shrink-0" size={24} />
                      <p className="text-[13px] text-[#1877F2] font-semibold leading-relaxed">Local-only environment. No mail ever leaves your machine unless explicitly relayed.</p>
                   </div>
                </div>

                <div className="bg-white border border-[#E4E6EB] rounded-[2.5rem] p-10 shadow-sm flex flex-col h-full">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                      <div>
                         <h2 className="text-[11px] font-black text-[#65676B] uppercase tracking-wider mb-2 ml-1">Tech Ecosystem</h2>
                         <div className="relative group">
                            <button className="bg-[#F0F2F5] px-6 py-2.5 rounded-full text-[13px] font-bold text-[#050505] flex items-center gap-3 hover:bg-[#E4E6EB] transition-all min-w-[140px] justify-between">
                               {techType} <ChevronDown size={14} />
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E4E6EB] rounded-2xl shadow-2xl py-2 invisible group-hover:visible z-[100] transition-all">
                               {['Laravel', 'Flutter', 'Node.js', 'Python', 'Go'].map(lang => (
                                 <button 
                                   key={lang} 
                                   onClick={() => setTechType(lang)}
                                   className="w-full text-left px-5 py-3 text-[13px] text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1877F2] transition-all font-bold"
                                 >
                                   {lang}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div>
                         <h2 className="text-[11px] font-black text-[#65676B] uppercase tracking-wider mb-2 ml-1">Active Workspace</h2>
                         <div className="relative group">
                            <button className="bg-[#F0F2F5] px-6 py-2.5 rounded-full text-[13px] font-bold text-[#1877F2] flex items-center gap-3 hover:bg-[#E4E6EB] transition-all min-w-[160px] justify-between border border-[#1877F2]/10">
                               <div className="flex items-center gap-2">
                                  <Layers size={14} />
                                  <span className="truncate max-w-[100px]">{selectedProject || 'Default'}</span>
                               </div>
                               <ChevronDown size={14} />
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#E4E6EB] rounded-2xl shadow-2xl py-2 invisible group-hover:visible z-[100] transition-all max-h-[300px] overflow-y-auto custom-scrollbar">
                               <button 
                                 onClick={() => setSelectedProject(null)}
                                 className="w-full text-left px-5 py-3 text-[13px] text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1877F2] transition-all font-bold flex items-center gap-2"
                               >
                                 <Layout size={14} /> Default
                               </button>
                               {projects.map(project => (
                                 <button 
                                   key={project} 
                                   onClick={() => setSelectedProject(project)}
                                   className={`w-full text-left px-5 py-3 text-[13px] transition-all font-bold flex items-center gap-2 ${selectedProject === project ? 'text-[#1877F2] bg-[#E7F3FF]' : 'text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1877F2]'}`}
                                 >
                                   <Layers size={14} /> {project}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 bg-[#F0F2F5] border border-[#E4E6EB] rounded-[2rem] p-10 font-mono text-[14px] text-[#050505] relative group shadow-inner overflow-hidden">
                      <div className="absolute top-6 right-6 z-10">
                          <button 
                            onClick={() => handleCopy(getFullConfigSnippet(techType, selectedProject), "Integration snippet captured")}
                            className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl border border-[#E4E6EB] flex items-center gap-2 ${copiedField === 'Integration snippet captured' ? 'bg-green-500 text-white' : 'bg-white text-[#1877F2]'}`}
                          >
                            {copiedField === 'Integration snippet captured' ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                      </div>
                      <div className="custom-scrollbar overflow-x-auto whitespace-pre leading-loose font-medium opacity-80 h-full">
                         {getFullConfigSnippet(techType, selectedProject)}
                      </div>
                   </div>
                   
                   <p className="mt-6 text-[12px] text-[#65676B] font-medium text-center">Refer to <span onClick={() => openExternalLink("https://github.com/khayson/SMTP")} className="text-[#1877F2] hover:underline cursor-pointer">Studio Documentation</span> for custom ports and relay patterns.</p>
                </div>
             </div>
          </div>
        )}

        {helpSubTab === 'whatsnew' && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
             <div className="bg-white border border-[#E4E6EB] p-16 rounded-[3rem] shadow-sm relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] animate-pulse shadow-[0_0_10px_#1877F2]" />
                      <span className="text-[12px] font-bold text-[#1877F2] uppercase tracking-[0.2em]">Flagship Version Update</span>
                   </div>
                   <h3 className="text-5xl font-extrabold text-[#050505] tracking-tight leading-tight">Studio 1.2.5 <br/> Clean Modern Evolution</h3>
                   <p className="text-[16px] text-[#65676B] leading-relaxed font-medium">We've completed the transition to a high-fidelity light theme, re-engineered the 3-column desktop layout, and introduced persistent 'Signals' folder state for total project isolation.</p>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div className="p-6 bg-[#F0F2F5] rounded-[1.5rem] border border-[#E4E6EB]">
                         <Layout size={24} className="text-[#1877F2] mb-4" />
                         <p className="text-[14px] text-[#050505] font-bold">Responsive 3-Column Architecture</p>
                      </div>
                      <div className="p-6 bg-[#F0F2F5] rounded-[1.5rem] border border-[#E4E6EB]">
                         <Layers size={24} className="text-[#1877F2] mb-4" />
                         <p className="text-[14px] text-[#050505] font-bold">Project Isolation Folders</p>
                      </div>
                   </div>
                </div>
                <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 h-80 bg-[#1877F2]/5 rounded-full blur-3xl pointer-events-none" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-10 bg-white border border-[#E4E6EB] rounded-[2.5rem] shadow-sm">
                   <h4 className="text-[18px] font-bold text-[#050505] mb-4">Hotline Favorites</h4>
                   <p className="text-[14px] text-[#65676B] font-medium leading-relaxed">Dynamic contact list that tracks your most frequent signal senders for rapid access.</p>
                </div>
                <div className="p-10 bg-white border border-[#E4E6EB] rounded-[2.5rem] shadow-sm">
                   <h4 className="text-[18px] font-bold text-[#050505] mb-4">Trash & Stars</h4>
                   <p className="text-[14px] text-[#65676B] font-medium leading-relaxed">Full persistence for message organization. Organize by priority or discard with focus.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
