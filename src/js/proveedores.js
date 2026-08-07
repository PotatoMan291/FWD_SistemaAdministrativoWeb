// ======================================================
// ADMINISTRACIÓN DE PROVEEDORES
// LocalStorage: "proveedores"
// ======================================================

const CLAVE_PROVEEDORES = "proveedores";

const formProveedor = document.getElementById("form-proveedor");
const proveedorId = document.getElementById("proveedor-id");
const proveedorNombre = document.getElementById("proveedor-nombre");
const proveedorEmpresa = document.getElementById("proveedor-empresa");
const proveedorTelefono = document.getElementById("proveedor-telefono");
const proveedorCorreo = document.getElementById("proveedor-correo");
const proveedorDireccion = document.getElementById("proveedor-direccion");

const btnGuardarProveedor =
    document.getElementById("btn-guardar-proveedor");

const btnCancelarProveedor =
    document.getElementById("btn-cancelar-proveedor");

const tablaProveedoresBody =
    document.getElementById("tabla-proveedores-body");

const buscadorProveedor =
    document.getElementById("buscador-proveedor");

const mensajeProveedor =
    document.getElementById("mensaje-proveedor");

const resumenTotalProveedores =
    document.getElementById("resumen-total-proveedores");

const resumenEmpresas =
    document.getElementById("resumen-empresas");

const resumenConProductos =
    document.getElementById("resumen-con-productos");

const resumenProductosAsociados =
    document.getElementById("resumen-productos-asociados");


// ------------------------------------------------------
// Leer proveedores desde LocalStorage
// ------------------------------------------------------
function obtenerProveedores() {

    const datos =
        localStorage.getItem(
            CLAVE_PROVEEDORES
        );

    return datos
        ? JSON.parse(datos)
        : [];
}


// ------------------------------------------------------
// Guardar proveedores en LocalStorage
// ------------------------------------------------------
function guardarProveedores(
    proveedores
) {

    localStorage.setItem(
        CLAVE_PROVEEDORES,
        JSON.stringify(proveedores)
    );
}


// ------------------------------------------------------
// Obtener productos relacionados
// ------------------------------------------------------
function obtenerProductos() {

    const datos =
        localStorage.getItem(
            "productos"
        );

    return datos
        ? JSON.parse(datos)
        : [];
}


// ------------------------------------------------------
// Actualizar tarjetas de resumen
// ------------------------------------------------------
function actualizarResumenProveedores() {

    const proveedores =
        obtenerProveedores();

    const productos =
        obtenerProductos();

    const empresas = [];

    proveedores.forEach(
        function(proveedor) {

            const empresa =
                proveedor.empresa
                    .trim()
                    .toLowerCase();

            if (
                empresa !== "" &&
                !empresas.includes(empresa)
            ) {

                empresas.push(
                    empresa
                );
            }
        }
    );

    let proveedoresConProductos = 0;

    proveedores.forEach(
        function(proveedor) {

            const tieneProductos =
                productos.some(
                    function(producto) {

                        return (
                            String(producto.proveedorId) ===
                            String(proveedor.id)
                        );
                    }
                );

            if (tieneProductos) {

                proveedoresConProductos++;
            }
        }
    );

    resumenTotalProveedores.textContent =
        proveedores.length;

    resumenEmpresas.textContent =
        empresas.length;

    resumenConProductos.textContent =
        proveedoresConProductos;

    resumenProductosAsociados.textContent =
        productos.length;
}


// ------------------------------------------------------
// Crear botón de acción
// ------------------------------------------------------
function crearBoton(
    titulo,
    clase,
    icono,
    idProveedor,
    accion
) {

    const boton =
        document.createElement(
            "button"
        );

    boton.type = "button";
    boton.className = clase;
    boton.title = titulo;
    boton.setAttribute(
        "aria-label",
        titulo
    );

    const iconoElemento =
        document.createElement("i");

    iconoElemento.className =
        icono;

    boton.appendChild(
        iconoElemento
    );

    boton.addEventListener(
        "click",
        function() {

            accion(idProveedor);
        }
    );

    return boton;
}


