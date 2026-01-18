import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");

// Read CSS
const css = readFileSync(resolve(__dirname, "../src/css/styles.css"), "utf-8");

// CSS injection code
const cssInjection = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.id='vue3-grid-layout-styles';if(!document.getElementById('vue3-grid-layout-styles')){s.textContent=${JSON.stringify(css)};document.head.appendChild(s)}}})();\n`;

// Inject into index.js
const indexJsPath = resolve(distDir, "index.js");
const indexJs = readFileSync(indexJsPath, "utf-8");
writeFileSync(indexJsPath, cssInjection + indexJs);
console.log("Injected CSS into index.js");

// Inject into index.cjs
const indexCjsPath = resolve(distDir, "index.cjs");
const indexCjs = readFileSync(indexCjsPath, "utf-8");
writeFileSync(indexCjsPath, cssInjection + indexCjs);
console.log("Injected CSS into index.cjs");

console.log("CSS injection complete!");
