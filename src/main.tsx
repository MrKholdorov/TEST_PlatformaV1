import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
  if (window.Telegram.WebApp.initData) {
    document.documentElement.classList.add('tg-mini-app');
    window.Telegram.WebApp.expand();
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
