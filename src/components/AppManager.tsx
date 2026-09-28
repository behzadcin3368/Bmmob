import React, { useState, useEffect } from 'react';
import { 
  AppWindow, 
  Play, 
  Snowflake, 
  Trash2, 
  Shield, 
  Package, 
  Search, 
  Upload, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { DeviceInfo, DeviceApp } from '../types.ts';
import { Language, translations } from '../translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface AppManagerProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  lang: Language;
}

export const AppManager: React.FC<AppManagerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  lang,
}) => {
  const t = translations[lang];
  const currentDevice = selectedDevice || devices[0];

  const [apps, setApps] = useState<DeviceApp[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchApps = async () => {
    if (!currentDevice) return;
    setLoading(true);
    try {
      const data = await safeFetchJson<{ success: boolean; apps: DeviceApp[] }>(`/api/devices/${currentDevice.id}/apps`);
      if (data?.success && Array.isArray(data.apps)) {
        setApps(data.apps);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [currentDevice]);

  const handleAppAction = async (packageName: string, action: 'freeze' | 'unfreeze' | 'uninstall' | 'launch') => {
    if (!currentDevice) return;
    const data = await safeFetchJson<any>(`/api/devices/${currentDevice.id}/apps/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageName, action }),
    });
    if (data?.success) {
      setNotice(`Applied ${action.toUpperCase()} to ${packageName}`);
      fetchApps();
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = 
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'system' && app.isSystem) || 
      (filterType === 'user' && !app.isSystem);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Device Bar & Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <AppWindow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Target Package Manager:</span>
              <select
                value={currentDevice?.id || ''}
                onChange={(e) => {
                  const target = devices.find(d => d.id === e.target.value);
                  if (target) onSelectDevice(target);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.os})</option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              <span>Total Packages: {apps.length}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>APK Injection: READY</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {(['all', 'user', 'system'] as const).map(ft => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1 rounded-md font-medium transition-colors capitalize ${
                  filterType === ft ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert(lang === 'fa' ? 'قابلیت آپلود بسته نصبی APK از طریق پنل فعال شد.' : 'Remote APK package sideloading channel active.')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Install APK</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-sky-950/80 border border-sky-800 rounded-lg text-xs font-mono text-sky-300">
          {notice}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter installed packages by app name or package identifier..."
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Applications Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                <th className="py-3 px-4 font-medium">APPLICATION</th>
                <th className="py-3 px-4 font-medium">PACKAGE NAME</th>
                <th className="py-3 px-4 font-medium">VERSION</th>
                <th className="py-3 px-4 font-medium">SIZE</th>
                <th className="py-3 px-4 font-medium">TYPE</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 text-xs font-bold">
                        {app.appName.charAt(0)}
                      </div>
                      <span>{app.appName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">{app.packageName}</td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">v{app.version}</td>
                  <td className="py-3 px-4 text-slate-400 tabular-nums whitespace-nowrap">{app.sizeMB} MB</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                      app.isSystem 
                        ? 'bg-slate-800 text-slate-400 border-slate-700' 
                        : 'bg-sky-950/60 text-sky-400 border-sky-800/60'
                    }`}>
                      {app.isSystem ? 'System' : 'User'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] ${
                      app.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="capitalize">{app.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleAppAction(app.packageName, 'launch')}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 mr-1.5"
                      title={t.launchApp}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    {app.status === 'active' ? (
                      <button
                        onClick={() => handleAppAction(app.packageName, 'freeze')}
                        className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 mr-1.5"
                        title={t.freezePackage}
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAppAction(app.packageName, 'unfreeze')}
                        className="p-1 rounded text-amber-400 hover:text-emerald-400 hover:bg-slate-800 mr-1.5"
                        title={t.unfreezePackage}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!app.isSystem && (
                      <button
                        onClick={() => handleAppAction(app.packageName, 'uninstall')}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title={t.uninstall}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
