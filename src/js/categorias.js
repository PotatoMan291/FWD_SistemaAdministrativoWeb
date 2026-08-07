// ======================================================
// ADMINISTRACIÓN DE CATEGORÍAS
// LocalStorage: "categorias"
// ======================================================

const CLAVE_CATEGORIAS = "categorias";

const formCategoria =
    document.getElementById("form-categoria");

const categoriaId =
    document.getElementById("categoria-id");

const categoriaNombre =
    document.getElementById("categoria-nombre");

const categoriaDescripcion =
    document.getElementById("categoria-descripcion");

const btnGuardarCategoria =
    document.getElementById("btn-guardar-categoria");

const btnCancelarCategoria =
    document.getElementById("btn-cancelar-categoria");

const tablaCategoriasBody =
    document.getElementById("tabla-categorias-body");

const buscadorCategoria =
    document.getElementById("buscador-categoria");

const mensajeCategoria =
    document.getElementById("mensaje-categoria");

const resumenTotalCategorias =
    document.getElementById("resumen-total-categorias");

const resumenCategoriasUsadas =
    document.getElementById("resumen-categorias-usadas");

const resumenProductos =
    document.getElementById("resumen-productos");


// ------------------------------------------------------
// Leer categorías
// ------------------------------------------------------
function obtenerCategorias() {

    const datos =
        localStorage.getItem(CLAVE_CATEGORIAS);

    return datos ? JSON.parse(datos) : [];
}


// ------------------------------------------------------
// Guardar categorías
// ------------------------------------------------------
function guardarCategorias(categorias) {

    localStorage.setItem(
        CLAVE_CATEGORIAS,
        JSON.stringify(categorias)
    );
}


// ------------------------------------------------------
// Leer productos
// ------------------------------------------------------
function obtenerProductos() {

    const datos =
        localStorage.getItem("productos");

    return datos ? JSON.parse(datos) : [];
}


// ------------------------------------------------------
// Cantidad de productos por categoría
// ------------------------------------------------------
function cantidadProductosCategoria(idCategoria) {

    const productos = obtenerProductos();

    return productos.filter(function(producto) {

        return String(producto.categoriaId) ===
               String(idCategoria);

    }).length;
}


// ------------------------------------------------------
// Actualizar tarjetas
// ------------------------------------------------------
function actualizarResumenCategorias() {

    const categorias = obtenerCategorias();
    const productos = obtenerProductos();

    let categoriasUsadas = 0;

    categorias.forEach(function(categoria) {

        if (
            cantidadProductosCategoria(
                categoria.id
            ) > 0
        ) {

            categoriasUsadas++;
        }
    });

    resumenTotalCategorias.textContent =
        categorias.length;

    resumenCategoriasUsadas.textContent =
        categoriasUsadas;

    resumenProductos.textContent =
        productos.length;
}


// ------------------------------------------------------
// Crear botón
// ------------------------------------------------------
function crearBoton(
    titulo,
    clase,
    icono,
    id,
    accion
) {

    const boton =
        document.createElement("button");

    boton.type = "button";
    boton.className = clase;
    boton.title = titulo;

    const iconoElemento =
        document.createElement("i");

    iconoElemento.className = icono;

    boton.appendChild(iconoElemento);

    boton.addEventListener(
        "click",
        function() {

            accion(id);
        }
    );

    return boton;
}


