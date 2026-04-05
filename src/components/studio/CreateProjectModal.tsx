import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, FolderPlus, Terminal, Shield, Copy, Check, Layout, Hash } from "lucide-react";
import { toast } from "react-toastify";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchProjects: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, fetchProjects }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Auto-generate ID from Name
  useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
      setId(slug);
    }
  }, [name]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id) return;

    setLoading(true);
    try {
      await invoke("create_project", { 
        name, 
        id, 
        description: description || null 
      });
      toast.success(`Workspace "${name}" Ready`);
      fetchProjects();
      onClose();
      // Reset form
      setName("");
      setId("");
      setDescription("");
    } catch (error) {
      toast.error(`Architecture Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#050505]/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-4xl max-h-[85vh] bg-white border border-[#E4E6EB] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col sm:flex-row animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Section: Form & Action */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Header */}
            <div className="px-8 sm:px-10 py-6 border-b border-[#E4E6EB] flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#1877F2] to-[#0D5FDA] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <FolderPlus size={22} />
                    </div>
                    <div>
                        <h2 className="text-[17px] font-black text-[#050505] tracking-tight leading-tight">Create Workspace</h2>
                        <p className="text-[10px] text-[#65676B] font-bold uppercase tracking-widest mt-0.5">Initialize Development Folder</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-[#F0F2F5] rounded-full text-[#65676B] transition-all group active:scale-90 sm:hidden">
                    <X size={20} />
                </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-10">
                <form onSubmit={handleCreate} id="project-form-v2" className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-[#050505] uppercase tracking-wider ml-1 flex items-center gap-2">
                            <Layout size={12} className="text-[#1877F2]" /> Workspace Display Name
                        </label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Production API"
                            className="w-full bg-[#F0F2F5] border-2 border-transparent rounded-xl px-5 py-3.5 text-[14px] font-bold text-[#050505] placeholder-[#8D949E] focus:bg-white focus:border-[#1877F2] transition-all outline-none"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-[#050505] uppercase tracking-wider ml-1 flex items-center gap-2">
                            <Hash size={12} className="text-[#1877F2]" /> Project ID (Slug)
                        </label>
                        <div className="relative">
                            <input 
                                value={id}
                                onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                placeholder="production_api"
                                className="w-full bg-[#F0F2F5] border-2 border-transparent rounded-xl px-5 py-3.5 text-[14px] font-mono font-bold text-[#1877F2] focus:bg-white focus:border-[#1877F2] transition-all outline-none"
                                required
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#65676B] bg-[#E4E6EB]/50 px-2 py-1 rounded-md uppercase tracking-tighter">SMTP USER</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-[#65676B] uppercase tracking-wider ml-1 flex items-center gap-2">
                            <Shield size={12} /> Workspace Description
                        </label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Internal notes for this signal environment..."
                            rows={2}
                            className="w-full bg-[#F0F2F5] border-2 border-transparent rounded-xl px-5 py-3.5 text-[13px] font-semibold text-[#050505] focus:bg-white focus:border-[#1877F2] transition-all outline-none resize-none"
                        />
                    </div>
                </form>
            </div>

            {/* Action Footer */}
            <div className="px-8 sm:px-10 py-6 bg-[#F9FAFB] border-t border-[#E4E6EB] flex justify-end items-center gap-4 shrink-0">
                <button onClick={onClose} className="px-5 py-3 text-[#65676B] hover:text-[#050505] text-[14px] font-bold transition-all">Cancel</button>
                <button 
                    type="submit"
                    form="project-form-v2"
                    disabled={loading || !name || !id}
                    className="bg-[#1877F2] text-white px-8 py-3.5 rounded-xl text-[14px] font-black shadow-lg shadow-blue-500/15 hover:bg-[#166fe5] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:grayscale disabled:scale-100"
                >
                    {loading ? "Initializing..." : "Register Workspace"}
                    <FolderPlus size={16} />
                </button>
            </div>
        </div>

        {/* Right Section: Connection Guide */}
        <div className="hidden sm:flex w-[340px] bg-[#F7F8F9] border-l border-[#E4E6EB] flex-col overflow-hidden">
            <div className="px-8 py-7 bg-white/50 border-b border-[#E4E6EB]">
                <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-[#050505]" />
                    <h3 className="text-[12px] font-black text-[#050505] uppercase tracking-wider">Blueprint</h3>
                </div>
            </div>
            
            <div className="flex-1 p-8 space-y-6">
                <p className="text-[11px] text-[#65676B] font-bold leading-relaxed uppercase tracking-wide opacity-80">
                    Integration Credentials
                </p>

                <div className="space-y-3">
                    {[
                        { label: 'Host', value: '127.0.0.1', field: 'host' },
                        { label: 'Port', value: '1025', field: 'port' },
                        { label: 'Username', value: id || '?', field: 'user', special: true },
                        { label: 'Password', value: 'any', field: 'pass' }
                    ].map(cred => (
                        <div key={cred.field} className="bg-white p-3.5 rounded-xl border border-[#E4E6EB] group transition-all hover:border-[#1877F2]/30 shadow-sm">
                            <span className="text-[8px] font-black text-[#BCC0C4] uppercase tracking-[0.2em]">{cred.label}</span>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className={`text-[13px] font-mono font-bold ${cred.special ? 'text-[#1877F2]' : 'text-[#050505]'}`}>
                                    {cred.value}
                                </span>
                                <button 
                                    onClick={() => handleCopy(cred.value, cred.field)}
                                    className="p-1.5 hover:bg-[#F0F2F5] rounded-md transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {copied === cred.field ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-[#8D949E]" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-600/5 border border-blue-600/10 p-5 rounded-2xl">
                    <div className="flex items-start gap-3">
                        <Shield size={14} className="text-[#1877F2] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#1877F2] font-bold leading-relaxed">
                            Isolation Mode: Every project ID routes signals to a dedicated workspace folder.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8 border-t border-[#E4E6EB]">
                <button onClick={onClose} className="w-full py-3 bg-white border border-[#E4E6EB] rounded-xl text-[12px] font-bold text-[#65676B] hover:bg-[#F9FAFB] transition-all active:scale-95">
                    Close Blueprint
                </button>
            </div>
        </div>

        {/* Global Exit */}
        <button 
           onClick={onClose}
           className="absolute top-6 right-6 p-4 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md hidden sm:flex transition-all"
        >
            <X size={24} />
        </button>
      </div>
    </div>
  );
}