// ------------------------------------------------------
// Mostrar proveedores
// ------------------------------------------------------
function mostrarProveedores(
    listaProveedores
) {

    let proveedores;

    if (listaProveedores) {

        proveedores =
            listaProveedores;

    } else {

        proveedores =
            obtenerProveedores();
    }

    tablaProveedoresBody.innerHTML =
        "";

    if (proveedores.length === 0) {

        const fila =
            document.createElement("tr");

        const celda =
            document.createElement("td");

        celda.colSpan = 7;
        celda.className =
            "empty-state";

        celda.innerHTML =
            '<i class="bi bi-person-x"></i>' +
            '<strong>No hay proveedores para mostrar</strong>' +
            '<div class="small mt-1">Registra un proveedor o cambia el criterio de búsqueda.</div>';

        fila.appendChild(celda);

        tablaProveedoresBody
            .appendChild(fila);

        actualizarResumenProveedores();

        return;
    }

    proveedores.forEach(
        function(proveedor) {

            const fila =
                document.createElement("tr");

            const celdaId =
                document.createElement("td");

            celdaId.className =
                "id-chip";

            celdaId.textContent =
                proveedor.id;

            const celdaNombre =
                document.createElement("td");

            const nombreWrapper =
                document.createElement("div");

            nombreWrapper.className =
                "d-flex align-items-center gap-2";

            const avatar =
                document.createElement("span");

            avatar.className =
                "provider-avatar";

            avatar.innerHTML =
                '<i class="bi bi-person"></i>';

            const datosNombre =
                document.createElement("div");

            const nombre =
                document.createElement("div");

            nombre.className =
                "table-primary-text";

            nombre.textContent =
                proveedor.nombre;

            const subtitulo =
                document.createElement("span");

            subtitulo.className =
                "table-secondary-text";

            subtitulo.textContent =
                "Proveedor registrado";

            datosNombre.appendChild(
                nombre
            );

            datosNombre.appendChild(
                subtitulo
            );

            nombreWrapper.appendChild(
                avatar
            );

            nombreWrapper.appendChild(
                datosNombre
            );

            celdaNombre.appendChild(
                nombreWrapper
            );

            const celdaEmpresa =
                document.createElement("td");

            celdaEmpresa.innerHTML =
                '<span class="badge border text-body category-badge"></span>';

            celdaEmpresa
                .querySelector("span")
                .textContent =
                    proveedor.empresa;

            const celdaTelefono =
                document.createElement("td");

            celdaTelefono.innerHTML =
                '<i class="bi bi-telephone me-2 text-body-secondary"></i>';

            celdaTelefono.append(
                proveedor.telefono
            );

            const celdaCorreo =
                document.createElement("td");

            const enlaceCorreo =
                document.createElement("a");

            enlaceCorreo.href =
                "mailto:" +
                proveedor.correo;

            enlaceCorreo.className =
                "text-decoration-none";

            enlaceCorreo.textContent =
                proveedor.correo;

            celdaCorreo.appendChild(
                enlaceCorreo
            );

            const celdaDireccion =
                document.createElement("td");

            celdaDireccion.textContent =
                proveedor.direccion;

            const celdaAcciones =
                document.createElement("td");

            const grupoAcciones =
                document.createElement("div");

            grupoAcciones.className =
                "action-group";

            const botonEditar =
                crearBoton(
                    "Editar proveedor",
                    "btn btn-outline-primary btn-action",
                    "bi bi-pencil",
                    proveedor.id,
                    editarProveedor
                );

            const botonEliminar =
                crearBoton(
                    "Eliminar proveedor",
                    "btn btn-outline-danger btn-action",
                    "bi bi-trash3",
                    proveedor.id,
                    eliminarProveedor
                );

            grupoAcciones.appendChild(
                botonEditar
            );

            grupoAcciones.appendChild(
                botonEliminar
            );

            celdaAcciones.appendChild(
                grupoAcciones
            );

            fila.appendChild(celdaId);
            fila.appendChild(celdaNombre);
            fila.appendChild(celdaEmpresa);
            fila.appendChild(celdaTelefono);
            fila.appendChild(celdaCorreo);
            fila.appendChild(celdaDireccion);
            fila.appendChild(celdaAcciones);

            tablaProveedoresBody
                .appendChild(fila);
        }
    );

    actualizarResumenProveedores();
}


