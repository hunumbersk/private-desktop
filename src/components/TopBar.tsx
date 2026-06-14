import { useRef, useState } from 'react';
import { LogOut, User, Download, Upload, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useDataManager } from '@/hooks/useDataManager';

interface TopBarProps {
  userName?: string;
  onLogout?: () => void;
}

export default function TopBar({ userName, onLogout }: TopBarProps) {
  const { handleExport, handleImport, handleRestore } = useDataManager();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onImportClick = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset
    const result = await handleImport(file);
    setImportMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setTimeout(() => setImportMsg(null), 4000);
  };

  const onRestoreClick = () => {
    if (!window.confirm('确定从自动备份恢复？当前未保存的数据将丢失。')) return;
    const result = handleRestore();
    setImportMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setTimeout(() => setImportMsg(null), 4000);
  };

  return (
    <div
      className="flex items-center justify-between select-none relative"
      style={{
        height: '40px',
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
        padding: '0 16px',
      }}
    >
      {/* Import message toast */}
      {importMsg && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-1.5 rounded text-[10px] flex items-center gap-1.5 shadow-lg"
          style={{
            backgroundColor: importMsg.type === 'success' ? 'rgba(78,201,176,0.15)' : 'rgba(231,76,60,0.15)',
            color: importMsg.type === 'success' ? '#4ec9b0' : '#e74c3c',
            border: `1px solid ${importMsg.type === 'success' ? 'rgba(78,201,176,0.3)' : 'rgba(231,76,60,0.3)'}`,
            zIndex: 100,
          }}>
          {importMsg.type === 'success' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
          {importMsg.text}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={onFileSelected} />

      {/* Left: Title */}
      <div className="flex items-center gap-1 text-[12px]">
        <span style={{ color: '#858585' }}>私密虚拟桌面</span>
        <span style={{ color: '#858585' }} className="mx-1">/</span>
        <span style={{ color: '#569cd6' }}>工作区</span>
      </div>

      {/* Center: User */}
      {userName && (
        <div className="flex items-center gap-1.5">
          <User size={11} color="#569cd6" />
          <span className="text-[11px]" style={{ color: '#aaa' }}>{userName}</span>
        </div>
      )}

      {/* Right: Data ops + Logout */}
      <div className="flex items-center gap-0.5">
        {/* Export */}
        <button
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#dcb862'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
          onClick={handleExport}
          title="导出所有数据"
        >
          <Download size={10} />
          <span>导出</span>
        </button>

        {/* Import */}
        <button
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#569cd6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
          onClick={onImportClick}
          title="从文件导入"
        >
          <Upload size={10} />
          <span>导入</span>
        </button>

        {/* Restore */}
        <button
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#4ec9b0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
          onClick={onRestoreClick}
          title="从自动备份恢复"
        >
          <Database size={10} />
          <span>恢复</span>
        </button>

        <div className="w-px h-3 mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {onLogout && (
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
            style={{ color: '#858585' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e74c3c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
            onClick={onLogout}
          >
            <LogOut size={10} />
            <span>退出</span>
          </button>
        )}
      </div>
    </div>
  );
}
