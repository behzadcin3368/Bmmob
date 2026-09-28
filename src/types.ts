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

export interface FleetStats {
  totalDevices: number;
  onlineDevices: number;
  idleDevices: number;
  offlineDevices: number;
  avgBattery: number;
  totalStorageGB: number;
  usedStorageGB: number;
  totalMessages: number;
  totalCalls: number;
  totalAuditLogs: number;
  serverUptimeHours: number;
  c2ServerStatus: string;
  activePort: number;
}
