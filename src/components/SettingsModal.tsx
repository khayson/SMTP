import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, Zap, Key, Server, X } from "lucide-react";

interface RelaySettings {
  host: string;
  port: number;
  username?: string;
  password?: string;
  encryption: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<RelaySettings>({
    host: "",
    port: 25,
    encryption: "none",
  });
  const [smtpPort, setSmtpPort] = useState<number>(1025);
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load Relay Settings
      invoke<RelaySettings | null>("get_relay_settings").then((data) => {
        if (data) setSettings(data);
      });
      
      // Load Studio Core Settings
      const loadStudioSettings = async () => {
        try {
          const port = await invoke<string | null>("get_settings", { key: "smtp_port" });
          if (port) setSmtpPort(parseInt(port));
          const license = await invoke<string | null>("get_settings", { key: "license_key" });
          if (license) setLicenseKey(license);
        } catch (e) { 
          console.error("Failed to load studio settings:", e); 
        }
      };
      loadStudioSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save Relay Configuration
      await invoke("update_relay_settings", { settings });
      
      // Save Studio Core Configuration
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0b0e14] border border-[#1e293b] rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.1)] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#11141b]/50">
          <div>
            <h2 className="text-2xl font-black text-[#e2e8f0] uppercase tracking-tighter italic">Studio Precision</h2>
            <p className="text-[10px] text-[#718096] uppercase font-bold tracking-[0.2em] opacity-60">Global Configuration Engine</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* Relay Group */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-blue-500" />
              <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Relay Studio</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">SMTP Host</label>
                <input 
                  value={settings.host}
                  onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                  placeholder="smtp.mailtrap.io"
                  className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Relay Port</label>
                  <input 
                    type="number"
                    value={settings.port}
                    onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) })}
                    className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Security</label>
                  <select 
                    value={settings.encryption}
                    onChange={(e) => setSettings({ ...settings, encryption: e.target.value })}
                    className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-bold appearance-none"
                  >
                    <option value="none">PLAIN / NONE</option>
                    <option value="starttls">STARTTLS</option>
                    <option value="tls">TLS/SSL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Auth User</label>
                  <input 
                    value={settings.username || ""}
                    onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                    className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Auth Pass</label>
                  <input 
                    type="password"
                    value={settings.password || ""}
                    onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                    className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Studio Core Group */}
          <section className="space-y-6 pt-6 border-t border-[#1e293b]/50">
            <div className="flex items-center gap-2 mb-4">
              <Server size={14} className="text-blue-500" />
              <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Studio Core</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Listen Port</label>
                <input 
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                  placeholder="1025"
                  className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Enterprise Key</label>
                <input 
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="PM-XXXX-XXXX"
                  className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-blue-500 transition-all uppercase tracking-widest placeholder:tracking-normal"
                />
                <Key size={12} className="absolute right-4 top-[38px] opacity-20" />
              </div>
            </div>
            <p className="text-[9px] text-[#4a5568] mt-2 italic flex items-center gap-2">
              <Shield size={10} /> Requires studio restart to apply port binding changes.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 bg-[#11141b]/50 border-t border-[#1e293b] flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-[#718096] hover:text-[#e2e8f0] text-xs font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            {saving ? "Deploying..." : "Sync Studio"}
          </button>
        </div>
      </div>
    </div>
  );
}
