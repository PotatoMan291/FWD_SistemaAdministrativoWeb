// ======================================================
// DASHBOARD ADMINISTRATIVO
// ======================================================


// ------------------------------------------------------
// Claves de LocalStorage
// ------------------------------------------------------

const CLAVE_USUARIO = "usuario";

const CLAVE_CLIENTES = "clientes_sistema";

const CLAVE_PRODUCTOS = "productos";

const CLAVE_PROVEEDORES = "proveedores";

const CLAVE_CATEGORIAS = "categorias";

const CLAVE_PEDIDOS = "pedidos";



// ------------------------------------------------------
// Verificar sesión
// ------------------------------------------------------

function verificarSesion() {

    const usuarioGuardado =
        localStorage.getItem(
            CLAVE_USUARIO
        );


    if (!usuarioGuardado) {

        window.location.href =
            "login.html";

        return null;

    }


    try {

        return JSON.parse(
            usuarioGuardado
        );

    } catch (error) {

        return {
            usuario:
                usuarioGuardado,

            nombre:
                usuarioGuardado
        };

    }

}



// ------------------------------------------------------
// Mostrar usuario conectado
// ------------------------------------------------------

function mostrarUsuario() {

    const usuario =
        verificarSesion();


    if (!usuario) {

        return;

    }


    const nombreUsuario =
        document.getElementById(
            "nombreUsuario"
        );


    nombreUsuario.textContent =
        usuario.nombre ||
        usuario.usuario ||
        "Usuario";


    const rolActivo =
        window.Permisos
            ? Permisos.obtenerRolActivo()
            : null;


    const rolUsuario =
        document.getElementById(
            "rolUsuario"
        );


    if (rolUsuario) {

        rolUsuario.textContent =
            rolActivo
                ? rolActivo.nombre
                : (
                    usuario.rol ||
                    "Sin rol"
                );


        rolUsuario.classList.toggle(
            "role-operator",
            String(
                usuario.rol ||
                ""
            )
                .toLowerCase() ===
                "operador"
        );
    }


    const estadoSesion =
        document.getElementById(
            "estadoSesion"
        );


    if (estadoSesion) {

        estadoSesion.textContent =
            "Rol activo: " +
            (
                rolActivo
                    ? rolActivo.nombre
                    : (
                        usuario.rol ||
                        "Sin rol"
                    )
            );
    }

}



// ------------------------------------------------------
// Leer arreglo desde LocalStorage
// ------------------------------------------------------

function obtenerDatos(clave) {

    const datos =
        localStorage.getItem(
            clave
        );


    if (!datos) {

        return [];

    }


    try {

        const arreglo =
            JSON.parse(datos);


        return Array.isArray(arreglo)
            ? arreglo
            : [];

    } catch (error) {

        return [];

    }

}



// ------------------------------------------------------
// Actualizar resumen del Dashboard
// ------------------------------------------------------

function actualizarResumen() {

    const clientes = obtenerDatos(CLAVE_CLIENTES);
    const productos = obtenerDatos(CLAVE_PRODUCTOS);
    const proveedores = obtenerDatos(CLAVE_PROVEEDORES);
    const categorias = obtenerDatos(CLAVE_CATEGORIAS);
    const pedidos = obtenerDatos(CLAVE_PEDIDOS);

    document.getElementById("resumen-clientes").textContent = clientes.length;
    document.getElementById("resumen-productos").textContent = productos.length;
    document.getElementById("resumen-proveedores").textContent = proveedores.length;
    document.getElementById("resumen-categorias").textContent = categorias.length;
    document.getElementById("resumen-pedidos").textContent = pedidos.length;

    actualizarResumenEstadosPedidos(pedidos);

}




// ------------------------------------------------------
// Pedidos en Dashboard
// ------------------------------------------------------

function guardarPedidosDashboard(pedidos) {
    try {
        localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los pedidos:", error);
        Swal.fire({
            title: "No se pudo actualizar el pedido",
            text: "Ocurrió un error al guardar el nuevo estado.",
            icon: "error",
            confirmButtonText: "Entendido"
        });
        return false;
    }
}

function monedaDashboard(valor) {
    const numero = Number(valor);
    return "₡" + (Number.isFinite(numero) ? numero : 0).toLocaleString(
        "es-CR",
        { maximumFractionDigits: 2 }
    );
}

