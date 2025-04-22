import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyD93-CezI0YDc62hL_71EV-0ct7l1amyGI",
  authDomain: "hyperlinking-9826f.firebaseapp.com",
  databaseURL: "https://hyperlinking-9826f-default-rtdb.firebaseio.com",
  projectId: "hyperlinking-9826f",
  storageBucket: "hyperlinking-9826f.appspot.com",
  messagingSenderId: "449564834065",
  appId: "1:449564834065:web:911b53ab43142ee555b4b0"
};

// ✅ 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ 生成 visitorId
function getVisitorId() {
  let id = localStorage.getItem("visitorId");
  if (!id) {
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.random().toString(36).substring(2, 8);
    id = `visitor-${dateStr}-${rand}`;
    localStorage.setItem("visitorId", id);
  }
  return id;
}

const visitorId = getVisitorId();

// ✅ 创建 session 节点
const sessionRef = push(ref(db, `trackingVisitors/${visitorId}/sessions`));

// ✅ 页面路径处理（更宽松判断首页）
const path = window.location.pathname;
const page = path.includes("index") || path === "/" || path === "/Hyperlink_v1/" ? "/index" : path;

const data = {
  page: page,
  url: window.location.href,
  userAgent: navigator.userAgent,
  startTime: Date.now(),
  mouseTrail: [],
  clicks: [],
  returns: []
};

// ✅ 鼠标轨迹
let lastMousePos = { x: null, y: null };
let prevPos = null;
const MAX_TRAIL = 120;

document.addEventListener("mousemove", (e) => {
  lastMousePos = { x: e.clientX, y: e.clientY };
});

setInterval(() => {
  if (lastMousePos.x !== null && data.mouseTrail.length < MAX_TRAIL) {
    const dx = lastMousePos.x - (prevPos?.x ?? 0);
    const dy = lastMousePos.y - (prevPos?.y ?? 0);
    const dist = Math.hypot(dx, dy);
    if (!prevPos || dist > 20) {
      data.mouseTrail.push({
        x: lastMousePos.x,
        y: lastMousePos.y,
        t: Date.now()
      });
      prevPos = { ...lastMousePos };
    }
  }
}, 500);

// ✅ 点击链接
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (link && link.href) {
    // 新标签页不阻止跳转
    if (link.target === "_blank") {
      data.clicks.push({
        href: link.href,
        time: Date.now()
      });
      return;
    }

    // 阻止跳转，等数据上传后再跳
    e.preventDefault();
    data.clicks.push({
      href: link.href,
      time: Date.now()
    });
    data.endTime = Date.now();
    set(sessionRef, data).then(() => {
      window.location.href = link.href;
    });
  }
});

// ✅ 可见性变化（切出/返回）
let pauseStart = null;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    pauseStart = Date.now();
    uploadSessionData();
  } else if (document.visibilityState === "visible") {
    if (pauseStart) {
      data.returns.push({
        leftAt: pauseStart,
        backAt: Date.now()
      });
      pauseStart = null;
    } else {
      data.returns.push({
        backAt: Date.now()
      });
    }
  }
});

// ✅ 提前上传数据函数
function uploadSessionData() {
  data.endTime = Date.now();
  set(sessionRef, data);
}

// ✅ 页面关闭时上传（更稳）
window.addEventListener("unload", () => {
  uploadSessionData();
});
