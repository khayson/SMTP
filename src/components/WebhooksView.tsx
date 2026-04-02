import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Play, Trash2, RotateCcw, Activity, Filter, Terminal, Globe, Cpu, X } from 'lucide-react';

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
  const [newBlueprint, setNewBlueprint] = useState("Standard JSON");
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
      if (onNotify) onNotify("Dispatch rule established");
    } catch (error) {
      if (onNotify) onNotify(`${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Decommission this endpoint?")) return;
    try {
      await invoke("delete_webhook", { id });
      fetchWebhooks();
      if (showHistoryId === id) setShowHistoryId(null);
      if (onNotify) onNotify("Infrastructure decommissioned");
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
      if (onNotify) onNotify(`Signal failed: ${error}`);
      setTestingId(null);
    }
  };

  const handleResetCounters = async (id: number) => {
    setIsReseting(id);
    try {
      await invoke("reset_webhook_counters", { id });
      fetchWebhooks();
      if (onNotify) onNotify("Telemetry reset complete");
    } catch (error) {
      console.error(error);
    } finally {
      setIsReseting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      
      <header className="h-20 px-10 border-b border-slate-900 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-white rounded-xl text-slate-950 shadow-2xl">
               <Globe size={18} />
             </div>
             <div>
               <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Infrastructure Rules</h2>
               <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{webhooks.length} Active Endpoints</p>
             </div>
          </div>
          <button 
            onClick={() => { fetchWebhooks(); if (onNotify) onNotify("Rules synchronized"); }}
            className="p-3 text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all border border-slate-800"
          >
             <RotateCcw size={16} />
          </button>
      </header>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <section className="forge-card p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="flex items-center gap-6 mb-10">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] shrink-0">New Dispatch Rule</h3>
              <div className="h-[1px] bg-slate-800 flex-1" />
            </div>

            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
              <div className="md:col-span-8">
                <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Endpoint URL</label>
                <input 
                  type="url" 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://api.acme.com/ingest"
                  className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 text-sm text-white placeholder:text-slate-800 focus:border-white/20 outline-none transition-all font-mono"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Payload Architecture</label>
                <div className="relative">
                  <select 
                    value={newBlueprint}
                    onChange={(e) => setNewBlueprint(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 text-sm text-white focus:border-white/20 outline-none appearance-none cursor-pointer font-bold uppercase tracking-widest text-[10px]"
                  >
                    <option>Standard JSON</option>
                    <option>Discord Webhook</option>
                    <option>Slack Webhook</option>
                    <option>Custom Blueprint</option>
                  </select>
                </div>
              </div>
              
              <div className="md:col-span-12 flex flex-col md:flex-row gap-8 items-end">
                <div className="flex-1 w-full">
                   <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Filter Logic (Subject Match)</label>
                   <div className="flex items-center gap-6 bg-slate-950 rounded-[1.5rem] border border-slate-800 p-2 pr-8 transition-within:border-white/20">
                      <input 
                        type="text" 
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        placeholder="e.g. Welcome or /Order #\\d+/"
                        className="flex-1 bg-transparent border-none rounded-xl px-4 py-3 text-sm text-white font-black font-mono outline-none placeholder:text-slate-800"
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => setUseRegex(!useRegex)}
                            className={`w-10 h-5 rounded-full transition-all relative ${useRegex ? 'bg-white' : 'bg-slate-800'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${useRegex ? 'left-6 bg-slate-950' : 'left-1 bg-slate-400'}`} />
                          </div>
                          <span className={`${useRegex ? 'text-white' : 'text-slate-600'} text-[9px] font-black uppercase tracking-widest transition-colors`}>REGEX</span>
                        </label>
                      </div>
                   </div>
                </div>
                <button type="submit" className="forge-button-primary h-16 px-12 rounded-[1.5rem] text-[10px] font-black shadow-2xl active:scale-95 transition-all">
                   ENABLE DISPATCH
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] shrink-0">Active Registry</h3>
              <div className="h-[1px] bg-slate-900 flex-1" />
            </div>
            
            <div className="forge-card rounded-[2.5rem] overflow-hidden border border-slate-900/50">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-900">
                  <tr>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Destination Infrastructure</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Telemetry</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {webhooks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-10 py-32 text-center text-slate-800 uppercase text-[10px] font-black tracking-[0.5em]">No Active Dispatch Rules</td>
                    </tr>
                  ) : (
                    webhooks.map((hook) => (
                      <tr key={hook.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-black text-white truncate max-w-lg flex items-center gap-4">
                               <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
                               {hook.url}
                               <span className="bg-white/5 text-slate-500 text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-white/5">{hook.blueprint}</span>
                            </span>
                            {hook.filter_subject && (
                              <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono font-black pl-5">
                                <Filter size={10} /> {hook.use_regex ? 'STRICT REGEX' : 'SUBSTRING'}: <span className="text-white">"{hook.filter_subject}"</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-10">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pass-Through</span>
                                <span className="text-xs font-mono text-white font-black">{hook.success_count}<span className="text-slate-800 mx-1">/</span>{hook.hits_count}</span>
                              </div>
                              {hook.last_error && (
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-red-900 uppercase tracking-widest mb-1">Error</span>
                                  <span className="text-[10px] text-red-500 font-mono font-black truncate max-w-[150px]">{hook.last_error}</span>
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => setShowHistoryId(showHistoryId === hook.id ? null : hook.id)}
                              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all border border-slate-800"
                              title="History"
                            ><Activity size={14} /></button>
                            <button 
                              onClick={() => handleResetCounters(hook.id)}
                              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all border border-slate-800"
                              title="Reset"
                            ><RotateCcw size={14} className={isReseting === hook.id ? 'animate-spin' : ''} /></button>
                            <button 
                              onClick={() => handleTest(hook.url, hook.id, hook.blueprint)}
                              disabled={testingId === hook.id}
                              className="p-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl transition-all shadow-xl shadow-white/5"
                              title="Test Signal"
                            ><Play size={14} fill="currentColor" /></button>
                            <button 
                              onClick={() => handleDelete(hook.id)}
                              className="p-3 bg-slate-900 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-xl transition-all border border-slate-800 hover:border-red-500/20"
                              title="Remove"
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
            <section className="forge-card rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 shadow-2xl border-white/5">
               <header className="px-10 py-8 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg text-white">
                      <Activity size={16} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Infrastructure Logs</h4>
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Real-time Delivery Telemetry</p>
                    </div>
                  </div>
                  <button onClick={() => setShowHistoryId(null)} className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all">
                    <X size={16} />
                  </button>
               </header>
               <div className="p-10 overflow-y-auto max-h-[600px] custom-scrollbar bg-slate-950/20">
                  {logs.length === 0 ? (
                    <div className="py-32 text-center">
                      <Cpu size={40} className="mx-auto text-slate-900 mb-6" />
                      <p className="text-slate-800 uppercase text-[9px] font-black tracking-[0.5em]">No Delivery Data Found</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                       {logs.map(log => (
                         <div 
                           key={log.id}
                           onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                           className={`p-6 rounded-[1.5rem] border transition-all cursor-pointer ${selectedLogId === log.id ? 'bg-white/[0.03] border-white/20' : 'bg-slate-900 border-transparent hover:border-slate-800'}`}
                         >
                            <div className="flex items-center justify-between mb-4">
                               <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-md border ${log.status === 'success' ? 'bg-white/5 text-white border-white/10' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>{log.status}</span>
                               <span className="text-[9px] text-slate-600 font-mono font-black uppercase">{new Date(log.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs font-black text-white uppercase tracking-wider">{log.email_subject || 'Infrastructure Test Signal'}</p>
                            {selectedLogId === log.id && (
                              <div className="mt-6 p-8 bg-black rounded-2xl border border-slate-900 font-mono text-[12px] text-slate-400 leading-relaxed overflow-auto max-h-64 custom-scrollbar group relative">
                                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <Terminal size={40} />
                                 </div>
                                 <pre className="whitespace-pre-wrap relative z-10">{log.payload || (log.error ? `ERR_TRACE: ${log.error}` : 'SIG_OK: NULL_RESPONSE')}</pre>
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
