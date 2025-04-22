document.addEventListener("DOMContentLoaded", function () {
    const startLabel = document.querySelector('.start-label');
    const mainStory = document.querySelector('.mainstory');
    const targetLink = document.querySelector('.intro-paragraph a');
  
    let lastScrollY = window.scrollY; // 用来记录上一次的滚动位置
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const top = entry.boundingClientRect.top;
        const currentScrollY = window.scrollY;
        const scrollingUp = currentScrollY < lastScrollY;
        lastScrollY = currentScrollY;
  
        // 🎯 向下滚：元素进入底部 10% → 显示动画
        if (entry.isIntersecting && top > 0) {
          startLabel.classList.add('show');
          if (!mainStory.classList.contains('show')) {
            setTimeout(() => {
              mainStory.classList.add('show');
            }, 800);
          }
        }
  
        // 🎯 向上滚 && 元素回到视口顶部 30px 内 → 隐藏动画
        if (scrollingUp && top < 30) {
          startLabel.classList.remove('show');
          mainStory.classList.remove('show');
        }
      });
    }, {
      root: null,
      threshold: 0,
      rootMargin: "0px 0px -40% 0px"
    });
  
    observer.observe(targetLink);
  });