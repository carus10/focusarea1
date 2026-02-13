
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DataProvider, PomodoroProvider } from './context/DataContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DataProvider>
        <PomodoroProvider>
          <App />
        </PomodoroProvider>
      </DataProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
