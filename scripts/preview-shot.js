// Screenshot a page at an exact viewport, for checking the real mobile layout.
//
// Chrome's --window-size does not give you the viewport you asked for: on
// Windows a request for 390 comes back as 512, so a "mobile" screenshot taken
// that way is a 390px-wide crop of a 512px-wide layout and tells you nothing.
// This drives the DevTools protocol instead and sets the device metrics
// explicitly, which is the only way to get a true 390x844 render.
//
// Node's built-in WebSocket is used, so there is no dependency to install.
//
//   node scripts/preview-shot.js <url> <out.png> [width] [height] [--full]

import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [, , url, out, widthArg = '390', heightArg = '844', ...rest] = process.argv;
if (!url || !out) {
  console.error('usage: node scripts/preview-shot.js <url> <out.png> [width] [height] [--full]');
  process.exit(1);
}

const width = Number(widthArg);
const height = Number(heightArg);
const fullPage = rest.includes('--full');
const mobile = width < 800;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('Chrome not found. Set CHROME_PATH.');
  process.exit(1);
}

const PORT = 9222 + Math.floor(Math.random() * 400);

async function waitForDebugger() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chrome did not open a debugging port');
}

function session(wsUrl) {
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
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      return;
    }
    const handler = listeners.get(msg.method);
    if (handler) handler(msg.params);
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
      listeners.set(method, handler);
    },
    close() {
      ws.close();
    },
  };
}

async function main() {
  const profile = await mkdtemp(join(tmpdir(), 'hemitech-shot-'));
  const proc = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${PORT}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const browserWs = await waitForDebugger();
    const browser = session(browserWs);
    await browser.ready;

    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });

    const send = (method, params) => browser.send(method, params, sessionId);

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile,
      screenWidth: width,
      screenHeight: height,
    });
    if (mobile) {
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    }

    const loaded = new Promise((resolve) => {
      browser.on('Page.loadEventFired', resolve);
      setTimeout(resolve, 15000);
    });
    await send('Page.navigate', { url });
    await loaded;
    await new Promise((r) => setTimeout(r, 700));

    // Confirm we really got the viewport we asked for before believing the shot.
    const probe = await send('Runtime.evaluate', {
      expression:
        'JSON.stringify({w: document.documentElement.clientWidth, ' +
        'scrollW: document.documentElement.scrollWidth, ' +
        'bodyScrollW: document.body.scrollWidth})',
      returnByValue: true,
    });
    const metrics = JSON.parse(probe.result.value);

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: fullPage,
      ...(fullPage
        ? {
            clip: {
              x: 0,
              y: 0,
              width: metrics.w,
              height: (await send('Runtime.evaluate', {
                expression: 'document.documentElement.scrollHeight',
                returnByValue: true,
              })).result.value,
              scale: 1,
            },
          }
        : {}),
    });

    await writeFile(out, Buffer.from(shot.data, 'base64'));

    const overflow = metrics.scrollW > metrics.w;
    console.log(
      `${out}  viewport ${metrics.w}px  document ${metrics.scrollW}px` +
        (overflow ? `  HORIZONTAL OVERFLOW of ${metrics.scrollW - metrics.w}px` : '  no horizontal scroll'),
    );

    browser.close();
    if (overflow) process.exitCode = 2;
  } finally {
    proc.kill();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
