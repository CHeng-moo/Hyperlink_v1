// comments.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 🧩 你的 Firebase 配置
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
const commentsRef = ref(db, "comments");

// 🌈 用于随机颜色生成
const randomColors = ["#a3cf57", "#5c47ec", "#f3c93c", "#ff6b81", "#4cd4b0", "#555", "#e67e22", "#1abc9c"];

function getRandomColor() {
  return randomColors[Math.floor(Math.random() * randomColors.length)];
}

// 📩 监听提交按钮
document.getElementById("submit-comment").addEventListener("click", () => {
  const textarea = document.getElementById("new-comment");
  const message = textarea.value.trim();
  if (message !== "") {
    push(commentsRef, {
      message: message,
      time: Date.now(),
      color: getRandomColor()
    });
    textarea.value = ""; // 清空文本框
  }
});

// 📡 实时监听所有新评论
const commentsGrid = document.querySelector(".comments-grid");

onChildAdded(commentsRef, (data) => {
  const { message, color } = data.val();

  const box = document.createElement("div");
  box.className = "comment-box";

  const dot = document.createElement("span");
  dot.className = "comment-dot";
  dot.style.backgroundColor = color || "#ccc";

  const p = document.createElement("p");
  p.textContent = message;

  box.appendChild(dot);
  box.appendChild(p);

  commentsGrid.appendChild(box);
});