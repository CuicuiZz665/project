(() => {
      const nav = document.querySelector("[data-nav]");
      // Measure nav height into --nav-h so the full-bleed hero can tuck behind it.
      if (nav) {
        const setNavH = () => document.documentElement.style.setProperty('--nav-h', nav.getBoundingClientRect().height + 'px');
        setNavH();
        window.addEventListener('resize', setNavH, { passive: true });
        if (window.ResizeObserver) new ResizeObserver(setNavH).observe(nav);
      }
      // Homepage-style transparent nav: add subtle dark blur only after scrolling.
      if (nav) {
        const updNavScroll = () => {
          const y = window.scrollY || document.documentElement.scrollTop || 0;
          nav.classList.toggle("is-scrolled", y > 24);
        };
        window.addEventListener("scroll", updNavScroll, { passive: true });
        updNavScroll();
      }
      const mobileMenuToggle = document.querySelector("[data-mobile-menu-toggle]");
      const mobileMenu = document.querySelector("[data-mobile-menu]");
      if (!nav || !mobileMenuToggle || !mobileMenu) return;
      const closeMobileMenu = () => {
        nav.classList.remove("is-mobile-open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      };
      mobileMenuToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-mobile-open");
        mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
      });
      mobileMenu.querySelectorAll(".mobile-accordion").forEach((accordion) => {
        accordion.addEventListener("toggle", () => {
          if (!accordion.open) return;
          mobileMenu.querySelectorAll(".mobile-accordion").forEach((item) => {
            if (item !== accordion) item.open = false;
          });
        });
      });
      mobileMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileMenu));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMobileMenu();
      });
      document.addEventListener("click", (event) => {
        if (!nav.contains(event.target)) closeMobileMenu();
      });
    })();
