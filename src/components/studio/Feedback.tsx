import { Check, X, AlertTriangle } from "lucide-react";

interface ToastProps {
  show: boolean;
  message: string;
}

export function Toast({ show, message }: ToastProps) {
  if (!show) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[var(--surface)] text-[#f8fafc] px-8 py-4 rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[var(--border)]">
        <div className="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/20"><Check size={14} /></div>
        <span className="text-[10px] font-black uppercase tracking-widest leading-loose">{message}</span>
      </div>
    </div>
  );
}

interface SmtpErrorProps {
  error: string | null;
  onClear: () => void;
}

export function SmtpError({ error, onClear }: SmtpErrorProps) {
  if (!error) return null;
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top-8 duration-500 w-full max-w-sm px-4">
      <div className="bg-red-500 text-white p-6 rounded-3xl flex items-start gap-4 shadow-2xl border border-red-400">
        <div className="p-2 bg-white/20 rounded-xl"><AlertTriangle size={18} /></div>
        <div className="flex-1">
           <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 leading-loose">SMTP CONFLICT</h4>
           <p className="text-[11px] font-medium leading-relaxed opacity-90">{error}</p>
        </div>
        <button onClick={onClear} className="p-1 hover:bg-white/20 rounded-lg transition-all"><X size={14} /></button>
      </div>
    </div>
  );
}
