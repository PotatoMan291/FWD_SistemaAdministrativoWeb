// ======================================================
// ADMINISTRACIÓN DE PRODUCTOS
// LocalStorage: "productos"
// ======================================================

const CLAVE_PRODUCTOS = "productos";
const CLAVE_PROVEEDORES = "proveedores";
const CLAVE_CATEGORIAS = "categorias";

const formProducto = document.getElementById("form-producto");
const productoId = document.getElementById("producto-id");
const productoNombre = document.getElementById("producto-nombre");
const productoCategoria = document.getElementById("producto-categoria");
const productoPrecio = document.getElementById("producto-precio");
const productoStock = document.getElementById("producto-stock");
const productoProveedor = document.getElementById("producto-proveedor");

const btnGuardarProducto = document.getElementById("btn-guardar-producto");
const btnCancelarProducto = document.getElementById("btn-cancelar-producto");

const tablaProductosBody = document.getElementById("tabla-productos-body");
const buscadorProducto = document.getElementById("buscador-producto");
const mensajeProducto = document.getElementById("mensaje-producto");

const resumenTotalProductos = document.getElementById("resumen-total-productos");
const resumenStockTotal = document.getElementById("resumen-stock-total");
const resumenStockBajo = document.getElementById("resumen-stock-bajo");
const resumenProveedores = document.getElementById("resumen-proveedores");


// ------------------------------------------------------
// Leer productos desde LocalStorage
// ------------------------------------------------------
function obtenerProductos() {

    const datos = localStorage.getItem(CLAVE_PRODUCTOS);

    return datos ? JSON.parse(datos) : [];
}


// ------------------------------------------------------
// Guardar productos en LocalStorage
// ------------------------------------------------------
function guardarProductos(productos) {

    localStorage.setItem(
        CLAVE_PRODUCTOS,
        JSON.stringify(productos)
    );
}


// ------------------------------------------------------
// Leer proveedores desde LocalStorage
// ------------------------------------------------------
function obtenerProveedores() {

    const datos = localStorage.getItem(CLAVE_PROVEEDORES);

    return datos ? JSON.parse(datos) : [];
}


// ------------------------------------------------------
// Actualizar tarjetas de resumen
// ------------------------------------------------------
function actualizarResumenProductos() {

    const productos = obtenerProductos();
    const proveedores = obtenerProveedores();

    let stockTotal = 0;
    let stockBajo = 0;

    productos.forEach(function(producto) {

        stockTotal += Number(producto.stock);

        if (Number(producto.stock) <= 5) {
            stockBajo++;
        }
    });

    resumenTotalProductos.textContent = productos.length;
    resumenStockTotal.textContent = stockTotal;
    resumenStockBajo.textContent = stockBajo;
    resumenProveedores.textContent = proveedores.length;
}


// ------------------------------------------------------
// Leer categorías desde LocalStorage
// ------------------------------------------------------
function obtenerCategorias() {

    const datos = localStorage.getItem(CLAVE_CATEGORIAS);

    return datos ? JSON.parse(datos) : [];
}


// ------------------------------------------------------
// Cargar categorías en el select
// ------------------------------------------------------
function cargarCategoriasEnSelect(categoriaSeleccionada = "") {

    const categorias = obtenerCategorias();

    productoCategoria.innerHTML =
        '<option value="">Seleccione una categoría</option>';

    categorias.forEach(function(categoria) {

        const opcion = document.createElement("option");

        opcion.value = categoria.id;
        opcion.textContent = categoria.nombre;

        if (
            String(categoria.id) ===
            String(categoriaSeleccionada)
        ) {
            opcion.selected = true;
        }

        productoCategoria.appendChild(opcion);
    });
}


// ------------------------------------------------------
// Buscar categoría por ID
// ------------------------------------------------------
function obtenerCategoria(idCategoria) {

    const categorias = obtenerCategorias();

    return categorias.find(function(categoria) {

        return String(categoria.id) === String(idCategoria);
    });
}


// ------------------------------------------------------
// Cargar proveedores en el select
// ------------------------------------------------------
function cargarProveedoresEnSelect(proveedorSeleccionado = "") {

    const proveedores = obtenerProveedores();

    productoProveedor.innerHTML =
        '<option value="">Seleccione un proveedor</option>';

    proveedores.forEach(function(proveedor) {

        const opcion = document.createElement("option");

        opcion.value = proveedor.id;
        opcion.textContent =
            proveedor.nombre + " - " + proveedor.empresa;

        if (
            String(proveedor.id) ===
            String(proveedorSeleccionado)
        ) {

            opcion.selected = true;
        }

        productoProveedor.appendChild(opcion);
    });
}


// ------------------------------------------------------
// Buscar proveedor por ID
// ------------------------------------------------------
function obtenerProveedor(idProveedor) {

    const proveedores = obtenerProveedores();

    return proveedores.find(function(proveedor) {

        return String(proveedor.id) === String(idProveedor);
    });
}


