/*
 * NEXUS animated background
 * tsParticles v4 · official engine + slim bundle pattern.
 *
 * Important:
 * The slim CDN bundle exposes loadSlim globally, but it does NOT call it
 * automatically. We must register it on tsParticles before tsParticles.load().
 */

(function () {
  "use strict";

  let container = null;
  let themeObserver = null;

  function isLightTheme() {
    return document.documentElement.dataset.theme === "light";
  }

  function reducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function options() {
    const light = isLightTheme();
    const mobile = window.innerWidth <= 700;

    return {
      fullScreen: {
        enable: false
      },

      background: {
        color: {
          value: "transparent"
        }
      },

      fpsLimit: mobile ? 34 : 46,
      detectRetina: false,

      particles: {
        number: {
          value: mobile ? 26 : 48,
          density: {
            enable: true,
            area: mobile ? 900 : 1050
          }
        },

        color: {
          value: light
            ? ["#6D4EF5", "#7C5CFC", "#4F6BDA"]
            : ["#7C5CFC", "#9B87FF", "#5965E8"]
        },

        shape: {
          type: "circle"
        },

        opacity: {
          value: {
            min: light ? 0.28 : 0.40,
            max: light ? 0.48 : 0.72
          }
        },

        size: {
          value: {
            min: 1,
            max: mobile ? 2.2 : 2.7
          }
        },

        links: {
          enable: true,
          distance: mobile ? 115 : 155,
          color: light ? "#7860DF" : "#8067F0",
          opacity: light ? 0.15 : 0.26,
          width: 1
        },

        move: {
          enable: true,
          speed: mobile ? 0.40 : 0.54,
          direction: "none",
          random: true,
          straight: false,
          outModes: {
            default: "bounce"
          }
        }
      },

      interactivity: {
        events: {
          onHover: {
            enable: false
          },
          onClick: {
            enable: false
          },
          resize: {
            enable: true,
            delay: 0.25
          }
        }
      }
    };
  }

  async function destroy() {
    try {
      if (container && typeof container.destroy === "function") {
        container.destroy();
      }
    } catch (error) {
      console.warn("NEXUS BACKGROUND: no se pudo destruir el canvas anterior.", error);
    }

    container = null;
  }

  async function start() {
    const target = document.getElementById("nexus-particles");

    if (!target) {
      console.warn("NEXUS BACKGROUND: falta #nexus-particles.");
      return;
    }

    if (reducedMotion()) {
      target.dataset.particlesStatus = "reduced-motion";
      return;
    }

    if (!window.tsParticles) {
      target.dataset.particlesStatus = "engine-missing";
      console.error(
        "NEXUS BACKGROUND: tsParticles engine no cargó. Revisa la conexión/CDN."
      );
      return;
    }

    if (typeof window.loadSlim !== "function") {
      target.dataset.particlesStatus = "slim-missing";
      console.error(
        "NEXUS BACKGROUND: loadSlim no está disponible. El bundle slim no cargó."
      );
      return;
    }

    try {
      await destroy();

      // Required by tsParticles v4 CDN builds.
      await window.loadSlim(window.tsParticles);

      container = await window.tsParticles.load({
        id: "nexus-particles",
        options: options()
      });

      if (!container) {
        target.dataset.particlesStatus = "load-failed";
        console.error("NEXUS BACKGROUND: tsParticles.load() no devolvió un contenedor.");
        return;
      }

      target.dataset.particlesStatus = "running";
      console.info("NEXUS BACKGROUND: tsParticles v4 activo.");
    } catch (error) {
      target.dataset.particlesStatus = "error";
      console.error("NEXUS BACKGROUND: error iniciando partículas.", error);
    }
  }

  function watchTheme() {
    if (themeObserver) return;

    themeObserver = new MutationObserver(function (mutations) {
      const changed = mutations.some(function (mutation) {
        return (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        );
      });

      if (changed) {
        start();
      }
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }


  function boot() {
    start();
    watchTheme();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
