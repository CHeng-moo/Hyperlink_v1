```js
// track.js - Single session across pages with index recorded first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, set, update, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// —— Firebase 初始化 ——
const firebaseConfig = {
  apiKey: "AIzaSyD93-CezI0YDc62hL_71EV-0ct7l1amyGI",
  authDomain: "hyperlinking-9826f.firebaseapp.com",
  databaseURL: "https://hyperlinking-9826f-default-rtdb.firebaseio.com",
  projectId: "hyperlinking-9826f",
  storageBucket: "hyperlinking-9826f.appspot.com",
  messagingSenderId: "449564834065",
  appId: "1:449564834065:web:911b53ab43142ee555b4b0"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// —— Visitor 与 Session 管理 ——
const VISITOR_KEY = "visitorId";
const SESSION_KEY = "sessionId";

let visitorId = localStorage.getItem(VISITOR_KEY);
if (!visitorId) {
  visitorId = "v_" + Math.random().toString(36).slice(2);
  localStorage.setItem(VISITOR_KEY, visitorId);
}

let sessionId = sessionStorage.getItem(SESSION_KEY);
let sessionRef;
let sessionData;

// —— 获取页面名 ——
function getPageName() {
  const p = window.location.pathname;
  if (p === "/" || p === "" || p.endsWith("/index.html")) return "index";
  return p.replace(/^\//, "").replace(/\.html$/, "");
}

// —— 初始化或恢复会话 ——
async function initSession() {
  if (sessionId) {
    sessionRef = ref(db, `trackingVisitors/${visitorId}/sessions/${sessionId}`);
    const snap = await get(sessionRef);
    if (snap.exists()) {
      sessionData = snap.val();
    } else {
      sessionId = null;
    }
  }
  if (!sessionId) {
    sessionRef = push(ref(db, `trackingVisitors/${visitorId}/sessions`));
    sessionId  = sessionRef.key;
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionData = {
      startTime: Date.now(),
      pages: [],
      clicks: [],
      mouseTrail: [],
      returns: []
    };
    await set(sessionRef, sessionData);
    console.log("✅ New session created:", sessionId);
  } else {
    console.log("🔄 Resumed session:", sessionId);
  }
  // —— 记录当前页面 ——
  const pageEntry = { page: getPageName(), time: Date.now() };
  sessionData.pages.push(pageEntry);
  await update(sessionRef, { pages: sessionData.pages });
  console.log("📄 Page recorded:", pageEntry);
}

// —— 鼠标 & 点击 追踪 ——
function trackInteractions() {
  // 点击
  document.addEventListener("click", e => {
    const rec = {
      x: Date.now(),
      y: Date.now(),
      t: Date.now(),
      tag: e.target.tagName,
      href: e.target.closest("a")?.href || null
    };
    sessionData.clicks.push(rec);
    update(sessionRef, { clicks: sessionData.clicks }).catch(console.error);
  });
  // 鼠标轨迹
  let buf = [], lastFlush = Date.now();
  document.addEventListener("mousemove", e => {
    buf.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (Date.now() - lastFlush > 500) {
      lastFlush = Date.now();
      sessionData.mouseTrail = sessionData.mouseTrail.concat(buf).slice(-200);
      update(sessionRef, { mouseTrail: sessionData.mouseTrail }).catch(console.error);
      buf = [];
    }
  });
  // 可见性变化
  document.addEventListener("visibilitychange", async () => {
    const now = Date.now();
    if (document.hidden) {
      sessionData.returns.push({ leave: now, return: null });
      await update(sessionRef, { returns: sessionData.returns });
    } else {
      const last = sessionData.returns.at(-1);
      if (last && last.return === null) {
        last.return = now;
        await update(sessionRef, { returns: sessionData.returns });
      }
    }
  });
}

// —— 一切就绪后启动 ——
document.addEventListener("DOMContentLoaded", async () => {
  await initSession();
  trackInteractions();
});
```
