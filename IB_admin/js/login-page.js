(function () {
  "use strict";

  const app = window.AdminApp;
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const antd = window.antd;

  const h = React.createElement;
  const { useState, useRef, useEffect, useCallback } = React;
  const {
    App,
    Button,
    Card,
    ConfigProvider,
    Dropdown,
    Flex,
    Form,
    Input,
    Typography,
    theme: antdTheme,
  } = antd;

  const isDarkMode = () => document.documentElement.dataset.theme === "dark";
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FONT_STACK =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

  const LOCALES = {
    zh: {
      htmlLang: "zh-CN",
      docTitle: "Cui 管理控制台",
      brandTitle: "Cui 管理控制台",
      brandSubtitle: "使用您的账号、密码和验证码登录 Cui 管理控制台。",
      formTitle: "登录",
      account: "账号",
      password: "密码",
      captcha: "验证码",
      usernamePlaceholder: "请输入用户名",
      passwordPlaceholder: "请输入密码",
      captchaPlaceholder: "请输入验证码",
      usernameRequired: "请输入用户名",
      passwordRequired: "请输入密码",
      captchaRequired: "请输入验证码",
      captchaExtra: "点击左侧图片刷新验证码",
      signIn: "登 录",
      signInSuccess: "登录成功",
      captchaMismatch: "验证码错误，请重试",
      refreshTitle: "刷新",
      captchaAlt: "登录验证码",
      langSwitched: "语言已切换：简体中文",
      sysFollow: "跟随系统",
      sysLight: "浅色",
      sysDark: "深色"
    },
    en: {
      htmlLang: "en",
      docTitle: "Cui Admin Console",
      brandTitle: "Cui Admin Console",
      brandSubtitle:
        "Use your account, password, and verification code to access Cui Admin Console.",
      formTitle: "Sign In",
      account: "Account",
      password: "Password",
      captcha: "Captcha",
      usernamePlaceholder: "Enter username",
      passwordPlaceholder: "Enter password",
      captchaPlaceholder: "Enter captcha",
      usernameRequired: "Please enter username",
      passwordRequired: "Please enter password",
      captchaRequired: "Please enter captcha",
      captchaExtra: "Click the image on the left to refresh the captcha",
      signIn: "Sign in",
      signInSuccess: "Sign in successful",
      captchaMismatch: "Incorrect captcha, please try again",
      refreshTitle: "Refresh",
      captchaAlt: "Sign-in captcha",
      langSwitched: "Language switched: English",
      sysFollow: "Follow system",
      sysLight: "Light",
      sysDark: "Dark"
    }
  };

  /* ------------------------------------------------------------------ */
  /* Inline icons — SVG paths ported from the live login page           */
  /* (the vendored antd bundle ships without @ant-design/icons)          */
  /* ------------------------------------------------------------------ */

  const ICON_PATHS = {
    user: [
      "M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z",
    ],
    lock: [
      "M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 10-56 0z",
    ],
    "eye-invisible": [
      "M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z",
      "M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z",
    ],
    "safety-certificate": [
      "M866.9 169.9L527.1 54.1C523 52.7 517.5 52 512 52s-11 .7-15.1 2.1L157.1 169.9c-8.3 2.8-15.1 12.4-15.1 21.2v482.4c0 8.8 5.7 20.4 12.6 25.9L499.3 968c3.5 2.7 8 4.1 12.6 4.1s9.2-1.4 12.6-4.1l344.7-268.6c6.9-5.4 12.6-17 12.6-25.9V191.1c.2-8.8-6.6-18.3-14.9-21.2zM810 654.3L512 886.5 214 654.3V226.7l298-101.6 298 101.6v427.6zm-405.8-201c-3-4.1-7.8-6.6-13-6.6H336c-6.5 0-10.3 7.4-6.5 12.7l126.4 174a16.1 16.1 0 0026 0l212.6-292.7c3.8-5.3 0-12.7-6.5-12.7h-55.2c-5.1 0-10 2.5-13 6.6L468.9 542.4l-64.7-89.1z",
    ],
    global: [
      "M854.4 800.9c.2-.3.5-.6.7-.9C920.6 722.1 960 621.7 960 512s-39.4-210.1-104.8-288c-.2-.3-.5-.5-.7-.8-1.1-1.3-2.1-2.5-3.2-3.7-.4-.5-.8-.9-1.2-1.4l-4.1-4.7-.1-.1c-1.5-1.7-3.1-3.4-4.6-5.1l-.1-.1c-3.2-3.4-6.4-6.8-9.7-10.1l-.1-.1-4.8-4.8-.3-.3c-1.5-1.5-3-2.9-4.5-4.3-.5-.5-1-1-1.6-1.5-1-1-2-1.9-3-2.8-.3-.3-.7-.6-1-1C736.4 109.2 629.5 64 512 64s-224.4 45.2-304.3 119.2c-.3.3-.7.6-1 1-1 .9-2 1.9-3 2.9-.5.5-1 1-1.6 1.5-1.5 1.4-3 2.9-4.5 4.3l-.3.3-4.8 4.8-.1.1c-3.3 3.3-6.5 6.7-9.7 10.1l-.1.1c-1.6 1.7-3.1 3.4-4.6 5.1l-.1.1c-1.4 1.5-2.8 3.1-4.1 4.7-.4.5-.8.9-1.2 1.4-1.1 1.2-2.1 2.5-3.2 3.7-.2.3-.5.5-.7.8C103.4 301.9 64 402.3 64 512s39.4 210.1 104.8 288c.2.3.5.6.7.9l3.1 3.7c.4.5.8.9 1.2 1.4l4.1 4.7c0 .1.1.1.1.2 1.5 1.7 3 3.4 4.6 5l.1.1c3.2 3.4 6.4 6.8 9.6 10.1l.1.1c1.6 1.6 3.1 3.2 4.7 4.7l.3.3c3.3 3.3 6.7 6.5 10.1 9.6 80.1 74 187 119.2 304.5 119.2s224.4-45.2 304.3-119.2a300 300 0 0010-9.6l.3-.3c1.6-1.6 3.2-3.1 4.7-4.7l.1-.1c3.3-3.3 6.5-6.7 9.6-10.1l.1-.1c1.5-1.7 3.1-3.3 4.6-5 0-.1.1-.1.1-.2 1.4-1.5 2.8-3.1 4.1-4.7.4-.5.8-.9 1.2-1.4a99 99 0 003.3-3.7zm4.1-142.6c-13.8 32.6-32 62.8-54.2 90.2a444.07 444.07 0 00-81.5-55.9c11.6-46.9 18.8-98.4 20.7-152.6H887c-3 40.9-12.6 80.6-28.5 118.3zM887 484H743.5c-1.9-54.2-9.1-105.7-20.7-152.6 29.3-15.6 56.6-34.4 81.5-55.9A373.86 373.86 0 01887 484zM658.3 165.5c39.7 16.8 75.8 40 107.6 69.2a394.72 394.72 0 01-59.4 41.8c-15.7-45-35.8-84.1-59.2-115.4 3.7 1.4 7.4 2.9 11 4.4zm-90.6 700.6c-9.2 7.2-18.4 12.7-27.7 16.4V697a389.1 389.1 0 01115.7 26.2c-8.3 24.6-17.9 47.3-29 67.8-17.4 32.4-37.8 58.3-59 75.1zm59-633.1c11 20.6 20.7 43.3 29 67.8A389.1 389.1 0 01540 327V141.6c9.2 3.7 18.5 9.1 27.7 16.4 21.2 16.7 41.6 42.6 59 75zM540 640.9V540h147.5c-1.6 44.2-7.1 87.1-16.3 127.8l-.3 1.2A445.02 445.02 0 00540 640.9zm0-156.9V383.1c45.8-2.8 89.8-12.5 130.9-28.1l.3 1.2c9.2 40.7 14.7 83.5 16.3 127.8H540zm-56 56v100.9c-45.8 2.8-89.8 12.5-130.9 28.1l-.3-1.2c-9.2-40.7-14.7-83.5-16.3-127.8H484zm-147.5-56c1.6-44.2 7.1-87.1 16.3-127.8l.3-1.2c41.1 15.6 85 25.3 130.9 28.1V484H336.5zM484 697v185.4c-9.2-3.7-18.5-9.1-27.7-16.4-21.2-16.7-41.7-42.7-59.1-75.1-11-20.6-20.7-43.3-29-67.8 37.2-14.6 75.9-23.3 115.8-26.1zm0-370a389.1 389.1 0 01-115.7-26.2c8.3-24.6 17.9-47.3 29-67.8 17.4-32.6 37.8-58.4 59.1-75.1 9.2-7.2 18.4-12.7 27.7-16.4V327zM365.7 165.5c3.7-1.5 7.3-3 11-4.4-23.4 31.3-43.5 70.4-59.2 115.4-21-12-40.9-26-59.4-41.8 31.8-29.2 67.9-52.4 107.6-69.2zM165.5 365.7c13.8-32.6 32-62.8 54.2-90.2 24.9 21.5 52.2 40.3 81.5 55.9-11.6 46.9-18.8 98.4-20.7 152.6H137c3-40.9 12.6-80.6 28.5-118.3zM137 540h143.5c1.9 54.2 9.1 105.7 20.7 152.6a444.07 444.07 0 00-81.5 55.9A373.86 373.86 0 01137 540zm228.7 318.5c-39.7-16.8-75.8-40-107.6-69.2 18.5-15.8 38.4-29.7 59.4-41.8 15.7 45 35.8 84.1 59.2 115.4-3.7-1.4-7.4-2.9-11-4.4zm292.6 0c-3.7 1.5-7.3 3-11 4.4 23.4-31.3 43.5-70.4 59.2-115.4 21 12 40.9 26 59.4 41.8a373.81 373.81 0 01-107.6 69.2z",
    ],
    desktop: [
      "M928 140H96c-17.7 0-32 14.3-32 32v496c0 17.7 14.3 32 32 32h380v112H304c-8.8 0-16 7.2-16 16v48c0 4.4 3.6 8 8 8h432c4.4 0 8-3.6 8-8v-48c0-8.8-7.2-16-16-16H548V700h380c17.7 0 32-14.3 32-32V172c0-17.7-14.3-32-32-32zm-40 488H136V212h752v416z",
    ],
  };

  function Icon({ name }) {
    return h(
      "span",
      { role: "img", "aria-label": name, className: `anticon anticon-${name}` },
      h(
        "svg",
        {
          viewBox: "64 64 896 896",
          focusable: "false",
          "data-icon": name,
          width: "1em",
          height: "1em",
          fill: "currentColor",
          "aria-hidden": "true",
        },
        ICON_PATHS[name].map((d, i) => h("path", { key: i, d }))
      )
    );
  }

  /* ------------------------------------------------------------------ */
  /* Full-viewport drifting particle network (canvas.login-network)      */
  /* ------------------------------------------------------------------ */

  function mountNetworkCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let w = 0;
    let h = 0;
    const points = [];
    const LINK_DIST = 130;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      points.length = 0;
      const count = Math.round(
        85 * Math.min(1.4, Math.max(0.55, (w * h) / (1280 * 720)))
      );
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
        });
      }
    }

    function draw() {
      const dark = isDarkMode();
      const base = dark ? "rgba(246,247,251," : "rgba(31,35,40,";
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;
        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * (dark ? 0.15 : 0.13);
            ctx.strokeStyle = base + alpha + ")";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      for (const p of points) {
        ctx.fillStyle = base + (dark ? 0.5 : 0.36) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      if (!document.hidden) draw();
      raf = requestAnimationFrame(loop);
    }

    function onResize() {
      resize();
      if (prefersReducedMotion) draw();
    }

    resize();
    window.addEventListener("resize", onResize);
    if (prefersReducedMotion) draw();
    else raf = requestAnimationFrame(loop);

    return function destroy() {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Hero particle core: rotating dot sphere + "C" letter particles      */
  /* ------------------------------------------------------------------ */

  function mountHeroScene(container, canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let W = 0;
    let H = 0;
    let firstFrameDrawn = false;

    // pointer tilt (shared by sphere and letter plane)
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    // fibonacci sphere points, unit radius
    const GLOBE_POINTS = 3600;
    const sphere = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < GLOBE_POINTS; i++) {
      const y = 1 - (i / (GLOBE_POINTS - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      sphere.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
    }

    // letter "C" particle positions, sampled from an offscreen canvas
    let letterPoints = [];
    function sampleLetter() {
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.ceil(W));
      off.height = Math.max(1, Math.ceil(H));
      const c = off.getContext("2d");
      const fontSize = Math.min(H * 0.62, W * 0.42);
      c.fillStyle = "#fff";
      c.font = "900 " + fontSize + "px " + FONT_STACK;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("C", off.width / 2, off.height / 2 + fontSize * 0.04);
      const data = c.getImageData(0, 0, off.width, off.height).data;
      const hits = [];
      const step = Math.max(1, Math.round(H / 220));
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 140) hits.push([x, y]);
        }
      }
      const target = 3200;
      const picked = [];
      if (hits.length > target) {
        const stride = hits.length / target;
        for (let i = 0; i < target; i++) {
          picked.push(hits[Math.floor(i * stride)]);
        }
      } else {
        picked.push(...hits);
      }
      letterPoints = picked.map(([x, y]) => ({
        x: x - W / 2,
        y: y - H / 2,
        ph: Math.random() * Math.PI * 2,
        sp: 0.5 + Math.random(),
      }));
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sampleLetter();
      if (prefersReducedMotion) draw(0);
    }

    function draw(ms) {
      const t = ms / 1000;
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
      const dark = isDarkMode();
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(H * 0.44, W * 0.29);
      const persp = 2.6;

      // ---- rotating globe of dots ----
      const rotY = t * 0.12 + tiltY * 0.6;
      const rotX = -0.16 + tiltX * 0.3;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const globeColor = dark ? "214,222,235" : "86,99,118";
      for (let i = 0; i < sphere.length; i++) {
        const p = sphere[i];
        const x1 = p[0] * cosY + p[2] * sinY;
        const z1 = -p[0] * sinY + p[2] * cosY;
        const y2 = p[1] * cosX - z1 * sinX;
        const z2 = p[1] * sinX + z1 * cosX;
        const f = persp / (persp - z2);
        const sx = cx + x1 * R * f;
        const sy = cy + y2 * R * f;
        const depth = (z2 + 1) / 2;
        const alpha = 0.08 + depth * 0.38;
        const size = 0.55 + depth * 0.7;
        ctx.fillStyle = "rgba(" + globeColor + "," + alpha.toFixed(3) + ")";
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      }

      // ---- letter "C" particles with amber→coral gradient ----
      const breathe = 1 + Math.sin(t * 0.8) * 0.012;
      const parX = 1 + tiltY * 0.06;
      const parY = 1 + tiltX * 0.06;
      for (let i = 0; i < letterPoints.length; i++) {
        const q = letterPoints[i];
        const wob = Math.sin(t * 1.6 * q.sp + q.ph);
        const lx = q.x * breathe * parX;
        const ly = q.y * breathe * parY + wob * 0.55;
        const u = Math.min(1, Math.max(0, q.x / (W * 0.26) + 0.5));
        const cr = Math.round(251 + (240 - 251) * u);
        const cg = Math.round(176 + (78 - 176) * u);
        const cb = Math.round(59 + (96 - 59) * u);
        const alpha = 0.5 + 0.32 * (0.5 + 0.5 * Math.sin(t * 2 * q.sp + q.ph));
        const size = 1.05 + 0.45 * (0.5 + 0.5 * wob);
        ctx.fillStyle =
          "rgba(" + cr + "," + cg + "," + cb + "," + alpha.toFixed(3) + ")";
        ctx.fillRect(cx + lx - size / 2, cy + ly - size / 2, size, size);
      }

      if (!firstFrameDrawn) {
        firstFrameDrawn = true;
        container.classList.add("is-webgl-ready");
      }
    }

    function loop(ms) {
      if (!document.hidden) draw(ms);
      raf = requestAnimationFrame(loop);
    }

    function onMouseMove(e) {
      const r = container.getBoundingClientRect();
      targetTiltY = ((e.clientX - r.left) / r.width - 0.5) * 2;
      targetTiltX = ((e.clientY - r.top) / r.height - 0.5) * 2;
      container.classList.add("is-hovered");
    }

    function onMouseLeave() {
      targetTiltX = 0;
      targetTiltY = 0;
      container.classList.remove("is-hovered");
    }

    const observer =
      window.ResizeObserver && new ResizeObserver(resize);
    if (observer) observer.observe(container);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);
    resize();
    if (!prefersReducedMotion) raf = requestAnimationFrame(loop);

    return function destroy() {
      if (observer) observer.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Mock captcha generator (canvas, jpeg data URL)                      */
  /* ------------------------------------------------------------------ */

  const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function makeCaptcha() {
    const w = 126;
    const hgt = 42;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = hgt;
    const x = canvas.getContext("2d");
    x.fillStyle = "#f4f5f7";
    x.fillRect(0, 0, w, hgt);
    for (let i = 0; i < 240; i++) {
      x.fillStyle =
        "rgba(120,130,145," + (0.05 + Math.random() * 0.1).toFixed(3) + ")";
      x.fillRect(Math.random() * w, Math.random() * hgt, 1.4, 1.4);
    }
    let code = "";
    for (let i = 0; i < 5; i++) {
      const ch = CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
      code += ch;
      x.save();
      x.translate(
        16 + i * 23 + (Math.random() * 4 - 2),
        hgt / 2 + (Math.random() * 6 - 3)
      );
      x.rotate((Math.random() - 0.5) * 0.6);
      x.font =
        "bold " + (24 + Math.floor(Math.random() * 5)) + "px " + FONT_STACK;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillStyle = ["#2f3542", "#3a4756", "#46557a"][i % 3];
      x.fillText(ch, 0, 0);
      x.restore();
    }
    x.strokeStyle = "rgba(110,122,140,0.35)";
    x.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      x.beginPath();
      x.moveTo(0, Math.random() * hgt);
      x.bezierCurveTo(
        w * 0.3,
        Math.random() * hgt,
        w * 0.6,
        Math.random() * hgt,
        w,
        Math.random() * hgt
      );
      x.stroke();
    }
    return { code, url: canvas.toDataURL("image/jpeg", 0.92) };
  }

  /* ------------------------------------------------------------------ */
  /* Captcha row (button + input) bound as a single form control         */
  /* ------------------------------------------------------------------ */

  const CaptchaRow = React.forwardRef(function CaptchaRow(props, ref) {
    const {
      value,
      onChange,
      captchaUrl,
      refreshing,
      onRefresh,
      labels,
    } = props;
    return h(
      "div",
      { className: "login-captcha-row", ref },
      h(
        Button,
        {
          className: "login-captcha-trigger",
          "aria-label": labels.refreshTitle,
          title: labels.refreshTitle,
          onClick: onRefresh,
          disabled: refreshing,
        },
        h("img", {
          className:
            "login-captcha-image" +
            (refreshing ? " login-captcha-image--refreshing" : ""),
          alt: labels.captchaAlt,
          src: captchaUrl,
        })
      ),
      h(Input, {
        id: "captcha",
        "aria-label": labels.captcha,
        className: "login-captcha-input",
        size: "large",
        placeholder: labels.captchaPlaceholder,
        autoComplete: "off",
        prefix: h(Icon, { name: "safety-certificate" }),
        value,
        onChange,
      })
    );
  });

  /* ------------------------------------------------------------------ */
  /* Login page                                                          */
  /* ------------------------------------------------------------------ */

  function applyThemePreference(pref) {
    const dark =
      pref === "dark" ||
      (pref === "system" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.themePreference = pref;
    root.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("cui-login-theme", pref);
    } catch (e) {
      /* file:// or privacy mode — keep session-only */
    }
  }

  function readThemePreference() {
    try {
      const stored = localStorage.getItem("cui-login-theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch (e) {
      /* ignore */
    }
    return "system";
  }

  function readLanguage() {
    try {
      const stored = localStorage.getItem("cui-login-lang");
      if (stored === "zh" || stored === "en") {
        return stored;
      }
    } catch (e) {
      /* ignore */
    }
    return "zh";
  }

  function LoginView({ themePref, setThemePref, dark }) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [lang, setLang] = useState(readLanguage);
    const t = LOCALES[lang];
    const [captcha, setCaptcha] = useState(() => makeCaptcha());
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const networkRef = useRef(null);
    const heroContainerRef = useRef(null);
    const heroCanvasRef = useRef(null);

    useEffect(
      function syncLanguage() {
        document.title = t.docTitle;
        document.documentElement.lang = t.htmlLang;
        try {
          localStorage.setItem("cui-login-lang", lang);
        } catch (e) {
          /* file:// or privacy mode — keep session-only */
        }
      },
      [lang, t.docTitle, t.htmlLang]
    );

    useEffect(() => {
      const destroyNetwork = networkRef.current
        ? mountNetworkCanvas(networkRef.current)
        : null;
      const destroyHero =
        heroContainerRef.current && heroCanvasRef.current
          ? mountHeroScene(heroContainerRef.current, heroCanvasRef.current)
          : null;
      return function cleanup() {
        if (destroyNetwork) destroyNetwork();
        if (destroyHero) destroyHero();
      };
    }, []);

    const refreshCaptcha = useCallback(function () {
      setRefreshing(true);
      window.setTimeout(function () {
        setCaptcha(makeCaptcha());
        setRefreshing(false);
      }, 320);
    }, []);

    const onFinish = useCallback(
      function (values) {
        if ((values.captcha || "").trim().toUpperCase() !== captcha.code) {
          message.error(t.captchaMismatch);
          refreshCaptcha();
          form.setFieldValue("captcha", "");
          return;
        }
        setSubmitting(true);
        window.setTimeout(function () {
          setSubmitting(false);
          message.success(t.signInSuccess);
          window.setTimeout(function () {
            try {
              sessionStorage.setItem("cui-admin-authed", "1");
            } catch (error) {
              // 无痕/隐私模式禁用存储时忽略，不影响进入后台
            }
            window.location.href = "index.html";
          }, 650);
        }, 900);
      },
      [captcha.code, form, message, refreshCaptcha]
    );

    const languageMenu = {
      selectable: true,
      selectedKeys: [lang],
      onClick: function (info) {
        setLang(info.key);
        message.info(LOCALES[info.key].langSwitched);
      },
      items: [
        { key: "zh", label: "简体中文" },
        { key: "en", label: "English" },
      ],
    };

    const systemMenu = {
      selectable: true,
      selectedKeys: [themePref],
      onClick: function (info) {
        setThemePref(info.key);
      },
      items: [
        { key: "system", label: t.sysFollow },
        { key: "light", label: t.sysLight },
        { key: "dark", label: t.sysDark },
      ],
    };

    return h(
      ConfigProvider,
      {
        theme: {
          algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        },
      },
      h(
        "main",
        { className: "login-wrapper" },
        // top-right corner actions
        h(
          Flex,
          { className: "login-top-actions", align: "center", gap: 6 },
          h(
            Dropdown,
            { menu: languageMenu, trigger: ["click"], placement: "bottomRight" },
            h(Button, {
              "aria-label": "Language",
              type: "text",
              size: "large",
              style: { padding: 0 },
              icon: h(Icon, { name: "global" }),
            })
          ),
          h(
            Dropdown,
            { menu: systemMenu, trigger: ["click"], placement: "bottomRight" },
            h(Button, {
              "aria-label": "System",
              title: "System",
              type: "text",
              size: "large",
              style: { padding: 0 },
              icon: h(Icon, { name: "desktop" }),
            })
          )
        ),
        // ambient background orbs + dot grid
        h(
          "div",
          { className: "login-source-bg", "aria-hidden": "true" },
          h("div", { className: "login-source-orb login-source-orb--1" }),
          h("div", { className: "login-source-orb login-source-orb--2" }),
          h("div", { className: "login-source-orb login-source-orb--3" }),
          h("div", { className: "login-source-orb login-source-orb--4" }),
          h("div", { className: "login-source-orb login-source-orb--5" })
        ),
        h("canvas", {
          className: "login-network",
          ref: networkRef,
          "aria-hidden": "true",
        }),
        h(
          "div",
          { className: "login-stage" },
          // left brand panel
          h(
            "section",
            { className: "login-brand", "aria-labelledby": "login-page-heading" },
            h(
              "div",
              { className: "login-brand-lockup" },
              h("img", {
                className: "login-brand-logo",
                alt: "Cui Admin Console",
                src: "images/auth-login/cui-logo.svg",
              })
            ),
            h(
              "div",
              { className: "login-hero-art" },
              h(
                "div",
                {
                  className: "particle-logo-core hex-core",
                  ref: heroContainerRef,
                  "data-hex-core": "",
                  tabIndex: -1,
                  "aria-hidden": "true",
                },
                h("canvas", {
                  className: "particle-logo-core__canvas hex-core-canvas",
                  ref: heroCanvasRef,
                  "aria-hidden": "true",
                }),
                h("div", {
                  className: "particle-logo-core__orbit hex-orbit-ring",
                  "aria-hidden": "true",
                }),
                h("div", {
                  className:
                    "particle-logo-core__orbit particle-logo-core__orbit--alt hex-orbit-ring is-alt",
                  "aria-hidden": "true",
                }),
                h("div", {
                  className:
                    "particle-logo-core__logo-fallback hex-logo-fallback",
                  "aria-hidden": "true",
                }),
                h("div", {
                  className: "particle-logo-core__scanline hex-scanline",
                  "aria-hidden": "true",
                })
              )
            ),
            h(
              "div",
              { className: "login-brand-copy" },
              h(
                Typography.Title,
                {
                  className: "login-brand-title",
                  id: "login-page-heading",
                  level: 1,
                },
                t.brandTitle
              ),
              h(
                Typography.Paragraph,
                { className: "login-brand-subtitle" },
                t.brandSubtitle
              )
            )
          ),
          // right sign-in panel
          h(
            "section",
            {
              className: "login-card-shell",
              "aria-labelledby": "login-form-heading",
            },
            h(
              Card,
              { className: "login-card", variant: "outlined" },
              h(
                Flex,
                { vertical: true, gap: 24 },
                h(
                  "div",
                  { className: "login-card-heading" },
                  h("span", { className: "login-card-spark", "aria-hidden": "true" }, "*"),
                  h(
                    Typography.Title,
                    {
                      className: "login-title",
                      id: "login-form-heading",
                      level: 2,
                    },
                    t.formTitle
                  )
                ),
                h(
                  Form,
                  {
                    form,
                    className: "login-form",
                    layout: "vertical",
                    autoComplete: "off",
                    onFinish,
                  },
                  h(
                    Flex,
                    { vertical: true, gap: 8 },
                    h(
                      Form.Item,
                      {
                        label: t.account,
                        name: "username",
                        rules: [
                          { required: true, message: t.usernameRequired },
                        ],
                        style: { marginBottom: 0 },
                      },
                      h(Input, {
                        id: "username",
                        size: "large",
                        placeholder: t.usernamePlaceholder,
                        autoComplete: "username",
                        prefix: h(Icon, { name: "user" }),
                      })
                    ),
                    h(
                      Form.Item,
                      {
                        label: t.password,
                        name: "password",
                        rules: [
                          { required: true, message: t.passwordRequired },
                        ],
                        style: { marginBottom: 0 },
                      },
                      h(Input.Password, {
                        id: "password",
                        size: "large",
                        placeholder: t.passwordPlaceholder,
                        autoComplete: "current-password",
                        prefix: h(Icon, { name: "lock" }),
                      })
                    ),
                    h(
                      Form.Item,
                      {
                        label: t.captcha,
                        name: "captcha",
                        rules: [
                          { required: true, message: t.captchaRequired },
                        ],
                        style: { marginBottom: 0 },
                        extra: h(
                          Typography.Text,
                          { type: "secondary" },
                          t.captchaExtra
                        ),
                      },
                      h(CaptchaRow, {
                        captchaUrl: captcha.url,
                        refreshing,
                        onRefresh: refreshCaptcha,
                        labels: {
                          refreshTitle: t.refreshTitle,
                          captchaAlt: t.captchaAlt,
                          captcha: t.captcha,
                          captchaPlaceholder: t.captchaPlaceholder,
                        },
                      })
                    ),
                    h(
                      Form.Item,
                      { style: { marginBottom: 0, paddingTop: 8 } },
                      h(
                        Button,
                        {
                          type: "primary",
                          size: "large",
                          block: true,
                          htmlType: "submit",
                          loading: submitting,
                        },
                        t.signIn
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  function LoginRoot() {
    // theme preference lives here so switching it re-renders the antd
    // algorithm without remounting the canvases or resetting the form
    const [themePref, setThemePref] = useState(readThemePreference());
    const [systemDark, setSystemDark] = useState(
      function () {
        return (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }
    );

    useEffect(function () {
      applyThemePreference(themePref);
    }, [themePref]);

    useEffect(function () {
      if (!window.matchMedia) return undefined;
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = function (e) {
        setSystemDark(e.matches);
      };
      mq.addEventListener("change", onChange);
      return function cleanup() {
        mq.removeEventListener("change", onChange);
      };
    }, []);

    const dark =
      themePref === "dark" || (themePref === "system" && systemDark);

    return h(LoginView, { themePref, setThemePref, dark });
  }

  app.LoginPage = {
    mount: function (rootEl) {
      const root = ReactDOM.createRoot(rootEl);
      root.render(h(App, null, h(LoginRoot)));
      return root;
    },
  };
})();