// ------------------------------------------------------
// Mostrar categorías
// ------------------------------------------------------
function mostrarCategorias(listaCategorias) {

    let categorias;

    if (listaCategorias) {

        categorias = listaCategorias;

    } else {

        categorias = obtenerCategorias();
    }

    tablaCategoriasBody.innerHTML = "";

    if (categorias.length === 0) {

        const fila =
            document.createElement("tr");

        const celda =
            document.createElement("td");

        celda.colSpan = 5;
        celda.className = "empty-state";

        celda.innerHTML =
            '<i class="bi bi-tags"></i>' +
            '<strong>No hay categorías para mostrar</strong>' +
            '<div class="small mt-1">Registra una categoría para utilizarla en Productos.</div>';

        fila.appendChild(celda);

        tablaCategoriasBody.appendChild(fila);

        actualizarResumenCategorias();

        return;
    }

    categorias.forEach(function(categoria) {

        const fila =
            document.createElement("tr");

        const celdaId =
            document.createElement("td");

        celdaId.className = "id-chip";
        celdaId.textContent = categoria.id;

        const celdaNombre =
            document.createElement("td");

        const badge =
            document.createElement("span");

        badge.className =
            "badge text-bg-primary category-main-badge";

        badge.innerHTML =
            '<i class="bi bi-tag"></i>';

        const textoNombre =
            document.createElement("span");

        textoNombre.textContent =
            categoria.nombre;

        badge.appendChild(textoNombre);

        celdaNombre.appendChild(badge);

        const celdaDescripcion =
            document.createElement("td");

        celdaDescripcion.textContent =
            categoria.descripcion;

        const celdaProductos =
            document.createElement("td");

        const cantidad =
            cantidadProductosCategoria(
                categoria.id
            );

        const badgeCantidad =
            document.createElement("span");

        badgeCantidad.className =
            cantidad > 0
                ? "badge text-bg-success"
                : "badge text-bg-secondary";

        badgeCantidad.textContent =
            cantidad + " producto(s)";

        celdaProductos.appendChild(
            badgeCantidad
        );

        const celdaAcciones =
            document.createElement("td");

        const acciones =
            document.createElement("div");

        acciones.className =
            "action-group";

        acciones.appendChild(
            crearBoton(
                "Editar categoría",
                "btn btn-outline-primary btn-action",
                "bi bi-pencil",
                categoria.id,
                editarCategoria
            )
        );

        acciones.appendChild(
            crearBoton(
                "Eliminar categoría",
                "btn btn-outline-danger btn-action",
                "bi bi-trash3",
                categoria.id,
                eliminarCategoria
            )
        );

        celdaAcciones.appendChild(
            acciones
        );

        fila.appendChild(celdaId);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaDescripcion);
        fila.appendChild(celdaProductos);
        fila.appendChild(celdaAcciones);

        tablaCategoriasBody.appendChild(
            fila
        );
    });

    actualizarResumenCategorias();
}


// ------------------------------------------------------
// Validar
// ------------------------------------------------------
function validarCategoria(
    nombre,
    descripcion
) {

    mensajeCategoria.textContent = "";

    if (
        nombre === "" ||
        descripcion === ""
    ) {

        mensajeCategoria.textContent =
            "Todos los campos son obligatorios.";

        return false;
    }

    return true;
}


// ------------------------------------------------------
// Registrar / actualizar
// ------------------------------------------------------
formCategoria.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const id =
            categoriaId.value;

        const nombre =
            categoriaNombre.value.trim();

        const descripcion =
            categoriaDescripcion.value.trim();

        if (
            !validarCategoria(
                nombre,
                descripcion
            )
        ) {

            return;
        }

        let categorias =
            obtenerCategorias();

        // Evitar nombres repetidos
        const repetida =
            categorias.some(
                function(categoria) {

                    return (
                        categoria.nombre
                            .toLowerCase() ===
                        nombre.toLowerCase() &&
                        String(categoria.id) !==
                        String(id)
                    );
                }
            );

        if (repetida) {

            mensajeCategoria.textContent =
                "Ya existe una categoría con ese nombre.";

            return;
        }

        // Registrar
        if (id === "") {

            const nuevaCategoria = {

                id: Date.now().toString(),
                nombre: nombre,
                descripcion: descripcion
            };

            categorias.push(
                nuevaCategoria
            );

            guardarCategorias(
                categorias
            );

            limpiarFormularioCategoria();
            mostrarCategorias();

            mostrarToast("Categoría registrada correctamente.", "success");

            return;
        }

        // Editar
        Swal.fire({

            title: "¿Desea guardar los cambios?",

            text: "Se actualizará la categoría.",

            icon: "question",

            showDenyButton: true,

            showCancelButton: true,

            confirmButtonText: "Guardar",

            denyButtonText: "No guardar",

            cancelButtonText: "Cancelar"

        }).then(function(result) {

            if (result.isConfirmed) {

                categorias =
                    categorias.map(
                        function(categoria) {

                            if (
                                String(categoria.id) ===
                                String(id)
                            ) {

                                return {
                                    id: categoria.id,
                                    nombre: nombre,
                                    descripcion: descripcion
                                };
                            }

                            return categoria;
                        }
                    );

                guardarCategorias(
                    categorias
                );

                limpiarFormularioCategoria();
                mostrarCategorias();

                mostrarToast("Cambios de la categoría guardados.", "success");

            } else if (result.isDenied) {

                Swal.fire(
                    "Cambios no guardados",
                    "La categoría no fue modificada.",
                    "info"
                );
            }
        });
    }
);


