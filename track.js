// ✅ Firebase 初始化
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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
const database = getDatabase(app);

// ✅ 基础变量
const cleanPath = location.pathname.replace(/\W+/g, "_") || "home";
const sessionId = `user_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const dbRef = ref(database, `tracking/${cleanPath}/${sessionId}`);
const startTime = Date.now();

const mousePath = [];
let lastMouseTime = 0;
const visibilityLog = [];
const clickLog = [];
let hideTime = null;

// ✅ 设备信息
const deviceInfo = {
  userAgent: navigator.userAgent,
  screen: {
    width: window.screen.width,
    height: window.screen.height
  },
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  language: navigator.language,
  platform: navigator.platform
};

// ✅ 鼠标轨迹（每500ms记录一次，限制200条）
document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastMouseTime > 500 && mousePath.length < 200) {
    mousePath.push({ x: e.clientX, y: e.clientY, t: now - startTime });
    lastMouseTime = now;
  }
});

// ✅ 点击链接记录（包括是否跳转到外部网站）
document.addEventListener("click", (e) => {
  const target = e.target.closest("a");
  if (target && target.href) {
    const href = target.href;
    const currentHost = location.host;
    const targetHost = new URL(href).host;
    const isExternal = targetHost !== currentHost;

    clickLog.push({
      href,
      time: Date.now() - startTime,
      external: isExternal
    });
  }
});

// ✅ 页面隐藏/返回记录
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hideTime = Date.now();
  } else if (hideTime) {
    visibilityLog.push({
      hiddenAt: hideTime - startTime,
      returnedAt: Date.now() - startTime
    });
    hideTime = null;
  }
});

// ✅ 页面关闭前上传数据
window.addEventListener("beforeunload", () => {
  const endTime = Date.now();
  const duration = endTime - startTime;

  set(dbRef, {
    startedAt: new Date(startTime).toISOString(),
    duration,
    referrer: document.referrer || null,
    device: deviceInfo,
    mousePath: mousePath,
    visibility: visibilityLog,
    clicks: clickLog
  });
});
