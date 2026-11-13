import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DatiPage from './pages/DatiPage';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatiPage />
  </StrictMode>
);
