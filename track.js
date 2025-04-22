import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, set, update, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// — Firebase 初始化 —
const firebaseConfig = {
  apiKey: "AIzaSyD93-CezI0YDc62hL_71EV-0ct7l1amyGI",
  authDomain: "hyperlinking-9826f.firebaseapp.com",
  databaseURL: "https://hyperlinking-9826f-default-rtdb.firebaseio.com",
  projectId: "hyperlinking-9826f",
  storageBucket: "hyperlinking-9826f.firebasestorage.app",
  messagingSenderId: "449564834065",
  appId: "1:449564834065:web:911b53ab43142ee555b4b0"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// — Visitor & Session ID 管理 —
const VISITOR_KEY = "visitorId";
const SESSION_KEY  = "sessionId";

let visitorId = localStorage.getItem(VISITOR_KEY);
if (!visitorId) {
  visitorId = "v_" + Math.random().toString(36).slice(2);
  localStorage.setItem(VISITOR_KEY, visitorId);
}

let sessionRef, sessionData;

// — 页面名称判断 —
function getPageName() {
  let p = window.location.pathname;
  if (p === "/" || p.endsWith("/index.html") || p === "") return "index";
  return p.replace(/^\//, "").replace(/\.html$/, "");
}

// — 新建 Session 并写一次初始快照 —
async function createSession() {
  sessionRef = push(ref(db, `trackingVisitors/${visitorId}/sessions`));
  sessionData = {
    page: getPageName(),
    url:  location.href,
    ua:   navigator.userAgent,
    startTime: Date.now(),
    clicks:   [],
    mouseTrail: [],
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    returns: []
  };
  await set(sessionRef, sessionData);
}

// — 恢复已有 Session（如果想要支持跨页面续写） —
// 略去，这里我们只做首次创建

// — 鼠标 & 点击 追踪 —
function trackMouseMovement() {
  let trailBuf = [], lastFlush = Date.now();
  const FLUSH_INTERVAL = 500;

  document.addEventListener("mousemove", e => {
    const now = Date.now();
    trailBuf.push({ x: e.clientX, y: e.clientY, t: now });
    if (now - lastFlush > FLUSH_INTERVAL) {
      lastFlush = now;
      sessionData.mouseTrail = sessionData.mouseTrail.concat(trailBuf);
      if (sessionData.mouseTrail.length > 200) {
        sessionData.mouseTrail = sessionData.mouseTrail.slice(-200);
      }
      update(sessionRef, { mouseTrail: sessionData.mouseTrail })
        .catch(console.error);
      trailBuf = [];
    }
  });

  document.addEventListener("click", e => {
    const now = Date.now();

    // ✅ clicks：保留原本的完整信息
    const rec = {
      x: e.clientX,
      y: e.clientY,
      t: now,
      tag: e.target.tagName,
      href: e.target.closest("a")?.href || null
    };
    sessionData.clicks.push(rec);

    // ✅ mouseClicks：新增轻量点击记录（只记录 x, y, t, tag）
    if (!sessionData.mouseClicks) sessionData.mouseClicks = [];
    sessionData.mouseClicks.push({
      x: e.clientX,
      y: e.clientY,
      t: now,
      tag: e.target.tagName
    });

    // ✅ 一次性更新两份数据
    update(sessionRef, {
      clicks: sessionData.clicks,
      mouseClicks: sessionData.mouseClicks
    }).catch(console.error);
  });
}

// — 页面可见性 追踪 回归/离开 —
function trackVisibility() {
  document.addEventListener("visibilitychange", () => {
    const now = Date.now();
    if (document.hidden) {
      // 离开
      sessionData.returns.push({ leave: now, return: null });
      update(sessionRef, { returns: sessionData.returns })
        .catch(console.error);
    } else {
      // 回来
      const last = sessionData.returns[sessionData.returns.length - 1];
      if (last && last.return === null) {
        last.return = now;
        update(sessionRef, { returns: sessionData.returns })
          .catch(console.error);
      }
    }
  });
}

// — 主流程：DOM 就绪后立即创建&开始追踪 —
document.addEventListener("DOMContentLoaded", async () => {
  await createSession();
  trackMouseMovement();
  trackVisibility();
  console.log("✅ Tracking started for", sessionData.page);
});