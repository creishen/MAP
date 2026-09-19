/* 
  file summary: main entrypoint for the marine assurance platform (map) react application.
  responsibilities: mounts App component inside DOM root element with React StrictMode and imports global stylesheet.
  role in system: application bootstrap file executed by Vite bundler.
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
  what: mounts react application tree into html root element.
  how: invokes ReactDOM.createRoot on 'root' div element and renders App inside StrictMode.
  with what file: src/main.tsx loaded by index.html.
*/
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