// ------------------------------------------------------
// Validar correo
// ------------------------------------------------------
function correoValido(correo) {

    return (
        correo.includes("@") &&
        correo.includes(".")
    );
}


// ------------------------------------------------------
// Validar formulario
// ------------------------------------------------------
function validarProveedor(
    nombre,
    empresa,
    telefono,
    correo,
    direccion
) {

    mensajeProveedor.textContent =
        "";

    if (
        nombre === "" ||
        empresa === "" ||
        telefono === "" ||
        correo === "" ||
        direccion === ""
    ) {

        mensajeProveedor.textContent =
            "Todos los campos son obligatorios.";

        return false;
    }

    if (!correoValido(correo)) {

        mensajeProveedor.textContent =
            "Ingrese un correo electrónico válido.";

        return false;
    }

    return true;
}


// ------------------------------------------------------
// Registrar o actualizar proveedor
// ------------------------------------------------------
formProveedor.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const id =
            proveedorId.value;

        const nombre =
            proveedorNombre.value.trim();

        const empresa =
            proveedorEmpresa.value.trim();

        const telefono =
            proveedorTelefono.value.trim();

        const correo =
            proveedorCorreo.value.trim();

        const direccion =
            proveedorDireccion.value.trim();

        if (
            !validarProveedor(
                nombre,
                empresa,
                telefono,
                correo,
                direccion
            )
        ) {

            return;
        }

        let proveedores =
            obtenerProveedores();

        // Registrar
        if (id === "") {

            const nuevoProveedor = {

                id: Date.now().toString(),
                nombre: nombre,
                empresa: empresa,
                telefono: telefono,
                correo: correo,
                direccion: direccion
            };

            proveedores.push(
                nuevoProveedor
            );

            guardarProveedores(
                proveedores
            );

            limpiarFormularioProveedor();
            mostrarProveedores();

            mostrarToast("Proveedor registrado correctamente.", "success");

            return;
        }

        // Editar
        Swal.fire({

            title: "¿Desea guardar los cambios?",

            text: "Se actualizará la información del proveedor.",

            icon: "question",

            showDenyButton: true,

            showCancelButton: true,

            confirmButtonText: "Guardar",

            denyButtonText: "No guardar",

            cancelButtonText: "Cancelar"

        }).then(function(result) {

            if (result.isConfirmed) {

                proveedores =
                    proveedores.map(
                        function(proveedor) {

                            if (
                                String(proveedor.id) ===
                                String(id)
                            ) {

                                return {
                                    id: proveedor.id,
                                    nombre: nombre,
                                    empresa: empresa,
                                    telefono: telefono,
                                    correo: correo,
                                    direccion: direccion
                                };
                            }

                            return proveedor;
                        }
                    );

                guardarProveedores(
                    proveedores
                );

                limpiarFormularioProveedor();
                mostrarProveedores();

                mostrarToast("Cambios del proveedor guardados.", "success");

            } else if (result.isDenied) {

                Swal.fire(
                    "Cambios no guardados",
                    "Los cambios del proveedor no se guardaron.",
                    "info"
                );
            }
        });
    }
);


