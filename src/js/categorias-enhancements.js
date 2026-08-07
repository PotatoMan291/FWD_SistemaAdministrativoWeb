// ======================================================
// MEJORAS VISUALES - CATEGORÍAS
// ======================================================

let chartProductosCategoria = null;
let chartUsoCategorias = null;

const valoresAnimadosCategorias = {};

let ultimaFirmaDatosCategorias = "";




// ------------------------------------------------------
// Animated counters
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
        valoresAnimadosCategorias[
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

    valoresAnimadosCategorias[
        clave
    ] = Number(valorFinal);

    const inicio =
        performance.now();

    function frame(ahora) {

        const progreso =
            Math.min(
                (
                    ahora -
                    inicio
                ) /
                520,
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


function animarResumenCategorias() {

    const categorias =
        obtenerCategorias();

    const productos =
        obtenerProductos();

    let usadas = 0;

    categorias.forEach(
        function(categoria) {

            if (
                cantidadProductosCategoria(
                    categoria.id
                ) > 0
            ) {

                usadas++;
            }
        }
    );

    animarNumero(
        resumenTotalCategorias,
        categorias.length
    );

    animarNumero(
        resumenCategoriasUsadas,
        usadas
    );

    animarNumero(
        resumenProductos,
        productos.length
    );
}


// ------------------------------------------------------
// Gráficos
// ------------------------------------------------------
function renderizarGraficosCategorias() {

    if (!window.ApexCharts) {
        return;
    }

    const elementoBarras =
        document.getElementById(
            "chart-productos-por-categoria"
        );

    const elementoDonut =
        document.getElementById(
            "chart-uso-categorias"
        );

    if (
        !elementoBarras ||
        !elementoDonut
    ) {

        return;
    }

    const categorias =
        obtenerCategorias();

    const productos =
        obtenerProductos();

    if (chartProductosCategoria) {

        chartProductosCategoria
            .destroy();

        chartProductosCategoria =
            null;
    }

    if (chartUsoCategorias) {

        chartUsoCategorias.destroy();
        chartUsoCategorias = null;
    }

    elementoBarras.innerHTML = "";
    elementoDonut.innerHTML = "";

    if (categorias.length === 0) {

        elementoBarras.innerHTML =
            '<div class="chart-empty">Agrega categorías para visualizar el gráfico.</div>';

        elementoDonut.innerHTML =
            '<div class="chart-empty">Agrega categorías para visualizar el gráfico.</div>';

        return;
    }

    const nombres =
        categorias.map(
            function(categoria) {

                return textoSeguroGrafico(
                    categoria.nombre
                );
            }
        );

    const cantidades =
        categorias.map(
            function(categoria) {

                return cantidadProductosCategoria(
                    categoria.id
                );
            }
        );

    let usadas = 0;

    cantidades.forEach(
        function(cantidad) {

            if (cantidad > 0) {

                usadas++;
            }
        }
    );

    const sinUso =
        categorias.length -
        usadas;

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

    chartProductosCategoria =
        new ApexCharts(
            elementoBarras,
            {
                chart: {
                    type: "bar",
                    height: 260,
                    toolbar: {
                        show: false
                    }
                },
                series: [
                    {
                        name: "Productos",
                        data: cantidades
                    }
                ],
                plotOptions: {
                    bar: {
                        borderRadius: 6,
                        columnWidth: "46%"
                    }
                },
                dataLabels: {
                    enabled: false
                },
                xaxis: {
                    categories: nombres,
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

    chartProductosCategoria
        .render();

    chartUsoCategorias =
        new ApexCharts(
            elementoDonut,
            {
                chart: {
                    type: "donut",
                    height: 260
                },
                series: [
                    usadas,
                    sinUso
                ],
                labels: [
                    "En uso",
                    "Sin usar"
                ],
                colors: [
                    "#12b76a",
                    "#98a2b3"
                ],
                stroke: {
                    width: 0
                },
                dataLabels: {
                    enabled: false
                },
                legend: {
                    position: "bottom",
                    labels: {
                        colors: texto
                    }
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: "70%",
                            labels: {
                                show: true,
                                total: {
                                    show: true,
                                    label: "Categorías",
                                    color: texto,
                                    formatter:
                                        function() {

                                            return (
                                                categorias
                                                    .length
                                            );
                                        }
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    theme:
                        oscuro
                            ? "dark"
                            : "light"
                }
            }
        );

    chartUsoCategorias
        .render();
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


function exportarCategoriasCSV() {

    const categorias =
        obtenerCategorias();

    if (categorias.length === 0) {

        mostrarToast(
            "No hay categorías para exportar.",
            "info"
        );

        return;
    }

    const filas = [
        [
            "ID",
            "Nombre",
            "Descripción",
            "Productos asociados"
        ]
    ];

    categorias.forEach(
        function(categoria) {

            filas.push([
                categoria.id,
                categoria.nombre,
                categoria.descripcion,
                cantidadProductosCategoria(
                    categoria.id
                )
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
        "categorias.csv";

    document.body.appendChild(
        enlace
    );

    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);

    mostrarToast(
        "CSV de categorías generado.",
        "success"
    );
}


// ------------------------------------------------------
// Detectar cambios reales en LocalStorage
// ------------------------------------------------------
function obtenerFirmaDatosCategorias() {

    return (
        leerTextoLocalStorage("categorias") || "[]"
    ) + "|" + (
        leerTextoLocalStorage("productos") || "[]"
    );
}


// ------------------------------------------------------
// Envolver render original
// ------------------------------------------------------
const mostrarCategoriasOriginal =
    mostrarCategorias;

mostrarCategorias =
    function(lista) {

        mostrarCategoriasOriginal(
            lista
        );

        const firmaActual =
            obtenerFirmaDatosCategorias();

        if (
            firmaActual !==
            ultimaFirmaDatosCategorias
        ) {

            ultimaFirmaDatosCategorias =
                firmaActual;

            animarResumenCategorias();

            requestAnimationFrame(
                function() {

                    renderizarGraficosCategorias();
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
            "btn-exportar-categorias"
        ).addEventListener(
            "click",
            exportarCategoriasCSV
        );

        btnModoOscuro.addEventListener(
            "click",
            function() {

                setTimeout(
                    renderizarGraficosCategorias,
                    40
                );
            }
        );

        // mostrarCategorias() se ejecuta desde el CRUD principal
        // y el wrapper hará la actualización una sola vez.
    }
);
