// ======================================================
// MEJORAS VISUALES - PROVEEDORES
// ======================================================

let chartProductosProveedor = null;

let vistaProveedoresActual =
    leerPreferenciaSegura(
        "vista_proveedores",
        "tabla"
    );

const valoresAnimadosProveedores = {};

let ultimaFirmaDatosProveedores = "";




// ------------------------------------------------------
// Animación
// ------------------------------------------------------
function animarNumero(
    elemento,
    valorFinal
) {

    if (!elemento) {
        return;
    }

    const clave = elemento.id;

    if (
        valoresAnimadosProveedores[
            clave
        ] === Number(valorFinal)
    ) {

        elemento.textContent =
            Number(valorFinal)
                .toLocaleString(
                    "es-CR"
                );

        return;
    }

    valoresAnimadosProveedores[
        clave
    ] = Number(valorFinal);

    const inicioTiempo =
        performance.now();

    const duracion = 520;

    function frame(ahora) {

        const progreso =
            Math.min(
                (
                    ahora -
                    inicioTiempo
                ) /
                duracion,
                1
            );

        elemento.textContent =
            Math.round(
                Number(valorFinal) *
                progreso
            ).toLocaleString(
                "es-CR"
            );

        if (progreso < 1) {

            requestAnimationFrame(
                frame
            );
        }
    }

    requestAnimationFrame(frame);
}


function animarResumenProveedores() {

    const proveedores =
        obtenerProveedores();

    const productos =
        obtenerProductos();

    const empresas = [];

    proveedores.forEach(
        function(proveedor) {

            const nombre =
                proveedor.empresa
                    .trim()
                    .toLowerCase();

            if (
                nombre &&
                !empresas.includes(nombre)
            ) {

                empresas.push(nombre);
            }
        }
    );

    let conProductos = 0;

    proveedores.forEach(
        function(proveedor) {

            if (
                productos.some(
                    function(producto) {

                        return (
                            String(
                                producto.proveedorId
                            ) ===
                            String(
                                proveedor.id
                            )
                        );
                    }
                )
            ) {

                conProductos++;
            }
        }
    );

    animarNumero(
        resumenTotalProveedores,
        proveedores.length
    );

    animarNumero(
        resumenEmpresas,
        empresas.length
    );

    animarNumero(
        resumenConProductos,
        conProductos
    );

    animarNumero(
        resumenProductosAsociados,
        productos.length
    );
}


// ------------------------------------------------------
// Avatar
// ------------------------------------------------------
function obtenerIniciales(
    nombre
) {

    return String(nombre || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            function(parte) {

                return parte
                    .charAt(0)
                    .toUpperCase();
            }
        )
        .join("");
}


// ------------------------------------------------------
// Tarjetas
// ------------------------------------------------------
function crearBotonProveedorCard(
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

    const iconoElemento =
        document.createElement("i");

    iconoElemento.className =
        "bi " + icono;

    const textoElemento =
        document.createElement("span");

    textoElemento.textContent =
        texto;

    boton.appendChild(
        iconoElemento
    );

    boton.appendChild(
        textoElemento
    );

    boton.addEventListener(
        "click",
        accion
    );

    return boton;
}


function renderizarTarjetasProveedores(
    lista
) {

    const contenedor =
        document.getElementById(
            "proveedores-cards"
        );

    if (!contenedor) {
        return;
    }

    const proveedores =
        lista ||
        obtenerProveedores();

    contenedor.innerHTML = "";

    if (proveedores.length === 0) {

        contenedor.innerHTML =
            '<div class="empty-state"><i class="bi bi-person-x"></i><strong>No hay proveedores para mostrar</strong></div>';

        return;
    }

    proveedores.forEach(
        function(proveedor) {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "provider-card";

            const top =
                document.createElement(
                    "div"
                );

            top.className =
                "provider-card-top";

            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "provider-card-avatar";

            avatar.textContent =
                obtenerIniciales(
                    proveedor.nombre
                );

            const productosProveedor =
                obtenerProductos()
                    .filter(
                        function(producto) {

                            return (
                                String(
                                    producto.proveedorId
                                ) ===
                                String(
                                    proveedor.id
                                )
                            );
                        }
                    );

            const badge =
                document.createElement(
                    "span"
                );

            badge.className =
                productosProveedor.length > 0
                    ? "badge text-bg-success"
                    : "badge text-bg-secondary";

            badge.textContent =
                productosProveedor.length +
                " producto(s)";

            top.appendChild(avatar);
            top.appendChild(badge);

            const titulo =
                document.createElement("h3");

            titulo.textContent =
                proveedor.nombre;

            const empresa =
                document.createElement(
                    "div"
                );

            empresa.className =
                "card-muted";

            empresa.textContent =
                proveedor.empresa;

            const contactos =
                document.createElement(
                    "div"
                );

            contactos.className =
                "provider-contact-list";

            contactos.innerHTML =
                '<div class="provider-contact"><i class="bi bi-telephone"></i><span></span></div>' +
                '<div class="provider-contact"><i class="bi bi-envelope"></i><span></span></div>' +
                '<div class="provider-contact"><i class="bi bi-geo-alt"></i><span></span></div>';

            const spans =
                contactos.querySelectorAll(
                    "span"
                );

            spans[0].textContent =
                proveedor.telefono;

            spans[1].textContent =
                proveedor.correo;

            spans[2].textContent =
                proveedor.direccion;

            const acciones =
                document.createElement(
                    "div"
                );

            acciones.className =
                "card-actions";

            acciones.appendChild(
                crearBotonProveedorCard(
                    "Editar",
                    "bi-pencil",
                    "edit",
                    function() {

                        editarProveedor(
                            proveedor.id
                        );
                    }
                )
            );

            acciones.appendChild(
                crearBotonProveedorCard(
                    "Eliminar",
                    "bi-trash3",
                    "delete",
                    function() {

                        eliminarProveedor(
                            proveedor.id
                        );
                    }
                )
            );

            card.appendChild(top);
            card.appendChild(titulo);
            card.appendChild(empresa);
            card.appendChild(
                contactos
            );
            card.appendChild(
                acciones
            );

            contenedor.appendChild(card);
        }
    );
}


