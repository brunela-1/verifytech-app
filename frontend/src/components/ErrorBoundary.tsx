import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fb] px-4">
          <div className="bg-white rounded-2xl border border-[#eceef0] shadow-sm p-10 max-w-md w-full text-center">
            <span className="text-5xl">⚠️</span>
            <h1 className="text-xl font-black text-[#191c1e] mt-4 mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-[#505f76] mb-6">
              Ocurrió un error inesperado. Por favor recarga la página o vuelve al inicio.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-[#94a3b8] bg-[#f7f9fb] rounded-xl p-3 mb-6 max-h-32 overflow-y-auto">
                <summary className="cursor-pointer font-semibold mb-1">Detalle técnico</summary>
                {this.state.error.message}
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-[#004ac6] text-white font-semibold py-3 rounded-xl hover:bg-[#003ea8] transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
