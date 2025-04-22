// ✅ 完整版 track.js with visibilitychange + fallback
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ Firebase config
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
const db = getDatabase(app);

// ✅ Visitor ID (stored locally)
let visitorId = localStorage.getItem("visitorId");
if (!visitorId) {
  visitorId = "v_" + Math.random().toString(36).substring(2);
  localStorage.setItem("visitorId", visitorId);
}

// ✅ Path detection
const path = window.location.pathname;
const page = path;

// ✅ Create session
const sessionRef = push(ref(db, `trackingVisitors/${visitorId}/sessions`));
const data = {
  page: page,
  url: window.location.href,
  userAgent: navigator.userAgent,
  startTime: Date.now(),
  mouseTrail: [],
  clicks: [],
  returns: [] // { leave: time, return: time }
};

// ✅ Mouse movement tracker
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

// ✅ Click tracking

document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (link && link.href) {
    data.clicks.push({
      href: link.href,
      time: Date.now()
    });
  }
});

// ✅ Visibility change tracker
let hasUploaded = false;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && !hasUploaded) {
    data.returns.push({ leave: Date.now() });
    data.endTime = Date.now();
    set(sessionRef, data);
    hasUploaded = true;
    console.log("\u{1F44B} Page hidden — uploaded");
  } else if (document.visibilityState === "visible") {
    data.returns.push({ return: Date.now() });
    hasUploaded = false; // 允许再次上传
    console.log("\u{1F440} Page visible again");
  }
});

// ✅ Fallback timeout in case no visibility event fires
setTimeout(() => {
  if (!hasUploaded) {
    data.endTime = Date.now();
    set(sessionRef, data);
    hasUploaded = true;
    console.log("\u{23F3} Timed fallback upload");
  }
}, 8000);
