import { LogOut, User } from 'lucide-react';

interface TopBarProps {
  userName?: string;
  onLogout?: () => void;
}

export default function TopBar({ userName, onLogout }: TopBarProps) {
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

      {/* Right: Logout */}
      <div className="flex items-center gap-0.5">
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
