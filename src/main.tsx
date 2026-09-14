import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          richColors={false}
          closeButton
          toastOptions={{
            classNames: {
              toast: 'border border-slate-200 shadow-sm',
            },
          }}
        />
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  console.error('Elemento "root" não foi encontrado no HTML.');
}