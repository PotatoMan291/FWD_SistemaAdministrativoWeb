/*
 * NEXUS · Smooth Scroll / Performance Guard
 *
 * Purpose:
 * - Preserve the existing Lenis instance if nexus-premium.js created it.
 * - Restore Lenis if for any reason the premium layer did not initialize it.
 * - Avoid running a second RAF loop.
 */

(function () {
  "use strict";

  function reducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function mark(status) {
    document.documentElement.dataset.nexusSmoothScroll = status;
  }

  function init() {
    if (reducedMotion()) {
      mark("reduced-motion");
      return;
    }

    if (!window.Lenis) {
      mark("lenis-missing");
      console.warn("NEXUS SCROLL: Lenis no cargó; se usa scroll nativo.");
      return;
    }

    // nexus-premium.js already owns Lenis in the normal path.
    if (window.nexusLenis) {
      mark("active-existing");
      return;
    }

    try {
      const lenis = new window.Lenis({
        autoRaf: true,
        anchors: true,
        smoothWheel: true,
        syncTouch: false,

        // lerp gives a smooth but responsive feel without the
        // "heavy / delayed" sensation of a long duration.
        lerp: 0.115,

        wheelMultiplier: 0.92,
        touchMultiplier: 1,
        allowNestedScroll: true
      });

      window.nexusLenis = lenis;

      if (window.ScrollTrigger && typeof window.ScrollTrigger.update === "function") {
        lenis.on("scroll", window.ScrollTrigger.update);
      }

      mark("active-fallback");
      console.info("NEXUS SCROLL: Lenis restaurado.");
    } catch (error) {
      mark("error");
      console.warn("NEXUS SCROLL: no se pudo iniciar Lenis.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