function idPedidoDashboard(id) {
    return "PED-" + String(id || "").replace(/-/g, "").slice(0, 8).toUpperCase();
}

function actualizarResumenEstadosPedidos(pedidos) {
    const lista = Array.isArray(pedidos) ? pedidos : obtenerDatos(CLAVE_PEDIDOS);
    const pendientes = lista.filter(pedido => pedido.estado === "pendiente").length;
    const proceso = lista.filter(pedido => pedido.estado === "en_proceso").length;
    const entregados = lista.filter(pedido => pedido.estado === "entregado").length;

    document.getElementById("dashboard-pedidos-pendientes").textContent = pendientes;
    document.getElementById("dashboard-pedidos-proceso").textContent = proceso;
    document.getElementById("dashboard-pedidos-entregados").textContent = entregados;
}

function mostrarToastDashboard(mensaje, icono = "success") {
    Swal.fire({
        toast: true,
        position: "top-end",
        icon: icono,
        title: mensaje,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
    });
}

function cambiarEstadoPedidoDesdeDashboard(idPedido, nuevoEstado) {

    if (
        window.Permisos &&
        !Permisos.exigir(
            "cambiar_estado"
        )
    ) {

        mostrarPedidosDashboard();

        return;
    }


    const estadosPermitidos = ["pendiente", "en_proceso", "entregado"];

    if (!estadosPermitidos.includes(nuevoEstado)) {
        mostrarToastDashboard("Estado de pedido inválido.", "error");
        return;
    }

    let pedidos = obtenerDatos(CLAVE_PEDIDOS);
    const existe = pedidos.some(pedido => String(pedido.id) === String(idPedido));

    if (!existe) {
        mostrarToastDashboard("El pedido ya no existe.", "warning");
        mostrarPedidosDashboard();
        return;
    }

    pedidos = pedidos.map(function(pedido) {
        if (String(pedido.id) !== String(idPedido)) return pedido;
        return {
            ...pedido,
            estado: nuevoEstado,
            actualizadoEn: new Date().toISOString()
        };
    });

    if (!guardarPedidosDashboard(pedidos)) return;

    actualizarResumen();
    mostrarPedidosDashboard();
    mostrarToastDashboard("Estado del pedido actualizado.");
}

function crearCeldaDashboard(texto) {
    const celda = document.createElement("td");
    celda.textContent = String(texto ?? "");
    return celda;
}

function mostrarPedidosDashboard() {
    const tbody = document.getElementById("tabla-pedidos-dashboard");
    if (!tbody) return;

    const pedidos = obtenerDatos(CLAVE_PEDIDOS)
        .slice()
        .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

    tbody.textContent = "";
    actualizarResumenEstadosPedidos(pedidos);

    if (pedidos.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 5;
        celda.className = "dashboard-order-empty";
        celda.textContent = "No hay pedidos registrados.";
        fila.appendChild(celda);
        tbody.appendChild(fila);
        return;
    }

    pedidos.forEach(function(pedido) {
        const fila = document.createElement("tr");
        const celdaId = crearCeldaDashboard(idPedidoDashboard(pedido.id));
        celdaId.className = "dashboard-order-id";
        const celdaCliente = crearCeldaDashboard(pedido.clienteNombre || "Cliente no disponible");
        celdaCliente.className = "dashboard-order-client";
        const celdaCantidad = crearCeldaDashboard(Number(pedido.cantidadArticulos || 0));
        const celdaTotal = crearCeldaDashboard(monedaDashboard(pedido.total));
        const celdaEstado = document.createElement("td");
        const selectEstado = document.createElement("select");
        selectEstado.className = "dashboard-order-state state-" + (pedido.estado || "pendiente");

        selectEstado.dataset.permiso =
            "cambiar_estado";

        selectEstado.setAttribute(
            "aria-label",
            "Cambiar estado de " +
            idPedidoDashboard(
                pedido.id
            )
        );


        if (
            window.Permisos &&
            !Permisos.puedeCambiarEstado()
        ) {

            selectEstado.disabled =
                true;

            selectEstado.title =
                "Solo el Administrador puede cambiar el estado del pedido.";
        }

        [
            ["pendiente", "Pendiente"],
            ["en_proceso", "En proceso"],
            ["entregado", "Entregado"]
        ].forEach(function(estado) {
            const opcion = document.createElement("option");
            opcion.value = estado[0];
            opcion.textContent = estado[1];
            opcion.selected = (pedido.estado || "pendiente") === estado[0];
            selectEstado.appendChild(opcion);
        });

        selectEstado.addEventListener("change", function() {
            cambiarEstadoPedidoDesdeDashboard(pedido.id, selectEstado.value);
        });

        celdaEstado.appendChild(selectEstado);
        fila.appendChild(celdaId);
        fila.appendChild(celdaCliente);
        fila.appendChild(celdaCantidad);
        fila.appendChild(celdaTotal);
        fila.appendChild(celdaEstado);
        tbody.appendChild(fila);
    });
}

