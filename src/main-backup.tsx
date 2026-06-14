import { StrictMode, Component, type ReactNode } from 'react'
import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import { TRPCProvider } from '@/providers/trpc'
import './index.css'
import App from './App.tsx'

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

// Global error handler
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error);
  const root = document.getElementById('root');
  if (root && root.children.length === 0) {
    root.innerHTML = `<div style="padding:20px;color:#e74c3c;font-family:monospace;font-size:12px">
      <h3>Runtime Error:</h3>
      <pre>${e.error?.stack || e.message}</pre>
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
