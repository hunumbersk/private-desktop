import { useState } from 'react';
import { Folder, FileText, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  itemCount: number;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  color: string;
  children?: FileItem[];
}

const fileTree: FileItem[] = [
  { name: '对话.txt', type: 'file', color: '#d4d4d4' },
  { name: '文档/', type: 'folder', color: '#dcb862', children: [] },
  { name: '图片/', type: 'folder', color: '#dcb862', children: [] },
];

function FileTreeItem({ item, depth = 0 }: { item: FileItem; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isFolder = item.type === 'folder';

  return (
    <div>
      <div
        className="flex items-center gap-1 cursor-pointer select-none transition-colors"
        style={{
          paddingLeft: `${depth * 12 + 10}px`,
          paddingTop: '3px',
          paddingBottom: '3px',
          paddingRight: '8px',
          backgroundColor: hovered ? 'rgba(86,156,214,0.08)' : 'transparent',
          borderLeft: hovered ? '2px solid #569cd6' : '2px solid transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => isFolder && setExpanded(!expanded)}
      >
        {isFolder ? (
          expanded ? <ChevronDown size={12} color="#858585" /> : <ChevronRight size={12} color="#858585" />
        ) : (
          <span className="w-3" />
        )}
        {item.type === 'file' ? <FileText size={13} color={item.color} /> : <Folder size={13} color={item.color} />}
        <span className="text-[12px] font-mono-terminal truncate" style={{ color: item.color }}>
          {item.name}
        </span>
      </div>
      {isFolder && expanded && item.children && (
        <div>
          {item.children.map((child, idx) => (
            <FileTreeItem key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ itemCount }: SidebarProps) {
  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        width: '220px',
        backgroundColor: '#252526',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-3"
        style={{ height: '36px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#858585' }}>
          资源管理器
        </span>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden py-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1">
          <ChevronDown size={12} color="#858585" />
          <span className="text-[12px] font-semibold" style={{ color: '#d4d4d4' }}>桌面</span>
        </div>
        <div className="mt-0.5">
          {fileTree.map((item, idx) => (
            <FileTreeItem key={idx} item={item} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center px-3"
        style={{
          height: '28px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: '#858585',
          fontSize: '11px',
        }}
      >
        <span className="font-mono-terminal">{itemCount} 个项目</span>
      </div>
    </div>
  );
}
