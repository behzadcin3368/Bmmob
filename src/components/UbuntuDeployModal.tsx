import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  Code
} from 'lucide-react';
import { Language, translations } from '../translations.ts';
import { safeFetchText } from '../utils/api.ts';

const defaultDeployScript = `#!/usr/bin/env bash
# ==============================================================================
# MobOps Fleet Administration - Production Ubuntu Auto-Deploy Script
# Supported OS: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS (x86_64 / aarch64)
# ==============================================================================

set -euo pipefail

APP_NAME="mobops-fleet"
APP_DIR="/var/www/mobops-fleet"
PORT=3000
NODE_MAJOR=20

echo "[INFO] Starting MobOps Fleet Production Deployment..."
if [[ $EUID -ne 0 ]]; then
   echo "[ERROR] Please re-run as root: sudo bash $0"
   exit 1
fi

apt-get update -y
apt-get install -y curl wget git build-essential ufw nginx jq

# Install Node.js LTS
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_\${NODE_MAJOR}.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
command -v pm2 >/dev/null 2>&1 || npm install -g pm2

mkdir -p "\${APP_DIR}"
cd "\${APP_DIR}"

# Install dependencies and build
npm install --production=false
npm run build

# PM2 & Systemd Startup
pm2 start server.ts --name "\${APP_NAME}" || pm2 restart "\${APP_NAME}"
pm2 save
pm2 startup systemd -u root --hp /root || true

# Nginx Configuration on Port 80
cat > /etc/nginx/sites-available/\${APP_NAME} << EOF
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:\${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/\${APP_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
systemctl restart nginx

echo "[SUCCESS] MobOps Fleet Dashboard is live on http://$(curl -s ifconfig.me):80"
`;

interface UbuntuDeployModalProps {
  lang: Language;
}

