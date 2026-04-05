import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, Key, X, Settings, RefreshCw } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [smtpPort, setSmtpPort] = useState<number>(1025);
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#050505]/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      <div ref={modalRef} className="w-full max-w-lg max-h-[90vh] bg-white border border-[#E4E6EB] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-6 sm:px-10 py-5 sm:py-8 border-b border-[#E4E6EB] flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F0F2F5] rounded-2xl flex items-center justify-center text-[#1877F2] shadow-sm">
              <Settings size={20} className="sm:w-[22px]" />
            </div>
            <div>
              <h2 className="text-[16px] sm:text-[18px] font-extrabold text-[#050505] tracking-tight">Studio settings</h2>
              <p className="text-[11px] sm:text-[12px] text-[#65676B] font-bold uppercase tracking-widest mt-0.5">Version 1.2.7 Flagship</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0F2F5] rounded-full text-[#65676B] transition-all">
            <X size={18} className="sm:w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#050505] ml-1">Incoming SMTP port</label>
                <div className="relative group">
                  <input 
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                    className="w-full bg-[#F0F2F5] border border-transparent rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-[14px] sm:text-[15px] text-[#050505] focus:bg-white focus:border-[#1877F2] transition-all font-bold outline-none shadow-inner"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#65676B] group-focus-within:text-[#1877F2] transition-colors">
                    <Shield size={16} className="sm:w-[18px]" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#050505] ml-1">Studio license key</label>
                <div className="relative group">
                  <input 
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="STUDIO-XXXX-XXXX"
                    className="w-full bg-[#F0F2F5] border border-transparent rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-[14px] sm:text-[15px] text-[#050505] focus:bg-white focus:border-[#1877F2] transition-all uppercase font-black outline-none shadow-inner placeholder:text-[#65676B]/40"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#65676B] group-focus-within:text-[#1877F2] transition-colors">
                    <Key size={16} className="sm:w-[18px]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-3xl flex items-start gap-3 sm:gap-4">
              <RefreshCw size={16} className="text-[#1877F2] mt-1 shrink-0 sm:w-[18px]" />
              <p className="text-[12px] sm:text-[13px] text-[#1877F2] font-semibold leading-relaxed">
                Note: Changing core ports requires an application reload to bind server listeners.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-10 py-5 sm:py-8 bg-[#F0F2F5] border-t border-[#E4E6EB] flex justify-end items-center gap-3 sm:gap-4 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-[#65676B] hover:text-[#050505] text-[13px] sm:text-[14px] font-bold transition-all">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1877F2] text-white px-6 sm:px-8 py-3 rounded-full text-[13px] sm:text-[14px] font-bold shadow-lg shadow-[#1877F2]/20 hover:bg-[#166fe5] active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "SAVING..." : "Apply changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
