/*
 * NEXUS · Custom Selects
 *
 * Reemplaza visualmente los <select> nativos del catálogo por un dropdown
 * acorde al diseño NEXUS, pero conserva el <select> original como fuente
 * de verdad para no romper tienda.js.
 */

(function () {
  "use strict";

  const ENHANCED_CLASS = "nexus-native-select";
  const ROOT_CLASS = "nexus-select";

  function closeAll(except) {
    document.querySelectorAll(`.${ROOT_CLASS}.open`).forEach(function (root) {
      if (root === except) return;
      root.classList.remove("open");

      const trigger = root.querySelector(".nexus-select-trigger");
      const menu = root.querySelector(".nexus-select-menu");

      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menu) menu.hidden = true;
    });
  }

  function optionText(select) {
    const option = select.options[select.selectedIndex];
    return option ? option.textContent.trim() : "";
  }

  function syncTrigger(select, trigger) {
    trigger.querySelector(".nexus-select-value").textContent = optionText(select);

    const selected = select.options[select.selectedIndex];
    trigger.classList.toggle(
      "has-value",
      Boolean(selected && selected.value !== "")
    );
  }

  function buildOptions(select, root, trigger, menu) {
    const fragment = document.createDocumentFragment();
    menu.replaceChildren();

    Array.from(select.options).forEach(function (option, index) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "nexus-select-option";
      item.dataset.value = option.value;
      item.setAttribute("role", "option");
      item.setAttribute(
        "aria-selected",
        option.selected ? "true" : "false"
      );

      if (option.disabled) {
        item.disabled = true;
      }

      const text = document.createElement("span");
      text.textContent = option.textContent.trim();
      item.appendChild(text);

      if (option.selected) {
        item.classList.add("selected");

        const check = document.createElement("span");
        check.className = "nexus-select-check";
        check.setAttribute("aria-hidden", "true");
        check.textContent = "✓";
        item.appendChild(check);
      }

      item.addEventListener("click", function () {
        if (option.disabled) return;

        select.selectedIndex = index;
        select.dispatchEvent(new Event("change", { bubbles: true }));

        syncTrigger(select, trigger);
        buildOptions(select, root, trigger, menu);

        root.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        trigger.focus();
      });

      fragment.appendChild(item);
    });

    menu.appendChild(fragment);
  }

  function enhance(select) {
    if (!(select instanceof HTMLSelectElement)) return;
    if (select.classList.contains(ENHANCED_CLASS)) return;

    select.classList.add(ENHANCED_CLASS);

    const root = document.createElement("div");
    root.className = ROOT_CLASS;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "nexus-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const value = document.createElement("span");
    value.className = "nexus-select-value";

    const chevron = document.createElement("span");
    chevron.className = "nexus-select-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML = `
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="m6 8 4 4 4-4"></path>
      </svg>
    `;

    trigger.append(value, chevron);

    const menu = document.createElement("div");
    menu.className = "nexus-select-menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;

    select.insertAdjacentElement("afterend", root);
    root.append(select, trigger, menu);

    syncTrigger(select, trigger);
    buildOptions(select, root, trigger, menu);

    trigger.addEventListener("click", function () {
      const willOpen = !root.classList.contains("open");

      closeAll(root);

      root.classList.toggle("open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
      menu.hidden = !willOpen;

      if (willOpen) {
        const selectedItem = menu.querySelector(".nexus-select-option.selected");
        if (selectedItem) {
          selectedItem.scrollIntoView({ block: "nearest" });
        }
      }
    });

    trigger.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        if (!root.classList.contains("open")) {
          closeAll(root);
          root.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
          menu.hidden = false;
        }

        const selectedItem =
          menu.querySelector(".nexus-select-option.selected") ||
          menu.querySelector(".nexus-select-option:not(:disabled)");

        selectedItem?.focus();
      }

      if (event.key === "Escape") {
        root.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      }
    });

    menu.addEventListener("keydown", function (event) {
      const items = Array.from(
        menu.querySelectorAll(".nexus-select-option:not(:disabled)")
      );

      const current = document.activeElement;
      const currentIndex = items.indexOf(current);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[Math.min(currentIndex + 1, items.length - 1)]?.focus();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        items[Math.max(currentIndex - 1, 0)]?.focus();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        root.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        trigger.focus();
      }
    });

    // tienda.js modifica dinámicamente opciones de categoría / marca.
    // Solo observamos este select, no todo el documento.
    const observer = new MutationObserver(function () {
      syncTrigger(select, trigger);
      buildOptions(select, root, trigger, menu);
    });

    observer.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["selected", "disabled"]
    });

    select.addEventListener("change", function () {
      syncTrigger(select, trigger);
      buildOptions(select, root, trigger, menu);
    });
  }

  function init() {
    document
      .querySelectorAll(".filters select, .toolbar select")
      .forEach(enhance);

    document.addEventListener("click", function (event) {
      if (!event.target.closest(`.${ROOT_CLASS}`)) {
        closeAll();
      }
    });

    window.addEventListener("blur", function () {
      closeAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
