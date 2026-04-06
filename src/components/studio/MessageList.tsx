import { Search, RotateCcw, CheckCircle, Trash2, Star, Mail, Terminal, Copy, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { Email } from "../../types";

interface MessageListProps {
  selectedProject: string | null;
  filteredEmails: Email[];
  selectedEmail: Email | null;
  handleSelectEmail: (email: Email) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  markAllRead: () => void;
  fetchEmails: () => void;
  clearAll: () => void;
  toggleStar: (id: number) => void;
  handleDelete: (id: number) => void;
  selectedFolder: string;
  smtpPort: number;
}

export default function MessageList({
  selectedProject,
  filteredEmails,
  selectedEmail,
  handleSelectEmail,
  searchQuery,
  setSearchQuery,
  markAllRead,
  fetchEmails,
  clearAll,
  toggleStar,
  handleDelete,
  selectedFolder,
  smtpPort
}: MessageListProps) {
  const [showConnectInfo, setShowConnectInfo] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getAvatarColor = (name: string) => {
    const colors = ['bg-[#1877F2]', 'bg-[#1a237e]', 'bg-[#0d47a1]', 'bg-[#01579b]', 'bg-[#006064]'];
    const idx = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[idx];
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const getEmptyState = () => {
    switch (selectedFolder) {
      case 'starred':
        return { title: 'No Focus Signals', sub: 'Star signals to isolate critical flow patterns.', icon: <Star size={32} /> };
      case 'trash':
        return { title: 'Trash is Empty', sub: 'Signal archive is clean for this module.', icon: <Trash2 size={32} /> };
      default:
        return { title: 'No Signals Detected', sub: 'Deploy a test signal or connect your application.', icon: <Mail size={32} /> };
    }
  };

  const empty = getEmptyState();

  const creds = [
    { label: 'Host', value: '127.0.0.1', field: 'Host' },
    { label: 'Port', value: smtpPort.toString(), field: 'Port' },
    { label: 'User', value: selectedProject || 'default', field: 'User' },
    { label: 'Pass', value: 'any', field: 'Pass' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white select-none relative">
      {/* Search & Utility Bar */}
      <div className="p-4 border-b border-[#E4E6EB] shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65676B]" />
          <input 
            type="text" 
            placeholder="Search signals..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-[#F0F2F5] border-none rounded-full pl-9 pr-4 py-2 text-[13px] outline-none focus:ring-1 focus:ring-[#1877F2]/30 transition-all font-medium placeholder:text-[#65676B]" 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-black text-[#050505] uppercase tracking-[0.1em] truncate">
               {selectedFolder === 'trash' ? 'Archive' : selectedFolder === 'starred' ? 'Focus' : selectedProject || 'Main Workspace'}
            </span>
            <span className="text-[9px] text-[#1877F2] font-black bg-[#1877F2]/10 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{filteredEmails.length}</span>
            
            {(selectedFolder !== 'trash' && selectedFolder !== 'starred') && (
              <button 
                onClick={() => setShowConnectInfo(!showConnectInfo)}
                className={`ml-1 p-1 rounded-md transition-all ${showConnectInfo ? 'bg-[#1877F2] text-white' : 'text-[#1877F2] hover:bg-[#1877F2]/10'}`}
                title="View Credentials"
              >
                <Terminal size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={fetchEmails} className="p-1.5 text-[#65676B] hover:bg-[#F0F2F5] rounded-md transition-all" title="Refresh Feed"><RotateCcw size={14} /></button>
            <button onClick={markAllRead} className="p-1.5 text-[#65676B] hover:bg-[#F0F2F5] rounded-md transition-all" title="Mark All Read"><CheckCircle size={14} /></button>
            <button onClick={clearAll} className="p-1.5 text-[#65676B] hover:bg-red-50/80 hover:text-red-500 rounded-md transition-all" title="Purge Feed"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>

      {/* Quick Connect Dropdown Overlay */}
      {showConnectInfo && (
        <div className="absolute top-[95px] left-4 right-4 z-20 bg-white border border-[#E4E6EB] shadow-2xl rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <Terminal size={14} className="text-[#1877F2]" />
                 <span className="text-[11px] font-black text-[#050505] uppercase tracking-wider">Project Credentials</span>
              </div>
              <button onClick={() => setShowConnectInfo(false)} className="text-[#65676B] hover:text-[#050505] transition-all">
                 <X size={14} />
              </button>
           </div>
           <div className="grid grid-cols-2 gap-2">
              {creds.map(cred => (
                <div key={cred.field} className="bg-[#F0F2F5] p-2.5 rounded-xl border border-transparent hover:border-[#1877F2]/20 transition-all group relative">
                   <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-black text-[#65676B] uppercase tracking-tighter">{cred.label}</span>
                      <button 
                        onClick={() => handleCopy(cred.value, cred.field)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         {copied === cred.field ? <Check size={10} className="text-green-500" /> : <Copy size={10} className="text-[#1877F2]" />}
                      </button>
                   </div>
                   <div className="text-[12px] font-mono font-bold text-[#050505] truncate">{cred.value}</div>
                </div>
              ))}
           </div>
           <div className="mt-4 pt-4 border-t border-[#F0F2F5] flex flex-col gap-2">
              <p className="text-[9px] text-[#65676B] font-bold leading-tight">
                 Route all local signals to <span className="text-[#1877F2]">{selectedProject || 'default'}</span> isolation context.
              </p>
           </div>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {filteredEmails.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center px-8">
            <div className="w-20 h-20 bg-[#F0F2F5] rounded-[2rem] flex items-center justify-center text-[#BCC0C4] shadow-inner">
               {empty.icon}
            </div>
            <div>
              <p className="text-[14px] text-[#050505] font-extrabold tracking-tight mb-1">{empty.title}</p>
              <p className="text-[12px] text-[#65676B] font-semibold leading-relaxed max-w-[200px]">{empty.sub}</p>
            </div>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const initials = email.sender.substring(0, 2).toUpperCase();
            const isActive = selectedEmail?.id === email.id;

            return (
              <div 
                key={email.id} 
                onClick={() => handleSelectEmail(email)} 
                className={`group px-5 py-5 border-b border-[#F0F2F5] cursor-pointer transition-all relative flex gap-4 ${isActive ? 'bg-[#E7F3FF] border-l-[6px] border-l-[#1877F2]' : 'hover:bg-[#F0F2F5]/80 border-l-[6px] border-l-transparent'}`}
              >
                <div className={`shrink-0 w-12 h-12 rounded-2xl ${getAvatarColor(email.sender)} flex items-center justify-center text-white text-[15px] font-black shadow-lg shadow-[#1877F2]/10`}>
                  {initials}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className={`text-[14px] truncate transition-all ${!email.is_read ? 'font-black text-[#050505]' : 'font-bold text-[#65676B]'}`}>
                      {email.sender}
                    </span>
                    <span className="text-[11px] text-[#65676B] font-bold uppercase tracking-tighter opacity-60">
                      {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <h3 className={`text-[13px] truncate pr-8 ${!email.is_read ? 'font-extrabold text-[#050505]' : 'font-semibold text-[#8A8D91]'}`}>
                      {email.subject || '(No Subject)'}
                    </h3>
                  </div>
                  
                  <p className="text-[12px] text-[#65676B] truncate font-medium mt-1 leading-none opacity-80">
                    {email.text_body || 'Signal source carries no text preview'}
                  </p>
                </div>

                {/* Quick Actions overlay */}
                <div className="absolute right-4 bottom-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 scale-95 group-hover:scale-100">
                   <button 
                      onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                      className={`p-2 rounded-xl transition-all shadow-md active:scale-90 ${email.is_starred ? 'bg-white text-yellow-500 border border-yellow-100' : 'bg-white text-[#BCC0C4] hover:text-yellow-500 border border-[#E4E6EB]'}`}
                    >
                      <Star size={14} fill={email.is_starred ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(email.id); }}
                      className="p-2 bg-white text-[#BCC0C4] hover:text-red-500 border border-[#E4E6EB] rounded-xl shadow-md transition-all active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                </div>

                {!email.is_read && (
                  <div className="absolute right-2 top-2 w-2.5 h-2.5 rounded-full bg-[#1877F2] border-2 border-white shadow-sm" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
