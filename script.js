

const THEME_KEY = "Lance-theme";

function getStored() {
  return localStorage.getItem(THEME_KEY) || "system";
}

function getSystem() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(t) {
  return t === "system" ? getSystem() : t;
}

function applyTheme(stored) {
  const resolved = resolveTheme(stored);
  document.documentElement.setAttribute("data-theme", resolved);
  document.querySelectorAll(".theme-label").forEach(el => {
    el.textContent = stored === "system" ? "system" : resolved;
  });
}

function cycleTheme() {
  const cur = getStored();
  const next = cur === "light" ? "dark" : cur === "dark" ? "system" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}


applyTheme(getStored());


window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (getStored() === "system") applyTheme("system");
});

/* ---------- LIVE CLOCK (PH Time — Asia/Manila) ---------- */
(function initClock() {
  const clockEl = document.getElementById("clockTime");
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    // Format to PH timezone
    const timeStr = now.toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour:     "2-digit",
      minute:   "2-digit",
      second:   "2-digit",
      hour12:   false,
    });
    clockEl.textContent = timeStr; // e.g. "19:32:54"
  }

  tick(); // run immediately — no blank flash
  setInterval(tick, 1000);
})();


document.addEventListener("DOMContentLoaded", () => {


  document.getElementById("themeToggle")?.addEventListener("click", cycleTheme);
  document.getElementById("mobileThemeToggle")?.addEventListener("click", cycleTheme);


  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeBtn = document.getElementById("mobileMenuClose");

  function openMenu() {
    mobileMenu.classList.add("open");
    mobileMenu.setAttribute("aria-hidden", "false");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  hamburger?.addEventListener("click", () => {
    mobileMenu.classList.contains("open") ? closeMenu() : openMenu();
  });

  closeBtn?.addEventListener("click", closeMenu);

  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) closeMenu();
  });


  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    });

    document.querySelectorAll(".animate-in").forEach(el => {
      animObserver.observe(el);
    });
  } else {

    document.querySelectorAll(".animate-in").forEach(el => {
      el.classList.add("visible");
    });
  }


  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  /* ---------- ACTIVE NAV ON SCROLL (fixed for last section) ----------
     IntersectionObserver with rootMargin misses short last sections like
     Contact because it never fully enters the detection zone.
     Solution: combine IO for mid-page sections + a scroll fallback that
     force-activates the LAST nav link when the user is near the bottom.
  -------------------------------------------------------------------- */

  function setActiveLink(id) {
    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-section") === id);
    });
  }

  // Build an ordered array of { id, top } for scroll-position fallback
  function getSectionTops() {
    return Array.from(sections).map(s => ({
      id:  s.getAttribute("id"),
      top: s.getBoundingClientRect().top + window.scrollY,
    }));
  }

  // Scroll-position based — used as fallback & bottom-of-page guard
  function updateNavByScroll() {
    const scrollY      = window.scrollY;
    const windowH      = window.innerHeight;
    const docH         = document.documentElement.scrollHeight;
    const atBottom     = scrollY + windowH >= docH - 80; // 80px buffer

    if (atBottom) {
      // Force-highlight the last section (Contact) when at the bottom
      const lastSection = sections[sections.length - 1];
      setActiveLink(lastSection.getAttribute("id"));
      return;
    }

    // Otherwise find the section whose top is closest above the midpoint
    const midpoint = scrollY + windowH * 0.35;
    const tops = getSectionTops();
    let active = tops[0].id;
    for (const { id, top } of tops) {
      if (top <= midpoint) active = id;
    }
    setActiveLink(active);
  }

  // Listen to scroll — throttled with requestAnimationFrame
  let rafPending = false;
  window.addEventListener("scroll", () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      updateNavByScroll();
      rafPending = false;
    });
  }, { passive: true });

  // Run once on load
  updateNavByScroll();

  /* ---------- SMOOTH SCROLL ---------- */
  document.querySelectorAll("a[href^='#']").forEach(anchor => {
    anchor.addEventListener("click", e => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });


});


