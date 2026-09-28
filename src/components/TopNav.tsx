import React from 'react';
import { 
  Server, 
  Smartphone, 
  Terminal, 
  FolderTree, 
  MessageSquare, 
  Cpu, 
  QrCode, 
  FileCode2, 
  ShieldAlert, 
  MonitorPlay,
  Globe2,
  Plus
} from 'lucide-react';
import { Language, translations } from '../translations.ts';

export type ActiveTab = 
  | 'overview' 
  | 'devices' 
  | 'live_screen' 
  | 'terminal' 
  | 'files' 
  | 'comms' 
  | 'apps' 
  | 'builder' 
  | 'deploy' 
  | 'logs';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenDeploy: () => void;
  onOpenEnroll: () => void;
  onlineCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onOpenDeploy,
  onOpenEnroll,
  onlineCount,
}) => {
  const t = translations[lang];

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t.overview, icon: <Server className="w-4 h-4" /> },
    { id: 'devices', label: t.devices, icon: <Smartphone className="w-4 h-4" /> },
    { id: 'live_screen', label: t.liveScreen, icon: <MonitorPlay className="w-4 h-4" /> },
    { id: 'terminal', label: t.terminal, icon: <Terminal className="w-4 h-4" /> },
    { id: 'files', label: t.fileManager, icon: <FolderTree className="w-4 h-4" /> },
    { id: 'comms', label: t.comms, icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'apps', label: t.apps, icon: <Cpu className="w-4 h-4" /> },
    { id: 'builder', label: t.builder, icon: <QrCode className="w-4 h-4" /> },
    { id: 'deploy', label: t.ubuntuDeploy, icon: <FileCode2 className="w-4 h-4" /> },
    { id: 'logs', label: t.auditLogs, icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
              MO
            </div>
            <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>MobOps</span>
              <span className="text-xs font-mono font-normal text-sky-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/40">
                Fleet Admin
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Online Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount} {t.online}</span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-colors cursor-pointer"
              title="تغییر زبان / Change Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
            </button>

            {/* Ubuntu Quick Deploy Button */}
            <button
              onClick={onOpenDeploy}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-md transition-colors cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Ubuntu Script</span>
            </button>

            {/* Enroll New Device Button */}
            <button
              onClick={onOpenEnroll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.enrollDevice}</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-900 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
                  isActive 
                    ? 'bg-slate-800 text-sky-400 border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
