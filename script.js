

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
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
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
      id: s.getAttribute("id"),
      top: s.getBoundingClientRect().top + window.scrollY,
    }));
  }

  // Scroll-position based — used as fallback & bottom-of-page guard
  function updateNavByScroll() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const atBottom = scrollY + windowH >= docH - 80; // 80px buffer

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

}); // end DOMContentLoaded

/* ---------- PROFILE PHOTO — 3D HEAD TRACKING ----------
   The photo tilts in 3D to follow the mouse cursor,
   giving the illusion that Lance is looking at you.
   On mobile (no hover/cursor), the effect is skipped.
-------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function initHeadTracking() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  // Skip on touch-only devices
  if (window.matchMedia("(hover: none)").matches) return;

  const wrap = document.querySelector(".profile-photo-wrap");
  const photo = document.querySelector(".profile-photo");
  if (!wrap || !photo) return;

  // Mark wrap so CSS hover scale doesn't fight with JS tracking
  wrap.classList.add("js-tracking");

  // Config
  const MAX_TILT = 14;   // max degrees of rotation
  const MAX_SHIFT = 6;   // max px translate for inner photo
  const EASE = 0.08;     // lerp speed (0 = frozen, 1 = instant)

  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;
  let rafId = null;
  let isHovering = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentRX = lerp(currentRX, targetRX, EASE);
    currentRY = lerp(currentRY, targetRY, EASE);

    // Outer wrap tilts in 3D
    wrap.style.transform = `perspective(600px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale3d(1.02,1.02,1.02)`;

    // Inner photo shifts slightly in opposite direction (parallax depth)
    const shiftX = (currentRY / MAX_TILT) * MAX_SHIFT;
    const shiftY = -(currentRX / MAX_TILT) * MAX_SHIFT;
    photo.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(1.05)`;

    // Dynamic shadow follows tilt direction
    const shadowX = (currentRY / MAX_TILT) * 16;
    const shadowY = (currentRX / MAX_TILT) * 16;
    wrap.style.boxShadow = `${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.22)`;

    if (
      isHovering ||
      Math.abs(currentRX - targetRX) > 0.01 ||
      Math.abs(currentRY - targetRY) > 0.01
    ) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  document.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalise mouse position relative to photo center: -1 to +1
    const nx = (e.clientX - centerX) / (window.innerWidth / 2);
    const ny = (e.clientY - centerY) / (window.innerHeight / 2);

    // Clamp to ±1 and map to tilt degrees
    targetRY = Math.max(-1, Math.min(1, nx)) * MAX_TILT;
    targetRX = -Math.max(-1, Math.min(1, ny)) * MAX_TILT;

    startLoop();
  });

  wrap.addEventListener("mouseenter", () => { isHovering = true; startLoop(); });
  wrap.addEventListener("mouseleave", () => {
    isHovering = false;
    // Smoothly return to neutral when cursor leaves
    targetRX = 0;
    targetRY = 0;
    startLoop();
  });

  // Performance hints
  wrap.style.willChange = "transform";
  photo.style.willChange = "transform";
  wrap.style.transformStyle = "preserve-3d";

  // CRITICAL: Remove CSS transform transitions — they fight with the rAF loop
  // and make the photo lag / not respond to cursor properly
  photo.style.transition = "filter 500ms ease";
  wrap.style.transition = "box-shadow 300ms ease, border-color 200ms ease";
});

/* ---------- HOVER SOUND (Web Audio API) ---------- */
(function initHoverSound() {
  const KEY  = "lance-sound";
  let ac     = null;
  let muted  = localStorage.getItem(KEY) === "off";
  let last   = null; // prevent re-triggering on same element

  // async beep — awaits resume before scheduling audio
  async function beep(freq, vol, dur) {
    if (muted) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state !== "running") await ac.resume();
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(vol, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(env);
      env.connect(ac.destination);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch (_) {}
  }

  // cursor:pointer = has a hover effect → play sound
  // Single document listener — covers ALL hoverable elements automatically
  document.addEventListener("mouseover", function (e) {
    const el = e.target;
    if (el === last) return;
    last = el;
    if (window.getComputedStyle(el).cursor === "pointer") {
      beep(1200, 0.055, 0.022);
    }
  });

  document.addEventListener("mousedown", function (e) {
    if (window.getComputedStyle(e.target).cursor === "pointer") {
      beep(700, 0.09, 0.032);
    }
  });

  // Emoji sync helper
  function syncEmoji() {
    ["soundToggle", "mobileSoundToggle"].forEach(id => {
      const span = document.getElementById(id)?.querySelector(".sound-emoji");
      if (span) span.textContent = muted ? "🔇" : "🔈";
    });
  }

  // Global toggle (called via onclick="window.toggleSound()")
  window.toggleSound = function () {
    muted = !muted;
    localStorage.setItem(KEY, muted ? "off" : "on");
    syncEmoji();
    if (!muted) beep(1400, 0.08, 0.04);
  };

  syncEmoji();
})();



