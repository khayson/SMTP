import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Send, User, Mail, Type, Code, Terminal } from "lucide-react";
import { toast } from "react-toastify";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchEmails: () => void;
}

export default function ComposeModal({ isOpen, onClose, fetchEmails }: ComposeModalProps) {
  const [sender, setSender] = useState("studio@forgemail.dev");
  const [recipient, setRecipient] = useState("app@local.dev");
  const [subject, setSubject] = useState("Studio Test Signal");
  const [body, setBody] = useState("<h1>ForgeMail Verification</h1><p>This is a high-fidelity test signal sent from the <b>ForgeMail Studio</b> compose utility.</p>");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await invoke("send_test_email", { 
        sender, 
        recipient, 
        subject, 
        body 
      });
      toast.success("Signal Dispatched");
      fetchEmails();
      onClose();
    } catch (error) {
      toast.error(`Dispatch Failed: ${error}`);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#050505]/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/20">
              <Send size={16} className="sm:w-[18px]" />
            </div>
            <div>
              <h2 className="text-[15px] sm:text-[17px] font-extrabold text-[#f8fafc] tracking-tight">Compose signal</h2>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)] font-bold uppercase tracking-widest mt-0.5">SMTP Test Utility</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--canvas)] rounded-full text-[var(--muted)] transition-all">
            <X size={18} className="sm:w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSend} id="compose-form" className="p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#f8fafc] ml-1 flex items-center gap-2">
                  <User size={13} className="text-[var(--muted)]" /> From
                </label>
                <input 
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="sender@local.dev"
                  className="w-full bg-[var(--canvas)] border border-[var(--border)] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-[13px] sm:text-[14px] text-[#f8fafc] focus:bg-[var(--canvas)] focus:border-[var(--primary)] transition-all outline-none font-semibold shadow-inner"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#f8fafc] ml-1 flex items-center gap-2">
                  <Mail size={13} className="text-[var(--muted)]" /> To
                </label>
                <input 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="recipient@local.dev"
                  className="w-full bg-[var(--canvas)] border border-[var(--border)] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-[13px] sm:text-[14px] text-[#f8fafc] focus:bg-[var(--canvas)] focus:border-[var(--primary)] transition-all outline-none font-semibold shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[12px] sm:text-[13px] font-bold text-[#f8fafc] ml-1 flex items-center gap-2">
                <Type size={13} className="text-[var(--muted)]" /> Subject
              </label>
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Signal Subject"
                className="w-full bg-[var(--canvas)] border border-[var(--border)] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-[13px] sm:text-[14px] text-[#f8fafc] focus:bg-[var(--canvas)] focus:border-[var(--primary)] transition-all outline-none font-extrabold shadow-inner"
                required
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#f8fafc] flex items-center gap-2">
                  <Code size={13} className="text-[var(--muted)]" /> Message body
                </label>
                <span className="text-[9px] sm:text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em] bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--primary)]/20">Rich Text Editor</span>
              </div>
              <div className="quill-container bg-[var(--canvas)] rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border border-[var(--border)] focus-within:border-[var(--primary)] transition-all">
                <ReactQuill 
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  placeholder="Design your signal..."
                  className="bg-white text-black"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                      ['link', 'code'],
                      ['clean']
                    ],
                  }}
                />
              </div>
              <style>{`
                .ql-container.ql-snow {
                  border: none !important;
                  height: 200px;
                  font-family: inherit;
                  font-size: 14px;
                  background: white;
                  color: black;
                }
                .ql-toolbar.ql-snow {
                  border: none !important;
                  border-bottom: 1px solid var(--border) !important;
                  background: var(--surface);
                  padding-top: 8px;
                  padding-bottom: 8px;
                }
                .ql-toolbar.ql-snow .ql-stroke {
                  stroke: var(--muted);
                }
                .ql-toolbar.ql-snow .ql-fill {
                  fill: var(--muted);
                }
                .ql-toolbar.ql-snow .ql-picker {
                  color: var(--muted);
                }
                .ql-editor {
                  background: white;
                  color: black;
                }
                .quill-container .ql-editor.ql-blank::before {
                  color: #65676B;
                  font-style: normal;
                  font-weight: 600;
                }
              `}</style>
            </div>
            
            <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start gap-3 sm:gap-4">
               <Terminal size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
               <p className="text-[11px] sm:text-[12px] text-[var(--primary)] font-semibold leading-relaxed">
                 Signal will be injected into the studio database directly.
               </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 bg-[var(--canvas)] border-t border-[var(--border)] flex justify-end items-center gap-3 sm:gap-4 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[var(--muted)] hover:text-[#f8fafc] text-[13px] sm:text-[14px] font-bold transition-all">Discard</button>
          <button 
            type="submit"
            form="compose-form"
            disabled={sending}
            className="bg-[var(--primary)] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[13px] sm:text-[14px] font-bold shadow-lg shadow-[#1877F2]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? "Dispatching..." : (
              <>
                <span>Send Signal</span>
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
