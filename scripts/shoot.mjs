// Dev-only verification: drive the scroll journey via CDP and screenshot
// each beat. Not part of the build. Usage: node scripts/shoot.mjs <port>
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const PORT = process.argv[2] || "4319";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "C:/Users/vengg/AppData/Local/Temp/polshot";
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--remote-debugging-port=9333", "--window-size=1440,900",
  `http://localhost:${PORT}/`,
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch("http://localhost:9333/json");
      const list = await r.json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error("no CDP target");
}

const beats = [
  { name: "01-hero", y: 0 },
  { name: "02-problem", y: 1.4 },
  { name: "03-reveal", y: 2.4 },
  { name: "04-path", y: 3.6 },
  { name: "04b-path-deep", y: 4.7 },
  { name: "05-twosides", y: 6.2 },
  { name: "07-close", y: 8.6 },
];

const ws = new WebSocket(await cdpTarget());
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) pending.get(m.id)(m.result);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await sleep(3500); // fonts + scene warmup

for (const b of beats) {
  await send("Runtime.evaluate", {
    expression: `window.__lenis && window.__lenis.scrollTo(window.innerHeight*${b.y}, {immediate:true})`,
  });
  await sleep(1400); // let scrub + reveals settle
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/${b.name}.png`, Buffer.from(data, "base64"));
  console.log("shot", b.name);
}
ws.close();
chrome.kill();
process.exit(0);
