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
// render. hydrate() absorbs its own failures — the UI still comes up, and a
// store that failed to load stops persisting rather than saving the defaults
// it is holding over the real settings.
profiles.hydrate().then(render);
