// ======================================================
// MÓDULO DE PEDIDOS
// LocalStorage: "pedidos"
// ======================================================

const CLAVE_PEDIDOS = "pedidos";
const CLAVE_USUARIO_PEDIDOS = "usuario";
const CLAVE_CLIENTES_PEDIDOS = "clientes_sistema";
const CLAVE_PRODUCTOS_PEDIDOS = "productos";
const CLAVE_PROVEEDORES_PEDIDOS = "proveedores";
const ESTADOS_PEDIDO = ["pendiente", "en_proceso", "entregado"];

const formPedido = document.getElementById("form-pedido");
const pedidoId = document.getElementById("pedido-id");
const pedidoCliente = document.getElementById("pedido-cliente");
const pedidoProducto = document.getElementById("pedido-producto");
const pedidoCantidad = document.getElementById("pedido-cantidad");
const btnAgregarProductoPedido = document.getElementById("btn-agregar-producto-pedido");
const btnGuardarPedido = document.getElementById("btn-guardar-pedido");
const btnCancelarPedido = document.getElementById("btn-cancelar-pedido");
const tablaItemsPedidoBody = document.getElementById("tabla-items-pedido-body");
const tablaPedidosBody = document.getElementById("tabla-pedidos-body");
const buscadorPedido = document.getElementById("buscador-pedido");
const mensajePedido = document.getElementById("mensaje-pedido");
const mensajeDisponibilidad = document.getElementById("mensaje-disponibilidad-pedido");
const contadorLineasPedido = document.getElementById("contador-lineas-pedido");
const pedidoCantidadArticulos = document.getElementById("pedido-cantidad-articulos");
const pedidoSubtotal = document.getElementById("pedido-subtotal");
const pedidoTotal = document.getElementById("pedido-total");
const resumenTotalPedidos = document.getElementById("resumen-total-pedidos");
const resumenPedidosPendientes = document.getElementById("resumen-pedidos-pendientes");
const resumenPedidosProceso = document.getElementById("resumen-pedidos-proceso");
const resumenPedidosEntregados = document.getElementById("resumen-pedidos-entregados");

let itemsPedidoActual = [];
let chartPedidosEstado = null;
let chartPedidosClientes = null;

// ------------------------------------------------------
// LocalStorage
// ------------------------------------------------------
function leerListaPedidos(clave) {
    try {
        const contenido = localStorage.getItem(clave);
        if (!contenido) return [];
        const lista = JSON.parse(contenido);
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        console.error("No se pudo leer " + clave + ":", error);
        return [];
    }
}

function guardarListaPedidos(clave, lista) {
    try {
        localStorage.setItem(clave, JSON.stringify(lista));
        return true;
    } catch (error) {
        console.error("No se pudo guardar " + clave + ":", error);
        alertaPedido({
            title: "No se pudieron guardar los datos",
            text: "LocalStorage no está disponible o no tiene espacio suficiente.",
            icon: "error"
        });
        return false;
    }
}

function obtenerPedidos() {
    return leerListaPedidos(CLAVE_PEDIDOS).map(function(pedido) {
        const items = Array.isArray(pedido.items)
            ? pedido.items.map(function(item) {
                const cantidadOriginal = Number(item.cantidad);
                const precioOriginal = Number(item.precioUnitario);
                const cantidad = Number.isInteger(cantidadOriginal) && cantidadOriginal > 0
                    ? cantidadOriginal
                    : 1;
                const precioUnitario = Number.isFinite(precioOriginal) && precioOriginal >= 0
                    ? precioOriginal
                    : 0;
                return {
                    ...item,
                    cantidad,
                    precioUnitario,
                    subtotal: cantidad * precioUnitario
                };
            })
            : [];

        const cantidadArticulos = items.reduce((total, item) => total + item.cantidad, 0);
        const subtotal = items.reduce((total, item) => total + item.subtotal, 0);

        return {
            ...pedido,
            items,
            cantidadArticulos,
            subtotal,
            total: subtotal,
            estado: ESTADOS_PEDIDO.includes(pedido.estado)
                ? pedido.estado
                : "pendiente"
        };
    });
}
function obtenerClientesPedido() { return leerListaPedidos(CLAVE_CLIENTES_PEDIDOS); }
function obtenerProductosPedido() { return leerListaPedidos(CLAVE_PRODUCTOS_PEDIDOS); }
function obtenerProveedoresPedido() { return leerListaPedidos(CLAVE_PROVEEDORES_PEDIDOS); }

// ------------------------------------------------------
// Utilidades
// ------------------------------------------------------
function generarIdPedido() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function monedaCRC(valor) {
    const numero = Number(valor);
    return "₡" + (Number.isFinite(numero) ? numero : 0).toLocaleString(
        "es-CR",
        { maximumFractionDigits: 2 }
    );
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";
    return new Intl.DateTimeFormat(
        "es-CR",
        { dateStyle: "medium", timeStyle: "short" }
    ).format(fecha);
}

function etiquetaEstado(estado) {
    return {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        entregado: "Entregado"
    }[estado] || "Pendiente";
}

function idPedidoCorto(id) {
    return "PED-" + String(id || "").replace(/-/g, "").slice(0, 8).toUpperCase();
}

function alertaPedido(configuracion) {
    if (window.Swal) return Swal.fire(configuracion);
    if (configuracion && configuracion.text) alert(configuracion.text);
    return Promise.resolve({ isConfirmed: true });
}

