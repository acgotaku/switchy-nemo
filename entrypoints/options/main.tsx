import React from 'react';
import ReactDOM from 'react-dom/client';
import { profiles } from '@options/stores';
import App from './App.tsx';

function render() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// browser.storage is async, so the store has to be loaded before the first
// render. hydrate() absorbs its own failures — the UI still comes up, and the
// store stays read-only rather than saving defaults over the real settings.
profiles.hydrate().then(render);
