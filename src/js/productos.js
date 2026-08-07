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
// Utilidades de seguridad y almacenamiento
// ------------------------------------------------------
let advertenciaStorageMostrada = false;

function mostrarToast(
    mensaje,
    icono = "success"
) {

    if (window.Swal) {

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: icono,
            title: mensaje,
            showConfirmButton: false,
            timer: 2200,
            timerProgressBar: true
        });

        return;
    }

    console.log(mensaje);
}


function avisarProblemaStorage(mensaje) {

    if (advertenciaStorageMostrada) {
        return;
    }

    advertenciaStorageMostrada = true;

    if (window.Swal) {

        Swal.fire({
            title: "Problema con el almacenamiento",
            text: mensaje,
            icon: "error",
            confirmButtonText: "Entendido"
        });

    } else {

        console.error(mensaje);
    }
}


function leerTextoLocalStorage(clave) {

    try {

        return localStorage.getItem(clave);

    } catch (error) {

        console.error(
            "No se pudo leer LocalStorage:",
            error
        );

        avisarProblemaStorage(
            "El navegador no permite acceder a LocalStorage. Los cambios no podrán persistirse."
        );

        return null;
    }
}


function leerListaLocalStorage(clave) {

    const datos =
        leerTextoLocalStorage(clave);

    if (!datos) {
        return [];
    }

    try {

        const lista = JSON.parse(datos);

        if (!Array.isArray(lista)) {

            throw new Error(
                "El contenido almacenado no es una lista."
            );
        }

        return lista.filter(
            function(item) {

                return (
                    item &&
                    typeof item === "object"
                );
            }
        );

    } catch (error) {

        console.error(
            "Datos inválidos en " + clave + ":",
            error
        );

        // Conservar una copia antes de recuperar la aplicación.
        try {

            const claveBackup =
                clave +
                "_backup_corrupto_" +
                Date.now();

            localStorage.setItem(
                claveBackup,
                datos
            );

            localStorage.setItem(
                clave,
                "[]"
            );

        } catch (errorBackup) {

            console.error(
                "No fue posible crear el respaldo:",
                errorBackup
            );
        }

        avisarProblemaStorage(
            "Se detectaron datos dañados. Se creó un respaldo y el módulo se recuperó para evitar que la página falle."
        );

        return [];
    }
}


function guardarListaLocalStorage(
    clave,
    lista
) {

    try {

        localStorage.setItem(
            clave,
            JSON.stringify(lista)
        );

        return true;

    } catch (error) {

        console.error(
            "No se pudo guardar LocalStorage:",
            error
        );

        avisarProblemaStorage(
            "No fue posible guardar los cambios. Revise el espacio disponible o los permisos del navegador."
        );

        return false;
    }
}


function leerPreferenciaSegura(
    clave,
    valorPorDefecto = ""
) {

    const valor =
        leerTextoLocalStorage(clave);

    return (
        valor === null ||
        valor === ""
    )
        ? valorPorDefecto
        : valor;
}


function guardarPreferenciaSegura(
    clave,
    valor
) {

    try {

        localStorage.setItem(
            clave,
            String(valor)
        );

        return true;

    } catch (error) {

        console.warn(
            "No se pudo guardar la preferencia " + clave,
            error
        );

        return false;
    }
}


function generarIdSeguro() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}


function normalizarTextoComparacion(texto) {

    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}


function textoSeguro(
    valor,
    maximo = 250
) {

    return String(valor ?? "")
        .trim()
        .slice(0, maximo);
}


function numeroSeguro(
    valor,
    valorPorDefecto = 0
) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : valorPorDefecto;
}


function normalizarProductoGuardado(producto) {

    return {
        id: textoSeguro(producto.id, 100),
        nombre: textoSeguro(producto.nombre, 120),
        categoriaId: textoSeguro(producto.categoriaId, 100),
        categoria: textoSeguro(producto.categoria, 80),
        precio: numeroSeguro(producto.precio, 0),
        stock: numeroSeguro(producto.stock, 0),
        proveedorId: textoSeguro(producto.proveedorId, 100)
    };
}


function normalizarProveedorGuardado(proveedor) {

    return {
        id: textoSeguro(proveedor.id, 100),
        nombre: textoSeguro(proveedor.nombre, 100),
        empresa: textoSeguro(proveedor.empresa, 100),
        telefono: textoSeguro(proveedor.telefono, 25),
        correo: textoSeguro(proveedor.correo, 150)
            .toLowerCase(),
        direccion: textoSeguro(proveedor.direccion, 200)
    };
}


function normalizarCategoriaGuardada(categoria) {

    return {
        id: textoSeguro(categoria.id, 100),
        nombre: textoSeguro(categoria.nombre, 80),
        descripcion: textoSeguro(categoria.descripcion, 250)
    };
}