// ------------------------------------------------------
// Insights
// ------------------------------------------------------
function actualizarInsightsProveedores() {

    const proveedores =
        obtenerProveedores();

    const productos =
        obtenerProductos();

    let mejorProveedor = null;
    let mejorCantidad = 0;
    let sinProductos = 0;

    const empresas = [];

    proveedores.forEach(
        function(proveedor) {

            const cantidad =
                productos.filter(
                    function(producto) {

                        return (
                            String(
                                producto.proveedorId
                            ) ===
                            String(
                                proveedor.id
                            )
                        );
                    }
                ).length;

            if (cantidad === 0) {

                sinProductos++;
            }

            if (cantidad > mejorCantidad) {

                mejorCantidad = cantidad;
                mejorProveedor =
                    proveedor;
            }

            const empresa =
                proveedor.empresa
                    .trim()
                    .toLowerCase();

            if (
                empresa &&
                !empresas.includes(empresa)
            ) {

                empresas.push(empresa);
            }
        }
    );

    document.getElementById(
        "proveedor-mas-productos"
    ).textContent =
        mejorProveedor
            ? (
                mejorProveedor.nombre +
                " (" +
                mejorCantidad +
                ")"
            )
            : "Sin datos";

    document.getElementById(
        "proveedores-sin-productos"
    ).textContent =
        sinProductos;

    document.getElementById(
        "total-contactos-proveedores"
    ).textContent =
        proveedores.length;

    document.getElementById(
        "empresas-unicas-proveedores"
    ).textContent =
        empresas.length;
}


// ------------------------------------------------------
// Chart
// ------------------------------------------------------
function renderizarChartProveedores() {

    if (!window.ApexCharts) {
        return;
    }

    const elemento =
        document.getElementById(
            "chart-productos-proveedor"
        );

    if (!elemento) {
        return;
    }

    const proveedores =
        obtenerProveedores();

    const productos =
        obtenerProductos();

    if (chartProductosProveedor) {

        chartProductosProveedor
            .destroy();

        chartProductosProveedor =
            null;
    }

    elemento.innerHTML = "";

    if (proveedores.length === 0) {

        elemento.innerHTML =
            '<div class="chart-empty">Agrega proveedores para visualizar el gráfico.</div>';

        return;
    }

    const categorias =
        proveedores.map(
            function(proveedor) {

                return textoSeguroGrafico(
                    proveedor.nombre
                );
            }
        );

    const valores =
        proveedores.map(
            function(proveedor) {

                return productos.filter(
                    function(producto) {

                        return (
                            String(
                                producto.proveedorId
                            ) ===
                            String(
                                proveedor.id
                            )
                        );
                    }
                ).length;
            }
        );

    const oscuro =
        document.documentElement
            .getAttribute(
                "data-theme"
            ) === "dark";

    const texto =
        oscuro
            ? "#98a2b3"
            : "#667085";

    const grid =
        oscuro
            ? "#1f2a3d"
            : "#e4e7ec";

    chartProductosProveedor =
        new ApexCharts(
            elemento,
            {
                chart: {
                    type: "bar",
                    height: 270,
                    toolbar: {
                        show: false
                    }
                },
                series: [
                    {
                        name: "Productos",
                        data: valores
                    }
                ],
                plotOptions: {
                    bar: {
                        horizontal: true,
                        borderRadius: 5,
                        barHeight: "52%"
                    }
                },
                dataLabels: {
                    enabled: false
                },
                xaxis: {
                    categories: categorias,
                    labels: {
                        style: {
                            colors: texto
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            colors: texto
                        }
                    }
                },
                grid: {
                    borderColor: grid,
                    strokeDashArray: 4
                },
                colors: [
                    "#465fff"
                ],
                tooltip: {
                    theme:
                        oscuro
                            ? "dark"
                            : "light"
                }
            }
        );

    chartProductosProveedor
        .render();
}


