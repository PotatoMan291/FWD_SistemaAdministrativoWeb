/* ==========================================================
   NEXUS CONTROL · React Login + Register
   ========================================================== */

(function () {
  "use strict";

  if (!window.React || !window.ReactDOM || !window.NexusAuth) {
    const root = document.getElementById("login-root");
    if (root) {
      root.innerHTML = `
        <div class="login-runtime-error">
          <strong>No se pudo iniciar el portal de acceso.</strong>
          <span>Verifica la conexión usada para cargar React y recarga.</span>
        </div>
      `;
    }
    return;
  }

  const h = React.createElement;
  const { useMemo, useState } = React;

  function Icon({ name, size = 18 }) {
    const paths = {
      user: [
        ["circle", { cx: 12, cy: 8, r: 3.5 }],
        ["path", { d: "M5 21c.6-4.6 3-6.8 7-6.8s6.4 2.2 7 6.8" }]
      ],
      mail: [
        ["rect", { x: 3, y: 5, width: 18, height: 14, rx: 2 }],
        ["path", { d: "m4 7 8 6 8-6" }]
      ],
      phone: [
        ["path", { d: "M5 4h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4c0 1-1 2-2 2C9.7 21 3 14.3 3 6c0-1 1-2 2-2Z" }]
      ],
      lock: [
        ["rect", { x: 5, y: 10, width: 14, height: 11, rx: 2 }],
        ["path", { d: "M8 10V7a4 4 0 0 1 8 0v3" }]
      ],
      eye: [
        ["path", { d: "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" }],
        ["circle", { cx: 12, cy: 12, r: 2.5 }]
      ],
      eyeOff: [
        ["path", { d: "m3 3 18 18" }],
        ["path", { d: "M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17.8 17.8 0 0 1-2.4 3.1M6.1 6.1C3.8 7.7 2.5 12 2.5 12c2 3.5 5.3 6 9.5 6 1.5 0 2.8-.4 4-.9" }]
      ],
      arrow: [
        ["path", { d: "M5 12h14" }],
        ["path", { d: "m14 7 5 5-5 5" }]
      ],
      shield: [
        ["path", { d: "M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6z" }],
        ["path", { d: "m8.5 12 2.2 2.2L15.8 9" }]
      ],
      package: [
        ["path", { d: "m12 3 8 4-8 4-8-4 8-4Z" }],
        ["path", { d: "m4 7 8 4 8-4M4 7v10l8 4 8-4V7M12 11v10" }]
      ],
      activity: [
        ["path", { d: "M3 12h4l2.2-6 4.2 12 2.3-6H21" }]
      ],
      users: [
        ["circle", { cx: 9, cy: 8, r: 3 }],
        ["path", { d: "M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M16 5.5a3 3 0 0 1 0 5.5M17 14c2.3.6 3.7 2.4 4 5" }]
      ],
      grid: [
        ["rect", { x: 4, y: 4, width: 6, height: 6, rx: 1 }],
        ["rect", { x: 14, y: 4, width: 6, height: 6, rx: 1 }],
        ["rect", { x: 4, y: 14, width: 6, height: 6, rx: 1 }],
        ["rect", { x: 14, y: 14, width: 6, height: 6, rx: 1 }]
      ]
    };

    return h(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true"
      },
      (paths[name] || paths.grid).map(([tag, props], index) =>
        h(tag, { ...props, key: index })
      )
    );
  }

  function ModuleCard({ icon, title, detail }) {
    return h(
      "article",
      { className: "login-module-card" },
      h("span", { className: "login-module-icon" }, h(Icon, { name: icon })),
      h(
        "div",
        { className: "login-module-copy" },
        h("strong", null, title),
        h("small", null, detail)
      ),
      h("span", { className: "login-module-status" }, "●")
    );
  }

  function Field({
    label,
    icon,
    type = "text",
    value,
    onChange,
    placeholder,
    autoComplete,
    right,
    onKeyUp,
    onKeyDown
  }) {
    return h(
      "label",
      { className: "access-field" },
      h("span", null, label),
      h(
        "div",
        { className: "access-input-shell" },
        h("i", null, h(Icon, { name: icon, size: 17 })),
        h("input", {
          type,
          value,
          onChange,
          placeholder,
          autoComplete,
          onKeyUp,
          onKeyDown,
          required: true
        }),
        right || null
      )
    );
  }

  function LoginApp() {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    const currentUser = window.NexusAuth.getCurrentUser();

    const loginReady = useMemo(
      () => username.trim() && password && !loading,
      [username, password, loading]
    );

    const registerReady = useMemo(
      () =>
        name.trim() &&
        email.trim() &&
        phone.trim() &&
        registerPassword &&
        confirmPassword &&
        !loading,
      [name, email, phone, registerPassword, confirmPassword, loading]
    );

    function detectCaps(event) {
      if (event?.getModifierState) {
        setCapsLock(event.getModifierState("CapsLock"));
      }
    }

    function switchMode(next) {
      setMode(next);
      setError("");
      setSuccess("");
    }

    function finishAccess(result) {
      document.documentElement.classList.add("login-success");
      setTimeout(() => {
        window.location.href = result.redirect;
      }, 420);
    }

    function submitLogin(event) {
      event.preventDefault();
      if (!loginReady) return;

      setError("");
      setSuccess("");
      setLoading(true);

      setTimeout(() => {
        const result = window.NexusAuth.authenticate(username, password);

        if (!result.ok) {
          setLoading(false);
          setError(result.message);
          return;
        }

        finishAccess(result);
      }, 250);
    }

    function submitRegister(event) {
      event.preventDefault();
      if (!registerReady) return;

      setError("");
      setSuccess("");
      setLoading(true);

      setTimeout(() => {
        const result = window.NexusAuth.registerClient({
          nombre: name,
          correo: email,
          telefono: phone,
          contraseña: registerPassword,
          confirmarContraseña: confirmPassword
        });

        if (!result.ok) {
          setLoading(false);
          setError(result.message);
          return;
        }

        setSuccess("Cuenta creada. Rol Cliente asignado automáticamente.");
        setTimeout(() => finishAccess(result), 450);
      }, 300);
    }

    function logoutCurrent() {
      window.NexusAuth.logout();
      window.location.reload();
    }

    const passwordToggle = (visible, setter) =>
      h(
        "button",
        {
          className: "access-password-toggle",
          type: "button",
          onClick: () => setter(!visible),
          "aria-label": visible ? "Ocultar contraseña" : "Mostrar contraseña"
        },
        h(Icon, { name: visible ? "eyeOff" : "eye", size: 17 })
      );

    return h(
      "main",
      { className: "access-page" },
      h("div", { className: "access-grid", "aria-hidden": "true" }),
      h("div", { className: "access-orb access-orb-a", "aria-hidden": "true" }),
      h("div", { className: "access-orb access-orb-b", "aria-hidden": "true" }),

      h(
        "section",
        { className: "access-shell" },

        h(
          "aside",
          { className: "access-intelligence" },
          h(
            "div",
            { className: "access-brand" },
            h("div", { className: "access-brand-mark" }, h("span", null, "N")),
            h(
              "div",
              null,
              h("strong", null, "NEXUS CONTROL"),
              h("small", null, "Administrative Workspace")
            )
          ),

          h(
            "div",
            { className: "access-hero-copy" },
            h("span", { className: "access-kicker" }, "CENTRO DE OPERACIONES"),
            h("h1", null, "Una entrada.", h("br"), h("span", null, "Todo el sistema.")),
            h(
              "p",
              null,
              "Administrador y Operador trabajan desde el panel administrativo. Los clientes registrados acceden directamente a NEXUS Store."
            )
          ),

          h(
            "div",
            { className: "login-module-grid" },
            h(ModuleCard, { icon: "package", title: "Inventario", detail: "Productos y categorías" }),
            h(ModuleCard, { icon: "activity", title: "Operaciones", detail: "Pedidos y estados" }),
            h(ModuleCard, { icon: "users", title: "Clientes", detail: "Registro conectado" }),
            h(ModuleCard, { icon: "grid", title: "NEXUS Store", detail: "Acceso de clientes" })
          ),

          h(
            "div",
            { className: "access-system-line" },
            h("span", { className: "access-pulse" }),
            h("strong", null, "Sistema disponible"),
            h("span", null, "Local workspace")
          )
        ),

        h(
          "section",
          { className: "access-panel" },

          h(
            "div",
            { className: "access-panel-top" },
            h(
              "span",
              { className: "access-secure-chip" },
              h(Icon, { name: "shield", size: 15 }),
              "Roles integrados"
            ),
            h("a", { href: "tienda.html", className: "access-store-link" }, "Ir a la tienda")
          ),

          h(
            "div",
            { className: "access-form-wrap" },

            currentUser
              ? h(
                  "div",
                  { className: "active-session-card" },
                  h(
                    "div",
                    null,
                    h("small", null, "SESIÓN ACTIVA"),
                    h("strong", null, currentUser.nombre || currentUser.usuario),
                    h("span", null, currentUser.rol)
                  ),
                  h(
                    "button",
                    { type: "button", onClick: logoutCurrent },
                    "Cerrar sesión"
                  )
                )
              : null,

            h(
              "div",
              { className: "access-tabs", role: "tablist" },
              h(
                "button",
                {
                  type: "button",
                  className: mode === "login" ? "active" : "",
                  onClick: () => switchMode("login")
                },
                "Iniciar sesión"
              ),
              h(
                "button",
                {
                  type: "button",
                  className: mode === "register" ? "active" : "",
                  onClick: () => switchMode("register")
                },
                "Crear cuenta"
              )
            ),

            mode === "login"
              ? h(
                  React.Fragment,
                  null,
                  h("span", { className: "access-kicker" }, "IDENTIFICACIÓN"),
                  h("h2", null, "Bienvenido de nuevo"),
                  h(
                    "p",
                    { className: "access-form-intro" },
                    "Ingresa tu usuario o correo. El sistema detectará automáticamente tu rol."
                  ),
                  h(
                    "form",
                    { className: "access-form", onSubmit: submitLogin },
                    h(Field, {
                      label: "Nombre, usuario o correo",
                      icon: "user",
                      value: username,
                      onChange: e => setUsername(e.target.value),
                      placeholder: "Nombre, usuario o correo@ejemplo.com",
                      autoComplete: "username"
                    }),
                    h(
                      "div",
                      null,
                      h(
                        "div",
                        { className: "access-password-label" },
                        h("span", null, "Contraseña"),
                        capsLock
                          ? h("small", { className: "caps-warning" }, "Bloq Mayús activo")
                          : null
                      ),
                      h(
                        "div",
                        { className: "access-input-shell" },
                        h("i", null, h(Icon, { name: "lock", size: 17 })),
                        h("input", {
                          type: showPassword ? "text" : "password",
                          value: password,
                          onChange: e => setPassword(e.target.value),
                          onKeyUp: detectCaps,
                          onKeyDown: detectCaps,
                          placeholder: "Ingresa tu contraseña",
                          autoComplete: "current-password",
                          required: true
                        }),
                        passwordToggle(showPassword, setShowPassword)
                      )
                    ),
                    error
                      ? h("div", { className: "access-error", role: "alert" }, h("span", null, "!"), h("p", null, error))
                      : null,
                    h(
                      "button",
                      {
                        className: `access-submit${loading ? " loading" : ""}`,
                        type: "submit",
                        disabled: !loginReady
                      },
                      h("span", null, loading ? "Validando..." : "Ingresar al sistema"),
                      loading
                        ? h("span", { className: "access-loader" })
                        : h(Icon, { name: "arrow", size: 18 })
                    )
                  )
                )
              : h(
                  React.Fragment,
                  null,
                  h("span", { className: "access-kicker" }, "REGISTRO DE CLIENTE"),
                  h("h2", null, "Crea tu cuenta NEXUS"),
                  h(
                    "p",
                    { className: "access-form-intro" },
                    "Tus datos se guardarán en Clientes y tu cuenta recibirá automáticamente el rol Cliente."
                  ),
                  h(
                    "form",
                    { className: "access-form register-form", onSubmit: submitRegister },
                    h(Field, {
                      label: "Nombre completo",
                      icon: "user",
                      value: name,
                      onChange: e => setName(e.target.value),
                      placeholder: "Nombre y apellidos",
                      autoComplete: "name"
                    }),
                    h(Field, {
                      label: "Correo electrónico",
                      icon: "mail",
                      type: "email",
                      value: email,
                      onChange: e => setEmail(e.target.value),
                      placeholder: "correo@ejemplo.com",
                      autoComplete: "email"
                    }),
                    h(Field, {
                      label: "Teléfono",
                      icon: "phone",
                      value: phone,
                      onChange: e => setPhone(e.target.value),
                      placeholder: "8888-8888",
                      autoComplete: "tel"
                    }),
                    h(
                      "label",
                      { className: "access-field" },
                      h("span", null, "Contraseña"),
                      h(
                        "div",
                        { className: "access-input-shell" },
                        h("i", null, h(Icon, { name: "lock", size: 17 })),
                        h("input", {
                          type: showRegisterPassword ? "text" : "password",
                          value: registerPassword,
                          onChange: e => setRegisterPassword(e.target.value),
                          placeholder: "Mínimo 4 caracteres",
                          autoComplete: "new-password",
                          required: true
                        }),
                        passwordToggle(showRegisterPassword, setShowRegisterPassword)
                      )
                    ),
                    h(Field, {
                      label: "Confirmar contraseña",
                      icon: "lock",
                      type: showRegisterPassword ? "text" : "password",
                      value: confirmPassword,
                      onChange: e => setConfirmPassword(e.target.value),
                      placeholder: "Repite tu contraseña",
                      autoComplete: "new-password"
                    }),
                    error
                      ? h("div", { className: "access-error", role: "alert" }, h("span", null, "!"), h("p", null, error))
                      : null,
                    success
                      ? h("div", { className: "access-success", role: "status" }, h("span", null, "✓"), h("p", null, success))
                      : null,
                    h(
                      "button",
                      {
                        className: `access-submit${loading ? " loading" : ""}`,
                        type: "submit",
                        disabled: !registerReady
                      },
                      h("span", null, loading ? "Creando cuenta..." : "Crear cuenta Cliente"),
                      loading
                        ? h("span", { className: "access-loader" })
                        : h(Icon, { name: "arrow", size: 18 })
                    )
                  )
                ),

            h(
              "div",
              { className: "access-role-note" },
              h(Icon, { name: "shield", size: 16 }),
              h(
                "p",
                null,
                h("strong", null, "Asignación automática: "),
                "los registros públicos siempre se crean como Cliente. Administradores y Operadores se gestionan desde el módulo Roles."
              )
            )
          ),

          h(
            "footer",
            { className: "access-footer" },
            h("span", null, "FWD · Sistema Administrativo Web"),
            h("span", null, "NEXUS Access Portal")
          )
        )
      )
    );
  }

  const root = document.getElementById("login-root");
  if (root) {
    ReactDOM.createRoot(root).render(h(LoginApp));
  }
})();
