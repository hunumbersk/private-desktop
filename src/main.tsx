import { StrictMode, Component, type ReactNode } from 'react'
import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import { TRPCProvider } from '@/providers/trpc'
import './index.css'
import App from './App.tsx'

// ====== CRITICAL: Clean corrupted localStorage before React starts ======
(function sanitizeStorage() {
  const keys = [
    'private-desktop-items',
    'private-desktop-notes-v2',
    'private-desktop-cookbook-v2',
    'private-dialogue-messages',
  ];
  for (const key of keys) {
    try {
      const val = localStorage.getItem(key);
      if (val === null) continue;
      const parsed = JSON.parse(val);
      if (parsed === null || typeof parsed === 'string') {
        localStorage.removeItem(key); continue;
      }
      if (key === 'private-desktop-notes-v2') {
        if (Array.isArray(parsed) || typeof parsed !== 'object') {
          localStorage.removeItem(key); continue;
        }
      } else {
        if (!Array.isArray(parsed)) {
          localStorage.removeItem(key); continue;
        }
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
})();

// Error boundary to catch startup errors
class StartupErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error: String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#e74c3c', fontFamily: 'monospace', fontSize: 12 }}>
          <h3>Startup Error:</h3>
          <pre>{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handler - show errors on page
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error);
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    const stack = e.error?.stack || e.message || 'Unknown error';
    root.innerHTML = `<div style="padding:20px;color:#e74c3c;font-family:monospace;font-size:11px;line-height:1.5;max-width:800px;margin:0 auto">
      <h3 style="color:#dcb862;margin-bottom:12px">⚠️ 运行时错误</h3>
      <pre style="white-space:pre-wrap;word-break:break-all;background:#1a1a1a;padding:12px;border-radius:4px;border:1px solid rgba(231,76,60,0.3)">${String(stack).replace(/</g,'&lt;')}</pre>
      <p style="color:#858585;margin-top:12px">请截图此页面发送给技术支持</p>
    </div>`;
  }
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise]', e.reason);
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    const reason = e.reason?.stack || e.reason?.message || String(e.reason);
    root.innerHTML = `<div style="padding:20px;color:#e74c3c;font-family:monospace;font-size:11px;line-height:1.5;max-width:800px;margin:0 auto">
      <h3 style="color:#dcb862;margin-bottom:12px">⚠️ Promise 错误</h3>
      <pre style="white-space:pre-wrap;word-break:break-all;background:#1a1a1a;padding:12px;border-radius:4px;border:1px solid rgba(231,76,60,0.3)">${String(reason).replace(/</g,'&lt;')}</pre>
      <p style="color:#858585;margin-top:12px">请截图此页面发送给技术支持</p>
    </div>`;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StartupErrorBoundary>
      <HashRouter>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </HashRouter>
    </StartupErrorBoundary>
  </StrictMode>,
)
