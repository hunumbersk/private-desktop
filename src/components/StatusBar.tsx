import { useEffect, useState } from 'react';
import { useAccessLog } from '@/hooks/useAccessLog';
import { Cloud, CloudOff } from 'lucide-react';

interface StatusBarProps {
  isCloudEnabled?: boolean;
}

export default function StatusBar({ isCloudEnabled }: StatusBarProps) {
  const { currentSession, isLoading, formatTime } = useAccessLog();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-between select-none"
      style={{
        height: '26px',
        backgroundColor: '#007acc',
        zIndex: 10,
        padding: '0 14px',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/70">
          {!isLoading && currentSession
            ? `接入 ${currentSession.ip} · ${formatTime(currentSession.time)}`
            : '检测中...'}
        </span>
        {isCloudEnabled ? (
          <span className="flex items-center gap-1 text-[10px] text-white/70">
            <Cloud size={10} />
            云端同步
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-white/50">
            <CloudOff size={10} />
            本地模式
          </span>
        )}
      </div>
      <span className="text-[11px] text-white/60">对话</span>
      <span className="text-[11px] text-white/70">{time}</span>
    </div>
  );
}
