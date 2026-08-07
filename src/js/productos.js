// ======================================================
// ADMINISTRACIÓN DE PRODUCTOS
// Todos los productos se guardan en LocalStorage.
// Clave utilizada: "productos"
// ======================================================

const CLAVE_PRODUCTOS = "productos";
const CLAVE_PROVEEDORES = "proveedores";

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
// Cargar proveedores en el select
// ------------------------------------------------------
function cargarProveedoresEnSelect(proveedorSeleccionado = "") {

    const proveedores = obtenerProveedores();

    productoProveedor.innerHTML =
        '<option value="">Seleccione un proveedor</option>';

    proveedores.forEach(function(proveedor) {

        const opcion = document.createElement("option");

        opcion.value = proveedor.id;
        opcion.textContent = proveedor.nombre + " - " + proveedor.empresa;

        if (String(proveedor.id) === String(proveedorSeleccionado)) {

            opcion.selected = true;

        }

        productoProveedor.appendChild(opcion);

    });
}


// ------------------------------------------------------
// Obtener nombre del proveedor usando su ID
// ------------------------------------------------------
function obtenerNombreProveedor(idProveedor) {

    const proveedores = obtenerProveedores();

    const proveedorEncontrado = proveedores.find(function(proveedor) {

        return String(proveedor.id) === String(idProveedor);

    });

    if (proveedorEncontrado) {

        return proveedorEncontrado.nombre;

    }

    return "Proveedor no disponible";
}


// ------------------------------------------------------
// Crear botón de acción
// ------------------------------------------------------
function crearBoton(texto, clase, idProducto, accion) {

    const boton = document.createElement("button");

    boton.type = "button";
    boton.textContent = texto;
    boton.className = clase;

    boton.addEventListener("click", function() {

        accion(idProducto);

    });

    return boton;
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
        celda.textContent = "No hay productos registrados.";
        celda.style.textAlign = "center";

        fila.appendChild(celda);
        tablaProductosBody.appendChild(fila);

        return;
    }

    productos.forEach(function(producto) {

        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.textContent = producto.id;

        const celdaNombre = document.createElement("td");
        celdaNombre.textContent = producto.nombre;

        const celdaCategoria = document.createElement("td");
        celdaCategoria.textContent = producto.categoria;

        const celdaPrecio = document.createElement("td");
        celdaPrecio.textContent = "₡" + Number(producto.precio).toLocaleString("es-CR");

        const celdaStock = document.createElement("td");
        celdaStock.textContent = producto.stock;

        const celdaProveedor = document.createElement("td");
        celdaProveedor.textContent =
            obtenerNombreProveedor(producto.proveedorId);

        const celdaAcciones = document.createElement("td");

        const botonEditar = crearBoton(
            "Editar",
            "btn-editar",
            producto.id,
            editarProducto
        );

        const botonEliminar = crearBoton(
            "Eliminar",
            "btn-eliminar",
            producto.id,
            eliminarProducto
        );

        celdaAcciones.appendChild(botonEditar);
        celdaAcciones.appendChild(botonEliminar);

        fila.appendChild(celdaId);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaCategoria);
        fila.appendChild(celdaPrecio);
        fila.appendChild(celdaStock);
        fila.appendChild(celdaProveedor);
        fila.appendChild(celdaAcciones);

        tablaProductosBody.appendChild(fila);

    });
}


