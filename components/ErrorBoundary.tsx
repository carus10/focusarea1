import React from 'react';
import { rendererErrorHandler } from '../utils/errorHandler.ts';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    rendererErrorHandler.handleReactError(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg">
          <div className="text-center p-8 bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Bir hata oluştu</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error?.message || 'Bilinmeyen bir hata oluştu'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Yeniden Yükle
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