// ------------------------------------------------------
// Editar categoría
// ------------------------------------------------------
function editarCategoria(id) {

    const categorias =
        obtenerCategorias();

    const categoria =
        categorias.find(
            function(item) {

                return String(item.id) ===
                       String(id);
            }
        );

    if (!categoria) {

        return;
    }

    categoriaId.value =
        categoria.id;

    categoriaNombre.value =
        categoria.nombre;

    categoriaDescripcion.value =
        categoria.descripcion;

    btnGuardarCategoria.innerHTML =
        '<i class="bi bi-check2-circle me-1"></i> Actualizar Categoría';

    btnCancelarCategoria.style.display =
        "inline-block";

    document
        .getElementById(
            "formulario-categorias"
        )
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ------------------------------------------------------
// Eliminar categoría
// ------------------------------------------------------
function eliminarCategoria(id) {

    const cantidad =
        cantidadProductosCategoria(id);

    if (cantidad > 0) {

        Swal.fire({
            title: "Categoría en uso",
            text:
                "No puede eliminar esta categoría porque tiene " +
                cantidad +
                " producto(s) asociado(s).",
            icon: "warning",
            confirmButtonText: "Entendido"
        });

        return;
    }

    Swal.fire({

        title: "¿Está seguro?",

        text: "¡No podrá revertir esta acción!",

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#d93737",

        cancelButtonColor: "#6b7785",

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            let categorias =
                obtenerCategorias();

            categorias =
                categorias.filter(
                    function(categoria) {

                        return (
                            String(categoria.id) !==
                            String(id)
                        );
                    }
                );

            guardarCategorias(
                categorias
            );

            limpiarFormularioCategoria();
            mostrarCategorias();

            mostrarToast("Categoría eliminada.", "success");
        }
    });
}


// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioCategoria() {

    formCategoria.reset();

    categoriaId.value = "";

    btnGuardarCategoria.innerHTML =
        '<i class="bi bi-floppy me-1"></i> Guardar Categoría';

    btnCancelarCategoria.style.display =
        "none";

    mensajeCategoria.textContent = "";
}


// ------------------------------------------------------
// Cancelar edición
// ------------------------------------------------------
btnCancelarCategoria.addEventListener(
    "click",
    function() {

        limpiarFormularioCategoria();
    }
);


// ------------------------------------------------------
// Buscar
// ------------------------------------------------------
buscadorCategoria.addEventListener(
    "input",
    function(event) {

        const texto =
            event.target.value
                .toLowerCase()
                .trim();

        const categorias =
            obtenerCategorias();

        const filtradas =
            categorias.filter(
                function(categoria) {

                    return (
                        categoria.nombre
                            .toLowerCase()
                            .includes(texto) ||
                        categoria.descripcion
                            .toLowerCase()
                            .includes(texto)
                    );
                }
            );

        mostrarCategorias(filtradas);
    }
);


// ------------------------------------------------------
// Tema CoreUI
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
            esOscuro ? "dark" : "light"
        );

    actualizarBotonTema(esOscuro);
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
                esOscuro ? "dark" : "light"
            );

        localStorage.setItem(
            "modo_oscuro",
            esOscuro
        );

        actualizarBotonTema(esOscuro);
    }
);


// ------------------------------------------------------
// Sidebar responsive
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
        mostrarCategorias();
    }
);
