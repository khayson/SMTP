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
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#050505]/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white border border-[#E4E6EB] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-[#E4E6EB] flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1877F2] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/20">
              <Send size={16} className="sm:w-[18px]" />
            </div>
            <div>
              <h2 className="text-[15px] sm:text-[17px] font-extrabold text-[#050505] tracking-tight">Compose signal</h2>
              <p className="text-[10px] sm:text-[11px] text-[#65676B] font-bold uppercase tracking-widest mt-0.5">SMTP Test Utility</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0F2F5] rounded-full text-[#65676B] transition-all">
            <X size={18} className="sm:w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSend} id="compose-form" className="p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#050505] ml-1 flex items-center gap-2">
                  <User size={13} className="text-[#65676B]" /> From
                </label>
                <input 
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="sender@local.dev"
                  className="w-full bg-[#F0F2F5] border border-transparent rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-[13px] sm:text-[14px] text-[#050505] focus:bg-white focus:border-[#1877F2] transition-all outline-none font-semibold shadow-inner"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#050505] ml-1 flex items-center gap-2">
                  <Mail size={13} className="text-[#65676B]" /> To
                </label>
                <input 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="recipient@local.dev"
                  className="w-full bg-[#F0F2F5] border border-transparent rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-[13px] sm:text-[14px] text-[#050505] focus:bg-white focus:border-[#1877F2] transition-all outline-none font-semibold shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[12px] sm:text-[13px] font-bold text-[#050505] ml-1 flex items-center gap-2">
                <Type size={13} className="text-[#65676B]" /> Subject
              </label>
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Signal Subject"
                className="w-full bg-[#F0F2F5] border border-transparent rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-[13px] sm:text-[14px] text-[#050505] focus:bg-white focus:border-[#1877F2] transition-all outline-none font-extrabold shadow-inner"
                required
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[12px] sm:text-[13px] font-bold text-[#050505] flex items-center gap-2">
                  <Code size={13} className="text-[#65676B]" /> Message body
                </label>
                <span className="text-[9px] sm:text-[10px] font-black text-[#1877F2] uppercase tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">Rich Text Editor</span>
              </div>
              <div className="quill-container bg-[#F0F2F5] rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border border-transparent focus-within:border-[#1877F2] transition-all">
                <ReactQuill 
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  placeholder="Design your signal..."
                  className="bg-white"
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
                }
                .ql-toolbar.ql-snow {
                  border: none !important;
                  border-bottom: 1px solid #E4E6EB !important;
                  background: #f8fafc;
                  padding-top: 8px;
                  padding-bottom: 8px;
                }
                .ql-editor {
                  background: white;
                }
                .quill-container .ql-editor.ql-blank::before {
                  color: #65676B;
                  font-style: normal;
                  font-weight: 600;
                }
              `}</style>
            </div>
            
            <div className="bg-[#1877F2]/5 border border-[#1877F2]/10 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start gap-3 sm:gap-4">
               <Terminal size={16} className="text-[#1877F2] mt-0.5 shrink-0" />
               <p className="text-[11px] sm:text-[12px] text-[#1877F2] font-semibold leading-relaxed">
                 Signal will be injected into the studio database directly.
               </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 sm:py-6 bg-[#F0F2F5] border-t border-[#E4E6EB] flex justify-end items-center gap-3 sm:gap-4 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[#65676B] hover:text-[#050505] text-[13px] sm:text-[14px] font-bold transition-all">Discard</button>
          <button 
            type="submit"
            form="compose-form"
            disabled={sending}
            className="bg-[#1877F2] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[13px] sm:text-[14px] font-bold shadow-lg shadow-[#1877F2]/20 hover:bg-[#166fe5] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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