// ------------------------------------------------------
// Vista
// ------------------------------------------------------
function cambiarVistaProveedores(
    vista,
    aviso = true
) {

    vistaProveedoresActual =
        vista;

    guardarPreferenciaSegura(
        "vista_proveedores",
        vista
    );

    const tabla =
        document.getElementById(
            "vista-tabla-proveedores"
        );

    const cards =
        document.getElementById(
            "vista-tarjetas-proveedores"
        );

    const btnTabla =
        document.getElementById(
            "btn-vista-tabla-proveedores"
        );

    const btnCards =
        document.getElementById(
            "btn-vista-tarjetas-proveedores"
        );

    const esTabla =
        vista === "tabla";

    tabla.classList.toggle(
        "hidden",
        !esTabla
    );

    cards.classList.toggle(
        "hidden",
        esTabla
    );

    btnTabla.classList.toggle(
        "active",
        esTabla
    );

    btnCards.classList.toggle(
        "active",
        !esTabla
    );

    if (
        aviso &&
        !esTabla
    ) {

        mostrarToast(
            "Vista de tarjetas activada.",
            "info"
        );
    }
}


// ------------------------------------------------------
// Export CSV
// ------------------------------------------------------
function escaparCSV(valor) {

    let texto =
        String(valor ?? "");

    if (/^\s*[=+@-]/.test(texto)) {
        texto = "'" + texto;
    }

    texto = texto.replace(/"/g, '""');

    return '"' + texto + '"';
}


function exportarProveedoresCSV() {

    const proveedores =
        obtenerProveedores();

    if (proveedores.length === 0) {

        mostrarToast(
            "No hay proveedores para exportar.",
            "info"
        );

        return;
    }

    const filas = [
        [
            "ID",
            "Nombre",
            "Empresa",
            "Teléfono",
            "Correo",
            "Dirección"
        ]
    ];

    proveedores.forEach(
        function(proveedor) {

            filas.push([
                proveedor.id,
                proveedor.nombre,
                proveedor.empresa,
                proveedor.telefono,
                proveedor.correo,
                proveedor.direccion
            ]);
        }
    );

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
        "proveedores.csv";

    document.body.appendChild(
        enlace
    );

    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);

    mostrarToast(
        "CSV de proveedores generado.",
        "success"
    );
}


// ------------------------------------------------------
// Detectar cambios reales en LocalStorage
// ------------------------------------------------------
function obtenerFirmaDatosProveedores() {

    return (
        leerTextoLocalStorage("proveedores") || "[]"
    ) + "|" + (
        leerTextoLocalStorage("productos") || "[]"
    );
}


// ------------------------------------------------------
// Envolver render original
// ------------------------------------------------------
const mostrarProveedoresOriginal =
    mostrarProveedores;

mostrarProveedores =
    function(lista) {

        mostrarProveedoresOriginal(
            lista
        );

        renderizarTarjetasProveedores(
            lista ||
            obtenerProveedores()
        );

        const firmaActual =
            obtenerFirmaDatosProveedores();

        if (
            firmaActual !==
            ultimaFirmaDatosProveedores
        ) {

            ultimaFirmaDatosProveedores =
                firmaActual;

            animarResumenProveedores();
            actualizarInsightsProveedores();

            requestAnimationFrame(
                function() {

                    renderizarChartProveedores();
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
document.getElementById(
            "btn-exportar-proveedores"
        ).addEventListener(
            "click",
            exportarProveedoresCSV
        );

        document.getElementById(
            "btn-vista-tabla-proveedores"
        ).addEventListener(
            "click",
            function() {

                cambiarVistaProveedores(
                    "tabla"
                );
            }
        );

        document.getElementById(
            "btn-vista-tarjetas-proveedores"
        ).addEventListener(
            "click",
            function() {

                cambiarVistaProveedores(
                    "tarjetas"
                );
            }
        );

        btnModoOscuro.addEventListener(
            "click",
            function() {

                setTimeout(
                    renderizarChartProveedores,
                    40
                );
            }
        );

        cambiarVistaProveedores(
            vistaProveedoresActual,
            false
        );

        // La inicialización principal llama mostrarProveedores().
        // El wrapper actualizará visuales y analítica sin duplicar trabajo.
    }
);
