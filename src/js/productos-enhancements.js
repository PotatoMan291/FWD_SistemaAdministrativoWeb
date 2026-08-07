// ======================================================
// MEJORAS VISUALES - PRODUCTOS
// No reemplaza el CRUD. Solo añade UI, gráficos y vistas.
// ======================================================

let chartProductosCategoria = null;
let chartEstadoStock = null;

let choicesCategoria = null;
let choicesProveedor = null;

let filtroStockActual = "todos";
let vistaProductosActual =
    localStorage.getItem("vista_productos") || "tabla";

let sortableProductos = null;

let ultimaFirmaDatosProductos = "";


// ------------------------------------------------------
// Toast reutilizable
// ------------------------------------------------------
function mostrarToast(mensaje, icono = "success") {

    Swal.fire({
        toast: true,
        position: "top-end",
        icon: icono,
        title: mensaje,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true
    });
}



// ------------------------------------------------------
// Contadores animados
// ------------------------------------------------------
const valoresAnimadosProductos = {};

function animarNumero(elemento, valorFinal) {

    if (!elemento) {
        return;
    }

    const clave = elemento.id;

    if (
        valoresAnimadosProductos[clave] ===
        Number(valorFinal)
    ) {

        elemento.textContent =
            Number(valorFinal)
                .toLocaleString("es-CR");

        return;
    }

    valoresAnimadosProductos[clave] =
        Number(valorFinal);

    const inicio = 0;
    const duracion = 520;
    const tiempoInicio = performance.now();

    function actualizar(ahora) {

        const progreso =
            Math.min(
                (ahora - tiempoInicio) /
                duracion,
                1
            );

        const valor =
            Math.round(
                inicio +
                (Number(valorFinal) - inicio) *
                progreso
            );

        elemento.textContent =
            valor.toLocaleString("es-CR");

        if (progreso < 1) {

            requestAnimationFrame(
                actualizar
            );
        }
    }

    requestAnimationFrame(
        actualizar
    );
}


// ------------------------------------------------------
// Resumen animado
// ------------------------------------------------------
function animarResumenProductos() {

    const productos =
        obtenerProductos();

    const proveedores =
        obtenerProveedores();

    let stockTotal = 0;
    let stockBajo = 0;

    productos.forEach(function(producto) {

        stockTotal += Number(producto.stock);

        if (
            Number(producto.stock) <= 5
        ) {

            stockBajo++;
        }
    });

    animarNumero(
        resumenTotalProductos,
        productos.length
    );

    animarNumero(
        resumenStockTotal,
        stockTotal
    );

    animarNumero(
        resumenStockBajo,
        stockBajo
    );

    animarNumero(
        resumenProveedores,
        proveedores.length
    );
}


// ------------------------------------------------------
// Choices.js
// ------------------------------------------------------
function crearChoices(
    elemento,
    placeholder
) {

    if (
        !window.Choices ||
        !elemento
    ) {

        return null;
    }

    return new Choices(
        elemento,
        {
            searchEnabled: true,
            shouldSort: false,
            itemSelectText: "",
            noResultsText:
                "No se encontraron resultados",
            noChoicesText:
                "No hay opciones disponibles",
            searchPlaceholderValue:
                "Buscar...",
            placeholder: true,
            placeholderValue:
                placeholder
        }
    );
}


function inicializarChoicesCategoria() {

    if (choicesCategoria) {

        choicesCategoria.destroy();
        choicesCategoria = null;
    }

    choicesCategoria =
        crearChoices(
            productoCategoria,
            "Seleccione una categoría"
        );
}


function inicializarChoicesProveedor() {

    if (choicesProveedor) {

        choicesProveedor.destroy();
        choicesProveedor = null;
    }

    choicesProveedor =
        crearChoices(
            productoProveedor,
            "Seleccione un proveedor"
        );
}


// Guardar las funciones originales antes de envolverlas.
const cargarCategoriasEnSelectOriginal =
    cargarCategoriasEnSelect;

const cargarProveedoresEnSelectOriginal =
    cargarProveedoresEnSelect;

cargarCategoriasEnSelect =
    function(categoriaSeleccionada = "") {

        if (choicesCategoria) {

            choicesCategoria.destroy();
            choicesCategoria = null;
        }

        cargarCategoriasEnSelectOriginal(
            categoriaSeleccionada
        );

        inicializarChoicesCategoria();
    };

