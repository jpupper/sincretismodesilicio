import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu-sandbox',
    '--enable-unsafe-webgl',
    '--use-gl=angle',
    '--window-size=1280,720',
    'http://localhost:6932/log.html'
  ]);
  await new Promise(r => setTimeout(r, 1500));

  http.get('http://127.0.0.1:9227/json', res => {
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

        // Dump shader canvas as dataURL
        const dataUrlRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const bg = window.__asciiShaderBg;
            if (!bg || !bg.canvas) return 'no canvas';
            bg.renderFrame();
            return bg.canvas.toDataURL('image/png');
          })()`,
          returnByValue: true
        });

        if (dataUrlRes.result && dataUrlRes.result.value && dataUrlRes.result.value.startsWith('data:image/png;base64,')) {
          const b64 = dataUrlRes.result.value.replace('data:image/png;base64,', '');
          fs.writeFileSync('C:\\Users\\JPupper\\.gemini\\antigravity-ide\\brain\\6a89777b-a82e-4aad-bb10-f2b80a603bdc\\shader_canvas.png', Buffer.from(b64, 'base64'));
          console.log('Saved shader_canvas.png');
        } else {
          console.log('Error dumping shader canvas:', dataUrlRes);
        }

        // Dump offscreen canvas BEFORE capa is drawn
        const fondoOnlyRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const f = window.__fondoConsola;
            const c = document.createElement('canvas');
            c.width = 1280; c.height = 720;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#070303';
            ctx.fillRect(0, 0, 1280, 720);
            f.init(1280, 720);
            f.drawRuido(ctx, 0.5);
            f.drawAscii(ctx, 0.5);
            return c.toDataURL('image/png');
          })()`,
          returnByValue: true
        });

        if (fondoOnlyRes.result && fondoOnlyRes.result.value && fondoOnlyRes.result.value.startsWith('data:image/png;base64,')) {
          const b64 = fondoOnlyRes.result.value.replace('data:image/png;base64,', '');
          fs.writeFileSync('C:\\Users\\JPupper\\.gemini\\antigravity-ide\\brain\\6a89777b-a82e-4aad-bb10-f2b80a603bdc\\fondo_only.png', Buffer.from(b64, 'base64'));
          console.log('Saved fondo_only.png');
        }

        ws.close();
        chrome.kill();
      });
    });
  });
}
run();
