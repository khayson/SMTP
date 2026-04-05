import { Mail, Smartphone, Tablet, Monitor, Copy, Trash2, ArrowLeft, Star, Printer, MoreHorizontal, RotateCcw } from "lucide-react";

import { Email } from "../../types";

interface EmailInspectorProps {
  selectedEmail: Email | null;
  inspectorTab: 'preview' | 'source' | 'text' | 'headers' | 'info';
  setInspectorTab: (tab: 'preview' | 'source' | 'text' | 'headers' | 'info') => void;
  previewDevice: 'mobile' | 'tablet' | 'desktop';
  setPreviewDevice: (device: 'mobile' | 'tablet' | 'desktop') => void;
  handleDelete: (id: number) => void;
  restoreEmail: (id: number) => void;
  copyToClipboard: (text: string, msg: string) => void;
  wrapHtmlWithLinkHandler: (html: string) => string;
  setSelectedEmail: (e: Email | null) => void;
  isSmallScreen: boolean;
  isMasterView?: boolean;
}

export default function EmailInspector({
  selectedEmail,
  inspectorTab,
  setInspectorTab,
  previewDevice,
  setPreviewDevice,
  handleDelete,
  restoreEmail,
  copyToClipboard,
  wrapHtmlWithLinkHandler,
  setSelectedEmail,
  isSmallScreen,
  isMasterView = false
}: EmailInspectorProps) {
  
  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-[#F0F2F5] select-none">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 border border-[#E4E6EB] shadow-sm relative group">
          <Mail size={40} className="text-[#BCC0C4] group-hover:scale-110 transition-transform" />
        </div>
        <h2 className="text-[13px] font-bold text-[#65676B] uppercase tracking-widest leading-loose">No Signal Selected</h2>
        <p className="text-[12px] text-[#8D949E] mt-2">Select a dispatch from the list to inspect its content.</p>
      </div>
    );
  }

  const initials = selectedEmail.sender.substring(0, 2).toUpperCase();

  return (
    <div className={`flex-1 flex flex-col overflow-hidden h-full bg-[#F0F2F5] select-none ${isMasterView && isSmallScreen ? 'hidden' : ''}`}>
      {/* Detail Header */}
      <div className="p-6 bg-white border-b border-[#E4E6EB] shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedEmail(null)} 
                className="p-2 -ml-2 text-[#65676B] hover:bg-[#F0F2F5] rounded-full lg:hidden"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-[16px]">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#050505]">{selectedEmail.sender}</span>
                <span className="text-[12px] text-[#65676B]">To: {selectedEmail.recipients}</span>
              </div>
           </div>
           
            <div className="flex items-center gap-1">
              {selectedEmail.folder === 'trash' && (
                <button 
                  onClick={() => restoreEmail(selectedEmail.id)} 
                  className="p-2 text-[#1877F2] hover:bg-blue-50 rounded-full transition-all"
                  title="Restore to Workspace"
                >
                  <RotateCcw size={18} />
                </button>
              )}
              <button className={`p-2 rounded-full transition-all ${selectedEmail.is_starred ? 'text-yellow-500' : 'text-[#65676B] hover:bg-[#F0F2F5]'}`}><Star size={18} fill={selectedEmail.is_starred ? "currentColor" : "none"} /></button>
              <button onClick={() => window.print()} className="p-2 text-[#65676B] hover:bg-[#F0F2F5] rounded-full transition-all"><Printer size={18} /></button>
              <button 
                onClick={() => handleDelete(selectedEmail.id)} 
                className={`p-2 transition-all rounded-full ${selectedEmail.folder === 'trash' ? 'text-red-600 hover:bg-red-50' : 'text-[#65676B] hover:bg-red-50 hover:text-red-500'}`}
                title={selectedEmail.folder === 'trash' ? 'Permanently Purge' : 'Move to Trash'}
              >
                <Trash2 size={18} />
              </button>
              <button className="p-2 text-[#65676B] hover:bg-[#F0F2F5] rounded-full transition-all"><MoreHorizontal size={18} /></button>
            </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-[#050505] tracking-tight mb-4 select-text">{selectedEmail.subject || '(No Subject)'}</h2>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-[#65676B]">
             <span className="text-[11px] font-bold uppercase tracking-wider">Arrived</span>
             <span className="text-[12px] font-medium">{new Date(selectedEmail.created_at).toLocaleString()}</span>
           </div>
           <div className="flex items-center gap-4 border-l border-[#E4E6EB] pl-6">
              {[
                { id: 'preview', label: 'Preview' },
                { id: 'source', label: 'HTML' },
                { id: 'text', label: 'Text' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setInspectorTab(tab.id as any)} 
                  className={`text-[12px] font-bold border-b-2 transition-all pb-1 ${inspectorTab === tab.id ? 'text-[#1877F2] border-[#1877F2]' : 'text-[#65676B] border-transparent hover:text-[#050505]'}`}
                >
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto custom-scrollbar flex flex-col">
         {/* Device Switcher */}
         <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E4E6EB] shadow-sm">
               <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-[#1877F2] text-white shadow-md' : 'text-[#65676B] hover:bg-[#F0F2F5]'}`} title="Mobile"><Smartphone size={16} /></button>
               <button onClick={() => setPreviewDevice('tablet')} className={`p-2 rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-[#1877F2] text-white shadow-md' : 'text-[#65676B] hover:bg-[#F0F2F5]'}`} title="Tablet"><Tablet size={16} /></button>
               <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-[#1877F2] text-white shadow-md' : 'text-[#65676B] hover:bg-[#F0F2F5]'}`} title="Desktop"><Monitor size={16} /></button>
            </div>
         </div>

         {/* Content Pane */}
         <div 
          className={`bg-white rounded-xl mx-auto overflow-hidden flex flex-col border border-[#E4E6EB] shadow-xl transition-all duration-500 ${previewDevice === 'mobile' ? 'w-[375px] h-[667px]' : previewDevice === 'tablet' ? 'w-[768px] h-[900px]' : 'w-full flex-1'}`}
         >
           {inspectorTab === 'preview' && (
             <iframe 
               title="Message Preview"
               className="w-full h-full border-none bg-white" 
               sandbox="allow-same-origin allow-popups"
               srcDoc={wrapHtmlWithLinkHandler(selectedEmail.html_body || `<pre style="padding:40px;font-family:Inter,sans-serif;color:#050505;font-size:14px;line-height:1.6">${selectedEmail.text_body}</pre>`)} 
             />
           )}
           {['source', 'text'].includes(inspectorTab) && (
             <div className="flex-1 bg-white p-8 overflow-auto font-mono text-[13px] leading-relaxed select-text custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-[#E4E6EB] pb-4">
                  <span className="text-[11px] font-bold text-[#65676B] uppercase tracking-widest">{inspectorTab === 'source' ? 'Source Code' : 'Plain Text Content'}</span>
                  <button onClick={() => copyToClipboard((inspectorTab === 'source' ? selectedEmail.html_body : selectedEmail.text_body) || "", "Copied content")} className="text-[#1877F2] hover:underline text-[12px] font-bold flex items-center gap-1"><Copy size={12} /> Copy All</button>
                </div>
                <pre className="whitespace-pre-wrap text-[#050505] font-medium tracking-tight">
                  {inspectorTab === 'source' ? selectedEmail.html_body : selectedEmail.text_body}
                </pre>
             </div>
           )}
         </div>

      </div>
    </div>
  );
}
