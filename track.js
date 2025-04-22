// track.js
(function() {
  // Firebase 初始化
  const firebaseConfig = {
    apiKey: "AIzaSyD93-CezI0YDc62hL_71EV-0ct7l1amyGI",
    authDomain: "hyperlinking-9826f.firebaseapp.com",
    databaseURL: "https://hyperlinking-9826f-default-rtdb.firebaseio.com",
    projectId: "hyperlinking-9826f",
    storageBucket: "hyperlinking-9826f.firebasestorage.app",
    messagingSenderId: "449564834065",
    appId: "1:449564834065:web:911b53ab43142ee555b4b0"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // 获取当前页路径并清理
  const cleanPath = location.pathname.replace(/\W+/g, "_") || "home";

  // 创建唯一 session ID
  const sessionId = `user_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const ref = db.ref(`tracking/${cleanPath}/${sessionId}`);

  // 初始数据结构
  const startTime = Date.now();
  const mousePath = [];
  let lastMouseTime = 0;
  let hideTime = null;
  const visibilityLog = [];
  const clickLog = [];

  // 获取用户设备信息
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

  // 鼠标移动（最多记录 200 条，500ms 采样一次）
  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastMouseTime > 500 && mousePath.length < 200) {
      mousePath.push({ x: e.clientX, y: e.clientY, t: now - startTime });
      lastMouseTime = now;
    }
  });

  // 超链接点击记录
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (target && target.href) {
      clickLog.push({
        href: target.href,
        time: Date.now() - startTime
      });
    }
  });

  // 页面隐藏与返回（记录隐藏/显示时间点）
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

  // 页面卸载前上传数据
  window.addEventListener("beforeunload", () => {
    const endTime = Date.now();
    ref.set({
      startedAt: new Date(startTime).toISOString(),
      duration: endTime - startTime,
      device: deviceInfo,
      mousePath: mousePath,
      visibility: visibilityLog,
      clicks: clickLog
    });
  });

})();
