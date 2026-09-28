import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Download, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Calendar
} from 'lucide-react';
import { AuditLog } from '../types.ts';
import { Language, translations } from '../translations.ts';

interface AuditLogsViewProps {
  logs: AuditLog[];
  lang: Language;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, lang }) => {
  const t = translations[lang];
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warn' | 'info'>('all');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      (l.deviceName && l.deviceName.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `mobops_audit_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-400" />
            <span>{t.auditLogs}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'fa' 
              ? 'ثبت و رصد تغییرات وضعیت، فرامین ارسالی، عملیات فایل و رویدادهای بحرانی ناوگان' 
              : 'Tamper-evident chronological audit trail for administrative operations and security policies.'}
          </p>
        </div>

        <button
          onClick={exportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON Audit</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter audit entries by action or keywords..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
          {(['all', 'critical', 'warn', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded transition-colors uppercase ${
                severityFilter === sev 
                  ? 'bg-slate-800 text-sky-400 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                <th className="py-3 px-4 font-medium">TIMESTAMP</th>
                <th className="py-3 px-4 font-medium">ACTION EVENT</th>
                <th className="py-3 px-4 font-medium">TARGET ENDPOINT</th>
                <th className="py-3 px-4 font-medium">OPERATOR</th>
                <th className="py-3 px-4 font-medium">AUDIT DETAILS</th>
                <th className="py-3 px-4 font-medium text-right">SEVERITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    {log.deviceName || log.deviceId || 'System Engine'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {log.user}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans max-w-sm truncate">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.severity === 'critical'
                        ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                        : log.severity === 'warn'
                        ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
                        : 'bg-sky-950/70 text-sky-400 border border-sky-800/60'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
