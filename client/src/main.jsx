import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n/config'
import { logEnvironment } from './env'
import { BrowserRouter } from 'react-router-dom';

// Log environment configuration
if (import.meta.env.DEV) {
  logEnvironment();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