// ------------------------------------------------------
// Cargar proveedor para editar
// ------------------------------------------------------
function editarProveedor(id) {

    const proveedores =
        obtenerProveedores();

    const proveedorEncontrado =
        proveedores.find(
            function(proveedor) {

                return (
                    String(proveedor.id) ===
                    String(id)
                );
            }
        );

    if (!proveedorEncontrado) {

        return;
    }

    proveedorId.value =
        proveedorEncontrado.id;

    proveedorNombre.value =
        proveedorEncontrado.nombre;

    proveedorEmpresa.value =
        proveedorEncontrado.empresa;

    proveedorTelefono.value =
        proveedorEncontrado.telefono;

    proveedorCorreo.value =
        proveedorEncontrado.correo;

    proveedorDireccion.value =
        proveedorEncontrado.direccion;

    btnGuardarProveedor.innerHTML =
        '<i class="bi bi-check2-circle me-1"></i> Actualizar Proveedor';

    btnCancelarProveedor.style.display =
        "inline-block";

    document
        .getElementById("formulario-proveedores")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ------------------------------------------------------
// Eliminar proveedor
// ------------------------------------------------------
function eliminarProveedor(id) {

    const productos =
        obtenerProductos();

    const tieneProductos =
        productos.some(
            function(producto) {

                return (
                    String(producto.proveedorId) ===
                    String(id)
                );
            }
        );

    let mensaje =
        "¡No podrá revertir esta acción!";

    if (tieneProductos) {

        mensaje =
            "Este proveedor tiene productos relacionados. ¡No podrá revertir esta acción!";
    }

    Swal.fire({

        title: "¿Está seguro?",

        text: mensaje,

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#d93737",

        cancelButtonColor: "#6b7785",

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            let proveedores =
                obtenerProveedores();

            proveedores =
                proveedores.filter(
                    function(proveedor) {

                        return (
                            String(proveedor.id) !==
                            String(id)
                        );
                    }
                );

            guardarProveedores(
                proveedores
            );

            limpiarFormularioProveedor();
            mostrarProveedores();

            mostrarToast("Proveedor eliminado.", "success");
        }
    });
}


// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioProveedor() {

    formProveedor.reset();

    proveedorId.value = "";

    btnGuardarProveedor.innerHTML =
        '<i class="bi bi-floppy me-1"></i> Guardar Proveedor';

    btnCancelarProveedor.style.display =
        "none";

    mensajeProveedor.textContent =
        "";
}


// ------------------------------------------------------
// Cancelar edición
// ------------------------------------------------------
btnCancelarProveedor.addEventListener(
    "click",
    function() {

        limpiarFormularioProveedor();
    }
);


// ------------------------------------------------------
// Buscar proveedores
// ------------------------------------------------------
buscadorProveedor.addEventListener(
    "input",
    function(event) {

        const texto =
            event.target.value
                .toLowerCase()
                .trim();

        const proveedores =
            obtenerProveedores();

        const proveedoresFiltrados =
            proveedores.filter(
                function(proveedor) {

                    return (
                        proveedor.nombre
                            .toLowerCase()
                            .includes(texto) ||
                        proveedor.empresa
                            .toLowerCase()
                            .includes(texto) ||
                        proveedor.telefono
                            .toLowerCase()
                            .includes(texto) ||
                        proveedor.correo
                            .toLowerCase()
                            .includes(texto) ||
                        proveedor.direccion
                            .toLowerCase()
                            .includes(texto)
                    );
                }
            );

        mostrarProveedores(
            proveedoresFiltrados
        );
    }
);


// ------------------------------------------------------
// Modo oscuro con CoreUI
// ------------------------------------------------------
const btnModoOscuro =
    document.getElementById(
        "btn-modo-oscuro"
    );

function actualizarBotonTema(esOscuro) {

    if (esOscuro) {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-sun"></i><span>Modo claro</span>';

    } else {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-moon-stars"></i><span>Modo oscuro</span>';
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
// ------------------------------------------------------
const sidebar =
    document.getElementById("sidebar");

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
// Inicialización
// ------------------------------------------------------
document.addEventListener(
    "DOMContentLoaded",
    function() {

        aplicarTemaGuardado();
        mostrarProveedores();
    }
);
