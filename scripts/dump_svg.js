import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu-sandbox',
    '--enable-unsafe-webgl',
    '--window-size=1280,720',
    'http://localhost:6932/log.html'
  ]);
  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9226/json', res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', async () => {
      const list = JSON.parse(d);
      const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
      let id = 1;
      const pending = new Map();
      ws.addEventListener('message', e => {
        const r = JSON.parse(e.data);
        if (r.id && pending.has(r.id)) { pending.get(r.id)(r.result); pending.delete(r.id); }
      });
      function send(method, params = {}) {
        return new Promise(res => { const reqId = id++; pending.set(reqId, res); ws.send(JSON.stringify({ id: reqId, method, params })); });
      }
      ws.addEventListener('open', async () => {
        await send('Runtime.enable');
        await new Promise(r => setTimeout(r, 2000));

        const svgRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const capa = window.__logGlitch.capturaImg;
            if (!capa || !capa.src) return 'no src';
            return decodeURIComponent(capa.src.replace('data:image/svg+xml;charset=utf-8,', ''));
          })()`,
          returnByValue: true
        });

        fs.writeFileSync('C:\\Users\\JPupper\\.gemini\\antigravity-ide\\brain\\6a89777b-a82e-4aad-bb10-f2b80a603bdc\\dumped_svg.html', svgRes.result.value);
        console.log('SVG written to dumped_svg.html, length:', svgRes.result.value.length);

        ws.close();
        chrome.kill();
      });
    });
  });
}
run();
