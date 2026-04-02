import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, Key, X, Settings } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [smtpPort, setSmtpPort] = useState<number>(1025);
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        try {
          const port = await invoke<string | null>("get_settings", { key: "smtp_port" });
          if (port) setSmtpPort(parseInt(port));
          const license = await invoke<string | null>("get_settings", { key: "license_key" });
          if (license) setLicenseKey(license);
        } catch (e) { 
          console.error("Failed to load settings:", e); 
        }
      };
      loadSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke("update_settings", { key: "smtp_port", value: smtpPort.toString() });
      await invoke("update_settings", { key: "license_key", value: licenseKey });
      onClose();
    } catch (error) {
      alert("Failed to save settings: " + error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-900 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in duration-500">
        
        <div className="px-12 py-10 border-b border-slate-900 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-white rounded-2xl text-slate-950 shadow-2xl">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase">Configuration</h2>
              <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1">ForgeMail v1.2.1 • Core Infrastructure</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all border border-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-12 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <section className="space-y-10">
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Network Environment (SMTP Port)</label>
                <div className="relative group">
                  <input 
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                    placeholder="1025"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-sm text-white focus:border-white/20 transition-all font-mono outline-none shadow-inner"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-lg text-slate-700 pointer-events-none group-focus-within:text-white transition-colors">
                    <Shield size={14} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 relative">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Infrastructure License</label>
                <div className="relative group">
                  <input 
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="FORGE-XXXX-XXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-sm text-white focus:border-white/20 transition-all uppercase tracking-[0.3em] font-black placeholder:tracking-normal outline-none shadow-inner"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-lg text-slate-700 pointer-events-none group-focus-within:text-white transition-colors">
                    <Key size={14} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex items-start gap-4">
              <div className="p-2 bg-white text-slate-950 rounded-lg">
                <Shield size={16} />
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-loose">
                Crucial: Changes to infrastructure network parameters require an environment restart to take effect.
              </p>
            </div>
          </section>
        </div>

        <div className="px-12 py-10 bg-slate-950 border-t border-slate-900 flex justify-between items-center">
          <button 
             onClick={() => openUrl('https://github.com/khayson/SMTP')}
             className="text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors"
          >
            v1.2.1 Stable
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="forge-button-primary px-10 py-4 rounded-2xl text-[10px] font-black shadow-2xl active:scale-95 transition-all outline-none"
            >
              {saving ? "REPLICATING..." : "COMMIT CHANGES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