function textoSeguroGrafico(
    valor,
    maximo = 60
) {

    return String(valor ?? "")
        .replace(/[<>]/g, "")
        .trim()
        .slice(0, maximo);
}


// ------------------------------------------------------
// Leer productos desde LocalStorage
// ------------------------------------------------------
function obtenerProductos() {

    return leerListaLocalStorage(
        CLAVE_PRODUCTOS
    )
        .map(normalizarProductoGuardado)
        .filter(function(producto) {

            return (
                producto.id !== "" &&
                producto.nombre !== ""
            );
        });
}


// ------------------------------------------------------
// Guardar productos en LocalStorage
// ------------------------------------------------------
function guardarProductos(productos) {

    return guardarListaLocalStorage(
        CLAVE_PRODUCTOS,
        productos
    );
}


// ------------------------------------------------------
// Leer proveedores desde LocalStorage
// ------------------------------------------------------
function obtenerProveedores() {

    return leerListaLocalStorage(
        CLAVE_PROVEEDORES
    )
        .map(normalizarProveedorGuardado)
        .filter(function(proveedor) {

            return (
                proveedor.id !== "" &&
                proveedor.nombre !== ""
            );
        });
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

    return leerListaLocalStorage(
        CLAVE_CATEGORIAS
    )
        .map(normalizarCategoriaGuardada)
        .filter(function(categoria) {

            return (
                categoria.id !== "" &&
                categoria.nombre !== ""
            );
        });
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

    productoCategoria.disabled =
        categorias.length === 0;

    if (categorias.length === 0) {

        productoCategoria.innerHTML =
            '<option value="">Primero registre una categoría</option>';
    }
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

    productoProveedor.disabled =
        proveedores.length === 0;

    if (proveedores.length === 0) {

        productoProveedor.innerHTML =
            '<option value="">Primero registre un proveedor</option>';
    }
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

    if (nombre.length > 120) {

        mensajeProducto.textContent =
            "El nombre no puede superar 120 caracteres.";

        return false;
    }

    const precioNumero = Number(precio);
    const stockNumero = Number(stock);

    if (
        !Number.isFinite(precioNumero) ||
        precioNumero <= 0 ||
        precioNumero > 999999999.99
    ) {

        mensajeProducto.textContent =
            "Ingrese un precio válido mayor que 0.";

        return false;
    }

    if (
        !Number.isFinite(stockNumero) ||
        stockNumero < 0 ||
        stockNumero > 10000000
    ) {

        mensajeProducto.textContent =
            "Ingrese un stock válido entre 0 y 10 000 000.";

        return false;
    }

    if (!Number.isInteger(stockNumero)) {

        mensajeProducto.textContent =
            "El stock debe ser un número entero.";

        return false;
    }

    if (!obtenerCategoria(categoriaId)) {

        mensajeProducto.textContent =
            "La categoría seleccionada ya no existe. Seleccione otra categoría.";

        return false;
    }

    if (!obtenerProveedor(proveedorId)) {

        mensajeProducto.textContent =
            "El proveedor seleccionado ya no existe. Seleccione otro proveedor.";

        return false;
    }

    return true;
}


function productoDuplicado(
    productos,
    idActual,
    nombre,
    categoriaId,
    proveedorId
) {

    const nombreNormalizado =
        normalizarTextoComparacion(nombre);

    return productos.some(
        function(producto) {

            if (
                String(producto.id) ===
                String(idActual)
            ) {

                return false;
            }

            return (
                normalizarTextoComparacion(
                    producto.nombre
                ) === nombreNormalizado &&
                String(producto.categoriaId) ===
                    String(categoriaId) &&
                String(producto.proveedorId) ===
                    String(proveedorId)
            );
        }
    );
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

        if (
            productoDuplicado(
                productos,
                id,
                nombre,
                categoriaId,
                proveedorId
            )
        ) {

            mensajeProducto.textContent =
                "Ya existe un producto con el mismo nombre, categoría y proveedor.";

            if (window.Swal) {

                Swal.fire({
                    title: "Producto duplicado",
                    text: mensajeProducto.textContent,
                    icon: "warning",
                    confirmButtonText: "Entendido"
                });
            }

            return;
        }

        // Registrar
        if (id === "") {

            const nuevoProducto = {

                id: generarIdSeguro(),
                nombre: nombre,
                categoriaId: categoriaId,
                precio: Number(precio),
                stock: Number(stock),
                proveedorId: proveedorId
            };

            productos.push(
                nuevoProducto
            );

            if (!guardarProductos(productos)) {
                return;
            }

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

                if (!guardarProductos(
                    productos
                )) {
                    return;
                }

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

            if (!guardarProductos(
                productos
            )) {
                return;
            }

            if (
                String(productoId.value) ===
                String(id)
            ) {
                limpiarFormularioProducto();
            }
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
        leerPreferenciaSegura(
            "modo_oscuro",
            "false"
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

        guardarPreferenciaSegura(
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