// ------------------------------------------------------
// Crear botón de acción
// ------------------------------------------------------
function crearBoton(
    titulo,
    clase,
    icono,
    idProducto,
    accion
) {

    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = clase;
    boton.title = titulo;
    boton.setAttribute("aria-label", titulo);

    const iconoElemento =
        document.createElement("i");

    iconoElemento.className = icono;

    boton.appendChild(iconoElemento);

    boton.addEventListener("click", function() {

        accion(idProducto);
    });

    return boton;
}


// ------------------------------------------------------
// Crear badge de stock
// ------------------------------------------------------
function crearBadgeStock(stock) {

    const badge = document.createElement("span");

    badge.classList.add(
        "badge",
        "stock-badge"
    );

    if (Number(stock) === 0) {

        badge.classList.add("text-bg-danger");
        badge.textContent = "Sin stock";

    } else if (Number(stock) <= 5) {

        badge.classList.add("text-bg-warning");
        badge.textContent = stock + " unidades";

    } else {

        badge.classList.add("text-bg-success");
        badge.textContent = stock + " unidades";
    }

    return badge;
}


// ------------------------------------------------------
// Mostrar productos
// ------------------------------------------------------
function mostrarProductos(listaProductos) {

    let productos;

    if (listaProductos) {

        productos = listaProductos;

    } else {

        productos = obtenerProductos();
    }

    tablaProductosBody.innerHTML = "";

    if (productos.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 7;
        celda.className = "empty-state";

        celda.innerHTML =
            '<i class="bi bi-inbox"></i>' +
            '<strong>No hay productos para mostrar</strong>' +
            '<div class="small mt-1">Registra un producto o cambia el criterio de búsqueda.</div>';

        fila.appendChild(celda);
        tablaProductosBody.appendChild(fila);

        actualizarResumenProductos();

        return;
    }

    productos.forEach(function(producto) {

        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.className = "id-chip";
        celdaId.textContent = producto.id;

        const celdaNombre = document.createElement("td");

        const nombre = document.createElement("div");
        nombre.className = "table-primary-text";
        nombre.textContent = producto.nombre;

        const categoriaSecundaria =
            document.createElement("span");

        categoriaSecundaria.className =
            "table-secondary-text";

        categoriaSecundaria.textContent =
            "Producto registrado";

        celdaNombre.appendChild(nombre);
        celdaNombre.appendChild(categoriaSecundaria);

        const celdaCategoria = document.createElement("td");

        const badgeCategoria =
            document.createElement("span");

        badgeCategoria.className =
            "badge border text-body category-badge";

        const categoria =
            obtenerCategoria(producto.categoriaId);

        if (categoria) {

            badgeCategoria.textContent =
                categoria.nombre;

        } else {

            // Compatibilidad con productos antiguos
            badgeCategoria.textContent =
                producto.categoria ||
                "Categoría no disponible";
        }

        celdaCategoria.appendChild(badgeCategoria);

        const celdaPrecio = document.createElement("td");
        celdaPrecio.className = "fw-semibold";

        celdaPrecio.textContent =
            "₡" +
            Number(producto.precio)
                .toLocaleString("es-CR");

        const celdaStock = document.createElement("td");

        celdaStock.appendChild(
            crearBadgeStock(producto.stock)
        );

        const celdaProveedor = document.createElement("td");

        const proveedor =
            obtenerProveedor(producto.proveedorId);

        if (proveedor) {

            const proveedorNombre =
                document.createElement("div");

            proveedorNombre.className =
                "table-primary-text";

            proveedorNombre.textContent =
                proveedor.nombre;

            const proveedorEmpresa =
                document.createElement("span");

            proveedorEmpresa.className =
                "table-secondary-text";

            proveedorEmpresa.textContent =
                proveedor.empresa;

            celdaProveedor.appendChild(
                proveedorNombre
            );

            celdaProveedor.appendChild(
                proveedorEmpresa
            );

        } else {

            const badge =
                document.createElement("span");

            badge.className =
                "badge text-bg-secondary";

            badge.textContent =
                "Proveedor no disponible";

            celdaProveedor.appendChild(badge);
        }

        const celdaAcciones =
            document.createElement("td");

        const grupoAcciones =
            document.createElement("div");

        grupoAcciones.className =
            "action-group";

        const botonEditar = crearBoton(
            "Editar producto",
            "btn btn-outline-primary btn-action",
            "bi bi-pencil",
            producto.id,
            editarProducto
        );

        const botonEliminar = crearBoton(
            "Eliminar producto",
            "btn btn-outline-danger btn-action",
            "bi bi-trash3",
            producto.id,
            eliminarProducto
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
        fila.appendChild(celdaCategoria);
        fila.appendChild(celdaPrecio);
        fila.appendChild(celdaStock);
        fila.appendChild(celdaProveedor);
        fila.appendChild(celdaAcciones);

        tablaProductosBody.appendChild(fila);
    });

    actualizarResumenProductos();
}


// ------------------------------------------------------
// Validar datos
// ------------------------------------------------------
function validarProducto(
    nombre,
    categoriaId,
    precio,
    stock,
    proveedorId
) {

    mensajeProducto.textContent = "";

    if (
        nombre === "" ||
        categoriaId === "" ||
        precio === "" ||
        stock === "" ||
        proveedorId === ""
    ) {

        mensajeProducto.textContent =
            "Todos los campos son obligatorios.";

        return false;
    }

    if (Number(precio) <= 0) {

        mensajeProducto.textContent =
            "El precio debe ser mayor que 0.";

        return false;
    }

    if (Number(stock) < 0) {

        mensajeProducto.textContent =
            "El stock no puede ser negativo.";

        return false;
    }

    if (!Number.isInteger(Number(stock))) {

        mensajeProducto.textContent =
            "El stock debe ser un número entero.";

        return false;
    }

    return true;
}


// ------------------------------------------------------
// Registrar o actualizar producto
// ------------------------------------------------------
formProducto.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const id =
            productoId.value;

        const nombre =
            productoNombre.value.trim();

        const categoriaId =
            productoCategoria.value;

        const precio =
            productoPrecio.value;

        const stock =
            productoStock.value;

        const proveedorId =
            productoProveedor.value;

        if (
            !validarProducto(
                nombre,
                categoriaId,
                precio,
                stock,
                proveedorId
            )
        ) {

            return;
        }

        let productos =
            obtenerProductos();

        // Registrar
        if (id === "") {

            const nuevoProducto = {

                id: Date.now().toString(),
                nombre: nombre,
                categoriaId: categoriaId,
                precio: Number(precio),
                stock: Number(stock),
                proveedorId: proveedorId
            };

            productos.push(
                nuevoProducto
            );

            guardarProductos(productos);

            limpiarFormularioProducto();
            mostrarProductos();

            mostrarToast("Producto registrado correctamente.", "success");

            return;
        }

        // Editar
        Swal.fire({

            title: "¿Desea guardar los cambios?",

            text: "Se actualizará la información del producto.",

            icon: "question",

            showDenyButton: true,

            showCancelButton: true,

            confirmButtonText: "Guardar",

            denyButtonText: "No guardar",

            cancelButtonText: "Cancelar"

        }).then(function(result) {

            if (result.isConfirmed) {

                productos =
                    productos.map(
                        function(producto) {

                            if (
                                String(producto.id) ===
                                String(id)
                            ) {

                                return {
                                    id: producto.id,
                                    nombre: nombre,
                                    categoriaId: categoriaId,
                                    precio: Number(precio),
                                    stock: Number(stock),
                                    proveedorId: proveedorId
                                };
                            }

                            return producto;
                        }
                    );

                guardarProductos(
                    productos
                );

                limpiarFormularioProducto();
                mostrarProductos();

                mostrarToast("Cambios del producto guardados.", "success");

            } else if (result.isDenied) {

                Swal.fire(
                    "Cambios no guardados",
                    "Los cambios del producto no se guardaron.",
                    "info"
                );
            }
        });
    }
);


