import { useState, useEffect, useCallback } from 'react';

export interface EditorSettings {
  fontFamily: string;
  fontSize: number; // px
  textColor: string;
  bgColor: string;
  bgImage: string | null; // base64 or url
  bgImageOpacity: number; // 0-100
  bgImageMode: 'cover' | 'contain' | 'repeat' | 'center';
  lineHeight: number;
  letterSpacing: number;
}

const STORAGE_KEY = 'private-desktop-editor-settings';

const FONT_OPTIONS = [
  { label: '系统默认', value: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '霞鹜文楷', value: '"LXGW WenKai", "PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '思源宋体', value: '"Source Han Serif CN", "Noto Serif SC", "SimSun", serif' },
  { label: '宋体', value: '"SimSun", "Songti SC", "STSong", serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: '黑体', value: '"SimHei", "Heiti SC", "STHeiti", sans-serif' },
  { label: '楷体', value: '"KaiTi", "Kaiti SC", "STKaiti", serif' },
  { label: '仿宋', value: '"FangSong", "Fangsong SC", "STFangsong", serif' },
  { label: 'Consolas代码', value: 'Consolas, "Courier New", "PingFang SC", monospace' },
] as const;

const DEFAULT_SETTINGS: EditorSettings = {
  fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
  fontSize: 14,
  textColor: '#d4d4d4',
  bgColor: '#252525',
  bgImage: null,
  bgImageOpacity: 30,
  bgImageMode: 'cover',
  lineHeight: 1.8,
  letterSpacing: 0,
};

function loadSettings(): EditorSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export { FONT_OPTIONS };

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const handleImageUpload = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('请选择图片文件'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('图片大小不能超过5MB'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    handleImageUpload,
  };
}
