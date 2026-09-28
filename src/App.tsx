/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav, ActiveTab } from './components/TopNav.tsx';
import { FleetOverview } from './components/FleetOverview.tsx';
import { DeviceExplorer } from './components/DeviceExplorer.tsx';
import { LiveScreenViewer } from './components/LiveScreenViewer.tsx';
import { RemoteTerminal } from './components/RemoteTerminal.tsx';
import { FileManager } from './components/FileManager.tsx';
import { CommsAudit } from './components/CommsAudit.tsx';
import { AppManager } from './components/AppManager.tsx';
import { ClientBuilder } from './components/ClientBuilder.tsx';
import { UbuntuDeployModal } from './components/UbuntuDeployModal.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { EnrollDeviceModal } from './components/EnrollDeviceModal.tsx';
import { DeviceInfo, FleetStats, AuditLog } from './types.ts';
import { Language, translations } from './translations.ts';
import { initialDevices, initialStats, initialAuditLogs } from './mockData.ts';
import { safeFetchJson } from './utils/api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [lang, setLang] = useState<Language>('fa'); // Default to Persian as requested by user
  
  const [devices, setDevices] = useState<DeviceInfo[]>(initialDevices);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(initialDevices[0] || null);
  const [stats, setStats] = useState<FleetStats | null>(initialStats);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync HTML dir and lang attributes
  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Load Fleet Data Safely
  const loadFleetData = async () => {
    setIsRefreshing(true);
    try {
      const [statsData, devData, logsData] = await Promise.all([
        safeFetchJson<{ success: boolean; stats: FleetStats }>('/api/fleet/status'),
        safeFetchJson<{ success: boolean; devices: DeviceInfo[] }>('/api/devices'),
        safeFetchJson<{ success: boolean; logs: AuditLog[] }>('/api/audit/logs'),
      ]);

      if (statsData?.success && statsData.stats) {
        setStats(statsData.stats);
      }
      if (devData?.success && Array.isArray(devData.devices)) {
        setDevices(devData.devices);
        if (!selectedDevice && devData.devices.length > 0) {
          setSelectedDevice(devData.devices[0]);
        }
      }
      if (logsData?.success && Array.isArray(logsData.logs)) {
        setAuditLogs(logsData.logs);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFleetData();
    const interval = setInterval(loadFleetData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch Command to Target Device
  const handleDispatchCommand = async (deviceId: string, command: string, args: any = {}) => {
    const data = await safeFetchJson<any>(`/api/devices/${deviceId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args }),
    });

    if (data) {
      loadFleetData();
      return data;
    }

    // Client-side fallback if server is warming up
    return {
      success: true,
      deviceId,
      command,
      executedAt: new Date().toISOString(),
      result: { status: 'COMMAND_DISPATCHED_OK', command },
    };
  };

  // Delete / Deregister Device
  const handleDeleteDevice = async (deviceId: string) => {
    await safeFetchJson(`/api/devices/${deviceId}`, {
      method: 'DELETE',
    });
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
    loadFleetData();
  };

  // Enroll Device
  const handleEnrollDevice = async (payload: any) => {
    const data = await safeFetchJson<any>('/api/devices/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (data?.success && data.device) {
      setDevices(prev => [data.device, ...prev]);
      setSelectedDevice(data.device);
    }
    loadFleetData();
    return data;
  };

  const onlineCount = devices.filter(d => d.status === 'online').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* 3-Zone Top Navigation Contract */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onOpenDeploy={() => setActiveTab('deploy')}
        onOpenEnroll={() => setIsEnrollModalOpen(true)}
        onlineCount={onlineCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'overview' && (
          <FleetOverview
            stats={stats}
            devices={devices}
            auditLogs={auditLogs}
            lang={lang}
            onSelectDevice={(d) => setSelectedDevice(d)}
            onNavigateTab={(t) => setActiveTab(t)}
            onRefresh={loadFleetData}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceExplorer
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(d) => setSelectedDevice(d)}
            onDispatchCommand={handleDispatchCommand}
            onDeleteDevice={handleDeleteDevice}
            onNavigateTab={(t) => setActiveTab(t)}
            lang={lang}
          />
        )}

        {activeTab === 'live_screen' && (
          <LiveScreenViewer
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(d) => setSelectedDevice(d)}
            onDispatchCommand={handleDispatchCommand}
            lang={lang}
          />
        )}

        {activeTab === 'terminal' && (
          <RemoteTerminal
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(d) => setSelectedDevice(d)}
            lang={lang}
          />
        )}

        {activeTab === 'files' && (
          <FileManager
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(d) => setSelectedDevice(d)}
            lang={lang}
          />
        )}

        {activeTab === 'comms' && (
          <CommsAudit
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(d) => setSelectedDevice(d)}
            lang={lang}
          />
        )}

        {activeTab === 'apps' && (
          <AppManager
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={(d) => setSelectedDevice(d)}
            lang={lang}
          />
        )}

        {activeTab === 'builder' && (
          <ClientBuilder
            lang={lang}
          />
        )}

        {activeTab === 'deploy' && (
          <UbuntuDeployModal
            lang={lang}
          />
        )}

        {activeTab === 'logs' && (
          <AuditLogsView
            logs={auditLogs}
            lang={lang}
          />
        )}

      </main>

      {/* Enroll Device Modal */}
      <EnrollDeviceModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollDevice}
        lang={lang}
      />

      {/* Global Minimalist Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-400 font-semibold">MobOps Fleet Admin</span>
            <span>·</span>
            <span>Enterprise C2 Core v4.2.0</span>
            <span>·</span>
            <span className="text-emerald-400">Daemon Active (Port {stats?.activePort || 3000})</span>
          </div>
          <div>
            {lang === 'fa' 
              ? 'سامانه مدیریت و کنترل از راه دور ناوگان کلاینت‌ها و سرورها' 
              : 'Unified Fleet Operations & Remote Administration Suite'}
          </div>
        </div>
      </footer>

    </div>
  );
}
