import { StrictMode, Component, type ReactNode } from 'react'
import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import { TRPCProvider } from '@/providers/trpc'
import './index.css'
import App from './App.tsx'

// ====== Fix corrupted data: clear only data stores, preserve auth ======
(function nukeStorage() {
  // Only clear potentially corrupted data stores
  // DO NOT clear: local-auth, mode, username, local-users (preserve login state)
  const dataKeys = [
    'private-desktop-items',
    'private-desktop-notes-v2',
    'private-desktop-cookbook-v2',
    'private-desktop-settings',
    'private-desktop-auto-backup',
    'private-dialogue-messages',
    'private-dialogue-active',
  ];
  for (const key of dataKeys) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
})();

// Error boundary to catch startup errors - show error details
class StartupErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error: String(error) + ' | ' + (error instanceof Error ? error.stack : '') };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 12, textAlign: 'center', marginTop: '10vh', color: '#858585' }}>
          <p>应用加载出现问题</p>
          <pre style={{ textAlign: 'left', background: '#1a1a1a', padding: 12, borderRadius: 4, marginTop: 12, maxWidth: 800, margin: '12px auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 10 }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '6px 16px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handler - log only, don't show on page
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error);
});

// Catch unhandled promise rejections - log only
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise]', e.reason);
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
