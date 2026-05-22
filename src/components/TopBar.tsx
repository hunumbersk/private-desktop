import { X, Minus, Square } from 'lucide-react';

export default function TopBar() {
  return (
    <div
      className="flex items-center justify-between select-none"
      style={{
        height: '40px',
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
        padding: '0 16px',
      }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1 text-[12px]">
        <span style={{ color: '#858585' }}>桌面</span>
        <span style={{ color: '#858585' }} className="mx-1">/</span>
        <span style={{ color: '#569cd6' }}>工作区</span>
      </div>

      {/* Center: Active Tab */}
      <div className="flex items-center">
        <div
          className="flex items-center gap-2 px-4 py-1.5 relative"
          style={{ color: '#d4d4d4' }}
        >
          <span className="text-[12px]">对话.txt</span>
          <span
            className="absolute bottom-0 left-0 w-full"
            style={{ height: '2px', backgroundColor: '#569cd6' }}
          />
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-0.5">
        <button
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Minus size={13} />
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Square size={11} />
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
