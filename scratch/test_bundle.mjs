import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distAssets = fs.readdirSync(path.join(__dirname, '../dist/assets'));
const jsFile = distAssets.find(f => f.endsWith('.js'));

const code = fs.readFileSync(path.join(__dirname, '../dist/assets', jsFile), 'utf8');

class MockMutationObserver {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
}

class MockWebSocket {
  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}

const mockRoot = {
  nodeType: 1,
  innerHTML: '',
  appendChild: () => {},
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
  ownerDocument: null,
};

const mockWindow = {
  URL: URL,
  URLSearchParams: URLSearchParams,
  Headers: Headers,
  Request: Request,
  Response: Response,
  fetch: fetch,
  WebSocket: MockWebSocket,
  history: {
    pushState: () => {},
    replaceState: () => {},
    state: {},
    back: () => {},
    forward: () => {},
    go: () => {},
  },
  location: {
    origin: 'https://2w.malaca.com.br',
    pathname: '/',
    search: '',
    hash: '',
    href: 'https://2w.malaca.com.br/',
    replace: () => {},
  },
  document: {
    title: '',
    nodeType: 9,
    getElementById: (id) => mockRoot,
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementsByTagName: () => [],
    createTextNode: (text) => ({ textContent: text }),
    addEventListener: () => {},
    removeEventListener: () => {},
    head: { appendChild: () => {} },
    createElement: () => ({ nodeType: 1, style: {}, setAttribute: () => {}, appendChild: () => {}, addEventListener: () => {}, removeEventListener: () => {} }),
    documentElement: {
      nodeType: 1,
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      setAttribute: () => {},
    },
    body: { nodeType: 1, style: {}, classList: { add: () => {} } },
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  MutationObserver: MockMutationObserver,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  console: console,
};

mockRoot.ownerDocument = mockWindow.document;
mockWindow.window = mockWindow;
mockWindow.self = mockWindow;
mockWindow.globalThis = mockWindow;

const context = vm.createContext(mockWindow);

try {
  console.log('Evaluating ESM bundle in VM...');
  const module = new vm.SourceTextModule(code, { context, importModuleDynamically: async () => ({}) });
  await module.link(async () => ({}));
  await module.evaluate();
  console.log('🎉 ✅ ESM Bundle evaluated successfully without ANY runtime error!');
} catch (err) {
  console.error('❌ Bundle error:', err);
}
