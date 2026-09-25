import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initMockApiIfNeeded } from './lib/mockApi.js';

// Activate client mock engine on static hostings (e.g. GitHub Pages)
initMockApiIfNeeded();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
