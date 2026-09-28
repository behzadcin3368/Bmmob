import React from 'react';
import { 
  Smartphone, 
  BatteryCharging, 
  Database, 
  Radio, 
  MapPin, 
  ShieldCheck, 
  Activity, 
  Server,
  ArrowRight,
  Terminal,
  QrCode,
  FileCode2,
  RefreshCw
} from 'lucide-react';
import { DeviceInfo, FleetStats, AuditLog } from '../types.ts';
import { Language, translations } from '../translations.ts';

interface FleetOverviewProps {
  stats: FleetStats | null;
  devices: DeviceInfo[];
  auditLogs: AuditLog[];
  lang: Language;
  onSelectDevice: (device: DeviceInfo) => void;
  onNavigateTab: (tab: any) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({
  stats,
  devices,
  auditLogs,
  lang,
  onSelectDevice,
  onNavigateTab,
  onRefresh,
  isRefreshing,
}) => {
  const t = translations[lang];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Hero Section */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6">
        <div className="absolute top-0 right-0 w-96 h-full opacity-20 pointer-events-none overflow-hidden">
          <img 
            src="/src/assets/images/fleet_cluster_art_1790631935057.jpg" 
            alt="Fleet Cluster Architecture" 
            className="w-full h-full object-cover object-right"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-2">
            <span>C2 ENGINE ACTIVE</span>
            <span aria-hidden="true">·</span>
            <span>PORT {stats?.activePort || 3000}</span>
            <span aria-hidden="true">·</span>
            <span>UPTIME {stats?.serverUptimeHours || 148}H</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            {lang === 'fa' ? 'مرکز مدیریت و نظارت زنده ناوگان دستگاه‌ها' : 'Enterprise Device Fleet & Telemetry Operations'}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            {lang === 'fa' 
              ? 'پلتفرم جامع کنترل ریموت، اجرای فرامین ترمینال، مدیریت فایل‌ها، بازرسی پیامک و تماس‌ها، و اجرای سناریوهای امنیتی روی گوشی‌های اندروید و سرورها.' 
              : 'Unified management console for real-time mobile device operations, live remote screen mirroring, shell execution, telemetry auditing, and emergency wipe policies.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('terminal')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{t.executeCmd}</span>
            </button>
            <button
              onClick={() => onNavigateTab('builder')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t.scanToEnroll}</span>
            </button>
            <button
              onClick={() => onNavigateTab('deploy')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>{t.ubuntuDeploy}</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
              <span>{t.refresh}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Devices */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.totalDevices}</span>
            <Smartphone className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats?.totalDevices ?? devices.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono tabular-nums">{stats?.onlineDevices ?? devices.filter(d => d.status === 'online').length}</span>
            <span>{t.online}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{stats?.idleDevices ?? 0}</span>
            <span>{t.idle}</span>
          </div>
        </div>

        {/* Metric 2: Fleet Avg Battery */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.avgBattery}</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {stats?.avgBattery ?? 76}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {lang === 'fa' ? 'وضعیت سلامت شارژ پایدار' : 'Healthy power reserves'}
          </div>
        </div>

        {/* Metric 3: Fleet Storage */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.storage}</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats?.usedStorageGB?.toFixed(1) ?? '454.0'} <span className="text-sm font-normal text-slate-400">/ {stats?.totalStorageGB ?? 1152} GB</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span className="font-mono tabular-nums">
              {stats?.totalStorageGB ? Math.round((stats.usedStorageGB / stats.totalStorageGB) * 100) : 39}%
            </span>
            <span> {lang === 'fa' ? 'ظرفیت اشغال شده' : 'capacity utilized'}</span>
          </div>
        </div>

        {/* Metric 4: Audited Comms */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.comms}</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {(stats?.totalMessages ?? 4) + (stats?.totalCalls ?? 3)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-mono tabular-nums">{stats?.totalMessages ?? 4}</span>
            <span>SMS</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{stats?.totalCalls ?? 3}</span>
            <span>Calls</span>
          </div>
        </div>

      </div>

      {/* Two Column Section: Connected Devices & Geolocation Map List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enrolled Endpoints Summary List (2 Columns) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {lang === 'fa' ? 'دستگاه‌های آنلاین و فعال ناوگان' : 'Active Connected Endpoints'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'fa' ? 'مشاهده و دسترسی سریع به کلاینت‌های در حال تبادل داده' : 'Real-time telemetry heartbeat status'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('devices')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>{lang === 'fa' ? 'مشاهده همه' : 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                onClick={() => onSelectDevice(device)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 group-hover:border-sky-500/50 group-hover:text-sky-400 transition-colors">
                    {device.os === 'Ubuntu' || device.os === 'Linux' ? (
                      <Server className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                        {device.name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{device.model}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{device.osVersion}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">{device.ipAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="tabular-nums">{device.batteryLevel}%</span>
                  </div>

                  <div className="text-slate-400 font-mono text-[11px] px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60">
                    {device.networkType}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDevice(device);
                      onNavigateTab('live_screen');
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-sky-400 hover:text-white hover:bg-sky-600/20 border border-sky-500/30 rounded transition-colors"
                  >
                    {lang === 'fa' ? 'کنترل' : 'Control'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geolocation & Telemetry Nodes (1 Column) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">
                  {lang === 'fa' ? 'موقعیت جغرافیایی نودها' : 'Geographic Fleet Nodes'}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">GPS/Cell-ID</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {lang === 'fa' 
                ? 'مختصات دقیق مکانی دستگاه‌های فعال دریافت شده از طریق دکل و سنسور موقعیت‌یاب.' 
                : 'Real-time telemetry positioning markers from cellular and GNSS sensors.'}
            </p>

            <div className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-xs">
                  <div className="flex items-center justify-between font-medium text-slate-200 mb-1">
                    <span>{device.location.city}, {device.location.country}</span>
                    <span className="font-mono text-emerald-400 text-[11px]">±{device.location.accuracyMeters}m</span>
                  </div>
                  <div className="font-mono text-slate-400 text-[11px] flex items-center justify-between">
                    <span>{device.location.latitude.toFixed(4)}° N, {device.location.longitude.toFixed(4)}° E</span>
                    <span className="text-slate-500 truncate max-w-[120px]">{device.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'fa' 
                ? 'رمزنگاری ارتباط TLS 1.3 و احراز هویت با کلیدهای اختصاصی فعال است.' 
                : 'Encrypted C2 channel with mutual enterprise token authentication.'}
            </span>
          </div>

        </div>

      </div>

      {/* Recent Security & Operations Audit Stream */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">
              {lang === 'fa' ? 'لاگ عملیات و رخدادهای اخیر امنیتی' : 'Recent Telemetry & Audit Stream'}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
          >
            {lang === 'fa' ? 'مشاهده همه لاگ‌ها' : 'Full Audit Trail'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-medium">{lang === 'fa' ? 'زمان' : 'Timestamp'}</th>
                <th className="pb-2.5 font-medium">{lang === 'fa' ? 'اقدام / رویداد' : 'Action'}</th>
                <th className="pb-2.5 font-medium">{lang === 'fa' ? 'دستگاه مقصد' : 'Endpoint'}</th>
                <th className="pb-2.5 font-medium">{lang === 'fa' ? 'جزئیات' : 'Details'}</th>
                <th className="pb-2.5 font-medium text-right">{lang === 'fa' ? 'سطح' : 'Severity'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-2.5 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 font-semibold text-white whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 text-slate-300 whitespace-nowrap">
                    {log.deviceName || log.deviceId || 'System'}
                  </td>
                  <td className="py-2.5 text-slate-400 font-sans max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      log.severity === 'critical' 
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50' 
                        : log.severity === 'warn'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                        : 'bg-sky-950/60 text-sky-400 border border-sky-800/50'
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
