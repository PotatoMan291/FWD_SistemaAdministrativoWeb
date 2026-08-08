/* ==========================================================
   NEXUS · Premium Experience Layer
   Progressive enhancement only: the store remains functional
   even if any CDN library is unavailable.
   ========================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let testimonialsSwiper = null;
  let premiumObserver = null;
  let refreshTimer = null;

  function safeCall(callback) {
    try {
      callback();
    } catch (error) {
      console.warn("NEXUS premium enhancement skipped:", error);
    }
  }

  // ----------------------------------------------------------
  // Lucide Icons
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
  // Tooltips
  // ----------------------------------------------------------

  function prepareDynamicTooltips() {
    document.querySelectorAll(".favorite").forEach(function (button) {
      if (!button.dataset.tippyContent) {
        button.dataset.tippyContent = button.classList.contains("active")
          ? "Quitar de favoritos"
          : "Agregar a favoritos";
      }
    });

    document.querySelectorAll(".compare-btn").forEach(function (button) {
      if (!button.dataset.tippyContent) {
        button.dataset.tippyContent = button.classList.contains("active")
          ? "Quitar del comparador"
          : "Comparar producto";
      }
    });

    document.querySelectorAll(".add-cart").forEach(function (button) {
      if (!button.dataset.tippyContent && !button.disabled) {
        button.dataset.tippyContent = "Agregar al carrito";
      }
    });
  }

  function initTippy() {
    if (typeof window.tippy !== "function") {
      return;
    }

    prepareDynamicTooltips();

    document
      .querySelectorAll("[data-tippy-content]")
      .forEach(function (element) {
        if (element._tippy) {
          return;
        }

        window.tippy(element, {
          placement: "bottom",
          animation: "shift-away",
          duration: [180, 130],
          delay: [350, 0],
          theme: "nexus",
          arrow: true,
          touch: ["hold", 500]
        });
      });
  }

  // ----------------------------------------------------------
  // AOS
  // ----------------------------------------------------------

  function markAosElements() {
    if (!window.AOS || reduceMotion) {
      return;
    }

    const groups = [
      [".section-head", "fade-up"],
      [".category-card", "fade-up"],
      [".novelty-card", "fade-up"],
      [".product-card", "fade-up"],
      [".trust article", "fade-up"],
      [".builder-section", "fade-up"],
      [".rewards", "fade-up"],
      [".testimonial-zone", "fade-up"],
      [".premium-tech-rail article", "fade-up"]
    ];

    groups.forEach(function ([selector, animation]) {
      document.querySelectorAll(selector).forEach(function (element, index) {
        if (!element.hasAttribute("data-aos")) {
          element.setAttribute("data-aos", animation);
          element.setAttribute("data-aos-duration", "650");
          element.setAttribute("data-aos-delay", String(Math.min(index * 45, 180)));
          element.setAttribute("data-aos-once", "true");
        }
      });
    });
  }

  function initAOS() {
    if (!window.AOS || reduceMotion) {
      return;
    }

    markAosElements();

    if (!document.documentElement.dataset.nexusAosReady) {
      window.AOS.init({
        duration: 650,
        easing: "ease-out-cubic",
        once: true,
        offset: 45,
        delay: 0,
        mirror: false
      });

      document.documentElement.dataset.nexusAosReady = "true";
    } else if (typeof window.AOS.refreshHard === "function") {
      window.AOS.refreshHard();
    }
  }

  // ----------------------------------------------------------
  // Vanilla Tilt
  // ----------------------------------------------------------

  function initTilt() {
    if (!window.VanillaTilt || reduceMotion || window.innerWidth < 780) {
      return;
    }

    document
      .querySelectorAll(".product-card, .category-card, .rewards")
      .forEach(function (element) {
        if (element.vanillaTilt) {
          return;
        }

        window.VanillaTilt.init(element, {
          max: 2.8,
          speed: 550,
          scale: 1,
          perspective: 1300,
          glare: false,
          gyroscope: false,
          reset: true
        });
      });
  }

  // ----------------------------------------------------------
  // Swiper
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
      observer: true,
      observeParents: true,
      resizeObserver: true,
      roundLengths: true,
      speed: reduceMotion ? 0 : 550,
      pagination: {
        el: ".testimonial-pagination",
        clickable: true
      },
      breakpoints: {
        680: {
          slidesPerView: 2
        },
        1120: {
          slidesPerView: 3
        }
      }
    });
  }

  // ----------------------------------------------------------
  // Lenis + GSAP ScrollTrigger
  // ----------------------------------------------------------

  function initSmoothScroll() {
    if (!window.Lenis || reduceMotion || window.nexusLenis) {
      return;
    }

    const hasGsap = Boolean(window.gsap && window.ScrollTrigger);

    const lenis = new window.Lenis({
      autoRaf: !hasGsap,
      anchors: true,
      smoothWheel: true,
      syncTouch: false,
      duration: 1.05,
      allowNestedScroll: true
    });

    window.nexusLenis = lenis;

    if (hasGsap) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      lenis.on("scroll", window.ScrollTrigger.update);

      window.gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });

      window.gsap.ticker.lagSmoothing(0);
    }
  }

  // ----------------------------------------------------------
  // GSAP hero and premium micro-interactions
  // ----------------------------------------------------------

  function initGsap() {
    if (!window.gsap || reduceMotion) {
      return;
    }

    const gsap = window.gsap;

    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
    }

    if (!document.documentElement.dataset.nexusHeroAnimated) {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out"
        }
      });

      timeline
        .from(".site-header", {
          y: -22,
          opacity: 0,
          duration: 0.55
        })
        .from(
          ".hero-copy > *",
          {
            y: 24,
            opacity: 0,
            duration: 0.65,
            stagger: 0.08
          },
          "-=0.2"
        )
        .from(
          ".hero-image-stage",
          {
            x: 36,
            scale: 0.96,
            opacity: 0,
            duration: 0.9
          },
          "-=0.65"
        );

      gsap.to(".hero-image-stage", {
        y: -8,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".hero-orbit-one", {
        rotation: 12,
        duration: 13,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".hero-orbit-two", {
        rotation: -10,
        duration: 16,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      document.documentElement.dataset.nexusHeroAnimated = "true";
    }

    if (
      window.ScrollTrigger &&
      !document.documentElement.dataset.nexusScrollGsapReady
    ) {
      gsap.to(".hero-glow", {
        scale: 1.12,
        opacity: 0.78,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top+=80",
          end: "bottom top",
          scrub: 1
        }
      });

      document.documentElement.dataset.nexusScrollGsapReady = "true";
    }
  }

  function initHeroPointerParallax() {
    if (!window.gsap || reduceMotion || window.innerWidth < 900) {
      return;
    }

    const visual = document.querySelector(".premium-hero-visual");
    const stage = document.querySelector(".hero-image-stage");

    if (!visual || !stage || visual.dataset.nexusPointerReady) {
      return;
    }

    visual.dataset.nexusPointerReady = "true";

    visual.addEventListener("pointermove", function (event) {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      window.gsap.to(stage, {
        x: x * 10,
        rotationY: x * 1.4,
        rotationX: -y * 1.2,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto"
      });
    });

    visual.addEventListener("pointerleave", function () {
      window.gsap.to(stage, {
        x: 0,
        rotationY: 0,
        rotationX: 0,
        duration: 0.75,
        ease: "power3.out",
        overwrite: "auto"
      });
    });
  }

  // ----------------------------------------------------------
  // Pointer ambience / header state
  // ----------------------------------------------------------

  function initPointerGlow() {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    if (document.querySelector(".nexus-pointer-glow")) {
      return;
    }

    const glow = document.createElement("div");
    glow.className = "nexus-pointer-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    window.addEventListener(
      "pointermove",
      function (event) {
        glow.style.setProperty("--pointer-x", event.clientX + "px");
        glow.style.setProperty("--pointer-y", event.clientY + "px");
      },
      { passive: true }
    );
  }

  function initHeaderScrollState() {
    if (document.documentElement.dataset.nexusHeaderScrollReady) {
      return;
    }

    const header = document.querySelector(".site-header");

    if (!header) {
      return;
    }

    const update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    document.documentElement.dataset.nexusHeaderScrollReady = "true";
  }

  // ----------------------------------------------------------
  // Premium button shine markers
  // ----------------------------------------------------------

  function preparePremiumElements() {
    document.querySelectorAll(".btn.primary").forEach(function (button) {
      button.classList.add("premium-button");
    });

    document.querySelectorAll(".product-media img, .novelty-media img").forEach(function (img) {
      img.classList.add("premium-product-image");
    });
  }

  // ----------------------------------------------------------
  // Unified refresh
  // ----------------------------------------------------------

  function refreshPremiumUI() {
    preparePremiumElements();
    safeCall(initLucide);
    safeCall(initTippy);
    safeCall(initAOS);
    safeCall(initTilt);

    if (testimonialsSwiper && typeof testimonialsSwiper.update === "function") {
      testimonialsSwiper.update();
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshPremiumUI, 80);
  }

  function initMutationObserver() {
    if (premiumObserver) {
      return;
    }

    premiumObserver = new MutationObserver(function (mutations) {
      const meaningful = mutations.some(function (mutation) {
        return mutation.addedNodes && mutation.addedNodes.length > 0;
      });

      if (meaningful) {
        scheduleRefresh();
      }
    });

    premiumObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function initPremiumExperience() {
    preparePremiumElements();
    safeCall(initSmoothScroll);
    safeCall(initGsap);
    safeCall(initHeroPointerParallax);
    safeCall(initSwiper);
    safeCall(initLucide);
    safeCall(initTippy);
    safeCall(initAOS);
    safeCall(initTilt);
    safeCall(initPointerGlow);
    safeCall(initHeaderScrollState);
    safeCall(initMutationObserver);
  }



/* Dev helper: run window.nexusFindHorizontalOverflow() in the console
   if a future component introduces horizontal overflow. */
window.nexusFindHorizontalOverflow = function () {
  const viewportWidth = document.documentElement.clientWidth;

  return Array.from(document.querySelectorAll("body *"))
    .map(function (element) {
      const rect = element.getBoundingClientRect();
      return {
        element: element,
        selector:
          element.tagName.toLowerCase() +
          (element.id ? "#" + element.id : "") +
          (element.classList.length
            ? "." + Array.from(element.classList).join(".")
            : ""),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      };
    })
    .filter(function (item) {
      return item.left < -2 || item.right > viewportWidth + 2;
    });
};

  document.addEventListener("DOMContentLoaded", initPremiumExperience);

  window.addEventListener("resize", function () {
    scheduleRefresh();
  });
})();