cargarProveedoresEnSelect =
    function(proveedorSeleccionado = "") {

        if (choicesProveedor) {

            choicesProveedor.destroy();
            choicesProveedor = null;
        }

        cargarProveedoresEnSelectOriginal(
            proveedorSeleccionado
        );

        inicializarChoicesProveedor();
    };


// ------------------------------------------------------
// Datos para gráficos
// ------------------------------------------------------
function obtenerDatosCategoriasProductos() {

    const productos =
        obtenerProductos();

    const categorias =
        obtenerCategorias();

    const nombres = [];
    const cantidades = [];

    categorias.forEach(function(categoria) {

        const cantidad =
            productos.filter(
                function(producto) {

                    return (
                        String(
                            producto.categoriaId
                        ) ===
                        String(categoria.id)
                    );
                }
            ).length;

        nombres.push(categoria.nombre);
        cantidades.push(cantidad);
    });

    return {
        nombres: nombres,
        cantidades: cantidades
    };
}


function obtenerEstadoStock() {

    const productos =
        obtenerProductos();

    let disponible = 0;
    let bajo = 0;
    let sinStock = 0;

    productos.forEach(function(producto) {

        const stock =
            Number(producto.stock);

        if (stock === 0) {

            sinStock++;

        } else if (stock <= 5) {

            bajo++;

        } else {

            disponible++;
        }
    });

    return {
        disponible: disponible,
        bajo: bajo,
        sinStock: sinStock
    };
}


function esTemaOscuro() {

    return (
        document.documentElement
            .getAttribute("data-theme") ===
        "dark"
    );
}


