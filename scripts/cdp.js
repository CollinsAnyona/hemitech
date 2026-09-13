// A very small Chrome DevTools Protocol client, using Node's built-in
// WebSocket so there is nothing to install.
//
// It exists because Chrome's --window-size does not give you the viewport you
// asked for (a request for 390 comes back as 512 on Windows), and this site's
// whole argument is about how it behaves on a phone. Emulation.setDeviceMetrics
// Override is the only way to render at a real 390x844.

import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

export function chromePath() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH.');
  return found;
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    for (const handler of listeners.get(msg.method) || []) handler(msg.params);
  });

  return {
    ready,
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
    on(method, handler) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(handler);
    },
    close() {
      ws.close();
    },
  };
}

async function waitForDebugger(port) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chrome did not open a debugging port');
}

/**
 * Launch a headless Chrome and hand back a tiny page API.
 * Always close it with `await browser.close()`.
 */
export async function launch() {
  const port = 9222 + Math.floor(Math.random() * 600);
  const profile = await mkdtemp(join(tmpdir(), 'hemitech-cdp-'));

  const proc = spawn(chromePath(), [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const client = connect(await waitForDebugger(port));
  await client.ready;

  return {
    async page({ width = 1440, height = 900, javascript = true } = {}) {
      const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });
      const send = (method, params) => client.send(method, params, sessionId);

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 800,
        screenWidth: width,
        screenHeight: height,
      });
      if (width < 800) {
        await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      }
      if (!javascript) {
        await send('Emulation.setScriptExecutionDisabled', { value: true });
      }

      return {
        send,
        async goto(url) {
          const loaded = new Promise((resolve) => {
            client.on('Page.loadEventFired', resolve);
            setTimeout(resolve, 15000);
          });
          await send('Page.navigate', { url });
          await loaded;
          await new Promise((r) => setTimeout(r, 400));
        },
        /** Evaluate an expression in the page and return its value. */
        async evaluate(expression) {
          const { result, exceptionDetails } = await send('Runtime.evaluate', {
            expression: `(() => { ${expression} })()`,
            returnByValue: true,
            awaitPromise: true,
          });
          if (exceptionDetails) throw new Error(exceptionDetails.text + ' ' + (exceptionDetails.exception?.description || ''));
          return result.value;
        },
        async screenshot(path) {
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          const { writeFile } = await import('node:fs/promises');
          await writeFile(path, Buffer.from(shot.data, 'base64'));
        },
        async key(key, code, keyCode) {
          await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode });
          await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
          await new Promise((r) => setTimeout(r, 60));
        },
        async close() {
          await client.send('Target.closeTarget', { targetId });
        },
      };
    },
    async close() {
      client.close();
      proc.kill();
      await rm(profile, { recursive: true, force: true }).catch(() => {});
    },
  };
}
