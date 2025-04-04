import React from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './App'; // Используем AppWrapper из-за useLocation
import './styles/styles.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);