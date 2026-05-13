import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BusinessProvider } from './context/BusinessContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BusinessProvider>
      <App />
    </BusinessProvider>
  </React.StrictMode>
);
