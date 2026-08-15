import React from 'react';
import ReactDOM from 'react-dom/client';
import { profiles } from '@options/stores';
import './i18n';
import App from './App.tsx';
import '@options/styles/index.css';

function render() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// browser.storage is async, so the store has to be loaded before the first
// render. `finally` keeps a storage failure from leaving a blank page: the UI
// still comes up, just empty.
profiles.hydrate().finally(render);