function toastPedido(mensaje, icono = "success") {
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

function encontrarCliente(id) {
    return obtenerClientesPedido().find(cliente => String(cliente.id) === String(id));
}

function encontrarProducto(id) {
    return obtenerProductosPedido().find(producto => String(producto.id) === String(id));
}

function encontrarProveedor(id) {
    return obtenerProveedoresPedido().find(proveedor => String(proveedor.id) === String(id));
}

// ------------------------------------------------------
// Control de stock
// ------------------------------------------------------
function obtenerPedidoEnEdicion() {
    if (!pedidoId.value) return null;

    return obtenerPedidos().find(
        pedido => String(pedido.id) === String(pedidoId.value)
    ) || null;
}

function cantidadOriginalProductoEnPedido(productoId) {
    const pedido = obtenerPedidoEnEdicion();

    if (!pedido || !Array.isArray(pedido.items)) {
        return 0;
    }

    const item = pedido.items.find(
        itemPedido => String(itemPedido.productoId) === String(productoId)
    );

    return item ? Number(item.cantidad || 0) : 0;
}

function stockActualProducto(producto) {
    const stock = Number(producto && producto.stock);

    return Number.isFinite(stock) && stock >= 0
        ? Math.floor(stock)
        : 0;
}

function stockMaximoParaPedido(productoId) {
    const producto = encontrarProducto(productoId);

    if (!producto) {
        return cantidadOriginalProductoEnPedido(productoId);
    }

    return (
        stockActualProducto(producto) +
        cantidadOriginalProductoEnPedido(productoId)
    );
}

function validarStockDeItems() {
    for (const item of itemsPedidoActual) {
        const cantidad = Number(item.cantidad);
        const producto = encontrarProducto(item.productoId);
        const cantidadOriginal =
            cantidadOriginalProductoEnPedido(item.productoId);

        if (!producto) {
            if (cantidad !== cantidadOriginal) {
                return (
                    "El producto \"" +
                    item.productoNombre +
                    "\" ya no existe en el catálogo y no se puede modificar su cantidad."
                );
            }

            continue;
        }

        const maximo =
            stockMaximoParaPedido(item.productoId);

        if (cantidad > maximo) {
            return (
                "Stock insuficiente para \"" +
                item.productoNombre +
                "\". Máximo disponible para este pedido: " +
                maximo +
                "."
            );
        }
    }

    return "";
}

function mapaCantidades(items) {
    const mapa = new Map();

    (Array.isArray(items) ? items : []).forEach(item => {
        const id = String(item.productoId || "");
        const cantidad = Number(item.cantidad || 0);

        if (!id) return;

        mapa.set(
            id,
            (mapa.get(id) || 0) + cantidad
        );
    });

    return mapa;
}

function prepararProductosConStockActualizado(pedidoExistente, nuevosItems) {
    const productos = obtenerProductosPedido();
    const cantidadesAnteriores = mapaCantidades(
        pedidoExistente && Array.isArray(pedidoExistente.items)
            ? pedidoExistente.items
            : []
    );
    const cantidadesNuevas = mapaCantidades(nuevosItems);

    let error = "";

    const actualizados = productos.map(producto => {
        const id = String(producto.id);
        const anterior = Number(cantidadesAnteriores.get(id) || 0);
        const nueva = Number(cantidadesNuevas.get(id) || 0);
        const stockActual = stockActualProducto(producto);

        // El stock actual ya tiene descontada la cantidad anterior.
        // Por eso primero se devuelve la cantidad anterior del pedido
        // y luego se descuenta la nueva cantidad.
        const stockNuevo =
            stockActual + anterior - nueva;

        if (stockNuevo < 0 && !error) {
            error =
                "Stock insuficiente para \"" +
                String(producto.nombre || "Producto") +
                "\". Disponibles actualmente: " +
                stockActual +
                ".";
        }

        return {
            ...producto,
            stock: Math.max(0, stockNuevo)
        };
    });

    // Si un producto histórico ya fue eliminado del catálogo,
    // no permitimos aumentar/modificar su cantidad.
    for (const [productoId, nuevaCantidad] of cantidadesNuevas.entries()) {
        const existeProducto = productos.some(
            producto => String(producto.id) === String(productoId)
        );

        if (!existeProducto) {
            const anterior =
                Number(cantidadesAnteriores.get(productoId) || 0);

            if (nuevaCantidad !== anterior && !error) {
                error =
                    "Uno de los productos históricos ya no existe en el catálogo. " +
                    "Su cantidad no puede modificarse.";
            }
        }
    }

    return {
        productos: actualizados,
        error
    };
}

function restaurarStockDePedido(pedido) {
    const productos = obtenerProductosPedido();
    const cantidades = mapaCantidades(
        pedido && Array.isArray(pedido.items)
            ? pedido.items
            : []
    );

    return productos.map(producto => {
        const cantidad =
            Number(cantidades.get(String(producto.id)) || 0);

        return {
            ...producto,
            stock:
                stockActualProducto(producto) +
                cantidad
        };
    });
}

function crearCelda(texto) {
    const td = document.createElement("td");
    td.textContent = String(texto ?? "");
    return td;
}

// ------------------------------------------------------
// Selects
// ------------------------------------------------------
function cargarClientesPedido(clienteSeleccionado = "", clienteHistorico = "") {
    const clientes = obtenerClientesPedido();
    pedidoCliente.textContent = "";

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = clientes.length ? "Seleccione un cliente" : "Primero registre un cliente";
    pedidoCliente.appendChild(inicial);

    let existeSeleccionado = false;

    clientes.forEach(cliente => {
        const opcion = document.createElement("option");
        opcion.value = cliente.id;
        opcion.textContent = cliente.nombre + " - " + cliente.correo;

        if (String(cliente.id) === String(clienteSeleccionado)) {
            opcion.selected = true;
            existeSeleccionado = true;
        }

        pedidoCliente.appendChild(opcion);
    });

    if (clienteSeleccionado && !existeSeleccionado && clienteHistorico) {
        const historico = document.createElement("option");
        historico.value = clienteSeleccionado;
        historico.textContent = clienteHistorico + " (cliente eliminado)";
        historico.selected = true;
        pedidoCliente.appendChild(historico);
    }

    pedidoCliente.disabled = clientes.length === 0 && !clienteSeleccionado;
}

function cargarProductosPedido() {
    const productos = obtenerProductosPedido();
    pedidoProducto.textContent = "";

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = productos.length ? "Seleccione un producto" : "Primero registre un producto";
    pedidoProducto.appendChild(inicial);

    productos.forEach(producto => {
        const opcion = document.createElement("option");
        const stock = stockActualProducto(producto);

        opcion.value = producto.id;
        opcion.textContent =
            producto.nombre +
            " · " +
            monedaCRC(producto.precio) +
            " · Stock: " +
            stock;

        if (stock <= 0) {
            opcion.disabled = true;
        }

        pedidoProducto.appendChild(opcion);
    });

    pedidoProducto.disabled = productos.length === 0;
    btnAgregarProductoPedido.disabled = productos.length === 0;
    actualizarMensajeProductoSeleccionado();
}

function actualizarMensajeProductoSeleccionado() {
    const producto = encontrarProducto(pedidoProducto.value);

    if (!producto) {
        mensajeDisponibilidad.textContent =
            "Selecciona un producto para ver su precio, stock y proveedor.";
        return;
    }

    const proveedor = encontrarProveedor(producto.proveedorId);
    const stockActual = stockActualProducto(producto);
    const cantidadOriginal =
        cantidadOriginalProductoEnPedido(producto.id);

    let detalleStock =
        " · Stock disponible: " +
        stockActual;

    if (cantidadOriginal > 0) {
        detalleStock +=
            " · Este pedido ya tiene: " +
            cantidadOriginal +
            " · Máximo total editable: " +
            (stockActual + cantidadOriginal);
    }

    mensajeDisponibilidad.textContent =
        "Precio: " + monedaCRC(producto.precio) +
        detalleStock +
        " · Proveedor: " +
        (proveedor ? proveedor.nombre + " - " + proveedor.empresa : "No disponible");
}

// ------------------------------------------------------
// Carrito
// ------------------------------------------------------
function agregarProductoAlPedido() {
    mensajePedido.textContent = "";

    const producto = encontrarProducto(pedidoProducto.value);
    const cantidad = Number(pedidoCantidad.value);

    if (!producto) {
        mensajePedido.textContent = "Seleccione un producto válido.";
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        mensajePedido.textContent = "La cantidad debe ser un número entero mayor que cero.";
        return;
    }

    const precio = Number(producto.precio);
    if (!Number.isFinite(precio) || precio <= 0) {
        mensajePedido.textContent = "El producto seleccionado no tiene un precio válido.";
        return;
    }

    const proveedor = encontrarProveedor(producto.proveedorId);
    const existente = itemsPedidoActual.find(
        item => String(item.productoId) === String(producto.id)
    );

    const cantidadActual =
        existente
            ? Number(existente.cantidad)
            : 0;

    const cantidadNueva =
        cantidadActual + cantidad;

    const maximoDisponible =
        stockMaximoParaPedido(producto.id);

    if (cantidadNueva > maximoDisponible) {
        mensajePedido.textContent =
            "Stock insuficiente para " +
            producto.nombre +
            ". Máximo disponible para este pedido: " +
            maximoDisponible +
            ".";
        return;
    }

    if (existente) {
        existente.cantidad = cantidadNueva;
    } else {
        itemsPedidoActual.push({
            productoId: String(producto.id),
            productoNombre: String(producto.nombre || "Producto"),
            proveedorId: producto.proveedorId ? String(producto.proveedorId) : "",
            proveedorNombre: proveedor
                ? proveedor.nombre + " - " + proveedor.empresa
                : "Proveedor no disponible",
            precioUnitario: precio,
            cantidad: cantidad
        });
    }

    pedidoProducto.value = "";
    pedidoCantidad.value = "1";
    actualizarMensajeProductoSeleccionado();
    renderizarItemsPedido();
}

function calcularResumenItems() {
    let cantidadArticulos = 0;
    let subtotal = 0;

    itemsPedidoActual.forEach(item => {
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precioUnitario);
        item.subtotal = cantidad * precio;
        cantidadArticulos += cantidad;
        subtotal += item.subtotal;
    });

    return {
        cantidadArticulos,
        subtotal,
        total: subtotal
    };
}

