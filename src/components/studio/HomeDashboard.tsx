import { useEffect, useState } from "react";
import {
  Zap,
  Copy,
  Sparkles,
  PlayCircle,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Layout,
  Layers,
  ArrowRight,
  Search,
  ChevronDown,
  Check,
  Download,
  ExternalLink,
  BookOpen,
  Package,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import {
  CHANGELOG_WEB_URL,
  extractLatestReleaseSection,
  fetchMainChangelogMarkdown,
  GITHUB_RELEASES_LATEST,
  GITHUB_REPO,
} from "../../lib/release-info";

interface HomeDashboardProps {
  helpSubTab: "welcome" | "integration" | "whatsnew";
  setHelpSubTab: (tab: "welcome" | "integration" | "whatsnew") => void;
  techType: string;
  setTechType: (type: string) => void;
  projects: string[];
  selectedProject: string | null;
  setSelectedProject: (p: string | null) => void;
  getFullConfigSnippet: (tech: string, project: string | null) => string;
  copyToClipboard: (text: string, msg: string) => void;
  openExternalLink: (url: string) => void;
  smtpPort: number;
}

function stripInlineMd(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

function ChangelogLines({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split("\n").map((raw, i) => {
        const t = raw.trim();
        if (!t || t === "---") return null;
        if (t.startsWith("### ")) {
          return (
            <h4
              key={i}
              className="text-[14px] font-bold text-[#f8fafc] mt-5 first:mt-0 mb-1 tracking-tight"
            >
              {stripInlineMd(t.slice(4))}
            </h4>
          );
        }
        if (t.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-3 pl-1">
              <span className="text-[var(--primary)] shrink-0 mt-1.5 h-1 w-1 rounded-full bg-[var(--primary)]" />
              <p className="text-[14px] text-[var(--muted)] leading-relaxed font-medium">
                {stripInlineMd(t.slice(2))}
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="text-[14px] text-[var(--muted)] leading-relaxed font-medium">
            {stripInlineMd(t)}
          </p>
        );
      })}
    </div>
  );
}

export default function HomeDashboard({
  helpSubTab,
  setHelpSubTab,
  techType,
  setTechType,
  projects,
  selectedProject,
  setSelectedProject,
  getFullConfigSnippet,
  copyToClipboard,
  openExternalLink,
  smtpPort,
}: HomeDashboardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("");
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [changelogError, setChangelogError] = useState<string | null>(null);
  const [latestNotes, setLatestNotes] = useState<{ heading: string; body: string } | null>(
    null
  );

  const p = selectedProject || "default";

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(""));
  }, []);

  useEffect(() => {
    if (helpSubTab !== "whatsnew") return;
    let cancelled = false;
    setChangelogLoading(true);
    setChangelogError(null);
    fetchMainChangelogMarkdown()
      .then((md) => {
        if (cancelled) return;
        if (!md) {
          setChangelogError("Could not load changelog from GitHub.");
          setLatestNotes(null);
          return;
        }
        const section = extractLatestReleaseSection(md);
        if (!section) {
          setChangelogError("Changelog format changed or no release section found.");
          setLatestNotes(null);
          return;
        }
        setLatestNotes(section);
      })
      .finally(() => {
        if (!cancelled) setChangelogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [helpSubTab]);

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, `Copied ${label}`);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const studioTabs = [
    { id: "welcome", label: "Welcome", icon: <Layout size={14} /> },
    { id: "integration", label: "Setup Guide", icon: <BookOpen size={14} /> },
    { id: "whatsnew", label: "What's New", icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--canvas)] select-none">
      <div className="h-[50px] px-8 border-b border-[var(--border)] flex items-center gap-6 shrink-0 bg-[var(--canvas)]">
        {studioTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setHelpSubTab(tab.id as "welcome" | "integration" | "whatsnew")}
            className={`h-full flex items-center gap-2 text-[13px] font-bold transition-all relative ${
              helpSubTab === tab.id
                ? "text-[var(--primary)]"
                : "text-[var(--muted)] hover:text-[#f8fafc]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {helpSubTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--canvas)]">
        {helpSubTab === "welcome" && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <p className="text-[12px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-3">
                ForgeMail Studio
                {appVersion ? (
                  <span className="text-[var(--muted)] normal-case tracking-normal">
                    {" "}
                    · v{appVersion}
                  </span>
                ) : null}
              </p>
              <h1 className="text-4xl font-extrabold text-[#f8fafc] mb-4 tracking-tight">
                Local SMTP, one workspace.
              </h1>
              <p className="text-[16px] text-[var(--muted)] font-medium leading-relaxed">
                Capture mail from your dev stack, inspect it like production, and wire webhooks —
                without sending traffic off your machine unless you choose to.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: "Project silos",
                  desc: "Route each app through its own SMTP user so inboxes stay isolated.",
                  icon: <Layers className="text-[var(--primary)]" size={24} />,
                  color: "bg-blue-500/10",
                },
                {
                  title: "Deep inspection",
                  desc: "Preview HTML safely, read raw source, headers, and plain text side by side.",
                  icon: <Search className="text-purple-400" size={24} />,
                  color: "bg-purple-500/10",
                },
                {
                  title: "Webhooks & relay",
                  desc: "Fan out to Slack, Discord, or custom URLs; relay onward when you need to.",
                  icon: <Zap className="text-orange-400" size={24} />,
                  color: "bg-orange-500/10",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div
                    className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    {item.icon}
                  </div>
                  <h4 className="text-[18px] font-bold text-[#f8fafc] mb-2">{item.title}</h4>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] flex gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Download className="text-emerald-400" size={26} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[18px] font-bold text-[#f8fafc] mb-2">Get ForgeMail (Windows)</h4>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed font-medium mb-4">
                    Prefer <strong className="text-[#f8fafc]">no installer</strong>? On each{" "}
                    <span className="text-[var(--primary)]">GitHub Release</span>, download the
                    asset named{" "}
                    <code className="text-[12px] text-[#f8fafc] bg-[var(--canvas)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      ForgeMail_&lt;version&gt;_01_Windows_Portable.zip
                    </code>{" "}
                    — extract and run. Use the <code className="text-[12px]">*-setup.exe</code> only
                    if you want a classic install.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openExternalLink(GITHUB_RELEASES_LATEST)}
                      className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-[12px] font-bold flex items-center gap-2 hover:opacity-90"
                    >
                      <Download size={14} /> Latest downloads
                    </button>
                    <button
                      type="button"
                      onClick={() => openExternalLink(GITHUB_REPO)}
                      className="px-5 py-2.5 rounded-full border border-[var(--border)] text-[12px] font-bold text-[var(--muted)] hover:text-[#f8fafc] flex items-center gap-2"
                    >
                      <ExternalLink size={14} /> Repository
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] flex gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
                  <Package className="text-[var(--primary)]" size={26} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[18px] font-bold text-[#f8fafc] mb-2">What's new</h4>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed font-medium mb-4">
                    Release notes are loaded from{" "}
                    <code className="text-[11px] text-[#f8fafc]">CHANGELOG.md</code> on GitHub
                    whenever you open the What&apos;s New tab — same file we ship with each tag.
                  </p>
                  <button
                    type="button"
                    onClick={() => setHelpSubTab("whatsnew")}
                    className="px-5 py-2.5 rounded-full border border-[var(--primary)]/40 text-[12px] font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10 flex items-center gap-2"
                  >
                    <Sparkles size={14} /> Open What&apos;s New
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="w-full md:w-48 h-32 bg-gradient-to-br from-[var(--primary)] to-[#00a3bf] rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-2 transition-transform">
                <PlayCircle size={48} className="text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-[20px] font-bold text-[#f8fafc] mb-2">Wire your first app</h4>
                <p className="text-[14px] text-[var(--muted)] font-medium leading-relaxed mb-6">
                  The Setup Guide walks through download choice, SMTP credentials, and copy-paste
                  snippets for Laravel, Flutter, Node, Python, and Go.
                </p>
                <button
                  type="button"
                  onClick={() => setHelpSubTab("integration")}
                  className="px-8 py-3.5 bg-[var(--canvas)] text-[#f8fafc] rounded-full font-bold text-[13px] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center gap-2 mx-auto md:mx-0 shadow-sm"
                >
                  Open setup guide <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {helpSubTab === "integration" && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-extrabold text-[#f8fafc] tracking-tight">Setup guide</h1>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-[13px] text-[var(--primary)] hover:underline font-bold px-4 py-2 bg-[var(--surface)] rounded-full border border-[var(--border)] shadow-sm"
              >
                <RefreshCw size={14} /> Reload app
              </button>
            </div>

            <div className="mb-10 p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] space-y-6">
              <h2 className="text-[11px] font-black text-[var(--muted)] uppercase tracking-wider">
                Before you paste code
              </h2>
              <ol className="space-y-4 text-[14px] text-[var(--muted)] font-medium leading-relaxed list-decimal list-inside marker:text-[var(--primary)] marker:font-bold">
                <li>
                  <span className="text-[#f8fafc] font-bold">Install or portable.</span> From{" "}
                  <button
                    type="button"
                    onClick={() => openExternalLink(GITHUB_RELEASES_LATEST)}
                    className="text-[var(--primary)] hover:underline font-bold"
                  >
                    Releases
                  </button>
                  , download{" "}
                  <code className="text-[12px] text-[#e2e8f0] bg-[var(--canvas)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                    ForgeMail_*_01_Windows_Portable.zip
                  </code>{" "}
                  to run without an installer, or the <code className="text-[12px]">*-setup.exe</code>{" "}
                  for a guided install (useful if WebView2 is missing).
                </li>
                <li>
                  <span className="text-[#f8fafc] font-bold">Keep ForgeMail running.</span> The SMTP
                  server listens only while the app is open (tray counts as running).
                </li>
                <li>
                  <span className="text-[#f8fafc] font-bold">Match the workspace.</span> Pick the
                  same project silo here as the SMTP username in your app (often{" "}
                  <code className="text-[12px]">default</code>).
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-10">
              <div className="space-y-6">
                <div className="bg-[var(--primary)] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                    <Terminal size={180} />
                  </div>

                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight">SMTP</h2>
                      <p className="text-[13px] font-bold opacity-80 mt-1 uppercase tracking-widest">
                        Local capture
                      </p>
                    </div>
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                      <Zap size={24} />
                    </div>
                  </div>

                  <div className="space-y-4 font-bold border-t border-white/10 pt-8 mt-2">
                    {[
                      { label: "Host", value: "127.0.0.1" },
                      { label: "Port", value: smtpPort.toString() },
                      { label: "User", value: p },
                      { label: "Pass", value: "any" },
                      { label: "Auth", value: "Plain (if required)" },
                      { label: "TLS", value: "Usually off on localhost" },
                    ].map((row) => (
                      <div key={row.label} className="grid grid-cols-[110px_1fr] items-center text-[14px]">
                        <span className="opacity-70 font-medium">{row.label}:</span>
                        <div className="flex items-center gap-2 group/copy">
                          <span className="text-white truncate max-w-[200px]">{row.value}</span>
                          {row.label !== "Auth" && row.label !== "TLS" && (
                            <button
                              type="button"
                              onClick={() => handleCopy(row.value, row.label)}
                              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                            >
                              {copiedField === row.label ? (
                                <Check size={14} className="text-green-300" />
                              ) : (
                                <Copy size={13} className="opacity-40 group-hover/copy:opacity-100" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-[2rem] flex items-center gap-4">
                  <ShieldCheck className="text-[var(--primary)] shrink-0" size={24} />
                  <p className="text-[13px] text-[var(--primary)] font-semibold leading-relaxed">
                    Mail is accepted on your loopback interface only. Nothing is relayed externally
                    unless you configure relay or webhooks to do so.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] p-10 shadow-sm flex flex-col h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-[11px] font-black text-[var(--muted)] uppercase tracking-wider mb-2 ml-1">
                      Stack
                    </h2>
                    <div className="relative group">
                      <button
                        type="button"
                        className="bg-[var(--canvas)] px-6 py-2.5 rounded-full text-[13px] font-bold text-[#f8fafc] flex items-center gap-3 hover:bg-[var(--border)] transition-all min-w-[140px] justify-between"
                      >
                        {techType} <ChevronDown size={14} />
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 invisible group-hover:visible z-[100] transition-all">
                        {["Laravel", "Flutter", "Node.js", "Python", "Go"].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setTechType(lang)}
                            className="w-full text-left px-5 py-3 text-[13px] text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--primary)] transition-all font-bold"
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[11px] font-black text-[var(--muted)] uppercase tracking-wider mb-2 ml-1">
                      Workspace
                    </h2>
                    <div className="relative group">
                      <button
                        type="button"
                        className="bg-[var(--canvas)] px-6 py-2.5 rounded-full text-[13px] font-bold text-[var(--primary)] flex items-center gap-3 hover:bg-[var(--border)] transition-all min-w-[160px] justify-between border border-[var(--primary)]/10"
                      >
                        <div className="flex items-center gap-2">
                          <Layers size={14} />
                          <span className="truncate max-w-[100px]">{selectedProject || "Default"}</span>
                        </div>
                        <ChevronDown size={14} />
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 invisible group-hover:visible z-[100] transition-all max-h-[300px] overflow-y-auto custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(null)}
                          className="w-full text-left px-5 py-3 text-[13px] text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--primary)] transition-all font-bold flex items-center gap-2"
                        >
                          <Layout size={14} /> Default
                        </button>
                        {projects.map((project) => (
                          <button
                            key={project}
                            type="button"
                            onClick={() => setSelectedProject(project)}
                            className={`w-full text-left px-5 py-3 text-[13px] transition-all font-bold flex items-center gap-2 ${
                              selectedProject === project
                                ? "text-[var(--primary)] bg-[var(--primary)]/5"
                                : "text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--primary)]"
                            }`}
                          >
                            <Layers size={14} /> {project}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-[var(--canvas)] border border-[var(--border)] rounded-[2rem] p-10 font-mono text-[14px] text-[#f8fafc] relative group shadow-inner overflow-hidden">
                  <div className="absolute top-6 right-6 z-10">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          getFullConfigSnippet(techType, selectedProject),
                          "Integration snippet captured"
                        )
                      }
                      className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl border border-[var(--border)] flex items-center gap-2 ${
                        copiedField === "Integration snippet captured"
                          ? "bg-green-500 text-white"
                          : "bg-[var(--surface)] text-[var(--primary)]"
                      }`}
                    >
                      {copiedField === "Integration snippet captured" ? (
                        <Check size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                  <div className="custom-scrollbar overflow-x-auto whitespace-pre leading-loose font-medium opacity-80 h-full">
                    {getFullConfigSnippet(techType, selectedProject)}
                  </div>
                </div>

                <p className="mt-6 text-[12px] text-[var(--muted)] font-medium text-center">
                  More detail in{" "}
                  <button
                    type="button"
                    onClick={() => openExternalLink(GITHUB_REPO)}
                    className="text-[var(--primary)] hover:underline cursor-pointer font-bold"
                  >
                    the repository
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => openExternalLink(CHANGELOG_WEB_URL)}
                    className="text-[var(--primary)] hover:underline cursor-pointer font-bold"
                  >
                    CHANGELOG.md
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {helpSubTab === "whatsnew" && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-2">
                  Live from GitHub
                </p>
                <h1 className="text-3xl font-extrabold text-[#f8fafc] tracking-tight">
                  What&apos;s new
                </h1>
                <p className="text-[14px] text-[var(--muted)] font-medium mt-2 max-w-xl">
                  Pulled from{" "}
                  <code className="text-[12px] text-[#e2e8f0]">main/CHANGELOG.md</code> — the same
                  file we commit when we ship a version. After each release, refresh this tab to see
                  the newest section.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openExternalLink(CHANGELOG_WEB_URL)}
                  className="px-5 py-2.5 rounded-full border border-[var(--border)] text-[12px] font-bold text-[#f8fafc] hover:bg-[var(--surface)] flex items-center gap-2"
                >
                  <ExternalLink size={14} /> View on GitHub
                </button>
                <button
                  type="button"
                  onClick={() => openExternalLink(GITHUB_RELEASES_LATEST)}
                  className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-[12px] font-bold flex items-center gap-2 hover:opacity-90"
                >
                  <Download size={14} /> Releases
                </button>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] p-10 md:p-12 shadow-sm relative overflow-hidden">
              <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 h-80 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />

              {changelogLoading && (
                <p className="text-[14px] text-[var(--muted)] font-medium relative z-10">
                  Loading changelog…
                </p>
              )}
              {!changelogLoading && changelogError && (
                <div className="relative z-10 space-y-4">
                  <p className="text-[14px] text-[var(--muted)] font-medium">{changelogError}</p>
                  <button
                    type="button"
                    onClick={() => openExternalLink(CHANGELOG_WEB_URL)}
                    className="text-[13px] font-bold text-[var(--primary)] hover:underline"
                  >
                    Open CHANGELOG.md in the browser
                  </button>
                </div>
              )}
              {!changelogLoading && !changelogError && latestNotes && (
                <div className="relative z-10 max-w-3xl space-y-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_10px_#1877F2]" />
                    <span className="text-[13px] font-bold text-[#f8fafc] tracking-tight">
                      {latestNotes.heading}
                    </span>
                  </div>
                  <ChangelogLines text={latestNotes.body} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem]">
                <h4 className="text-[16px] font-bold text-[#f8fafc] mb-2">Older releases</h4>
                <p className="text-[13px] text-[var(--muted)] font-medium leading-relaxed">
                  Every version block in CHANGELOG.md stays in the file on GitHub. Use the file view
                  for the full timeline, or browse tagged{" "}
                  <button
                    type="button"
                    onClick={() => openExternalLink(`${GITHUB_REPO}/releases`)}
                    className="text-[var(--primary)] font-bold hover:underline"
                  >
                    Releases
                  </button>
                  .
                </p>
              </div>
              <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem]">
                <h4 className="text-[16px] font-bold text-[#f8fafc] mb-2">Shipping workflow</h4>
                <p className="text-[13px] text-[var(--muted)] font-medium leading-relaxed">
                  When we tag a release, CI builds installers and uploads artifacts. Updating{" "}
                  <code className="text-[11px] text-[#e2e8f0]">CHANGELOG.md</code> on{" "}
                  <code className="text-[11px] text-[#e2e8f0]">main</code> before or with that tag
                  keeps this tab truthful for everyone online.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