// ------------------------------------------------------
// Cargar producto para editar
// ------------------------------------------------------
function editarProducto(id) {

    const productos =
        obtenerProductos();

    const productoEncontrado =
        productos.find(
            function(producto) {

                return (
                    String(producto.id) ===
                    String(id)
                );
            }
        );

    if (!productoEncontrado) {

        return;
    }

    productoId.value =
        productoEncontrado.id;

    productoNombre.value =
        productoEncontrado.nombre;

    cargarCategoriasEnSelect(
        productoEncontrado.categoriaId
    );

    productoPrecio.value =
        productoEncontrado.precio;

    productoStock.value =
        productoEncontrado.stock;

    cargarProveedoresEnSelect(
        productoEncontrado.proveedorId
    );

    btnGuardarProducto.innerHTML =
        '<i class="bi bi-check2-circle me-1"></i> Actualizar Producto';

    btnCancelarProducto.style.display =
        "inline-block";

    document
        .getElementById("formulario-productos")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ------------------------------------------------------
// Eliminar producto
// ------------------------------------------------------
function eliminarProducto(id) {

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

            let productos =
                obtenerProductos();

            productos =
                productos.filter(
                    function(producto) {

                        return (
                            String(producto.id) !==
                            String(id)
                        );
                    }
                );

            guardarProductos(
                productos
            );

            limpiarFormularioProducto();
            mostrarProductos();

            mostrarToast("Producto eliminado.", "success");
        }
    });
}


// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioProducto() {

    formProducto.reset();

    productoId.value = "";

    btnGuardarProducto.innerHTML =
        '<i class="bi bi-floppy me-1"></i> Guardar Producto';

    btnCancelarProducto.style.display =
        "none";

    mensajeProducto.textContent = "";

    cargarProveedoresEnSelect();
    cargarCategoriasEnSelect();
}


// ------------------------------------------------------
// Cancelar edición
// ------------------------------------------------------
btnCancelarProducto.addEventListener(
    "click",
    function() {

        limpiarFormularioProducto();
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

    document.documentElement.setAttribute(
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
        cargarCategoriasEnSelect();
        cargarProveedoresEnSelect();
        mostrarProductos();
    }
);
