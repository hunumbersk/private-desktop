import { useState } from 'react';
import { X, Download } from 'lucide-react';

interface TextViewerProps {
  title: string;
  content: string;
  onClose: () => void;
}

export default function TextViewer({ title, content, onClose }: TextViewerProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 200, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col window-shadow rounded-lg overflow-hidden"
        style={{
          width: 'min(560px, 90vw)',
          height: 'min(440px, 80vh)',
          backgroundColor: 'rgba(45,45,45,0.95)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{ height: '36px', backgroundColor: '#333', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[13px]" style={{ color: '#ccc' }}>{title}</span>
          <div className="flex items-center gap-1">
            <button
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: '#858585' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => setShowConfirm(true)}
            >
              <Download size={13} />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: '#858585' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={onClose}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-auto p-5 font-mono-terminal text-[13px] leading-relaxed"
          style={{ color: '#d4d4d4', whiteSpace: 'pre-wrap' }}
        >
          {content || (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ minHeight: '200px' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#858585" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div className="text-center">
                <p style={{ color: '#858585', fontSize: 13 }}>此文件暂无内容</p>
                <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>这是一个文本查看器</p>
              </div>
            </div>
          )}
        </div>

        {/* Download Confirm */}
        {showConfirm && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="p-5 rounded-lg" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '300px' }}>
              <h3 className="text-[14px] font-medium mb-2" style={{ color: '#d4d4d4' }}>下载此文件？</h3>
              <p className="text-[12px] mb-4" style={{ color: '#858585' }}>文件将保存到你的设备，离开此网页。</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1.5 rounded text-[12px]"
                  style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => setShowConfirm(false)}
                >
                  取消
                </button>
                <button
                  className="px-3 py-1.5 rounded text-[12px]"
                  style={{ color: '#fff', backgroundColor: '#569cd6' }}
                  onClick={handleDownload}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
