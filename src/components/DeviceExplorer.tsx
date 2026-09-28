import React, { useState } from 'react';
import { 
  Smartphone, 
  Server, 
  BatteryCharging, 
  HardDrive, 
  Cpu, 
  Wifi, 
  MapPin, 
  Terminal, 
  FolderTree, 
  MessageSquare, 
  AppWindow, 
  Lock, 
  Unlock, 
  Flame, 
  Radio, 
  Trash2, 
  Eye, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Lightbulb,
  Vibrate
} from 'lucide-react';
import { DeviceInfo } from '../types.ts';
import { Language, translations } from '../translations.ts';

interface DeviceExplorerProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  onDispatchCommand: (deviceId: string, command: string, args?: any) => Promise<any>;
  onDeleteDevice: (deviceId: string) => Promise<any>;
  onNavigateTab: (tab: any) => void;
  lang: Language;
}

export const DeviceExplorer: React.FC<DeviceExplorerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onDispatchCommand,
  onDeleteDevice,
  onNavigateTab,
  lang,
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'idle' | 'offline'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeTargetDevice, setWipeTargetDevice] = useState<DeviceInfo | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Filtering
  const filteredDevices = devices.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.imei.includes(searchQuery) ||
      d.ipAddress.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCommand = async (deviceId: string, command: string, args?: any) => {
    try {
      const res = await onDispatchCommand(deviceId, command, args);
      setCommandFeedback(`${command.toUpperCase()}: ${JSON.stringify(res.result || res.status || 'OK')}`);
      setTimeout(() => setCommandFeedback(null), 4000);
    } catch (err: any) {
      setCommandFeedback(`Error: ${err.message}`);
      setTimeout(() => setCommandFeedback(null), 4000);
    }
  };

  const confirmWipe = async () => {
    if (!wipeTargetDevice) return;
    await handleCommand(wipeTargetDevice.id, 'wipe_data');
    setIsWipeModalOpen(false);
    setWipeTargetDevice(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs (Interactive segmented control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {(['all', 'online', 'idle', 'offline'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                statusFilter === st 
                  ? 'bg-slate-800 text-sky-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'all' ? t.allStatus : t[st]}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
              viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
              viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Table
          </button>
        </div>

      </div>

      {/* Floating Command Execution Toast */}
      {commandFeedback && (
        <div className="p-3 rounded-lg border border-sky-500/50 bg-sky-950/80 text-sky-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{commandFeedback}</span>
          <button onClick={() => setCommandFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDevices.map((device) => {
            const isSelected = selectedDevice?.id === device.id;
            return (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className={`rounded-xl border transition-all p-5 flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'border-sky-500 bg-slate-900/90 ring-1 ring-sky-500/20 shadow-md' 
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                        {device.os === 'Ubuntu' || device.os === 'Linux' ? (
                          <Server className="w-5 h-5" />
                        ) : (
                          <Smartphone className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{device.name}</h3>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{device.model}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px]">{device.osVersion}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {device.networkType}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 my-3 text-xs font-mono">
                    {/* Battery */}
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                        <span>BATTERY</span>
                        <BatteryCharging className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="font-bold text-slate-200 tabular-nums">
                        {device.batteryLevel}% {device.isCharging ? '⚡' : ''}
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                        <span>STORAGE</span>
                        <HardDrive className="w-3 h-3 text-sky-400" />
                      </div>
                      <div className="font-bold text-slate-200 tabular-nums">
                        {device.storageUsedGB} / {device.storageTotalGB}G
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-850">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                        <span>RAM</span>
                        <Cpu className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="font-bold text-slate-200 tabular-nums">
                        {device.ramUsedGB} / {device.ramTotalGB}G
                      </div>
                    </div>
                  </div>

                  {/* Device Identifiers & Geolocation */}
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IP ADDRESS:</span>
                      <span className="text-slate-300">{device.ipAddress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IMEI IDENTIFIER:</span>
                      <span className="text-slate-300">{device.imei}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">LOCATION:</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-400" />
                        {device.location.city}, {device.location.country}
                      </span>
                    </div>
                  </div>

                  {/* Active Permissions Audit Checklist */}
                  <div className="mb-4">
                    <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                      {t.permissions}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                      {Object.entries(device.permissions).map(([permKey, isGranted]) => (
                        <span
                          key={permKey}
                          className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                            isGranted 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60' 
                              : 'bg-slate-950 text-slate-600 border-slate-800'
                          }`}
                        >
                          {isGranted ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          <span>{permKey}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Controls & Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* View Navigators */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                        onNavigateTab('live_screen');
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition-colors"
                      title={t.liveScreen}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                        onNavigateTab('terminal');
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={t.terminal}
                    >
                      <Terminal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                        onNavigateTab('files');
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={t.fileManager}
                    >
                      <FolderTree className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                        onNavigateTab('comms');
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={t.comms}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                        onNavigateTab('apps');
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={t.apps}
                    >
                      <AppWindow className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Immediate Device Command Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommand(device.id, 'ping');
                      }}
                      className="p-1.5 rounded bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-sky-400 border border-slate-700/60 transition-colors"
                      title={t.ping}
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommand(device.id, device.screenLocked ? 'wake_screen' : 'lock_screen');
                      }}
                      className={`p-1.5 rounded border transition-colors ${
                        device.screenLocked 
                          ? 'bg-amber-950/50 border-amber-800/60 text-amber-400' 
                          : 'bg-slate-850 border-slate-750 text-slate-300 hover:text-white'
                      }`}
                      title={device.screenLocked ? t.unlockScreen : t.lockScreen}
                    >
                      {device.screenLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommand(device.id, 'toggle_torch');
                      }}
                      className={`p-1.5 rounded border transition-colors ${
                        device.torchOn 
                          ? 'bg-yellow-950/50 border-yellow-800/60 text-yellow-400' 
                          : 'bg-slate-850 border-slate-750 text-slate-300 hover:text-white'
                      }`}
                      title={t.toggleTorch}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommand(device.id, 'vibrate', { duration: 1500 });
                      }}
                      className="p-1.5 rounded bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 transition-colors"
                      title={t.vibrate}
                    >
                      <Vibrate className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWipeTargetDevice(device);
                        setIsWipeModalOpen(true);
                      }}
                      className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 transition-colors"
                      title={t.wipeDevice}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove device ${device.name}?`)) {
                          onDeleteDevice(device.id);
                        }
                      }}
                      className="p-1.5 rounded bg-slate-850 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 border border-slate-750 transition-colors"
                      title="Deregister"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High Density Data Table View */
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                  <th className="py-3 px-4 font-medium">ENDPOINT</th>
                  <th className="py-3 px-4 font-medium">OS / VERSION</th>
                  <th className="py-3 px-4 font-medium">IP / NETWORK</th>
                  <th className="py-3 px-4 font-medium">BATTERY</th>
                  <th className="py-3 px-4 font-medium">STORAGE</th>
                  <th className="py-3 px-4 font-medium">STATUS</th>
                  <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredDevices.map((device) => (
                  <tr 
                    key={device.id} 
                    onClick={() => onSelectDevice(device)}
                    className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white font-sans">{device.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{device.imei}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{device.osVersion}</td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {device.ipAddress} <span className="text-slate-500">({device.networkType})</span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 tabular-nums whitespace-nowrap">
                      {device.batteryLevel}% {device.isCharging ? '⚡' : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-300 tabular-nums whitespace-nowrap">
                      {device.storageUsedGB} / {device.storageTotalGB} GB
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {device.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDevice(device);
                          onNavigateTab('live_screen');
                        }}
                        className="px-2.5 py-1 text-xs text-sky-400 hover:text-white bg-slate-800 rounded mr-2"
                      >
                        Control
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDevice(device);
                          onNavigateTab('terminal');
                        }}
                        className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded"
                      >
                        Shell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emergency Remote Wipe Confirmation Modal */}
      {isWipeModalOpen && wipeTargetDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-800/80 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t.dangerZone}</h3>
                <p className="text-xs text-rose-400">Remote Wipe & Factory Reset</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.confirmWipe}
            </p>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
              <div><span className="text-slate-500">Target Device:</span> <span className="text-white font-bold">{wipeTargetDevice.name}</span></div>
              <div><span className="text-slate-500">IMEI:</span> <span className="text-slate-300">{wipeTargetDevice.imei}</span></div>
              <div><span className="text-slate-500">IP:</span> <span className="text-slate-300">{wipeTargetDevice.ipAddress}</span></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsWipeModalOpen(false);
                  setWipeTargetDevice(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmWipe}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
