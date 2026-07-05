/// <reference path="./material-web.d.ts" />
// Patch React 19 / Material Web Components "form" property getter/setter conflict
Object.defineProperty(HTMLElement.prototype, 'form', {
  get() {
    return this.closest('form') || this.getAttribute('form');
  },
  set(val) {
    if (typeof val === 'string') {
      this.setAttribute('form', val);
    } else if (!val) {
      this.removeAttribute('form');
    }
  },
  configurable: true
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Material Web Components Imports
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/elevated-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/dialog/dialog.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/divider/divider.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/progress/circular-progress.js';

// Labs (Beta) Components
import '@material/web/labs/navigationdrawer/navigation-drawer.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
