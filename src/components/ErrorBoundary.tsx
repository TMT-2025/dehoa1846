import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              !
            </div>
            <h2 className="text-lg font-black text-slate-900">Đã xảy ra lỗi giao diện</h2>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left font-mono break-all">
              {this.state.error?.message || 'Lỗi không xác định'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              Tải lại trang web
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
