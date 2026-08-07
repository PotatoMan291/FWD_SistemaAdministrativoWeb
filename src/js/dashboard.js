// ======================================================
// DASHBOARD ADMINISTRATIVO
// ======================================================


// ------------------------------------------------------
// Claves de LocalStorage
// ------------------------------------------------------

const CLAVE_USUARIO = "usuario";

const CLAVE_CLIENTES = "clientes";

const CLAVE_PRODUCTOS = "productos";

const CLAVE_PROVEEDORES = "proveedores";

const CLAVE_CATEGORIAS = "categorias";



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
        "Administrador";

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

    const clientes =
        obtenerDatos(
            CLAVE_CLIENTES
        );


    const productos =
        obtenerDatos(
            CLAVE_PRODUCTOS
        );


    const proveedores =
        obtenerDatos(
            CLAVE_PROVEEDORES
        );


    const categorias =
        obtenerDatos(
            CLAVE_CATEGORIAS
        );


    document.getElementById(
        "resumen-clientes"
    ).textContent =
        clientes.length;


    document.getElementById(
        "resumen-productos"
    ).textContent =
        productos.length;


    document.getElementById(
        "resumen-proveedores"
    ).textContent =
        proveedores.length;


    document.getElementById(
        "resumen-categorias"
    ).textContent =
        categorias.length;

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


        verificarSesion();


        aplicarTemaGuardado();


        mostrarUsuario();


        actualizarResumen();


    }

);