function renderizarItemsPedido() {
    tablaItemsPedidoBody.textContent = "";

    if (itemsPedidoActual.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.className = "empty-order-row";
        celda.textContent = "Aún no has agregado productos al pedido.";
        fila.appendChild(celda);
        tablaItemsPedidoBody.appendChild(fila);
    } else {
        itemsPedidoActual.forEach((item, indice) => {
            const fila = document.createElement("tr");

            const celdaProducto = document.createElement("td");
            const nombre = document.createElement("strong");
            nombre.textContent = item.productoNombre;
            celdaProducto.appendChild(nombre);

            if (!encontrarProducto(item.productoId)) {
                const br = document.createElement("br");
                const historico = document.createElement("span");
                historico.className = "historical-badge";
                historico.textContent = "Dato histórico";
                celdaProducto.appendChild(br);
                celdaProducto.appendChild(historico);
            }

            const celdaProveedor = crearCelda(item.proveedorNombre);
            const celdaPrecio = crearCelda(monedaCRC(item.precioUnitario));

            const celdaCantidad = document.createElement("td");
            const control = document.createElement("div");
            control.className = "quantity-control";

            const input = document.createElement("input");
            const productoActual =
                encontrarProducto(item.productoId);

            input.type = "number";
            input.min = "1";
            input.step = "1";
            input.value = item.cantidad;
            input.setAttribute("aria-label", "Cantidad de " + item.productoNombre);

            if (productoActual) {
                input.max =
                    String(
                        stockMaximoParaPedido(
                            item.productoId
                        )
                    );
            } else {
                input.disabled = true;
                input.title =
                    "Este producto ya no existe en el catálogo. Se conserva como dato histórico.";
            }

            input.addEventListener("change", function () {
                const nueva = Number(input.value);

                if (!Number.isInteger(nueva) || nueva <= 0) {
                    input.value = item.cantidad;
                    toastPedido("La cantidad debe ser un entero mayor que cero.", "warning");
                    return;
                }

                const maximo =
                    stockMaximoParaPedido(
                        item.productoId
                    );

                if (productoActual && nueva > maximo) {
                    input.value = item.cantidad;
                    toastPedido(
                        "Stock insuficiente. Máximo disponible para este pedido: " +
                        maximo +
                        ".",
                        "warning"
                    );
                    return;
                }

                item.cantidad = nueva;
                renderizarItemsPedido();
            });

            control.appendChild(input);
            celdaCantidad.appendChild(control);

            const celdaSubtotal = crearCelda(
                monedaCRC(Number(item.cantidad) * Number(item.precioUnitario))
            );

            const celdaAccion = document.createElement("td");
            celdaAccion.className = "text-end";

            const quitar = document.createElement("button");
            quitar.type = "button";
            quitar.className = "order-action-button delete";
            quitar.title = "Quitar producto";
            const icono = document.createElement("i");
            icono.className = "bi bi-trash";
            quitar.appendChild(icono);

            const productoDisponible =
                encontrarProducto(item.productoId);

            if (!productoDisponible) {
                quitar.disabled = true;
                quitar.title =
                    "No se puede quitar un producto histórico que ya no existe en el catálogo.";
            }

            quitar.addEventListener("click", function () {
                if (!productoDisponible) {
                    toastPedido(
                        "Este producto es histórico y ya no existe en el catálogo.",
                        "warning"
                    );
                    return;
                }

                itemsPedidoActual.splice(indice, 1);
                renderizarItemsPedido();
            });

            celdaAccion.appendChild(quitar);

            [
                celdaProducto,
                celdaProveedor,
                celdaPrecio,
                celdaCantidad,
                celdaSubtotal,
                celdaAccion
            ].forEach(celda => fila.appendChild(celda));

            tablaItemsPedidoBody.appendChild(fila);
        });
    }

    const resumen = calcularResumenItems();
    pedidoCantidadArticulos.textContent = resumen.cantidadArticulos;
    pedidoSubtotal.textContent = monedaCRC(resumen.subtotal);
    pedidoTotal.textContent = monedaCRC(resumen.total);
    contadorLineasPedido.textContent =
        itemsPedidoActual.length +
        (itemsPedidoActual.length === 1 ? " producto diferente" : " productos diferentes");
}

