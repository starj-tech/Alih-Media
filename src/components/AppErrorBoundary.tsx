import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[AppErrorBoundary] Unhandled app error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border bg-card p-6 text-center shadow-sm space-y-3">
          <h1 className="text-lg font-semibold">Aplikasi gagal dimuat</h1>
          <p className="text-sm text-muted-foreground">
            Terjadi gangguan saat memuat halaman. Silakan muat ulang aplikasi.
          </p>
          <Button onClick={this.handleReload} className="w-full">
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }
}
