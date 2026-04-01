import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Play, Plus, Trash2, RotateCcw, Activity, Filter, Terminal } from 'lucide-react';

interface Webhook {
  id: number;
  url: string;
  is_active: boolean;
  filter_subject?: string;
  filter_sender?: string;
  use_regex: boolean;
  hits_count: number;
  success_count: number;
  last_error?: string;
  blueprint: string;
}

interface WebhookLog {
  id: number;
  webhook_id: number;
  email_subject: string;
  status: string;
  error?: string;
  payload?: string;
  created_at: string;
}

interface WebhooksViewProps {
  onNotify?: (msg: string) => void;
}

export default function WebhooksView({ onNotify }: WebhooksViewProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newBlueprint, setNewBlueprint] = useState("Custom HTTP JSON");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [isReseting, setIsReseting] = useState<number | null>(null);
  const [showHistoryId, setShowHistoryId] = useState<number | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  useEffect(() => {
    fetchWebhooks();
    const interval = setInterval(fetchWebhooks, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showHistoryId) {
      fetchLogs(showHistoryId);
    }
  }, [showHistoryId]);

  const fetchWebhooks = async () => {
    try {
      const data: Webhook[] = await invoke("get_webhooks");
      setWebhooks(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async (id: number) => {
    try {
      const data: WebhookLog[] = await invoke("get_webhook_logs", { webhookId: id });
      setLogs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      await invoke("add_webhook", { 
        url: newUrl, 
        blueprint: newBlueprint,
        filterSubject: subjectFilter || null,
        filterSender: null,
        useRegex
      });
      setNewUrl("");
      setSubjectFilter("");
      fetchWebhooks();
      if (onNotify) onNotify("Rule registered successfully");
    } catch (error) {
      if (onNotify) onNotify(`${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this endpoint?")) return;
    try {
      await invoke("delete_webhook", { id });
      fetchWebhooks();
      if (showHistoryId === id) setShowHistoryId(null);
      if (onNotify) onNotify("Endpoint deleted");
    } catch (error) {
      console.error(error);
    }
  };

  const handleTest = async (url: string, id: number, blueprint: string) => {
    setTestingId(id);
    try {
      await invoke("test_webhook", { url, blueprint, webhookId: id });
      setTimeout(() => {
        setTestingId(null);
        fetchWebhooks();
        if (showHistoryId === id) fetchLogs(id);
        if (onNotify) onNotify("Test signal dispatched");
      }, 1000);
    } catch (error) {
      if (onNotify) onNotify(`Test failed: ${error}`);
      setTestingId(null);
    }
  };

  const handleResetCounters = async (id: number) => {
    setIsReseting(id);
    try {
      await invoke("reset_webhook_counters", { id });
      fetchWebhooks();
      if (onNotify) onNotify("Counters reset");
    } catch (error) {
      console.error(error);
    } finally {
      setIsReseting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0e14] overflow-hidden">
      
      {/* Sub-Header */}
      <header className="h-12 px-6 border-b border-[#1e293b] flex items-center justify-between shrink-0">
          <div className="flex gap-8 h-full">
             <button className="h-full text-sm font-semibold text-[#e2e8f0] border-b-2 border-blue-500 px-1 flex items-center uppercase italic tracking-tighter">
               Dispatch Rules
             </button>
             <button 
               onClick={() => onNotify ? onNotify("Rule auditing coming soon") : null}
               className="h-full text-sm font-semibold text-[#4a5568] hover:text-[#718096] px-1 flex items-center uppercase italic tracking-tighter"
             >
               Global Stats
             </button>
          </div>
          <button 
            onClick={() => {
              fetchWebhooks();
              if (onNotify) onNotify("Sycing endpoints...");
            }}
            className="px-3 py-1.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded text-[11px] font-bold uppercase tracking-tight hover:bg-blue-600/20 transition-all font-mono"
          >
             Manual Sync
          </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[rgba(11,14,20,0.5)]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <section className="bg-[#11141b] border border-[#1e293b] rounded-xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
            <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 flex items-center gap-2 uppercase tracking-widest italic">
              <Plus size={16} className="text-blue-500" /> Register Endpoint
            </h3>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
              <div className="md:col-span-6">
                <label className="block text-[10px] font-black text-[#4a5568] uppercase tracking-widest mb-2 italic">Destination (HTTPS)</label>
                <input 
                  type="url" 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks"
                  className="w-full bg-[#0b0e14] border border-[#1e293b] rounded-lg px-4 py-3 text-xs text-[#e2e8f0] focus:border-blue-500 outline-none transition-all focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-[#4a5568] uppercase tracking-widest mb-2 italic">Blueprint</label>
                <select 
                  value={newBlueprint}
                  onChange={(e) => setNewBlueprint(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-[#1e293b] rounded-lg px-4 py-3 text-xs text-[#e2e8f0] focus:border-blue-500 outline-none appearance-none"
                >
                  <option>JSON POST (Raw)</option>
                  <option>Discord Event</option>
                  <option>Slack Incoming</option>
                  <option>Laravel Forge</option>
                </select>
              </div>
              <div className="md:col-span-3 flex items-end">
                <button type="submit" className="w-full h-[46px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-900/40">
                  Deploy Rule
                </button>
              </div>
              
              <div className="md:col-span-12">
                 <label className="block text-[10px] font-black text-[#4a5568] uppercase tracking-widest mb-2 italic">Subject Infiltration Pattern (Optional)</label>
                 <div className="flex items-center gap-4 bg-[#11141b] rounded-lg border border-[#1e293b] p-1 pr-6">
                    <input 
                      type="text" 
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      placeholder="e.g. [URGENT] or /PAYMENT.*/"
                      className="flex-1 bg-transparent border-none rounded px-4 py-2 text-xs text-blue-400 font-bold outline-none font-mono"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => setUseRegex(!useRegex)}
                          className={`w-9 h-5 rounded-full transition-all relative ${useRegex ? 'bg-blue-600' : 'bg-[#1e293b]'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useRegex ? 'left-5' : 'left-1'}`} />
                        </div>
                        <span className="text-[10px] font-black text-[#4a5568] uppercase group-hover:text-[#718096] italic px-1">Logic Pattern</span>
                      </label>
                    </div>
                 </div>
              </div>
            </form>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-[#e2e8f0] uppercase tracking-widest italic border-l-4 border-blue-500 pl-4">Endpoint Registry <span className="ml-2 text-[#4a5568] opacity-50">/{webhooks.length} Active</span></h3>
            </div>
            
            <div className="bg-[#11141b] border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl relative">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b0e14] border-b border-[#1e293b]">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-[#4a5568] uppercase tracking-[0.2em] italic">Infiltration Target</th>
                    <th className="px-8 py-4 text-[9px] font-black text-[#4a5568] uppercase tracking-[0.2em] italic">Telemetry</th>
                    <th className="px-8 py-4 text-[9px] font-black text-[#4a5568] uppercase tracking-[0.2em] italic text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {webhooks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-32 text-center text-[#4a5568] italic text-xs uppercase tracking-widest opacity-50 bg-[#0b0e14]/30">No active signal routers detected.</td>
                    </tr>
                  ) : (
                    webhooks.map((hook) => (
                      <tr key={hook.id} className="hover:bg-blue-600/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-bold text-[#e2e8f0] truncate max-w-lg flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                               {hook.url}
                               <span className="bg-blue-600/10 text-blue-500 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-blue-500/20">{hook.blueprint}</span>
                            </span>
                            {hook.filter_subject && (
                              <div className="flex items-center gap-2 text-[10px] text-blue-400 font-mono italic px-5">
                                <Filter size={10} /> {hook.use_regex ? 'RGX' : 'SUB'}: <span className="opacity-80">"{hook.filter_subject}"</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-8">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-[#4a5568] uppercase tracking-widest mb-1 italic">Deliveries</span>
                                <span className="text-xs font-bold text-[#e2e8f0] font-mono tracking-tighter">{hook.success_count}<span className="text-[#2d3748] mx-1">/</span>{hook.hits_count}</span>
                              </div>
                              {hook.last_error && (
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1 italic">Interruption</span>
                                  <span className="text-[10px] text-red-400 font-bold truncate max-w-[150px] font-mono italic">{hook.last_error}</span>
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button 
                              onClick={() => setShowHistoryId(showHistoryId === hook.id ? null : hook.id)}
                              className="p-2 hover:bg-blue-500/10 text-[#718096] hover:text-blue-500 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                              title="Telemetry Logs"
                            ><Activity size={14} /></button>
                            <button 
                              onClick={() => handleResetCounters(hook.id)}
                              className="p-2 hover:bg-white/5 text-[#718096] rounded-lg transition-colors"
                              title="Reset Telemetry"
                            ><RotateCcw size={14} className={isReseting === hook.id ? 'animate-spin' : ''} /></button>
                            <button 
                              onClick={() => handleTest(hook.url, hook.id, hook.blueprint)}
                              disabled={testingId === hook.id}
                              className="p-2 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all border border-transparent hover:border-blue-500/40"
                              title="Disptach Test Signal"
                            ><Play size={14} fill="currentColor" /></button>
                            <button 
                              onClick={() => handleDelete(hook.id)}
                              className="p-2 hover:bg-red-500/10 text-red-500/80 hover:text-red-500 rounded-lg transition-colors"
                              title="Decommission Endpoint"
                            ><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {showHistoryId && (
            <section className="bg-[#11141b] border border-[#1e293b] rounded-xl overflow-hidden animate-in slide-in-from-bottom-6 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
               <header className="px-8 py-4 bg-[#0b0e14] border-b border-[#1e293b] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    <h4 className="text-xs font-black text-[#e2e8f0] uppercase tracking-[0.2em] italic">Telemetry Stream</h4>
                  </div>
                  <button onClick={() => setShowHistoryId(null)} className="text-[#4a5568] hover:text-white transition-colors p-1">✕</button>
               </header>
               <div className="p-6 overflow-y-auto max-h-[400px] custom-scrollbar bg-[#0b0e14]/30">
                  {logs.length === 0 ? (
                    <p className="text-center py-24 text-[#4a5568] italic text-[10px] uppercase tracking-[0.3em] opacity-40">Zero telemetry signals intercepted.</p>
                  ) : (
                    <div className="space-y-3">
                       {logs.map(log => (
                         <div 
                           key={log.id}
                           onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                           className={`p-4 rounded-lg border transition-all ${selectedLogId === log.id ? 'bg-[#0b0e14] border-blue-500/50 shadow-lg' : 'bg-[#11141b] border-transparent hover:border-[#1e293b] hover:bg-[#11141b]/80'}`}
                         >
                            <div className="flex items-center justify-between mb-2">
                               <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border ${log.status === 'success' ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>{log.status}</span>
                               <span className="text-[10px] text-[#4a5568] font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs font-bold text-[#e2e8f0] truncate">{log.email_subject || 'Simulated Pulse Signal'}</p>
                            {selectedLogId === log.id && (
                              <div className="mt-4 p-4 bg-[#05070a] rounded-lg border border-[#1e293b] shadow-inner font-mono text-[10px] text-blue-400/80 leading-relaxed overflow-auto max-h-48 custom-scrollbar">
                                 <div className="flex items-center gap-2 mb-3 border-b border-[#1e293b] pb-2">
                                    <Terminal size={12} className="text-blue-500" />
                                    <span className="font-black text-[#4a5568] uppercase tracking-widest">Payload Response</span>
                                 </div>
                                 <pre className="whitespace-pre-wrap">{log.payload || (log.error ? `FATAL: ${log.error}` : 'ACK: No response content.')}</pre>
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
