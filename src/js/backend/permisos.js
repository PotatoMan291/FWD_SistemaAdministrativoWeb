/* ==========================================================
   NEXUS · Permisos
   Roles:
   - Administrador: acceso completo.
   - Operador: consultar, crear y editar; no eliminar ni roles.
   - Cliente: tienda NEXUS; sin acceso al panel administrativo.
   ========================================================== */

(function () {
  "use strict";

  const SESSION_KEY = "usuario";
  const PERMISSIONS_KEY = "permisos_roles";

  const DEFAULTS = {
    Administrador: [
      "dashboard_ver",
      "clientes_ver", "clientes_crear", "clientes_editar", "clientes_eliminar",
      "productos_ver", "productos_crear", "productos_editar", "productos_eliminar",
      "proveedores_ver", "proveedores_crear", "proveedores_editar", "proveedores_eliminar",
      "categorias_ver", "categorias_crear", "categorias_editar", "categorias_eliminar",
      "pedidos_ver", "pedidos_crear", "pedidos_editar", "pedidos_eliminar",
      "pedidos_cambiar_estado",
      "roles_gestionar",
      "tienda_acceso"
    ],
    Operador: [
      "dashboard_ver",
      "clientes_ver", "clientes_crear", "clientes_editar",
      "productos_ver", "productos_crear", "productos_editar",
      "proveedores_ver", "proveedores_crear", "proveedores_editar",
      "categorias_ver", "categorias_crear", "categorias_editar",
      "pedidos_ver", "pedidos_crear", "pedidos_editar",
      "tienda_acceso"
    ],
    Cliente: ["tienda_acceso"]
  };

  const PAGE_MODULES = {
    "dashboard.html": "dashboard",
    "clientes.html": "clientes",
    "productos.html": "productos",
    "proveedores.html": "proveedores",
    "categorias.html": "categorias",
    "pedidos.html": "pedidos",
    "roles.html": "roles"
  };

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeRole(value) {
    const role = String(value || "").toLowerCase();
    if (role.includes("admin")) return "Administrador";
    if (role.includes("oper")) return "Operador";
    return "Cliente";
  }

  function currentUser() {
    const user = safeParse(localStorage.getItem(SESSION_KEY), null);
    if (!user) return null;

    return {
      ...user,
      rol: normalizeRole(user.rol || user.rolAsignado)
    };
  }

  function currentRole() {
    const user = currentUser();
    if (!user) return null;

    return {
      id: user.rol.toLowerCase(),
      nombre: user.rol
    };
  }

  function permissionsMap() {
    const saved = safeParse(localStorage.getItem(PERMISSIONS_KEY), null);

    if (!saved) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(DEFAULTS));
      return JSON.parse(JSON.stringify(DEFAULTS));
    }

    return {
      Administrador: Array.from(new Set([
        ...DEFAULTS.Administrador,
        ...(Array.isArray(saved.Administrador) ? saved.Administrador : [])
      ])),
      Operador: Array.isArray(saved.Operador)
        ? saved.Operador
        : DEFAULTS.Operador.slice(),
      Cliente: ["tienda_acceso"]
    };
  }

  function moduleName() {
    const file = location.pathname.split("/").pop() || "dashboard.html";
    return PAGE_MODULES[file] || "";
  }

  function permissionFor(action, module = moduleName()) {
    if (action.includes("_")) return action;

    const aliases = {
      crear: "crear",
      editar: "editar",
      eliminar: "eliminar",
      ver: "ver"
    };

    if (aliases[action] && module && module !== "roles") {
      return `${module}_${aliases[action]}`;
    }

    if (action === "cambiar_estado") return "pedidos_cambiar_estado";
    if (action === "gestionar_roles") return "roles_gestionar";

    return action;
  }

  function has(permission) {
    const role = currentRole();
    if (!role) return false;

    if (role.nombre === "Administrador") {
      return true;
    }

    const map = permissionsMap();
    return Boolean(map[role.nombre]?.includes(permission));
  }

  function canAction(action) {
    const role = currentRole();
    if (!role) return false;

    if (role.nombre === "Administrador") return true;

    if (action === "crear") {
      const mod = moduleName();
      return has(`${mod}_crear`);
    }

    if (action === "editar") {
      const mod = moduleName();
      return has(`${mod}_editar`);
    }

    if (action === "eliminar") {
      const mod = moduleName();
      return has(`${mod}_eliminar`);
    }

    if (action === "cambiar_estado") {
      return has("pedidos_cambiar_estado");
    }

    if (action === "gestionar_roles") {
      return has("roles_gestionar");
    }

    return has(permissionFor(action));
  }

  function messageFor(action) {
    const messages = {
      crear: "Tu rol no permite crear registros en este módulo.",
      editar: "Tu rol no permite editar registros en este módulo.",
      eliminar: "Tu rol no permite eliminar registros.",
      cambiar_estado: "Tu rol no permite cambiar el estado de los pedidos.",
      gestionar_roles: "Solo un Administrador puede gestionar roles y permisos."
    };

    return messages[action] || "Tu rol no permite realizar esta acción.";
  }

  function notify(message) {
    if (window.Swal) {
      Swal.fire({
        title: "Acción no permitida",
        text: message,
        icon: "info",
        confirmButtonText: "Entendido"
      });
    } else {
      alert(message);
    }
  }

  function requireAction(action) {
    const allowed = canAction(action);
    if (!allowed) notify(messageFor(action));
    return allowed;
  }

  function verifySession() {
    const user = currentUser();

    if (!user) {
      location.replace("login.html");
      return false;
    }

    const mod = moduleName();

    if (user.rol === "Cliente") {
      location.replace("tienda.html");
      return false;
    }

    if (mod === "roles" && user.rol !== "Administrador") {
      notify("El módulo Roles está disponible únicamente para Administradores.");
      location.replace("dashboard.html");
      return false;
    }

    if (mod && mod !== "roles" && mod !== "dashboard") {
      const viewPermission = `${mod}_ver`;
      if (!has(viewPermission)) {
        notify("Tu rol no tiene acceso a este módulo.");
        location.replace("dashboard.html");
        return false;
      }
    }

    return true;
  }

  function roleBadge() {
    const user = currentUser();
    if (!user) return;

    let badge = document.getElementById("rolUsuario");

    if (!badge) {
      const name = document.getElementById("nombreUsuario");
      if (name) {
        badge = document.createElement("span");
        badge.id = "rolUsuario";
        badge.className = "nexus-role-badge";
        name.insertAdjacentElement("afterend", badge);
      }
    }

    if (badge) {
      badge.textContent = user.rol;
      badge.dataset.role = user.rol;
    }
  }

  function hideRoleNavigation() {
    const user = currentUser();
    if (!user || user.rol === "Administrador") return;

    document.querySelectorAll(
      'a[href$="roles.html"], a[href*="#roles"]'
    ).forEach(function (link) {
      const item = link.closest("li, .nav-item, .sidebar-item, .quick-action, article");
      (item || link).hidden = true;
    });
  }

  function inspectActionElement(element) {
    if (!(element instanceof HTMLElement)) return;

    const text = [
      element.dataset.permiso,
      element.title,
      element.getAttribute("aria-label"),
      element.textContent,
      element.className
    ].join(" ").toLowerCase();

    if (text.includes("eliminar") || text.includes("borrar") || text.includes("delete")) {
      if (!canAction("eliminar")) {
        element.hidden = true;
      }
      return;
    }

    if (text.includes("editar") || text.includes("actualizar")) {
      if (!canAction("editar")) {
        element.hidden = true;
      }
    }
  }

  function applyForms() {
    const module = moduleName();
    const createAllowed =
      module === "dashboard" ||
      module === "roles" ||
      has(`${module}_crear`);

    if (!createAllowed) {
      [
        "#formulario-productos",
        "#formulario-proveedores",
        "#formulario-categorias",
        "#formulario-clientes",
        "#formulario-pedidos"
      ].forEach(function (selector) {
        const element = document.querySelector(selector);
        if (element) element.hidden = true;
      });
    }
  }

  function applyUI() {
    roleBadge();
    hideRoleNavigation();
    applyForms();

    document.querySelectorAll(
      'button, a, [data-permiso], .btn-action, .order-action-button'
    ).forEach(inspectActionElement);

    document
      .querySelectorAll('[data-permiso="cambiar_estado"]')
      .forEach(function (element) {
        if (!canAction("cambiar_estado")) {
          element.disabled = true;
          element.title = "Solo el Administrador puede cambiar estados.";
        }
      });
  }

  let observer = null;

  function watchUI() {
    if (observer) return;

    observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (!(node instanceof HTMLElement)) return;

          inspectActionElement(node);

          node.querySelectorAll?.(
            'button, a, [data-permiso], .btn-action, .order-action-button'
          ).forEach(inspectActionElement);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function init() {
    if (!verifySession()) return;
    applyUI();
    watchUI();
  }

  window.Permisos = Object.freeze({
    verificarSesion: verifySession,
    obtenerUsuario: currentUser,
    obtenerRolActivo: currentRole,
    obtenerPermisos: permissionsMap,
    tiene: has,
    exigir: requireAction,
    puedeCrear: () => canAction("crear"),
    puedeEditar: () => canAction("editar"),
    puedeEliminar: () => canAction("eliminar"),
    puedeCambiarEstado: () => canAction("cambiar_estado"),
    puedeGestionarRoles: () => canAction("gestionar_roles"),
    aplicarInterfaz: applyUI
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