// ------------------------------------------------------
// Guardar / editar
// ------------------------------------------------------
function validarPedido() {
    if (!pedidoCliente.value) return "Seleccione un cliente.";
    if (itemsPedidoActual.length === 0) return "Agregue al menos un producto al pedido.";

    const invalido = itemsPedidoActual.some(item =>
        !Number.isFinite(Number(item.precioUnitario)) ||
        Number(item.precioUnitario) <= 0 ||
        !Number.isInteger(Number(item.cantidad)) ||
        Number(item.cantidad) <= 0
    );

    if (invalido) {
        return "Uno o más productos tienen cantidades o precios inválidos.";
    }

    return validarStockDeItems();
}

function itemsParaGuardar() {
    return itemsPedidoActual.map(item => ({
        productoId: String(item.productoId),
        productoNombre: String(item.productoNombre),
        proveedorId: String(item.proveedorId || ""),
        proveedorNombre: String(item.proveedorNombre || "Proveedor no disponible"),
        precioUnitario: Number(item.precioUnitario),
        cantidad: Number(item.cantidad),
        subtotal: Number(item.precioUnitario) * Number(item.cantidad)
    }));
}

formPedido.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mensajePedido.textContent = "";


    if (
        !pedidoId.value &&
        window.Permisos &&
        !Permisos.exigir(
            "crear"
        )
    ) {

        return;
    }


    if (
        pedidoId.value &&
        window.Permisos &&
        !Permisos.exigir(
            "editar"
        )
    ) {

        return;
    }

    const error = validarPedido();
    if (error) {
        mensajePedido.textContent = error;
        return;
    }

    const pedidos = obtenerPedidos();
    const idActual = pedidoId.value;
    const existente = pedidos.find(p => String(p.id) === String(idActual));
    const cliente = encontrarCliente(pedidoCliente.value);
    const clienteNombre = cliente
        ? cliente.nombre
        : (existente ? existente.clienteNombre : "Cliente no disponible");

    const resumen = calcularResumenItems();
    const datos = {
        clienteId: String(pedidoCliente.value),
        clienteNombre: String(clienteNombre),
        items: itemsParaGuardar(),
        cantidadArticulos: resumen.cantidadArticulos,
        subtotal: resumen.subtotal,
        total: resumen.total,
        actualizadoEn: new Date().toISOString()
    };

    let resultado;

    if (!idActual) {
        resultado = pedidos.concat({
            id: generarIdPedido(),
            ...datos,
            estado: "pendiente",
            creadoEn: new Date().toISOString()
        });
    } else {
        resultado = pedidos.map(pedido =>
            String(pedido.id) === String(idActual)
                ? {
                    ...pedido,
                    ...datos,
                    estado: ESTADOS_PEDIDO.includes(pedido.estado)
                        ? pedido.estado
                        : "pendiente"
                }
                : pedido
        );
    }

    const productosAntes =
        obtenerProductosPedido();

    const ajusteStock =
        prepararProductosConStockActualizado(
            existente,
            datos.items
        );

    if (ajusteStock.error) {
        mensajePedido.textContent =
            ajusteStock.error;
        return;
    }

    // Primero se actualiza el inventario.
    if (
        !guardarListaPedidos(
            CLAVE_PRODUCTOS_PEDIDOS,
            ajusteStock.productos
        )
    ) {
        return;
    }

    // Después se guarda el pedido. Si falla, se restaura el stock.
    if (
        !guardarListaPedidos(
            CLAVE_PEDIDOS,
            resultado
        )
    ) {
        guardarListaPedidos(
            CLAVE_PRODUCTOS_PEDIDOS,
            productosAntes
        );

        return;
    }

    toastPedido(
        idActual
            ? "Pedido actualizado y stock ajustado correctamente."
            : "Pedido registrado y stock descontado correctamente."
    );

    limpiarFormularioPedido();
    mostrarPedidos();
});

