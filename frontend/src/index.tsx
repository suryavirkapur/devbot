import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Make this error very obvious if the #root div is missing from index.html
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 2rem; text-align: center; color: red; background-color: #ffe0e0; border: 2px solid red;">
      <h1>Fatal Error</h1>
      <p>The root HTML element with ID 'root' was not found in the document.</p>
      <p>React application cannot start.</p>
      <p>Please ensure your public/index.html (or equivalent generated HTML) includes <div id="root"></div>.</p>
    </div>
  `;
  console.error(
    "Fatal: Root element with ID 'root' not found in HTML. React app cannot mount."
  );
}
