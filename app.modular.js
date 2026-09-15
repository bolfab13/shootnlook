import { initApp } from './app.js';

let initialized = false;

async function initModularApp() {
  if (initialized) return;
  initialized = true;
  await initApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModularApp, { once: true });
} else {
  initModularApp();
}
