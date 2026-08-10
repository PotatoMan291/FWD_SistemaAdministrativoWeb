/* ==========================================================
   NEXUS CONTROL · Auth Store
   Login + registro de clientes + roles.
   Persistencia local para proyecto académico.
   ========================================================== */

(function () {
  "use strict";

  const KEYS = Object.freeze({
    session: "usuario",
    legacySession: "usuarioLogueado",
    users: "usuarios_sistema",
    clients: "clientes_sistema",
    roles: "rolesSistema",
    permissions: "permisos_roles"
  });

  const ROLES = Object.freeze({
    ADMIN: "Administrador",
    OPERATOR: "Operador",
    CLIENT: "Cliente"
  });

  const DEFAULT_ADMIN = Object.freeze({
    id: "USR-ADMIN",
    usuario: "admin",
    correo: "admin@nexus.local",
    contraseña: "admin",
    nombre: "Administrador NEXUS",
    rol: ROLES.ADMIN,
    rolAsignado: ROLES.ADMIN,
    origen: "sistema"
  });

  const DEFAULT_PERMISSIONS = Object.freeze({
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
    Cliente: [
      "tienda_acceso"
    ]
  });

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function readList(key) {
    const value = safeParse(localStorage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function writeList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function normalizeRole(value) {
    const role = String(value || "").trim().toLowerCase();

    if (role.includes("admin")) return ROLES.ADMIN;
    if (role.includes("oper")) return ROLES.OPERATOR;
    if (role.includes("client")) return ROLES.CLIENT;

    return ROLES.CLIENT;
  }

  function normalizeAccount(record, fallbackRole) {
    if (!record || typeof record !== "object") return null;

    const username =
      record.usuario ||
      record.username ||
      record.correo ||
      record.email ||
      "";

    const password =
      record.contraseña ??
      record.password ??
      record.clave ??
      "";

    if (!username || password === "") return null;

    return {
      ...record,
      usuario: String(username).trim(),
      contraseña: String(password),
      nombre:
        record.nombre ||
        record.nombres ||
        record.usuario ||
        record.correo ||
        "Usuario",
      rol: normalizeRole(
        record.rol ||
        record.rolAsignado ||
        fallbackRole
      )
    };
  }

  function ensureBaseData() {
    const users = readList(KEYS.users);

    const adminExists = users.some(function (user) {
      return (
        String(user.usuario || "").toLowerCase() === "admin" ||
        normalizeRole(user.rol || user.rolAsignado) === ROLES.ADMIN
      );
    });

    if (!adminExists) {
      users.unshift({ ...DEFAULT_ADMIN });
      writeList(KEYS.users, users);
    }

    const roles = [
      {
        id: "rol_admin",
        nombre: ROLES.ADMIN,
        descripcion: "Acceso completo al panel administrativo, configuraciones, roles y acciones CRUD."
      },
      {
        id: "rol_operador",
        nombre: ROLES.OPERATOR,
        descripcion: "Puede consultar, crear y editar información. No puede eliminar registros ni administrar roles."
      },
      {
        id: "rol_cliente",
        nombre: ROLES.CLIENT,
        descripcion: "Acceso a la tienda NEXUS. Se asigna automáticamente a las cuentas creadas desde Registro."
      }
    ];

    localStorage.setItem(KEYS.roles, JSON.stringify(roles));

    const currentPermissions = safeParse(
      localStorage.getItem(KEYS.permissions),
      null
    );

    if (!currentPermissions) {
      localStorage.setItem(
        KEYS.permissions,
        JSON.stringify(DEFAULT_PERMISSIONS)
      );
    }
  }

  function accountIdentity(account) {
    return String(
      account.usuario ||
      account.correo ||
      account.email ||
      ""
    ).trim().toLowerCase();
  }

  function getUsers() {
    ensureBaseData();

    const systemUsers = readList(KEYS.users)
      .map((item) => normalizeAccount(item, ROLES.OPERATOR))
      .filter(Boolean);

    const clients = readList(KEYS.clients)
      .map((item) => normalizeAccount(item, ROLES.CLIENT))
      .filter(Boolean);

    return [...systemUsers, ...clients];
  }

  function usernameExists(username, email) {
    const targetUser = String(username || "").trim().toLowerCase();
    const targetEmail = String(email || "").trim().toLowerCase();

    return getUsers().some(function (account) {
      const identity = accountIdentity(account);
      const mail = String(account.correo || account.email || "")
        .trim()
        .toLowerCase();

      return (
        (targetUser && identity === targetUser) ||
        (targetEmail && identity === targetEmail) ||
        (targetEmail && mail === targetEmail)
      );
    });
  }

  function setSession(user) {
    const sessionUser = {
      ...user,
      rol: normalizeRole(user.rol || user.rolAsignado)
    };

    localStorage.setItem(KEYS.session, JSON.stringify(sessionUser));
    localStorage.setItem(KEYS.legacySession, JSON.stringify(sessionUser));

    return sessionUser;
  }

  function redirectForRole(role) {
    return normalizeRole(role) === ROLES.CLIENT
      ? "tienda.html"
      : "dashboard.html";
  }

  function authenticate(username, password) {
    ensureBaseData();

    const cleanUsername = String(username || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    const user = getUsers().find(function (candidate) {
      const candidateIdentity = accountIdentity(candidate);

      const candidateEmail = String(
        candidate.correo ||
        candidate.email ||
        ""
      )
        .trim()
        .toLowerCase();

      const candidateName = String(
        candidate.nombre ||
        candidate.nombres ||
        ""
      )
        .trim()
        .toLowerCase();

      return (
        (
          candidateIdentity === cleanUsername ||
          candidateEmail === cleanUsername ||
          candidateName === cleanUsername
        ) &&
        String(candidate.contraseña) === cleanPassword
      );
    });

    if (!user) {
      return {
        ok: false,
        message: "Nombre, usuario/correo o contraseña incorrectos."
      };
    }

    const sessionUser = setSession(user);

    return {
      ok: true,
      user: sessionUser,
      redirect: redirectForRole(sessionUser.rol)
    };
  }

  function registerClient(data) {
    ensureBaseData();

    const nombre = String(data?.nombre || "").trim();
    const correo = String(data?.correo || "").trim().toLowerCase();
    const telefono = String(data?.telefono || "").trim();
    const password = String(data?.contraseña || "");
    const confirm = String(data?.confirmarContraseña || "");

    if (nombre.length < 3) {
      return { ok: false, message: "Ingresa tu nombre completo." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return { ok: false, message: "Ingresa un correo válido." };
    }

    if (telefono.length < 8) {
      return { ok: false, message: "Ingresa un teléfono válido." };
    }

    if (password.length < 4) {
      return {
        ok: false,
        message: "La contraseña debe tener al menos 4 caracteres."
      };
    }

    if (password !== confirm) {
      return { ok: false, message: "Las contraseñas no coinciden." };
    }

    if (usernameExists(correo, correo)) {
      return {
        ok: false,
        message: "Ya existe una cuenta registrada con ese correo."
      };
    }

    const clients = readList(KEYS.clients);

    const client = {
      id: "CLI-" + Date.now().toString(36).toUpperCase(),
      nombre,
      correo,
      telefono,
      usuario: correo,
      contraseña: password,
      rol: ROLES.CLIENT,
      rolAsignado: ROLES.CLIENT,
      creadoDesde: "registro",
      creadoEn: new Date().toISOString()
    };

    clients.push(client);
    writeList(KEYS.clients, clients);

    const sessionUser = setSession(client);

    return {
      ok: true,
      user: sessionUser,
      redirect: "tienda.html"
    };
  }

  function getCurrentUser() {
    const value = safeParse(localStorage.getItem(KEYS.session), null);
    if (!value) return null;

    return {
      ...value,
      rol: normalizeRole(value.rol || value.rolAsignado)
    };
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
    localStorage.removeItem(KEYS.legacySession);
  }

  ensureBaseData();

  window.NexusAuth = Object.freeze({
    KEYS,
    ROLES,
    DEFAULT_PERMISSIONS,
    authenticate,
    registerClient,
    getCurrentUser,
    getUsers,
    logout,
    normalizeRole,
    redirectForRole,
    ensureBaseData
  });
})();