// ------------------------------------------------------
// Validar datos
// ------------------------------------------------------
function validarProducto(nombre, categoria, precio, stock, proveedorId) {

    mensajeProducto.textContent = "";

    if (
        nombre === "" ||
        categoria === "" ||
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
formProducto.addEventListener("submit", function(event) {

    event.preventDefault();

    const id = productoId.value;

    const nombre = productoNombre.value.trim();
    const categoria = productoCategoria.value.trim();
    const precio = productoPrecio.value;
    const stock = productoStock.value;
    const proveedorId = productoProveedor.value;

    if (!validarProducto(
        nombre,
        categoria,
        precio,
        stock,
        proveedorId
    )) {

        return;
    }

    let productos = obtenerProductos();

    // --------------------------------------------------
    // REGISTRAR NUEVO PRODUCTO
    // --------------------------------------------------
    if (id === "") {

        const nuevoProducto = {

            id: Date.now().toString(),
            nombre: nombre,
            categoria: categoria,
            precio: Number(precio),
            stock: Number(stock),
            proveedorId: proveedorId

        };

        productos.push(nuevoProducto);

        guardarProductos(productos);

        limpiarFormularioProducto();
        mostrarProductos();

        return;
    }

    // --------------------------------------------------
    // EDITAR PRODUCTO
    // SweetAlert pregunta antes de guardar los cambios
    // --------------------------------------------------
    Swal.fire({

        title: "¿Desea guardar los cambios?",

        icon: "question",

        showDenyButton: true,

        showCancelButton: true,

        confirmButtonText: "Guardar",

        denyButtonText: "No guardar",

        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            productos = productos.map(function(producto) {

                if (String(producto.id) === String(id)) {

                    return {

                        id: producto.id,
                        nombre: nombre,
                        categoria: categoria,
                        precio: Number(precio),
                        stock: Number(stock),
                        proveedorId: proveedorId

                    };

                }

                return producto;

            });

            // Actualizar LocalStorage solo si confirma
            guardarProductos(productos);

            limpiarFormularioProducto();
            mostrarProductos();

            Swal.fire(
                "¡Guardado!",
                "Los cambios del producto se guardaron correctamente.",
                "success"
            );

        } else if (result.isDenied) {

            Swal.fire(
                "Cambios no guardados",
                "Los cambios del producto no se guardaron.",
                "info"
            );

        }

        // Si presiona Cancelar, no se guarda nada
        // y el formulario permanece en modo edición.
    });

});


// ------------------------------------------------------
// Cargar producto en el formulario para editar
// ------------------------------------------------------
function editarProducto(id) {

    const productos = obtenerProductos();

    const productoEncontrado = productos.find(function(producto) {

        return String(producto.id) === String(id);

    });

    if (!productoEncontrado) {

        return;
    }

    productoId.value = productoEncontrado.id;
    productoNombre.value = productoEncontrado.nombre;
    productoCategoria.value = productoEncontrado.categoria;
    productoPrecio.value = productoEncontrado.precio;
    productoStock.value = productoEncontrado.stock;

    cargarProveedoresEnSelect(
        productoEncontrado.proveedorId
    );

    btnGuardarProducto.textContent =
        "Actualizar Producto";

    btnCancelarProducto.style.display =
        "inline-block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ------------------------------------------------------
// Eliminar producto con SweetAlert2
// ------------------------------------------------------
function eliminarProducto(id) {

    Swal.fire({

        title: "¿Está seguro?",

        text: "¡No podrá revertir esta acción!",

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#3085d6",

        cancelButtonColor: "#d33",

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            let productos = obtenerProductos();

            productos = productos.filter(function(producto) {

                return String(producto.id) !== String(id);

            });

            // Actualizar LocalStorage inmediatamente
            guardarProductos(productos);

            limpiarFormularioProducto();
            mostrarProductos();

            Swal.fire({

                title: "¡Eliminado!",

                text: "El producto ha sido eliminado.",

                icon: "success"

            });

        }

    });
}


// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioProducto() {

    formProducto.reset();

    productoId.value = "";

    btnGuardarProducto.textContent =
        "Guardar Producto";

    btnCancelarProducto.style.display =
        "none";

    mensajeProducto.textContent = "";

    cargarProveedoresEnSelect();
}


// ------------------------------------------------------
// Cancelar edición
// ------------------------------------------------------
btnCancelarProducto.addEventListener("click", function() {

    limpiarFormularioProducto();

});


// ------------------------------------------------------
// Buscar productos en tiempo real
// ------------------------------------------------------
buscadorProducto.addEventListener("input", function(event) {

    const texto = event.target.value
        .toLowerCase()
        .trim();

    const productos = obtenerProductos();

    const productosFiltrados =
        productos.filter(function(producto) {

            const nombreProveedor =
                obtenerNombreProveedor(producto.proveedorId)
                    .toLowerCase();

            return (
                producto.nombre.toLowerCase().includes(texto) ||
                producto.categoria.toLowerCase().includes(texto) ||
                nombreProveedor.includes(texto)
            );

        });

    mostrarProductos(productosFiltrados);
});


// ------------------------------------------------------
// Modo oscuro
// Usa la misma clave del módulo de Clientes
// ------------------------------------------------------
const btnModoOscuro =
    document.getElementById("btn-modo-oscuro");

if (localStorage.getItem("modo_oscuro") === "true") {

    document.body.classList.add("dark-mode");

    btnModoOscuro.textContent =
        "☀️ Modo Claro";
}

btnModoOscuro.addEventListener("click", function() {

    document.body.classList.toggle("dark-mode");

    const esOscuro =
        document.body.classList.contains("dark-mode");

    btnModoOscuro.textContent =
        esOscuro
            ? "☀️ Modo Claro"
            : "🌙 Modo Oscuro";

    localStorage.setItem(
        "modo_oscuro",
        esOscuro
    );
});


// ------------------------------------------------------
// Cargar datos al iniciar
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {

    cargarProveedoresEnSelect();
    mostrarProductos();

});