// ------------------------------------------------------
// Modo oscuro
// Misma estructura utilizada en Productos
// ------------------------------------------------------

const btnModoOscuro =
    document.getElementById(
        "btn-modo-oscuro"
    );



function actualizarBotonTema(
    esOscuro
) {

    if (esOscuro) {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-sun"></i>' +
            '<span>Modo claro</span>';

    } else {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-moon-stars"></i>' +
            '<span>Modo oscuro</span>';

    }

}



function aplicarTemaGuardado() {

    const esOscuro =
        localStorage.getItem(
            "modo_oscuro"
        ) === "true";


    document.documentElement
        .setAttribute(

            "data-theme",

            esOscuro
                ? "dark"
                : "light"

        );


    actualizarBotonTema(
        esOscuro
    );

}



btnModoOscuro.addEventListener(

    "click",

    function() {

        const temaActual =
            document.documentElement
                .getAttribute(
                    "data-theme"
                );


        const esOscuro =
            temaActual !== "dark";


        document.documentElement
            .setAttribute(

                "data-theme",

                esOscuro
                    ? "dark"
                    : "light"

            );


        localStorage.setItem(

            "modo_oscuro",

            esOscuro

        );


        actualizarBotonTema(
            esOscuro
        );

    }

);



// ------------------------------------------------------
// Menú lateral responsive
// Misma estructura utilizada en Productos
// ------------------------------------------------------

const sidebar =
    document.getElementById(
        "sidebar"
    );


const sidebarOverlay =
    document.getElementById(
        "sidebar-overlay"
    );


const btnAbrirMenu =
    document.getElementById(
        "btn-abrir-menu"
    );


const btnCerrarMenu =
    document.getElementById(
        "btn-cerrar-menu"
    );



function abrirMenu() {

    sidebar.classList.add(
        "menu-open"
    );


    sidebarOverlay.classList.add(
        "show"
    );


    document.body.classList.add(
        "menu-open"
    );

}



function cerrarMenu() {

    sidebar.classList.remove(
        "menu-open"
    );


    sidebarOverlay.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "menu-open"
    );

}



btnAbrirMenu.addEventListener(

    "click",

    abrirMenu

);



btnCerrarMenu.addEventListener(

    "click",

    cerrarMenu

);



sidebarOverlay.addEventListener(

    "click",

    cerrarMenu

);



// ------------------------------------------------------
// Cerrar sesión
// ------------------------------------------------------

const btnCerrarSesion =
    document.getElementById(
        "btn-cerrar-sesion"
    );



btnCerrarSesion.addEventListener(

    "click",

    function() {


        Swal.fire({

            title:
                "¿Cerrar sesión?",

            text:
                "Tendrás que iniciar sesión nuevamente para acceder al sistema.",

            icon:
                "warning",

            showCancelButton:
                true,

            confirmButtonText:
                "Sí, cerrar sesión",

            cancelButtonText:
                "Cancelar",

            reverseButtons:
                true


        }).then(
            function(resultado) {


                if (
                    resultado.isConfirmed
                ) {


                    localStorage.removeItem(
                        CLAVE_USUARIO
                    );


                    window.location.href =
                        "login.html";

                }


            }
        );

    }

);



// ------------------------------------------------------
// Inicialización
// ------------------------------------------------------

document.addEventListener(

    "DOMContentLoaded",

    function() {


        if (
            window.Permisos &&
            !Permisos.verificarSesion()
        ) {

            return;
        }


        verificarSesion();


        aplicarTemaGuardado();


        mostrarUsuario();


        actualizarResumen();


        mostrarPedidosDashboard();


    }

);