import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Declare custom properties on window object for TypeScript safety
declare global {
  interface Window {
    deferredInstallPrompt?: any;
  }
}

// Capture beforeinstallprompt event as early as possible to prevent race conditions
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
  window.dispatchEvent(new CustomEvent("installpromptready"));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for offline PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only register on secure contexts (HTTPS or localhost)
    if (window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker loaded successfully on scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] ServiceWorker registration failure:', error);
        });
    }
  });
}
