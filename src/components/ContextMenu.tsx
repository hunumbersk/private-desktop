import { useEffect, useRef } from 'react';
import {
  FolderPlus,
  FilePlus,
  Trash2,
  Download,
  RefreshCw,
  Lock,
  Shield,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon?: React.ElementType;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="context-menu fixed py-1.5 z-[9999]"
      style={{ left: adjustedX, top: adjustedY, minWidth: '180px' }}
    >
      {items.map((item, idx) =>
        item.separator ? (
          <div key={idx} className="context-menu-separator" />
        ) : (
          <div
            key={idx}
            className={`context-menu-item flex items-center justify-between ${
              item.danger ? 'text-red-400' : item.disabled ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
          >
            <div className="flex items-center gap-2.5">
              {item.icon && <item.icon size={14} />}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-[11px] opacity-50 ml-4">{item.shortcut}</span>
            )}
          </div>
        )
      )}
    </div>
  );
}

// Predefined menu configurations
export function useDesktopContextMenus(
  onOpenDialogue: () => void,
  onCreateFolder: () => void,
  onCreateText: () => void,
  onRefresh: () => void,
  onSecurityInfo: () => void
) {
  const desktopMenu: MenuItem[] = [
    { label: '新建文件夹', icon: FolderPlus, action: onCreateFolder },
    { label: '新建文本文件', icon: FilePlus, action: onCreateText },
    { label: '打开对话', icon: Lock, action: onOpenDialogue },
    { separator: true, label: '', action: () => {} },
    { label: '刷新', icon: RefreshCw, shortcut: 'F5', action: onRefresh },
    { separator: true, label: '', action: () => {} },
    { label: '安全信息', icon: Shield, action: onSecurityInfo },
  ];

  return { desktopMenu };
}

export function useItemContextMenus(
  onOpen: () => void,
  onRename: () => void,
  onDelete: () => void,
  onDownload: (() => void) | null,
  itemType: string
) {
  const items: MenuItem[] = [
    { label: '打开', icon: itemType === 'dialogue' ? Lock : undefined, action: onOpen },
    { separator: true, label: '', action: () => {} },
    ...(onDownload
      ? [{ label: '申请下载', icon: Download, action: onDownload, disabled: !onDownload }]
      : []),
    { label: '重命名', action: onRename },
    { separator: true, label: '', action: () => {} },
    { label: '删除', icon: Trash2, action: onDelete, danger: true },
  ];

  return items;
}
