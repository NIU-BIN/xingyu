/* 星屿·新标签页 官网交互
   纯原生 JS，无依赖。所有动效都尊重 prefers-reduced-motion。 */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.getElementById("site-header");
  const progress = document.getElementById("scroll-progress");
  const hero = document.querySelector(".hero");
  const mock = document.querySelector(".mock");
  const starfield = document.getElementById("starfield");

  /* ---------------------------------------------------------------
     滚动进度 + 头部状态 + 视差
     --------------------------------------------------------------- */
  let scrollY = window.scrollY;
  let ticking = false;

  const updateOnScroll = () => {
    scrollY = window.scrollY;

    if (header) {
      header.classList.toggle("is-scrolled", scrollY > 12);
    }

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(scrollY / max, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }

    if (starfield && !reduceMotion) {
      starfield.style.transform = `translate3d(0, ${scrollY * 0.06}px, 0)`;
    }

    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateOnScroll);
    }
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateOnScroll();

  /* ---------------------------------------------------------------
     移动端导航
     --------------------------------------------------------------- */
  const navToggle = document.getElementById("nav-toggle");
  const siteNav = document.getElementById("site-nav");

  const closeNav = () => {
    header?.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "打开菜单");
  };

  navToggle?.addEventListener("click", () => {
    const open = !header?.classList.contains("nav-open");
    header?.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  });

  siteNav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  document.addEventListener("click", (event) => {
    if (!header?.classList.contains("nav-open")) return;
    if (!event.target.closest(".site-header")) closeNav();
  });

  /* ---------------------------------------------------------------
     滚动渐入
     --------------------------------------------------------------- */
  const reveals = Array.from(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------------------------------------------------------
     数字滚动
     --------------------------------------------------------------- */
  const counters = Array.from(document.querySelectorAll("[data-count]"));

  const runCounter = (el) => {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (counters.length) {
    // HTML 里先写最终值，保证禁用 JS 时也能读到；脚本接管后再从 0 开始滚动
    counters.forEach((el) => {
      el.textContent = `0${el.dataset.suffix || ""}`;
    });

    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
    } else {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* ---------------------------------------------------------------
     主题与壁纸：滚动切换预览
     --------------------------------------------------------------- */
  const themeSteps = Array.from(document.querySelectorAll(".theme-step"));
  const themeScreens = Array.from(document.querySelectorAll(".theme-screen"));
  const themeDots = Array.from(document.querySelectorAll(".theme-dots span"));

  const setActiveTheme = (index) => {
    themeSteps.forEach((step, i) => step.classList.toggle("is-active", i === index));
    themeScreens.forEach((screen, i) => screen.classList.toggle("is-active", i === index));
    themeDots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };

  if (themeSteps.length && "IntersectionObserver" in window) {
    const themeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTheme(Number(entry.target.dataset.step));
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    themeSteps.forEach((step) => themeObserver.observe(step));
    setActiveTheme(0);
  }

  /* ---------------------------------------------------------------
     星空 canvas
     --------------------------------------------------------------- */
  if (starfield) {
    const ctx = starfield.getContext("2d");

    const drawStars = () => {
      const width = starfield.clientWidth;
      const height = starfield.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      starfield.width = Math.round(width * dpr);
      starfield.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const count = Math.min(240, Math.round((width * height) / 8200));
      const palette = ["255,255,255", "156,196,255", "179,166,255", "127,208,255"];

      for (let i = 0; i < count; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.25 + 0.35;
        const alpha = Math.random() * 0.65 + 0.18;
        const color = palette[Math.floor(Math.random() * palette.length)];
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 少量带光晕的亮星
      for (let i = 0; i < 9; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.1 + 1.1;
        ctx.beginPath();
        ctx.fillStyle = "rgba(214,232,255,0.95)";
        ctx.shadowColor = "rgba(127,208,255,0.9)";
        ctx.shadowBlur = 10;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    drawStars();
    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(drawStars, 180);
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------
     鼠标视差（仅桌面 + 允许动效）
     --------------------------------------------------------------- */
  if (mock && hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;
    let heroVisible = true;

    const render = () => {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;

      const parallax = Math.min(window.scrollY * 0.05, 70);
      const dx = currentX * 10;
      const dy = parallax + currentY * 8;

      mock.style.transform =
        `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) ` +
        `rotateX(${(-currentY * 3.5).toFixed(2)}deg) rotateY(${(currentX * 4.5).toFixed(2)}deg)`;

      const settled =
        Math.abs(targetX - currentX) < 0.0005 &&
        Math.abs(targetY - currentY) < 0.0005;

      if (heroVisible) {
        rafId = requestAnimationFrame(render);
      } else if (!settled) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    };

    const startRender = () => {
      if (rafId === null) rafId = requestAnimationFrame(render);
    };

    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        targetX = (event.clientX - rect.left) / rect.width - 0.5;
        targetY = (event.clientY - rect.top) / rect.height - 0.5;
        startRender();
      },
      { passive: true }
    );

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      startRender();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          heroVisible = entries[0].isIntersecting;
          if (heroVisible) startRender();
        },
        { threshold: 0 }
      ).observe(hero);
    }

    startRender();
  }

  /* ---------------------------------------------------------------
     隐私政策目录高亮
     --------------------------------------------------------------- */
  const tocLinks = Array.from(document.querySelectorAll(".legal-toc a"));
  if (tocLinks.length) {
    const targets = tocLinks
      .map((link) => {
        const id = link.getAttribute("href");
        return id && id.startsWith("#") ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    const highlightToc = () => {
      let active = targets[0];
      targets.forEach((heading) => {
        if (heading.getBoundingClientRect().top <= 150) active = heading;
      });
      tocLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          active && link.getAttribute("href") === `#${active.id}`
        );
      });
    };

    highlightToc();
    window.addEventListener("scroll", highlightToc, { passive: true });
  }

  /* ---------------------------------------------------------------
     隐私政策：移动端把表格转成卡片
     --------------------------------------------------------------- */
  document.querySelectorAll(".legal-card table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      th.textContent.trim()
    );
    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (headers[index]) cell.setAttribute("data-label", headers[index]);
      });
    });
    table.closest(".table-wrap")?.classList.add("legal-table");
  });

  /* ---------------------------------------------------------------
     年份
     --------------------------------------------------------------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
