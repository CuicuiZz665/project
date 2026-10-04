(() => {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const motionStyle = document.createElement("style");
  motionStyle.textContent = `
    .gin-reveal {
      opacity: 0;
      transform: translate3d(0, 22px, 0);
      transition:
        opacity .72s cubic-bezier(.2, .8, .2, 1),
        transform .72s cubic-bezier(.2, .8, .2, 1),
        filter .72s cubic-bezier(.2, .8, .2, 1);
      filter: saturate(.94);
      will-change: opacity, transform;
    }

    .gin-reveal.is-visible {
      opacity: 1;
      transform: translate3d(0, 0, 0);
      filter: saturate(1);
    }

    .gin-interactive-sheen {
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }

    .gin-interactive-sheen::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      border-radius: inherit;
      opacity: 0;
      background:
        radial-gradient(
          260px circle at var(--gin-pointer-x, 50%) var(--gin-pointer-y, 50%),
          rgba(247, 147, 26, .18),
          rgba(255, 209, 102, .06) 34%,
          transparent 68%
        );
      transition: opacity .28s ease;
    }

    .gin-interactive-sheen:hover::before {
      opacity: 1;
    }

    .gin-motion-enabled :where(.btn, .button, .bitget-button, a[class*="btn"], a[class*="button"], button) {
      transition:
        transform .22s ease,
        box-shadow .22s ease,
        border-color .22s ease,
        background .22s ease,
        color .22s ease;
    }

    .gin-motion-enabled :where(.btn, .button, .bitget-button, a[class*="btn"], a[class*="button"], button):hover {
      transform: translateY(-2px);
    }

    .gin-motion-enabled .mega-menu {
      transform-origin: top center;
    }
  `;
  document.head.appendChild(motionStyle);
  document.documentElement.classList.add("gin-motion-enabled");

  const revealSelector = [
    "main > section",
    ".hero",
    ".hero-section",
    ".academy-hero",
    ".article-hero",
    ".articles-hero",
    ".copy-hero",
    ".invite-hero",
    ".ib-hero",
    ".rewards-hero",
    ".article-card",
    ".course-stage",
    ".course-card",
    ".outline-card",
    ".progress-card",
    ".copy-card",
    ".trader-card",
    ".mission-card",
    ".reward-board",
    ".redeem-card",
    ".faq-card",
    ".ib-card",
    ".tier-card",
    ".channel-card",
    ".feature-card",
    ".process-card",
    ".benefit-card",
    ".contact-card",
    ".metric-card",
    ".market-card",
    ".why-card",
    ".access-card",
    ".trust-card"
  ].join(",");

  const interactiveSelector = [
    ".article-card",
    ".course-stage",
    ".course-card",
    ".copy-card",
    ".trader-card",
    ".mission-card",
    ".reward-board",
    ".redeem-card",
    ".faq-card",
    ".ib-card",
    ".tier-card",
    ".channel-card",
    ".feature-card",
    ".process-card",
    ".benefit-card",
    ".contact-card",
    ".metric-card",
    ".market-card",
    ".why-card",
    ".access-card",
    ".trust-card"
  ].join(",");

  const revealItems = Array.from(document.querySelectorAll(revealSelector))
    .filter((element) => !element.closest(".mega-menu, .mobile-menu, footer"));

  revealItems.forEach((element, index) => {
    element.classList.add("gin-reveal");
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 45}ms`;
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    revealItems.forEach((element) => observer.observe(element));
  } else {
    revealItems.forEach((element) => element.classList.add("is-visible"));
  }

  document.querySelectorAll(interactiveSelector).forEach((element) => {
    element.classList.add("gin-interactive-sheen");
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty("--gin-pointer-x", `${x.toFixed(2)}%`);
      element.style.setProperty("--gin-pointer-y", `${y.toFixed(2)}%`);
    }, { passive: true });
  });
})();