function editarPedido(id) {

    if (
        window.Permisos &&
        !Permisos.exigir(
            "editar"
        )
    ) {

        return;
    }

    const pedido = obtenerPedidos().find(item => String(item.id) === String(id));

    if (!pedido) {
        toastPedido("El pedido ya no existe.", "warning");
        mostrarPedidos();
        return;
    }

    pedidoId.value = pedido.id;
    cargarClientesPedido(pedido.clienteId, pedido.clienteNombre);

    itemsPedidoActual = Array.isArray(pedido.items)
        ? pedido.items.map(item => ({
            productoId: String(item.productoId || ""),
            productoNombre: String(item.productoNombre || "Producto histórico"),
            proveedorId: String(item.proveedorId || ""),
            proveedorNombre: String(item.proveedorNombre || "Proveedor histórico"),
            precioUnitario: Number(item.precioUnitario) || 0,
            cantidad: Number(item.cantidad) || 1
        }))
        : [];

    btnGuardarPedido.innerHTML = '<i class="bi bi-check2-circle"></i> Actualizar pedido';
    btnCancelarPedido.style.display = "inline-flex";
    document.getElementById("titulo-formulario-pedido").textContent =
        "Editar " + idPedidoCorto(pedido.id);

    renderizarItemsPedido();
    document.getElementById("formulario-pedidos").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function eliminarPedido(id) {

    if (
        window.Permisos &&
        !Permisos.exigir(
            "eliminar"
        )
    ) {

        return;
    }

    const pedidoAEliminar =
        obtenerPedidos().find(
            pedido => String(pedido.id) === String(id)
        );

    if (!pedidoAEliminar) {
        toastPedido(
            "El pedido ya no existe.",
            "warning"
        );
        mostrarPedidos();
        return;
    }

    alertaPedido({
        title: "¿Eliminar pedido?",
        text:
            "El pedido se eliminará y las unidades de los productos que todavía existan " +
            "en el catálogo volverán automáticamente al stock.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d93737",
        cancelButtonColor: "#6b7785",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(resultado => {
        if (!resultado.isConfirmed) return;

        const productosAntes =
            obtenerProductosPedido();

        const productosRestaurados =
            restaurarStockDePedido(
                pedidoAEliminar
            );

        const pedidos =
            obtenerPedidos().filter(
                pedido => String(pedido.id) !== String(id)
            );

        if (
            !guardarListaPedidos(
                CLAVE_PRODUCTOS_PEDIDOS,
                productosRestaurados
            )
        ) {
            return;
        }

        if (
            !guardarListaPedidos(
                CLAVE_PEDIDOS,
                pedidos
            )
        ) {
            guardarListaPedidos(
                CLAVE_PRODUCTOS_PEDIDOS,
                productosAntes
            );

            return;
        }

        if (String(pedidoId.value) === String(id)) {
            limpiarFormularioPedido();
        }

        mostrarPedidos();
        toastPedido(
            "Pedido eliminado y stock restaurado."
        );
    });
}

// ------------------------------------------------------
// Detalle y tabla
// ------------------------------------------------------
function verDetallePedido(id) {
    const pedido = obtenerPedidos().find(item => String(item.id) === String(id));
    if (!pedido) return;

    const lineas = (pedido.items || []).map(item =>
        "• " + item.productoNombre +
        " × " + item.cantidad +
        " = " + monedaCRC(item.subtotal) +
        "\n  Proveedor: " + item.proveedorNombre
    );

    alertaPedido({
        title: "Detalle del pedido",
        text:
            idPedidoCorto(pedido.id) +
            "\n\nCliente: " + pedido.clienteNombre +
            "\nEstado: " + etiquetaEstado(pedido.estado) +
            "\nArtículos: " + pedido.cantidadArticulos +
            "\nTotal: " + monedaCRC(pedido.total) +
            "\n\nPRODUCTOS\n" + lineas.join("\n\n"),
        icon: "info",
        confirmButtonText: "Cerrar"
    });
}

function crearBadgeEstado(estado) {
    const span = document.createElement("span");
    span.className = "order-status-badge " +
        (estado === "en_proceso" ? "en-proceso" : estado);

    const punto = document.createElement("span");
    punto.className = "status-dot " +
        (estado === "en_proceso"
            ? "status-proceso"
            : (estado === "entregado" ? "status-entregado" : "status-pendiente"));

    span.appendChild(punto);
    span.appendChild(document.createTextNode(etiquetaEstado(estado)));
    return span;
}

function crearBotonPedido(titulo, icono, accion, claseExtra = "") {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "order-action-button " + claseExtra;
    boton.title = titulo;
    boton.setAttribute("aria-label", titulo);

    const i = document.createElement("i");
    i.className = icono;
    boton.appendChild(i);
    boton.addEventListener("click", accion);
    const descripcionPermiso =
        String(
            titulo ||
            ""
        )
            .toLowerCase();

    if (
        descripcionPermiso.includes(
            "editar"
        )
    ) {

        boton.dataset.permiso =
            "editar";


        if (
            window.Permisos &&
            !Permisos.puedeEditar()
        ) {

            boton.hidden =
                true;
        }
    }


    if (
        descripcionPermiso.includes(
            "eliminar"
        ) ||
        descripcionPermiso.includes(
            "borrar"
        )
    ) {

        boton.dataset.permiso =
            "eliminar";


        if (
            window.Permisos &&
            !Permisos.puedeEliminar()
        ) {

            boton.hidden =
                true;
        }
    }


    return boton;
}

function renderizarTablaPedidos(lista) {
    tablaPedidosBody.textContent = "";

    if (!lista.length) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.className = "empty-order-row";
        celda.textContent = "No hay pedidos para mostrar.";
        fila.appendChild(celda);
        tablaPedidosBody.appendChild(fila);
        return;
    }

    lista.slice().sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
        .forEach(pedido => {
            const fila = document.createElement("tr");

            const cId = document.createElement("td");
            const id = document.createElement("span");
            id.className = "order-id";
            id.textContent = idPedidoCorto(pedido.id);
            cId.appendChild(id);

            const cFecha = crearCelda(formatearFecha(pedido.creadoEn));

            const cCliente = document.createElement("td");
            const nombre = document.createElement("span");
            nombre.className = "order-client-name";
            nombre.textContent = pedido.clienteNombre || "Cliente no disponible";
            cCliente.appendChild(nombre);

            if (!encontrarCliente(pedido.clienteId)) {
                const nota = document.createElement("span");
                nota.className = "order-client-history";
                nota.textContent = "Cliente eliminado · dato histórico";
                cCliente.appendChild(nota);
            }

            const cCantidad = crearCelda(pedido.cantidadArticulos);
            const cTotal = crearCelda(monedaCRC(pedido.total));
            const cEstado = document.createElement("td");
            cEstado.appendChild(crearBadgeEstado(pedido.estado));

            const cAcciones = document.createElement("td");
            cAcciones.className = "text-end";
            const acciones = document.createElement("div");
            acciones.className = "order-actions";
            acciones.appendChild(crearBotonPedido("Ver detalle", "bi bi-eye", () => verDetallePedido(pedido.id)));
            acciones.appendChild(crearBotonPedido("Editar pedido", "bi bi-pencil", () => editarPedido(pedido.id)));
            acciones.appendChild(crearBotonPedido("Eliminar pedido", "bi bi-trash", () => eliminarPedido(pedido.id), "delete"));
            cAcciones.appendChild(acciones);

            [cId, cFecha, cCliente, cCantidad, cTotal, cEstado, cAcciones]
                .forEach(celda => fila.appendChild(celda));

            tablaPedidosBody.appendChild(fila);
        });
}

// ------------------------------------------------------
// Resumen, búsqueda y gráficos
// ------------------------------------------------------
function actualizarResumenPedidos() {
    const pedidos = obtenerPedidos();
    resumenTotalPedidos.textContent = pedidos.length;
    resumenPedidosPendientes.textContent = pedidos.filter(p => p.estado === "pendiente").length;
    resumenPedidosProceso.textContent = pedidos.filter(p => p.estado === "en_proceso").length;
    resumenPedidosEntregados.textContent = pedidos.filter(p => p.estado === "entregado").length;
}

function destruirGraficosPedidos() {
    if (chartPedidosEstado) {
        chartPedidosEstado.destroy();
        chartPedidosEstado = null;
    }
    if (chartPedidosClientes) {
        chartPedidosClientes.destroy();
        chartPedidosClientes = null;
    }
}

function renderizarGraficosPedidos() {
    if (typeof ApexCharts === "undefined") return;

    destruirGraficosPedidos();

    const pedidos = obtenerPedidos();
    const oscuro = document.documentElement.getAttribute("data-theme") === "dark";
    const colorTexto = oscuro ? "#cbd5e1" : "#667085";

    const estados = [
        pedidos.filter(p => p.estado === "pendiente").length,
        pedidos.filter(p => p.estado === "en_proceso").length,
        pedidos.filter(p => p.estado === "entregado").length
    ];

    chartPedidosEstado = new ApexCharts(
        document.getElementById("chart-pedidos-estado"),
        {
            chart: { type: "donut", height: 280, toolbar: { show: false } },
            series: estados,
            labels: ["Pendientes", "En proceso", "Entregados"],
            dataLabels: { enabled: false },
            legend: { position: "bottom", labels: { colors: colorTexto } },
            noData: { text: "Sin pedidos", style: { color: colorTexto } },
            stroke: { width: 0 }
        }
    );
    chartPedidosEstado.render();

    const mapa = new Map();
    pedidos.forEach(pedido => {
        const nombre = pedido.clienteNombre || "Cliente";
        mapa.set(nombre, (mapa.get(nombre) || 0) + Number(pedido.total || 0));
    });

    const top = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

    chartPedidosClientes = new ApexCharts(
        document.getElementById("chart-pedidos-clientes"),
        {
            chart: { type: "bar", height: 280, toolbar: { show: false } },
            series: [{ name: "Total", data: top.map(item => item[1]) }],
            xaxis: {
                categories: top.map(item => item[0]),
                labels: { style: { colors: colorTexto } }
            },
            yaxis: {
                labels: {
                    style: { colors: colorTexto },
                    formatter: valor => "₡" + Math.round(valor).toLocaleString("es-CR")
                }
            },
            dataLabels: { enabled: false },
            grid: { borderColor: oscuro ? "#334155" : "#eaecf0" },
            tooltip: { y: { formatter: valor => monedaCRC(valor) } },
            noData: { text: "Sin pedidos", style: { color: colorTexto } }
        }
    );
    chartPedidosClientes.render();
}

function aplicarBusquedaPedidos() {
    const texto = buscadorPedido.value.trim().toLowerCase();
    const pedidos = obtenerPedidos();

    if (!texto) {
        renderizarTablaPedidos(pedidos);
        return;
    }

    renderizarTablaPedidos(
        pedidos.filter(pedido =>
            idPedidoCorto(pedido.id).toLowerCase().includes(texto) ||
            String(pedido.clienteNombre || "").toLowerCase().includes(texto) ||
            etiquetaEstado(pedido.estado).toLowerCase().includes(texto)
        )
    );
}

function mostrarPedidos() {
    aplicarBusquedaPedidos();
    actualizarResumenPedidos();
    requestAnimationFrame(renderizarGraficosPedidos);
}

// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioPedido() {
    formPedido.reset();
    pedidoId.value = "";
    pedidoCantidad.value = "1";
    itemsPedidoActual = [];
    btnGuardarPedido.innerHTML = '<i class="bi bi-floppy"></i> Guardar pedido';
    btnCancelarPedido.style.display = "none";
    document.getElementById("titulo-formulario-pedido").textContent = "Crear pedido";
    cargarClientesPedido();
    cargarProductosPedido();
    renderizarItemsPedido();
    mensajePedido.textContent = "";
}

// ------------------------------------------------------
// CSV
// ------------------------------------------------------
function limpiarCSVPedido(valor) {
    let texto = String(valor ?? "");
    if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
    return '"' + texto.replace(/"/g, '""') + '"';
}

function exportarPedidosCSV() {
    const pedidos = obtenerPedidos();

    if (!pedidos.length) {
        toastPedido("No hay pedidos para exportar.", "info");
        return;
    }

    const filas = [[
        "ID", "Fecha", "Cliente", "Estado",
        "Cantidad de artículos", "Subtotal", "Total",
        "Productos y proveedores"
    ]];

    pedidos.forEach(pedido => {
        const detalle = (pedido.items || [])
            .map(item =>
                item.productoNombre + " x" + item.cantidad +
                " - " + item.proveedorNombre
            )
            .join(" | ");

        filas.push([
            idPedidoCorto(pedido.id),
            formatearFecha(pedido.creadoEn),
            pedido.clienteNombre,
            etiquetaEstado(pedido.estado),
            pedido.cantidadArticulos,
            pedido.subtotal,
            pedido.total,
            detalle
        ]);
    });

    const contenido = "\uFEFF" + filas
        .map(fila => fila.map(limpiarCSVPedido).join(","))
        .join("\n");

    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "pedidos.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    toastPedido("Pedidos exportados a CSV.");
}

// ------------------------------------------------------
// PDF
// ------------------------------------------------------
async function exportarPedidosPDF() {
    const pedidos = obtenerPedidos();

    if (!pedidos.length) {
        toastPedido("No hay pedidos para exportar.", "info");
        return;
    }

    if (typeof PDFReporte === "undefined") {
        toastPedido("El módulo PDF no está disponible.", "error");
        return;
    }

    const totalVentas = pedidos.reduce((total, p) => total + Number(p.total || 0), 0);
    const totalArticulos = pedidos.reduce(
        (total, p) => total + Number(p.cantidadArticulos || 0),
        0
    );

    const filas = pedidos.map(pedido => [
        idPedidoCorto(pedido.id),
        formatearFecha(pedido.creadoEn),
        pedido.clienteNombre,
        etiquetaEstado(pedido.estado),
        pedido.cantidadArticulos,
        monedaCRC(pedido.total),
        (pedido.items || [])
            .map(item =>
                item.productoNombre + " x" + item.cantidad +
                " / " + item.proveedorNombre
            )
            .join(" | ")
    ]);

    await PDFReporte.generarReporte({
        titulo: "Reporte de Pedidos",
        subtitulo: "Clientes, productos y proveedores",
        nombreArchivo: "reporte_pedidos",
        fondoGraficosOscuro:
            document.documentElement.getAttribute("data-theme") === "dark",
        metricas: [
            { etiqueta: "Total pedidos", valor: pedidos.length },
            { etiqueta: "Artículos pedidos", valor: totalArticulos },
            { etiqueta: "Pendientes", valor: pedidos.filter(p => p.estado === "pendiente").length },
            { etiqueta: "En proceso", valor: pedidos.filter(p => p.estado === "en_proceso").length },
            { etiqueta: "Entregados", valor: pedidos.filter(p => p.estado === "entregado").length },
            { etiqueta: "Total acumulado", valor: monedaCRC(totalVentas) }
        ],
        graficos: [
            { titulo: "Pedidos por estado", chart: chartPedidosEstado },
            { titulo: "Total por cliente", chart: chartPedidosClientes }
        ],
        tabla: {
            titulo: "Listado completo de pedidos",
            columnas: [
                "Pedido", "Fecha", "Cliente", "Estado",
                "Artículos", "Total", "Productos / Proveedores"
            ],
            filas
        },
        alFinalizar: () => toastPedido("Reporte PDF de pedidos generado.")
    });
}

// ------------------------------------------------------
// Sesión
// ------------------------------------------------------
function verificarSesionPedidos() {
    const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO_PEDIDOS);

    if (!usuarioGuardado) {
        window.location.href = "login.html";
        return null;
    }

    try {
        return JSON.parse(usuarioGuardado);
    } catch (error) {
        return { nombre: usuarioGuardado };
    }
}

function mostrarUsuarioPedidos() {
    const usuario = verificarSesionPedidos();
    const elemento = document.getElementById("nombreUsuario");
    if (!usuario || !elemento) return;
    elemento.textContent = usuario.nombre || usuario.usuario || "Administrador";
}

function configurarCerrarSesionPedidos() {
    const boton = document.getElementById("btn-cerrar-sesion");
    if (!boton) return;

    boton.addEventListener("click", function() {
        alertaPedido({
            title: "¿Cerrar sesión?",
            text: "Tendrás que iniciar sesión nuevamente para acceder al sistema.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cerrar sesión",
            cancelButtonText: "Cancelar",
            reverseButtons: true
        }).then(function(resultado) {
            if (!resultado.isConfirmed) return;
            localStorage.removeItem(CLAVE_USUARIO_PEDIDOS);
            window.location.href = "login.html";
        });
    });
}

// ------------------------------------------------------
// Tema y menú
// ------------------------------------------------------
function aplicarTemaPedido() {
    const oscuro = localStorage.getItem("modo_oscuro") === "true";

    document.documentElement.setAttribute(
        "data-theme",
        oscuro ? "dark" : "light"
    );

    const boton = document.getElementById("btn-modo-oscuro");
    boton.innerHTML = oscuro
        ? '<i class="bi bi-sun"></i><span>Modo claro</span>'
        : '<i class="bi bi-moon-stars"></i><span>Modo oscuro</span>';
}

function configurarInterfazPedido() {
    const btnTema = document.getElementById("btn-modo-oscuro");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const abrir = document.getElementById("btn-abrir-menu");
    const cerrar = document.getElementById("btn-cerrar-menu");

    aplicarTemaPedido();

    btnTema.addEventListener("click", function () {
        const esOscuro =
            document.documentElement.getAttribute("data-theme") === "dark";

        localStorage.setItem("modo_oscuro", esOscuro ? "false" : "true");
        aplicarTemaPedido();
        requestAnimationFrame(renderizarGraficosPedidos);
    });

    function cerrarMenu() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    }

    abrir.addEventListener("click", function () {
        sidebar.classList.add("open");
        overlay.classList.add("show");
    });

    cerrar.addEventListener("click", cerrarMenu);
    overlay.addEventListener("click", cerrarMenu);
}

// ------------------------------------------------------
// Eventos
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {

    if (
        window.Permisos &&
        !Permisos.verificarSesion()
    ) {

        return;
    }


    verificarSesionPedidos();
    mostrarUsuarioPedidos();
    configurarCerrarSesionPedidos();
    configurarInterfazPedido();
    cargarClientesPedido();
    cargarProductosPedido();
    renderizarItemsPedido();
    mostrarPedidos();

    btnAgregarProductoPedido.addEventListener("click", agregarProductoAlPedido);
    pedidoProducto.addEventListener("change", actualizarMensajeProductoSeleccionado);
    btnCancelarPedido.addEventListener("click", limpiarFormularioPedido);
    buscadorPedido.addEventListener("input", aplicarBusquedaPedidos);

    document.getElementById("btn-exportar-pedidos")
        .addEventListener("click", exportarPedidosCSV);

    document.getElementById("btn-exportar-pedidos-pdf")
        .addEventListener("click", exportarPedidosPDF);
});
