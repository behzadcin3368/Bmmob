import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Upload, 
  FolderPlus, 
  ArrowLeft, 
  HardDrive,
  RefreshCw,
  Search,
  Package
} from 'lucide-react';
import { DeviceInfo, DeviceFileItem } from '../types.ts';
import { Language, translations } from '../translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface FileManagerProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  lang: Language;
}

export const FileManager: React.FC<FileManagerProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  lang,
}) => {
  const t = translations[lang];
  const currentDevice = selectedDevice || devices[0];

  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [files, setFiles] = useState<DeviceFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchFiles = async (dirPath: string) => {
    if (!currentDevice) return;
    setLoading(true);
    try {
      const data = await safeFetchJson<{ success: boolean; files: DeviceFileItem[] }>(
        `/api/devices/${currentDevice.id}/files?path=${encodeURIComponent(dirPath)}`
      );
      if (data?.success && Array.isArray(data.files)) {
        setFiles(data.files);
        setCurrentPath(dirPath);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentDevice]);

  const handleFolderClick = (folderPath: string) => {
    fetchFiles(folderPath);
  };

  const handleGoBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      fetchFiles('/sdcard');
      return;
    }
    parts.pop();
    const parentPath = '/' + parts.join('/');
    fetchFiles(parentPath);
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm(`Delete ${filePath}?`)) return;
    try {
      const res = await fetch(`/api/devices/${currentDevice.id}/files/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_file', filePath }),
      });
      const data = await res.json();
      setActionNotice(`File deleted: ${filePath}`);
      fetchFiles(currentPath);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownloadFile = async (item: DeviceFileItem) => {
    // Generate simulated download
    const blob = new Blob([`Content of ${item.name} from device ${currentDevice.name}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
    setActionNotice(`Downloaded ${item.name}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetch(`/api/devices/${currentDevice.id}/files/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_folder', filePath: `${currentPath}/${newFolderName}` }),
      });
      setIsNewFolderModalOpen(false);
      setNewFolderName('');
      fetchFiles(currentPath);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFileName.trim()) return;
    try {
      await fetch(`/api/devices/${currentDevice.id}/files/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload_file', filePath: `${currentPath}/${uploadFileName}` }),
      });
      setIsUploadModalOpen(false);
      setUploadFileName('');
      fetchFiles(currentPath);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="space-y-4">
      
      {/* Top Device Bar & Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-800/80 flex items-center justify-center text-sky-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Target Endpoint:</span>
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
              <span>Used: {currentDevice?.storageUsedGB} GB</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Total: {currentDevice?.storageTotalGB} GB</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.newFolder}</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.uploadFile}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-sky-950/80 border border-sky-800/80 rounded-lg text-xs font-mono text-sky-300">
          {actionNotice}
        </div>
      )}

      {/* Breadcrumb Path & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 overflow-x-auto scrollbar-none">
          <button
            onClick={handleGoBack}
            className="p-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-white"
            title="Go up one directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-500 font-bold">PATH:</span>
          <span className="text-sky-400 font-semibold">{currentPath}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter files..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            onClick={() => fetchFiles(currentPath)}
            disabled={loading}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Grid / Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono">
                <th className="py-2.5 px-4 font-medium">NAME</th>
                <th className="py-2.5 px-4 font-medium">SIZE</th>
                <th className="py-2.5 px-4 font-medium">MODIFIED</th>
                <th className="py-2.5 px-4 font-medium">PERMS</th>
                <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredFiles.map((file) => (
                <tr 
                  key={file.id} 
                  className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                  onClick={() => file.isDirectory && handleFolderClick(file.path)}
                >
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      {file.isDirectory ? (
                        <Folder className="w-4 h-4 text-sky-400 shrink-0 fill-sky-500/20" />
                      ) : file.name.endsWith('.apk') ? (
                        <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : file.name.endsWith('.png') || file.name.endsWith('.jpg') ? (
                        <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`font-medium ${file.isDirectory ? 'text-white hover:text-sky-300' : 'text-slate-300'}`}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 tabular-nums whitespace-nowrap">
                    {file.isDirectory ? '—' : formatBytes(file.sizeBytes)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{file.modified}</td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">{file.permissions}</td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    {!file.isDirectory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 mr-2"
                        title={t.downloadFile}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.path);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      title={t.deleteFile}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">{t.newFolder}</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name (e.g. Logs, Payload)..."
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">{t.uploadFile}</h3>
            <p className="text-xs text-slate-400">Target path: {currentPath}</p>
            <input
              type="text"
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
              placeholder="Filename (e.g. update.bin, payload.dex)..."
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleUploadFile}
                className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
