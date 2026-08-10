/* ==========================================================
   NEXUS · Premium Experience Layer (optimizado)
   Mantiene mejoras visuales importantes sin observers, tilt,
   tooltips externos ni listeners de puntero globales.
   ========================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let testimonialsSwiper = null;

  function safeCall(callback) {
    try {
      callback();
    } catch (error) {
      console.warn("NEXUS premium enhancement skipped:", error);
    }
  }

  // ----------------------------------------------------------
  // Lucide
  // ----------------------------------------------------------

  function initLucide() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function") {
      return;
    }

    window.lucide.createIcons({
      attrs: {
        "stroke-width": 1.7,
        "aria-hidden": "true"
      }
    });
  }

  // ----------------------------------------------------------
  // Swiper testimonios
  // ----------------------------------------------------------

  function initSwiper() {
    if (!window.Swiper) {
      return;
    }

    const element = document.querySelector(".testimonial-swiper");

    if (!element || testimonialsSwiper) {
      return;
    }

    testimonialsSwiper = new window.Swiper(element, {
      slidesPerView: 1,
      spaceBetween: 12,
      grabCursor: true,
      watchOverflow: true,
      resizeObserver: true,
      roundLengths: true,
      speed: reduceMotion ? 0 : 500,
      pagination: {
        el: ".testimonial-pagination",
        clickable: true
      },
      breakpoints: {
        680: { slidesPerView: 2 },
        1120: { slidesPerView: 3 }
      }
    });
  }

  // ----------------------------------------------------------
  // Lenis
  // Un único loop RAF para evitar trabajo duplicado.
  // ----------------------------------------------------------

  function initSmoothScroll() {
    if (!window.Lenis || reduceMotion || window.nexusLenis) {
      return;
    }

    const lenis = new window.Lenis({
      autoRaf: true,
      anchors: true,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.115,
      wheelMultiplier: 0.92,
      touchMultiplier: 1,
      allowNestedScroll: true
    });

    window.nexusLenis = lenis;
    document.documentElement.dataset.nexusSmoothScroll = "active";
  }

  // ----------------------------------------------------------
  // GSAP: solo hero / microanimaciones visibles.
  // Animaciones limitadas al hero para mantener el costo bajo.
  // ----------------------------------------------------------

  function initGsap() {
    if (!window.gsap || reduceMotion) {
      return;
    }

    if (document.documentElement.dataset.nexusHeroAnimated) {
      return;
    }

    const gsap = window.gsap;
    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" }
    });

    timeline
      .from(".site-header", {
        y: -18,
        opacity: 0,
        duration: 0.45
      })
      .from(
        ".hero-copy > *",
        {
          y: 20,
          opacity: 0,
          duration: 0.58,
          stagger: 0.065
        },
        "-=0.16"
      );

    document.documentElement.dataset.nexusHeroAnimated = "true";
  }

  // ----------------------------------------------------------
  // Header: listener pasivo + una actualización por frame.
  // ----------------------------------------------------------

  function initHeaderScrollState() {
    if (document.documentElement.dataset.nexusHeaderScrollReady) {
      return;
    }

    const header = document.querySelector(".site-header");
    if (!header) return;

    let scheduled = false;

    function update() {
      scheduled = false;
      header.classList.toggle("is-scrolled", window.scrollY > 18);
    }

    function onScroll() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.dataset.nexusHeaderScrollReady = "true";
  }

  function initPremiumExperience() {
    safeCall(initSmoothScroll);
    safeCall(initGsap);
    safeCall(initSwiper);
    safeCall(initLucide);
    safeCall(initHeaderScrollState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPremiumExperience, { once: true });
  } else {
    initPremiumExperience();
  }
})();