// ------------------------------------------------------
// ApexCharts
// ------------------------------------------------------
function renderizarGraficosProductos() {

    if (!window.ApexCharts) {
        return;
    }

    const elementoCategoria =
        document.getElementById(
            "chart-productos-categoria"
        );

    const elementoStock =
        document.getElementById(
            "chart-estado-stock"
        );

    if (
        !elementoCategoria ||
        !elementoStock
    ) {

        return;
    }

    const datosCategoria =
        obtenerDatosCategoriasProductos();

    const estadoStock =
        obtenerEstadoStock();

    const totalProductos =
        obtenerProductos().length;

    const colorTexto =
        esTemaOscuro()
            ? "#98a2b3"
            : "#667085";

    const colorGrid =
        esTemaOscuro()
            ? "#1f2a3d"
            : "#e4e7ec";

    if (chartProductosCategoria) {

        chartProductosCategoria.destroy();
        chartProductosCategoria = null;
    }

    if (chartEstadoStock) {

        chartEstadoStock.destroy();
        chartEstadoStock = null;
    }

    elementoCategoria.innerHTML = "";
    elementoStock.innerHTML = "";

    if (
        datosCategoria.nombres.length === 0
    ) {

        elementoCategoria.innerHTML =
            '<div class="chart-empty">Registra categorías para visualizar el gráfico.</div>';

    } else {

        chartProductosCategoria =
            new ApexCharts(
                elementoCategoria,
                {
                    chart: {
                        type: "bar",
                        height: 250,
                        toolbar: {
                            show: false
                        },
                        animations: {
                            enabled: true,
                            speed: 260
                        }
                    },
                    series: [
                        {
                            name: "Productos",
                            data:
                                datosCategoria
                                    .cantidades
                        }
                    ],
                    plotOptions: {
                        bar: {
                            borderRadius: 6,
                            columnWidth: "48%"
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },
                    xaxis: {
                        categories:
                            datosCategoria
                                .nombres,
                        labels: {
                            style: {
                                colors:
                                    colorTexto
                            }
                        }
                    },
                    yaxis: {
                        labels: {
                            style: {
                                colors:
                                    colorTexto
                            }
                        }
                    },
                    grid: {
                        borderColor:
                            colorGrid,
                        strokeDashArray: 4
                    },
                    colors: [
                        "#465fff"
                    ],
                    tooltip: {
                        theme:
                            esTemaOscuro()
                                ? "dark"
                                : "light"
                    }
                }
            );

        chartProductosCategoria.render();
    }

    if (totalProductos === 0) {

        elementoStock.innerHTML =
            '<div class="chart-empty">Agrega productos para visualizar el gráfico.</div>';

    } else {

        chartEstadoStock =
            new ApexCharts(
                elementoStock,
                {
                    chart: {
                        type: "donut",
                        height: 250
                    },
                    series: [
                        estadoStock.disponible,
                        estadoStock.bajo,
                        estadoStock.sinStock
                    ],
                    labels: [
                        "Disponible",
                        "Stock bajo",
                        "Sin stock"
                    ],
                    colors: [
                        "#12b76a",
                        "#f79009",
                        "#d92d20"
                    ],
                    stroke: {
                        width: 0
                    },
                    legend: {
                        position: "bottom",
                        labels: {
                            colors:
                                colorTexto
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },
                    plotOptions: {
                        pie: {
                            donut: {
                                size: "70%",
                                labels: {
                                    show: true,
                                    total: {
                                        show: true,
                                        label: "Productos",
                                        color:
                                            colorTexto,
                                        formatter:
                                            function() {
                                                return totalProductos;
                                            }
                                    }
                                }
                            }
                        }
                    },
                    tooltip: {
                        theme:
                            esTemaOscuro()
                                ? "dark"
                                : "light"
                    }
                }
            );

        chartEstadoStock.render();
    }
}


// ------------------------------------------------------
// Panel de resumen
// ------------------------------------------------------
function actualizarResumenInventario() {

    const productos =
        obtenerProductos();

    let valorTotal = 0;
    let sumaPrecios = 0;
    let sinStock = 0;
    let productoMayor = null;

    productos.forEach(function(producto) {

        const precio =
            Number(producto.precio);

        const stock =
            Number(producto.stock);

        valorTotal +=
            precio * stock;

        sumaPrecios += precio;

        if (stock === 0) {

            sinStock++;
        }

        if (
            !productoMayor ||
            stock >
            Number(productoMayor.stock)
        ) {

            productoMayor = producto;
        }
    });

    const promedio =
        productos.length > 0
            ? sumaPrecios /
              productos.length
            : 0;

    document.getElementById(
        "valor-total-inventario"
    ).textContent =
        "₡" +
        valorTotal.toLocaleString(
            "es-CR",
            {
                maximumFractionDigits: 0
            }
        );

    document.getElementById(
        "precio-promedio-productos"
    ).textContent =
        "₡" +
        promedio.toLocaleString(
            "es-CR",
            {
                maximumFractionDigits: 0
            }
        );

    document.getElementById(
        "producto-mayor-stock"
    ).textContent =
        productoMayor
            ? (
                productoMayor.nombre +
                " (" +
                productoMayor.stock +
                ")"
            )
            : "Sin datos";

    document.getElementById(
        "productos-sin-stock"
    ).textContent =
        sinStock;
}


// ------------------------------------------------------
// Tarjetas de productos
// ------------------------------------------------------
function obtenerListaOrdenada(
    productos
) {

    const ordenGuardado =
        localStorage.getItem(
            "orden_tarjetas_productos"
        );

    if (!ordenGuardado) {

        return productos.slice();
    }

    const ids =
        ordenGuardado.split("|");

    const mapa = {};

    productos.forEach(
        function(producto) {

            mapa[
                String(producto.id)
            ] = producto;
        }
    );

    const ordenados = [];

    ids.forEach(function(id) {

        if (mapa[id]) {

            ordenados.push(
                mapa[id]
            );

            delete mapa[id];
        }
    });

    Object.keys(mapa)
        .forEach(function(id) {

            ordenados.push(
                mapa[id]
            );
        });

    return ordenados;
}


function crearBotonTarjeta(
    texto,
    icono,
    clase,
    accion
) {

    const boton =
        document.createElement("button");

    boton.type = "button";
    boton.className =
        "card-action-button " +
        clase;

    boton.innerHTML =
        '<i class="bi ' +
        icono +
        '"></i>' +
        texto;

    boton.addEventListener(
        "click",
        accion
    );

    return boton;
}


function renderizarTarjetasProductos(
    listaProductos
) {

    const contenedor =
        document.getElementById(
            "productos-cards"
        );

    if (!contenedor) {
        return;
    }

    const productos =
        obtenerListaOrdenada(
            listaProductos ||
            obtenerProductos()
        );

    contenedor.innerHTML = "";

    if (productos.length === 0) {

        contenedor.innerHTML =
            '<div class="empty-state"><i class="bi bi-inbox"></i><strong>No hay productos para mostrar</strong></div>';

        return;
    }

    const maxStock =
        Math.max(
            1,
            ...productos.map(
                function(producto) {

                    return Number(
                        producto.stock
                    );
                }
            )
        );

    productos.forEach(
        function(producto) {

            const categoria =
                obtenerCategoria(
                    producto.categoriaId
                );

            const proveedor =
                obtenerProveedor(
                    producto.proveedorId
                );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "product-card";

            card.dataset.id =
                producto.id;

            const top =
                document.createElement(
                    "div"
                );

            top.className =
                "product-card-top";

            top.innerHTML =
                '<div class="product-card-icon"><i class="bi bi-box-seam"></i></div>';

            top.appendChild(
                crearBadgeStock(
                    producto.stock
                )
            );

            const titulo =
                document.createElement("h3");

            titulo.textContent =
                producto.nombre;

            const categoriaTexto =
                document.createElement(
                    "div"
                );

            categoriaTexto.className =
                "card-muted";

            categoriaTexto.textContent =
                categoria
                    ? categoria.nombre
                    : (
                        producto.categoria ||
                        "Sin categoría"
                    );

            const precio =
                document.createElement(
                    "div"
                );

            precio.className =
                "product-price";

            precio.textContent =
                "₡" +
                Number(
                    producto.precio
                ).toLocaleString(
                    "es-CR"
                );

            const meta =
                document.createElement(
                    "div"
                );

            meta.className =
                "product-card-meta";

            const proveedorRow =
                document.createElement(
                    "div"
                );

            proveedorRow.className =
                "card-meta-row";

            proveedorRow.innerHTML =
                "<span>Proveedor</span>";

            const proveedorStrong =
                document.createElement(
                    "strong"
                );

            proveedorStrong.textContent =
                proveedor
                    ? proveedor.nombre
                    : "No disponible";

            proveedorRow.appendChild(
                proveedorStrong
            );

            const stockRow =
                document.createElement(
                    "div"
                );

            stockRow.className =
                "card-meta-row";

            stockRow.innerHTML =
                "<span>Stock</span><strong>" +
                producto.stock +
                " unidades</strong>";

            const progress =
                document.createElement(
                    "div"
                );

            progress.className =
                "stock-progress";

            const progressBar =
                document.createElement(
                    "div"
                );

            progressBar.className =
                "stock-progress-bar";

            if (
                Number(producto.stock) ===
                0
            ) {

                progressBar.classList.add(
                    "empty"
                );

            } else if (
                Number(producto.stock) <=
                5
            ) {

                progressBar.classList.add(
                    "low"
                );
            }

            const porcentaje =
                Math.round(
                    (
                        Number(
                            producto.stock
                        ) /
                        maxStock
                    ) *
                    100
                );

            progressBar.style.width =
                porcentaje + "%";

            progress.title =
                "Nivel relativo de stock dentro del inventario actual";

            progress.appendChild(
                progressBar
            );

            meta.appendChild(
                proveedorRow
            );

            meta.appendChild(
                stockRow
            );

            meta.appendChild(
                progress
            );

            const acciones =
                document.createElement(
                    "div"
                );

            acciones.className =
                "card-actions";

            acciones.appendChild(
                crearBotonTarjeta(
                    "Editar",
                    "bi-pencil",
                    "edit",
                    function() {

                        editarProducto(
                            producto.id
                        );
                    }
                )
            );

            acciones.appendChild(
                crearBotonTarjeta(
                    "Eliminar",
                    "bi-trash3",
                    "delete",
                    function() {

                        eliminarProducto(
                            producto.id
                        );
                    }
                )
            );

            card.appendChild(top);
            card.appendChild(titulo);
            card.appendChild(
                categoriaTexto
            );
            card.appendChild(precio);
            card.appendChild(meta);
            card.appendChild(
                acciones
            );

            contenedor.appendChild(
                card
            );
        }
    );

    inicializarSortableProductos();
}


// ------------------------------------------------------
// SortableJS
// ------------------------------------------------------
function inicializarSortableProductos() {

    const contenedor =
        document.getElementById(
            "productos-cards"
        );

    if (
        !contenedor ||
        !window.Sortable
    ) {

        return;
    }

    if (sortableProductos) {

        sortableProductos.destroy();
    }

    sortableProductos =
        Sortable.create(
            contenedor,
            {
                animation: 180,
                ghostClass:
                    "sortable-ghost",
                onEnd:
                    function() {

                        const ids =
                            Array.from(
                                contenedor.children
                            )
                            .map(
                                function(card) {

                                    return (
                                        card.dataset.id
                                    );
                                }
                            )
                            .filter(Boolean);

                        localStorage.setItem(
                            "orden_tarjetas_productos",
                            ids.join("|")
                        );

                        mostrarToast(
                            "Orden de tarjetas guardado.",
                            "success"
                        );
                    }
            }
        );
}


// ------------------------------------------------------
// Vista tabla / tarjetas
// ------------------------------------------------------
function cambiarVistaProductos(
    vista,
    mostrarAviso = true
) {

    const tabla =
        document.getElementById(
            "vista-tabla-productos"
        );

    const tarjetas =
        document.getElementById(
            "vista-tarjetas-productos"
        );

    const btnTabla =
        document.getElementById(
            "btn-vista-tabla"
        );

    const btnTarjetas =
        document.getElementById(
            "btn-vista-tarjetas"
        );

    if (
        !tabla ||
        !tarjetas
    ) {

        return;
    }

    vistaProductosActual = vista;

    localStorage.setItem(
        "vista_productos",
        vista
    );

    const esTabla =
        vista === "tabla";

    tabla.classList.toggle(
        "hidden",
        !esTabla
    );

    tarjetas.classList.toggle(
        "hidden",
        esTabla
    );

    btnTabla.classList.toggle(
        "active",
        esTabla
    );

    btnTarjetas.classList.toggle(
        "active",
        !esTabla
    );

    if (
        !esTabla &&
        mostrarAviso
    ) {

        mostrarToast(
            "Vista de tarjetas activada.",
            "info"
        );
    }
}


// ------------------------------------------------------
// Filtros combinados
// ------------------------------------------------------
function aplicarFiltrosProductos() {

    const texto =
        buscadorProducto.value
            .toLowerCase()
            .trim();

    const productos =
        obtenerProductos();

    const filtrados =
        productos.filter(
            function(producto) {

                const proveedor =
                    obtenerProveedor(
                        producto.proveedorId
                    );

                const categoria =
                    obtenerCategoria(
                        producto.categoriaId
                    );

                const coincideTexto =
                    producto.nombre
                        .toLowerCase()
                        .includes(texto) ||
                    (
                        categoria
                            ? categoria.nombre
                            : (
                                producto.categoria ||
                                ""
                            )
                    )
                        .toLowerCase()
                        .includes(texto) ||
                    (
                        proveedor
                            ? (
                                proveedor.nombre +
                                " " +
                                proveedor.empresa
                            )
                            : ""
                    )
                        .toLowerCase()
                        .includes(texto);

                const stock =
                    Number(
                        producto.stock
                    );

                let coincideStock =
                    true;

                if (
                    filtroStockActual ===
                    "disponible"
                ) {

                    coincideStock =
                        stock > 5;

                } else if (
                    filtroStockActual ===
                    "bajo"
                ) {

                    coincideStock =
                        stock > 0 &&
                        stock <= 5;

                } else if (
                    filtroStockActual ===
                    "sin"
                ) {

                    coincideStock =
                        stock === 0;
                }

                return (
                    coincideTexto &&
                    coincideStock
                );
            }
        );

    mostrarProductos(filtrados);
}


// ------------------------------------------------------
// Exportar CSV
// ------------------------------------------------------
function escaparCSV(valor) {

    const texto =
        String(
            valor ?? ""
        )
        .replace(/"/g, '""');

    return '"' + texto + '"';
}


function exportarProductosCSV() {

    const productos =
        obtenerProductos();

    if (productos.length === 0) {

        mostrarToast(
            "No hay productos para exportar.",
            "info"
        );

        return;
    }

    const filas = [
        [
            "ID",
            "Nombre",
            "Categoría",
            "Precio",
            "Stock",
            "Proveedor"
        ]
    ];

    productos.forEach(function(producto) {

        const categoria =
            obtenerCategoria(
                producto.categoriaId
            );

        const proveedor =
            obtenerProveedor(
                producto.proveedorId
            );

        filas.push([
            producto.id,
            producto.nombre,
            categoria
                ? categoria.nombre
                : (
                    producto.categoria ||
                    ""
                ),
            producto.precio,
            producto.stock,
            proveedor
                ? (
                    proveedor.nombre +
                    " - " +
                    proveedor.empresa
                )
                : ""
        ]);
    });

    const csv =
        "\ufeff" +
        filas
            .map(
                function(fila) {

                    return fila
                        .map(escaparCSV)
                        .join(",");
                }
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;
    enlace.download =
        "productos.csv";

    document.body.appendChild(
        enlace
    );

    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);

    mostrarToast(
        "CSV de productos generado.",
        "success"
    );
}


// ------------------------------------------------------
// Detectar si los datos reales cambiaron
// ------------------------------------------------------
function obtenerFirmaDatosProductos() {

    return (
        localStorage.getItem("productos") || "[]" 
    ) + "|" + (
        localStorage.getItem("categorias") || "[]"
    ) + "|" + (
        localStorage.getItem("proveedores") || "[]"
    );
}


// ------------------------------------------------------
// Actualizar extras cuando el CRUD renderiza
// ------------------------------------------------------
const mostrarProductosOriginal =
    mostrarProductos;

mostrarProductos =
    function(listaProductos) {

        mostrarProductosOriginal(
            listaProductos
        );

        const lista =
            listaProductos ||
            obtenerProductos();

        // La vista de tarjetas sí debe responder
        // inmediatamente a búsqueda y filtros.
        renderizarTarjetasProductos(
            lista
        );

        // Los gráficos y estadísticas solo se recalculan
        // cuando cambió LocalStorage, no en cada tecla.
        const firmaActual =
            obtenerFirmaDatosProductos();

        if (
            firmaActual !==
            ultimaFirmaDatosProductos
        ) {

            ultimaFirmaDatosProductos =
                firmaActual;

            animarResumenProductos();
            actualizarResumenInventario();

            requestAnimationFrame(
                function() {

                    renderizarGraficosProductos();
                }
            );
        }
    };


// ------------------------------------------------------
// Eventos
// ------------------------------------------------------
document.addEventListener(
    "DOMContentLoaded",
    function() {
document
            .getElementById(
                "btn-vista-tabla"
            )
            .addEventListener(
                "click",
                function() {

                    cambiarVistaProductos(
                        "tabla"
                    );
                }
            );

        document
            .getElementById(
                "btn-vista-tarjetas"
            )
            .addEventListener(
                "click",
                function() {

                    cambiarVistaProductos(
                        "tarjetas"
                    );
                }
            );

        document
            .getElementById(
                "btn-exportar-productos"
            )
            .addEventListener(
                "click",
                exportarProductosCSV
            );

        document
            .querySelectorAll(
                "[data-stock-filter]"
            )
            .forEach(
                function(boton) {

                    boton.addEventListener(
                        "click",
                        function() {

                            filtroStockActual =
                                boton.dataset
                                    .stockFilter;

                            document
                                .querySelectorAll(
                                    "[data-stock-filter]"
                                )
                                .forEach(
                                    function(item) {

                                        item.classList
                                            .remove(
                                                "active"
                                            );
                                    }
                                );

                            boton.classList.add(
                                "active"
                            );

                            aplicarFiltrosProductos();
                        }
                    );
                }
            );

        // Se ejecuta después del listener original.
        buscadorProducto.addEventListener(
            "input",
            aplicarFiltrosProductos
        );

        btnModoOscuro.addEventListener(
            "click",
            function() {

                setTimeout(
                    renderizarGraficosProductos,
                    40
                );
            }
        );

        cambiarVistaProductos(
            vistaProductosActual,
            false
        );

        // Si los selects todavía no tienen Choices,
        // se inicializan aquí.
        if (!choicesCategoria) {

            inicializarChoicesCategoria();
        }

        if (!choicesProveedor) {

            inicializarChoicesProveedor();
        }

        // El CRUD principal ejecuta mostrarProductos() al iniciar.
        // El wrapper anterior actualizará tarjetas y analítica una sola vez.
    }
);
