import React, { useState } from 'react';
import { Smartphone, Server, X, Plus, Check } from 'lucide-react';
import { Language, translations } from '../translations.ts';

interface EnrollDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (payload: any) => Promise<any>;
  lang: Language;
}

export const EnrollDeviceModal: React.FC<EnrollDeviceModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  lang,
}) => {
  const t = translations[lang];

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [os, setOs] = useState<'Android' | 'Ubuntu' | 'Linux'>('Android');
  const [osVersion, setOsVersion] = useState('Android 14 (HyperOS)');
  const [networkType, setNetworkType] = useState<'5G' | '4G' | 'Wi-Fi' | 'Ethernet'>('5G');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onEnroll({
        name: name || undefined,
        model: model || undefined,
        os,
        osVersion,
        networkType,
      });
      onClose();
      setName('');
      setModel('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">{t.enrollDevice}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">DEVICE NAME / ALIAS</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Field Team Pixel 8, POS Terminal #4"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white font-sans focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">HARDWARE MODEL</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Samsung SM-S928B, Xiaomi 13 Pro"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white font-sans focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">OPERATING SYSTEM</label>
              <select
                value={os}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setOs(val);
                  if (val === 'Ubuntu') setOsVersion('Ubuntu 24.04 LTS');
                  if (val === 'Android') setOsVersion('Android 14 (OneUI 6.1)');
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="Android">Android</option>
                <option value="Ubuntu">Ubuntu Linux</option>
                <option value="Linux">Generic Linux</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">NETWORK CARRIER / TYPE</label>
              <select
                value={networkType}
                onChange={(e) => setNetworkType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="5G">5G Ultra</option>
                <option value="4G">4G LTE</option>
                <option value="Wi-Fi">Wi-Fi 6E</option>
                <option value="Ethernet">Ethernet LAN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">OS BUILD / FIRMWARE</label>
            <input
              type="text"
              value={osVersion}
              onChange={(e) => setOsVersion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              {isSubmitting ? 'Registering...' : t.enrollDevice}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
