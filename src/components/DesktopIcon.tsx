import { useState, useCallback, useRef } from 'react';
import {
  MessageCircle,
  Folder,
  Image,
  FileText,
  Link2,
  File,
  Lock,
  ShieldCheck,
  StickyNote,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { DesktopItem } from '@/hooks/useDesktopStore';

interface DesktopIconProps {
  item: DesktopItem;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMove: (id: string, x: number, y: number) => void;
}

const iconMap: Record<string, React.ElementType> = {
  'message-circle': MessageCircle,
  folder: Folder,
  image: Image,
  'file-text': FileText,
  link: Link2,
  file: File,
  lock: Lock,
  shield: ShieldCheck,
  notepad: StickyNote,
  cookbook: BookOpen,
  dialogue: MessageCircle,
  app: Sparkles,
};

const typeColorMap: Record<string, string> = {
  dialogue: '#569cd6',
  folder: '#dcb862',
  image: '#ce9178',
  text: '#d4d4d4',
  link: '#4ec9b0',
  file: '#858585',
  app: '#dcb862',
};

export default function DesktopIcon({
  item,
  isSelected,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onMove,
}: DesktopIconProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const IconComponent = iconMap[item.icon] || File;
  const iconColor = typeColorMap[item.type] || '#d4d4d4';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelect();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: item.x,
        origY: item.y,
      };
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        const newX = Math.max(0, dragRef.current.origX + dx);
        const newY = Math.max(0, dragRef.current.origY + dy);
        onMove(item.id, newX, newY);
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [item.id, item.x, item.y, onSelect, onMove]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick();
    },
    [onDoubleClick]
  );

  return (
    <div
      className={`desktop-icon absolute flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer ${
        isSelected ? 'selected' : ''
      }`}
      style={{
        left: item.x,
        top: item.y,
        width: '80px',
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: item.type === 'app' ? 10 : 4,
          backgroundColor: item.type === 'app' ? `${iconColor}15` : 'transparent',
          border: item.type === 'app' ? `1px solid ${iconColor}30` : '1px solid transparent',
        }}
      >
        <IconComponent size={item.type === 'app' ? 26 : 40} color={iconColor} strokeWidth={1.5} />
        {item.source === 'external' && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#2ecc71' }}
          >
            <span className="text-[8px] text-white font-bold">+</span>
          </div>
        )}
      </div>
      <span
        className="icon-name text-[12px] text-center leading-tight px-1 py-0.5 rounded max-w-full break-words"
        style={{
          color: isSelected ? 'white' : '#d4d4d4',
          textShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
          fontSize: '11px',
          wordBreak: 'break-word',
          maxWidth: '76px',
        }}
      >
        {item.name}
      </span>
    </div>
  );
}