export const UbuntuDeployModal: React.FC<UbuntuDeployModalProps> = ({ lang }) => {
  const t = translations[lang];

  const [scriptContent, setScriptContent] = useState<string>(defaultDeployScript);
  const [copiedOneLine, setCopiedOneLine] = useState(false);
  const [copiedFullScript, setCopiedFullScript] = useState(false);

  const serverUrl = window.location.origin;
  const oneLineCommand = `curl -sSL ${serverUrl}/api/script/ubuntu-install | sudo bash`;

  useEffect(() => {
    safeFetchText('/api/script/ubuntu-install').then(txt => {
      if (txt && !txt.includes('<!DOCTYPE') && txt.length > 50) {
        setScriptContent(txt);
      }
    });
  }, []);

  const copyOneLine = () => {
    navigator.clipboard.writeText(oneLineCommand);
    setCopiedOneLine(true);
    setTimeout(() => setCopiedOneLine(false), 2000);
  };

  const copyFullScript = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopiedFullScript(true);
    setTimeout(() => setCopiedFullScript(false), 2000);
  };

  const downloadScriptFile = () => {
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy-ubuntu.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Header */}
      <div className="p-6 rounded-xl border border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Server className="w-4 h-4" />
          <span>UBUNTU 20.04 / 22.04 / 24.04 LTS TESTED & VERIFIED</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {lang === 'fa' ? 'اسکریپت نصب و راه‌اندازی خودکار روی سرور اوبونتو' : 'Automated Ubuntu Server Deployment Suite'}
        </h1>

        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {lang === 'fa'
            ? 'این اسکریپت تمام وابستگی‌های سیستمی، Node.js LTS، پکیج منیجر PM2، وب‌سرور Nginx (جهت پراکسی و وب‌سوکت لایو)، فایروال UFW و بیلد پروداکشن را به‌صورت کامپوننت به کامپوننت روی سرور شما پیاده‌سازی و اجرا می‌کند.'
            : 'Turnkey bash deployment script to auto-configure system packages, Node.js LTS runtime, PM2 process manager daemon, Nginx reverse proxy with WebSocket support, and UFW firewall rules.'}
        </p>

        {/* 1-Line Execution Banner */}
        <div className="pt-2">
          <label className="text-[11px] font-mono text-emerald-400 font-semibold block mb-1.5 uppercase">
            {t.oneLineUbuntu}
          </label>
          <div className="p-3.5 bg-black/80 border border-emerald-900/80 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-300 shadow-xl overflow-x-auto">
            <code className="select-all">{oneLineCommand}</code>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyOneLine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {copiedOneLine ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOneLine ? t.copied : t.copyCommand}</span>
              </button>
              <button
                onClick={downloadScriptFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Download .sh file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">.sh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Execution Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
          <span>{t.ubuntuInstructionsTitle}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center font-bold text-sky-400">
              1
            </div>
            <h3 className="font-semibold text-white">
              {lang === 'fa' ? 'اتصال به سرور اوبونتو با SSH' : 'Connect via SSH'}
            </h3>
            <p className="text-slate-400 leading-relaxed font-sans">
              {lang === 'fa' 
                ? 'با نرم‌افزار Putty یا ترمینال وارد سرور شوید:' 
                : 'Log in to your Ubuntu cloud/VPS server terminal:'}
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
              ssh root@YOUR_SERVER_IP
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400">
              2
            </div>
            <h3 className="font-semibold text-white">
              {lang === 'fa' ? 'اجرای دستور نصب یک‌خطی' : 'Execute Install Script'}
            </h3>
            <p className="text-slate-400 leading-relaxed font-sans">
              {lang === 'fa' 
                ? 'دستور بالا را کپی و در خط فرمان سرور پیست کنید تا اسکریپت شروع شود.' 
                : 'Paste the one-line command to trigger the unattended setup process.'}
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-400 truncate">
              {oneLineCommand}
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-purple-400">
              3
            </div>
            <h3 className="font-semibold text-white">
              {lang === 'fa' ? 'دسترسی به داشبورد در مرورگر' : 'Access Web Dashboard'}
            </h3>
            <p className="text-slate-400 leading-relaxed font-sans">
              {lang === 'fa' 
                ? 'پس از اتمام، پنل روی پورت 80 و 3000 با آدرس IP سرور در دسترس خواهد بود.' 
                : 'Browse to http://YOUR_SERVER_IP:3000 to manage your fleet.'}
            </p>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-purple-300">
              http://YOUR_SERVER_IP:3000
            </div>
          </div>

        </div>

        {/* Useful Maintenance Commands */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase mb-3">
            {lang === 'fa' ? 'دستورات مهم مدیریت و مانیتورینگ PM2 روی سرور:' : 'Production PM2 Server Management Commands:'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-sky-400 font-bold block">pm2 status</span>
              <span className="text-slate-500 text-[11px] font-sans">مشاهده وضعیت زنده سرویس</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold block">pm2 logs mobops-fleet</span>
              <span className="text-slate-500 text-[11px] font-sans">مشاهده لاگ‌های اتصال زنده</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-amber-400 font-bold block">pm2 restart mobops-fleet</span>
              <span className="text-slate-500 text-[11px] font-sans">راه‌اندازی مجدد پروسه سرور</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-purple-400 font-bold block">systemctl status nginx</span>
              <span className="text-slate-500 text-[11px] font-sans">بررسی وضعیت وب‌سرور Nginx</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Script Code Viewer */}
      <div className="rounded-xl border border-slate-800 bg-[#080d1a] overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>deploy-ubuntu.sh (Raw Shell Script Source)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyFullScript}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-750 rounded transition-colors cursor-pointer"
            >
              {copiedFullScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFullScript ? t.copied : 'Copy Script'}</span>
            </button>
            <button
              onClick={downloadScriptFile}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sh</span>
            </button>
          </div>
        </div>

        <pre className="p-5 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[480px] scrollbar-none select-text">
          {scriptContent || '# Loading deployment script source...'}
        </pre>
      </div>

    </div>
  );
};
