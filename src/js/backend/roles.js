/* ==========================================================
   NEXUS ADMIN · Roles integrado en Dashboard
   ========================================================== */

(function () {
  "use strict";

  const KEYS = {
    users: "usuarios_sistema",
    clients: "clientes_sistema",
    permissions: "permisos_roles"
  };

  const roleDefinitions = [
    {
      name: "Administrador",
      className: "admin",
      label: "Acceso total",
      description:
        "CRUD completo, cambio de estados, gestión de roles y acceso a todos los módulos."
    },
    {
      name: "Operador",
      className: "operator",
      label: "Acceso operativo",
      description:
        "Consulta, crea y edita registros. Por defecto no elimina ni gestiona roles."
    },
    {
      name: "Cliente",
      className: "client",
      label: "NEXUS Store",
      description:
        "Se asigna automáticamente desde Registro y accede a la tienda pública."
    }
  ];

  const operatorPermissions = [
    ["dashboard_ver", "Dashboard", "Consultar resumen general"],
    ["clientes_ver", "Clientes · consultar", "Ver clientes registrados"],
    ["clientes_crear", "Clientes · crear", "Registrar clientes"],
    ["clientes_editar", "Clientes · editar", "Modificar clientes"],
    ["productos_ver", "Productos · consultar", "Ver inventario"],
    ["productos_crear", "Productos · crear", "Registrar productos"],
    ["productos_editar", "Productos · editar", "Modificar productos"],
    ["proveedores_ver", "Proveedores · consultar", "Ver proveedores"],
    ["proveedores_crear", "Proveedores · crear", "Registrar proveedores"],
    ["proveedores_editar", "Proveedores · editar", "Modificar proveedores"],
    ["categorias_ver", "Categorías · consultar", "Ver categorías"],
    ["categorias_crear", "Categorías · crear", "Registrar categorías"],
    ["categorias_editar", "Categorías · editar", "Modificar categorías"],
    ["pedidos_ver", "Pedidos · consultar", "Ver pedidos"],
    ["pedidos_crear", "Pedidos · crear", "Registrar pedidos"],
    ["pedidos_editar", "Pedidos · editar", "Modificar pedidos"]
  ];

  const defaultOperatorPermissions = operatorPermissions.map(item => item[0]);

  let initialized = false;

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function getList(key) {
    const value = safeParse(localStorage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function saveList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
    document.dispatchEvent(
      new CustomEvent("nexus:data-changed", { detail: { key } })
    );
  }

  function normalizeRole(value) {
    const role = String(value || "").toLowerCase();

    if (role.includes("admin")) return "Administrador";
    if (role.includes("oper")) return "Operador";
    return "Cliente";
  }

  function currentUser() {
    return window.Permisos?.obtenerUsuario?.() || null;
  }

  function accountIdentity(account) {
    return String(
      account.usuario ||
      account.correo ||
      ""
    ).trim().toLowerCase();
  }

  function allAccounts() {
    const system = getList(KEYS.users).map((account, index) => ({
      ...account,
      _source: "Sistema",
      _sourceKey: KEYS.users,
      _index: index,
      rol: normalizeRole(account.rol || account.rolAsignado)
    }));

    const clients = getList(KEYS.clients).map((account, index) => ({
      ...account,
      _source: "Cliente",
      _sourceKey: KEYS.clients,
      _index: index,
      rol: normalizeRole(
        account.rol ||
        account.rolAsignado ||
        "Cliente"
      )
    }));

    return [...system, ...clients];
  }

  function getPermissions() {
    const stored = safeParse(localStorage.getItem(KEYS.permissions), {});

    return {
      Administrador:
        stored.Administrador ||
        window.NexusAuth?.DEFAULT_PERMISSIONS?.Administrador ||
        [],
      Operador:
        Array.isArray(stored.Operador)
          ? stored.Operador
          : defaultOperatorPermissions,
      Cliente: ["tienda_acceso"]
    };
  }

  function renderDefinitions() {
    const grid = document.getElementById("roles-definition-grid");
    if (!grid) return;

    grid.innerHTML = roleDefinitions.map(role => `
      <article class="dashboard-role-definition">
        <div class="dashboard-role-definition-head">
          <strong>${role.name}</strong>
          <span class="dashboard-role-pill ${role.className}">
            ${role.label}
          </span>
        </div>
        <p>${role.description}</p>
      </article>
    `).join("");
  }

  function renderPermissions() {
    const list = document.getElementById("permissions-list");
    if (!list) return;

    const permissions = getPermissions();

    list.innerHTML = operatorPermissions.map(([id, title, detail]) => `
      <label class="dashboard-permission-row">
        <div>
          <strong>${title}</strong>
          <small>${detail}</small>
        </div>
        <input
          type="checkbox"
          class="operator-permission"
          value="${id}"
          ${permissions.Operador.includes(id) ? "checked" : ""}
        >
      </label>
    `).join("");
  }

  function savePermissions() {
    const selected = Array.from(
      document.querySelectorAll(".operator-permission:checked")
    ).map(input => input.value);

    const current = getPermissions();

    localStorage.setItem(
      KEYS.permissions,
      JSON.stringify({
        Administrador: current.Administrador,
        Operador: selected,
        Cliente: ["tienda_acceso"]
      })
    );

    document.dispatchEvent(
      new CustomEvent("nexus:data-changed", {
        detail: { key: KEYS.permissions }
      })
    );

    window.Swal?.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Permisos del Operador actualizados",
      showConfirmButton: false,
      timer: 1700
    });
  }

  function roleAccessText(role) {
    if (role === "Administrador") return "Panel completo";
    if (role === "Operador") return "Panel operativo";
    return "Tienda NEXUS";
  }

  function renderAccounts(filter = "") {
    const body = document.getElementById("roles-users-body");
    if (!body) return;

    const query = String(filter || "").trim().toLowerCase();

    const accounts = allAccounts().filter(account => {
      if (!query) return true;

      return [
        account.nombre,
        account.usuario,
        account.correo,
        account.rol
      ].some(value =>
        String(value || "").toLowerCase().includes(query)
      );
    });

    body.innerHTML = "";

    if (!accounts.length) {
      body.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:var(--text-secondary);padding:28px;">
            No hay cuentas que coincidan.
          </td>
        </tr>
      `;
      updateSummary();
      return;
    }

    accounts.forEach(account => {
      const row = document.createElement("tr");

      const protectedAdmin =
        account._sourceKey === KEYS.users &&
        String(account.usuario || "").toLowerCase() === "admin";

      row.innerHTML = `
        <td>
          <div class="dashboard-role-account">
            <strong>${account.nombre || "Sin nombre"}</strong>
            <small>${account.id || "Sin ID"}</small>
          </div>
        </td>
        <td>
          <span class="dashboard-origin-badge">
            ${account._source}
          </span>
        </td>
        <td>${account.usuario || account.correo || "—"}</td>
        <td>
          <select class="dashboard-role-select" ${protectedAdmin ? "disabled" : ""}>
            <option value="Administrador" ${account.rol === "Administrador" ? "selected" : ""}>
              Administrador
            </option>
            <option value="Operador" ${account.rol === "Operador" ? "selected" : ""}>
              Operador
            </option>
            <option value="Cliente" ${account.rol === "Cliente" ? "selected" : ""}>
              Cliente
            </option>
          </select>
        </td>
        <td>
          <span class="dashboard-role-access">
            ${roleAccessText(account.rol)}
          </span>
        </td>
      `;

      const select = row.querySelector(".dashboard-role-select");

      if (!protectedAdmin) {
        select.addEventListener("change", function () {
          updateAccountRole(account, select.value);
        });
      }

      body.appendChild(row);
    });

    updateSummary();
  }

  function updateAccountRole(account, newRole) {
    const list = getList(account._sourceKey);
    if (!list[account._index]) return;

    list[account._index] = {
      ...list[account._index],
      rol: newRole,
      rolAsignado: newRole
    };

    saveList(account._sourceKey, list);

    window.Swal?.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Rol actualizado a ${newRole}`,
      showConfirmButton: false,
      timer: 1600
    });

    renderAccounts(
      document.getElementById("roles-search-input")?.value || ""
    );
  }

  function usernameExists(username) {
    const target = String(username || "").trim().toLowerCase();

    return allAccounts().some(account =>
      accountIdentity(account) === target ||
      String(account.correo || "").toLowerCase() === target
    );
  }

  function createInternalUser(event) {
    event.preventDefault();

    const name =
      document.getElementById("internal-name")?.value.trim() || "";
    const username =
      document.getElementById("internal-username")?.value.trim() || "";
    const password =
      document.getElementById("internal-password")?.value || "";
    const role =
      document.getElementById("internal-role")?.value || "Operador";
    const message =
      document.getElementById("internal-user-message");

    if (message) message.textContent = "";

    if (name.length < 3 || username.length < 3 || password.length < 4) {
      if (message) {
        message.textContent =
          "Completa correctamente todos los campos.";
      }
      return;
    }

    if (usernameExists(username)) {
      if (message) {
        message.textContent =
          "Ese usuario o correo ya está registrado.";
      }
      return;
    }

    const users = getList(KEYS.users);

    users.push({
      id: "USR-" + Date.now().toString(36).toUpperCase(),
      nombre: name,
      usuario: username,
      contraseña: password,
      rol,
      rolAsignado: role,
      origen: "administracion",
      creadoEn: new Date().toISOString()
    });

    saveList(KEYS.users, users);

    event.currentTarget.reset();

    if (message) {
      message.textContent = "Usuario creado correctamente.";
    }

    refresh();

    window.Swal?.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `${role} creado correctamente`,
      showConfirmButton: false,
      timer: 1700
    });
  }

  function updateSummary() {
    const systemCount = document.getElementById("summary-system-users");
    const clientCount = document.getElementById("summary-clients");

    if (systemCount) {
      systemCount.textContent = getList(KEYS.users).length;
    }

    if (clientCount) {
      clientCount.textContent = getList(KEYS.clients).length;
    }
  }

  function refresh() {
    if (!document.getElementById("roles-view")) return;

    renderDefinitions();
    renderPermissions();
    renderAccounts(
      document.getElementById("roles-search-input")?.value || ""
    );
    updateSummary();
  }

  function init() {
    const view = document.getElementById("roles-view");
    if (!view || initialized) return;

    const user = currentUser();

    if (!user || user.rol !== "Administrador") {
      return;
    }

    document
      .getElementById("btn-save-permissions")
      ?.addEventListener("click", savePermissions);

    document
      .getElementById("form-internal-user")
      ?.addEventListener("submit", createInternalUser);

    document
      .getElementById("roles-search-input")
      ?.addEventListener("input", function () {
        renderAccounts(this.value);
      });

    initialized = true;
    refresh();
  }

  window.NexusRoles = Object.freeze({
    init,
    refresh
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
