import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ChiSiamoPage from './pages/ChiSiamoPage';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChiSiamoPage />
  </StrictMode>
);
