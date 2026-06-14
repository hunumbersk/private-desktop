import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; name: string; }
interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error: String(error) };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 8, fontSize: 10, color: '#e74c3c', border: '1px dashed rgba(231,76,60,0.3)', borderRadius: 4, margin: 4 }}>
          ⚠️ {this.props.name} 加载失败
        </div>
      );
    }
    return this.props.children;
  }
}
